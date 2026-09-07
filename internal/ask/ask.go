// Package ask implements the "Chat with this website" widget's backend:
// POST /api/ask answers a visitor's multi-turn conversation with an actual
// LLM (Cloudflare Workers AI), grounded in the site's own data.json content,
// and gated by a Cloudflare Turnstile challenge so it can't be scripted for
// free/unlimited LLM calls.
//
// This calls Cloudflare's plain HTTPS REST APIs (Turnstile's siteverify and
// Workers AI's "run a model" endpoint) rather than requiring a Cloudflare
// Worker/binding, so it works identically everywhere this binary runs: a
// local `task run`, the deploy_ssh.sh VPS deployment, and the
// deploy_cloudflare.sh Container deployment (see cloudflare/src/index.js,
// which just proxies straight to this binary — no special-casing there).
package ask

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/geidelguerra/website/internal/data"
)

const (
	// fp8-quantized Llama 3.1 8B: cheap and fast, with plenty of context
	// room (32k tokens) for the whole site's content plus the system
	// prompt below. See
	// https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/.
	aiModel = "@cf/meta/llama-3.1-8b-instruct-fp8"

	turnstileVerifyURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

	// Per-message and whole-conversation limits, enforced server-side
	// regardless of what static/js/ask.js already caps client-side (a
	// modified/scripted client could send anything). Generous enough to
	// keep a handful of prior turns as context without letting the prompt
	// (and thus Workers AI cost) grow unbounded.
	maxMessageLength = 1000
	maxMessages      = 20

	requestTimeout = 20 * time.Second
)

// Config holds the credentials needed to answer questions. All three must
// be set (see README.md > "Chat with this website" for how to obtain them)
// or Handler responds with 503 to every request rather than partially
// working.
type Config struct {
	// AccountID is the Cloudflare account ID that owns the Workers AI
	// usage and the Turnstile widget. Not a secret (it's visible in the
	// dashboard URL and various configs), but grouped here for
	// convenience.
	AccountID string

	// APIToken is a Cloudflare API Token scoped to (at least) "Workers
	// AI: Read" for AccountID. Create one at
	// https://dash.cloudflare.com/profile/api-tokens (My Profile > API
	// Tokens > Create Token > Custom Token) — or reuse an existing token
	// that already covers it (e.g. one already used to deploy this app;
	// the "Edit Cloudflare Workers" template includes Workers AI). Never
	// commit this.
	APIToken string

	// TurnstileSecret is the secret key for the Turnstile widget whose
	// sitekey is embedded client-side (see AskTurnstileSiteKey in
	// internal/web/views/ask.templ). Get/rotate it from the Cloudflare
	// dashboard's Turnstile page. Never commit this.
	TurnstileSecret string
}

func (c Config) valid() bool {
	return c.AccountID != "" && c.APIToken != "" && c.TurnstileSecret != ""
}

// Handler serves POST /api/ask. Construct one with NewHandler.
type Handler struct {
	cfg     Config
	context string
	client  *http.Client
}

// NewHandler builds a Handler. The site's content (d) is turned into a
// compact plain-text briefing once, up front — same lifecycle as the rest
// of the site's pre-rendered content (see internal/httpserver.New).
func NewHandler(d *data.Data, cfg Config) *Handler {
	return &Handler{
		cfg:     cfg,
		context: buildContext(d),
		client:  &http.Client{Timeout: requestTimeout},
	}
}

// chatMessage is one turn of the conversation, as sent by
// static/js/ask.js and forwarded (after the system prompt) to Workers AI.
type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type askRequest struct {
	Messages       []chatMessage `json:"messages"`
	TurnstileToken string        `json:"turnstileToken"`
}

type askResponse struct {
	Answer string `json:"answer,omitempty"`
	Error  string `json:"error,omitempty"`
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, askResponse{Error: "method not allowed"})
		return
	}

	if !h.cfg.valid() {
		log.Printf("ask: not configured — set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and TURNSTILE_SECRET_KEY")
		writeJSON(w, http.StatusServiceUnavailable, askResponse{Error: "the ask feature is not configured on this deployment"})
		return
	}

	var req askRequest
	// A larger body limit than a single question needs, since a
	// multi-turn conversation is sent on every request (see maxMessages/
	// maxMessageLength below for the actual enforced caps).
	if err := json.NewDecoder(io.LimitReader(r.Body, 64<<10)).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, askResponse{Error: "invalid request body"})
		return
	}

	messages, ok := sanitizeMessages(req.Messages)
	if !ok {
		writeJSON(w, http.StatusBadRequest, askResponse{Error: "messages must be a non-empty conversation ending in a user message"})
		return
	}

	if !h.verifyTurnstile(r, req.TurnstileToken) {
		writeJSON(w, http.StatusForbidden, askResponse{Error: "verification failed — please try again"})
		return
	}

	answer, err := h.askAI(messages)
	if err != nil {
		log.Printf("ask: Workers AI call failed: %v", err)
		writeJSON(w, http.StatusBadGateway, askResponse{Error: "Sorry, I couldn't come up with an answer just now. Please try again."})
		return
	}

	writeJSON(w, http.StatusOK, askResponse{Answer: answer})
}

// verifyTurnstile checks a visitor-supplied Turnstile token against
// Cloudflare's siteverify API. Fails closed (returns false) on any error,
// missing token, or non-success response, rather than risk letting an
// unverified request through to the (metered) Workers AI call below.
func (h *Handler) verifyTurnstile(r *http.Request, token string) bool {
	if token == "" {
		return false
	}

	// CF-Connecting-IP is set by Cloudflare when this app is fronted by
	// it (see cloudflare/src/index.js); RemoteAddr is the best available
	// fallback otherwise (e.g. deploy_ssh.sh behind nginx, or local dev).
	remoteIP := r.Header.Get("CF-Connecting-IP")
	if remoteIP == "" {
		remoteIP = r.RemoteAddr
	}

	form := url.Values{}
	form.Set("secret", h.cfg.TurnstileSecret)
	form.Set("response", token)
	if remoteIP != "" {
		form.Set("remoteip", remoteIP)
	}

	resp, err := h.client.PostForm(turnstileVerifyURL, form)
	if err != nil {
		log.Printf("ask: turnstile verify request failed: %v", err)
		return false
	}
	defer resp.Body.Close()

	var result struct {
		Success bool `json:"success"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("ask: turnstile verify decode failed: %v", err)
		return false
	}

	return result.Success
}

// sanitizeMessages validates and bounds a client-supplied conversation
// before it's ever sent to Workers AI: only "user"/"assistant" roles are
// allowed (rejecting, rather than silently dropping, anything else —
// notably a scripted client trying to smuggle in its own "system" message
// ahead of ours), the conversation must be non-empty and end with a user
// message, and both the number of messages and each one's length are
// capped (see maxMessages/maxMessageLength) regardless of what
// static/js/ask.js already enforces client-side.
func sanitizeMessages(messages []chatMessage) ([]chatMessage, bool) {
	if len(messages) == 0 {
		return nil, false
	}

	if len(messages) > maxMessages {
		messages = messages[len(messages)-maxMessages:]
	}

	clean := make([]chatMessage, 0, len(messages))
	for _, m := range messages {
		if m.Role != "user" && m.Role != "assistant" {
			return nil, false
		}

		content := strings.TrimSpace(m.Content)
		if content == "" {
			continue
		}
		if len(content) > maxMessageLength {
			content = content[:maxMessageLength]
		}

		clean = append(clean, chatMessage{Role: m.Role, Content: content})
	}

	if len(clean) == 0 || clean[len(clean)-1].Role != "user" {
		return nil, false
	}

	return clean, true
}

// askAI sends the conversation, grounded in h.context via a system prompt,
// to Workers AI via Cloudflare's REST API and returns the model's reply.
func (h *Handler) askAI(messages []chatMessage) (string, error) {
	apiMessages := make([]map[string]string, 0, len(messages)+1)
	apiMessages = append(apiMessages, map[string]string{
		"role": "system",
		"content": "You are the assistant embedded on Geidel Guerra's personal portfolio website, answering " +
			"visitor questions about him and his work in an ongoing conversation. Answer using ONLY the " +
			"information below, in the third person, in 2-4 concise sentences. If the answer isn't contained " +
			"in this information, say you don't have that information — never guess or make anything up.\n\n" + h.context,
	})
	for _, m := range messages {
		apiMessages = append(apiMessages, map[string]string{"role": m.Role, "content": m.Content})
	}

	reqBody := map[string]any{
		"messages":   apiMessages,
		"max_tokens": 400,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	endpoint := fmt.Sprintf("https://api.cloudflare.com/client/v4/accounts/%s/ai/run/%s", h.cfg.AccountID, aiModel)
	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+h.cfg.APIToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Success bool `json:"success"`
		Errors  []struct {
			Message string `json:"message"`
		} `json:"errors"`
		Result struct {
			Response string `json:"response"`
		} `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode response: %w", err)
	}

	if !result.Success {
		msg := "unknown error"
		if len(result.Errors) > 0 {
			msg = result.Errors[0].Message
		}
		return "", fmt.Errorf("workers ai error: %s", msg)
	}

	answer := strings.TrimSpace(result.Result.Response)
	if answer == "" {
		return "", fmt.Errorf("empty response from model")
	}

	return answer, nil
}

func writeJSON(w http.ResponseWriter, status int, body askResponse) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

// buildContext turns the site's content into a compact plain-text briefing
// the model can be grounded on. Runs once, at startup, not per-request.
func buildContext(d *data.Data) string {
	var b strings.Builder

	fmt.Fprintf(&b, "%s — %s\n", d.Name, d.Title)
	if d.About != "" {
		fmt.Fprintf(&b, "%s\n", d.About)
	}

	if len(d.Skills) > 0 {
		parts := make([]string, 0, len(d.Skills))
		for _, s := range d.Skills {
			parts = append(parts, fmt.Sprintf("%s (%s yr)", s.Label, s.Years))
		}
		fmt.Fprintf(&b, "Skills: %s\n", strings.Join(parts, ", "))
	}

	if len(d.Toolkit) > 0 {
		parts := make([]string, 0, len(d.Toolkit))
		for _, t := range d.Toolkit {
			parts = append(parts, fmt.Sprintf("%s: %s", t.Category, strings.Join(t.Tools, "/")))
		}
		fmt.Fprintf(&b, "Workstation/toolkit: %s\n", strings.Join(parts, "; "))
	}

	if len(d.Languages) > 0 {
		parts := make([]string, 0, len(d.Languages))
		for _, l := range d.Languages {
			parts = append(parts, fmt.Sprintf("%s (%s)", l.Label, l.Score))
		}
		fmt.Fprintf(&b, "Spoken languages: %s\n", strings.Join(parts, ", "))
	}

	if len(d.Experience) > 0 {
		b.WriteString("Work experience, most recent first:\n")
		for _, e := range d.Experience {
			tech := ""
			if len(e.Tech) > 0 {
				tech = fmt.Sprintf(" Tech: %s.", strings.Join(e.Tech, ", "))
			}
			fmt.Fprintf(&b, "- %s at %s (%s): %s%s\n", e.Name, e.Company, e.DateRange, e.Description, tech)
		}
	}

	if len(d.Projects) > 0 {
		b.WriteString("Personal/side projects:\n")
		for _, p := range d.Projects {
			fmt.Fprintf(&b, "- %s (%s): %s\n", p.Name, p.DateRange, p.Description)
		}
	}

	if len(d.Studies) > 0 {
		b.WriteString("Education:\n")
		for _, s := range d.Studies {
			fmt.Fprintf(&b, "- %s, %s (%s)\n", s.Name, s.School, s.DateRange)
		}
	}

	if len(d.Networks) > 0 {
		parts := make([]string, 0, len(d.Networks))
		for _, n := range d.Networks {
			parts = append(parts, fmt.Sprintf("%s (%s)", n.Label, n.URL))
		}
		fmt.Fprintf(&b, "Contact / social links: %s\n", strings.Join(parts, ", "))
	}

	return b.String()
}
