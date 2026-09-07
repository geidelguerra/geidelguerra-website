// "Chat with this website" widget.
//
// A small multi-turn conversation, answered by an actual LLM (Cloudflare
// Workers AI), called via POST /api/ask — implemented once, in Go (see
// internal/ask), and served identically no matter how this app is deployed
// (local `task run`, deploy_ssh.sh, or deploy_cloudflare.sh), grounded in
// the site's own data.json content so it can't wander off-topic or
// hallucinate unrelated facts. The whole conversation so far (not just the
// latest message) is sent on every request, so follow-up questions have
// context; it's only kept in memory (see conversation below), so it's lost
// on page reload — there's no server-side session/history.
//
// Any element with a data-ask-open attribute opens the panel (see the
// wiring below) — not just the floating toggle button, but also the
// "Chat with this website" call to action in the hero (see index.templ),
// so the widget is discoverable without relying on visitors noticing the
// floating button.
//
// /api/ask is protected by a Cloudflare Turnstile challenge (loaded lazily
// below, once the panel is first opened) so it can't be scripted for free
// LLM calls; its token is sent along with each message and verified
// server-side before the Workers AI call is made.
//
// There is no fallback: if /api/ask isn't configured (see
// internal/ask.Config) on whatever's serving this page, or a request
// otherwise fails transiently, or an invalid/expired Turnstile token gets
// rejected, a plain error message is appended to the chat instead of an
// assistant reply.
(function () {
	"use strict";

	var widget = document.getElementById("ask-widget");
	if (!widget) return;

	var toggle = document.getElementById("ask-toggle");
	var panel = document.getElementById("ask-panel");
	var form = document.getElementById("ask-form");
	var input = document.getElementById("ask-input");
	var submitButton = document.getElementById("ask-submit");
	var messagesEl = document.getElementById("ask-messages");
	var turnstileContainer = document.getElementById("ask-turnstile");

	// The conversation sent to /api/ask on every request: only committed
	// turns (a question that got a real answer back), never a loading
	// placeholder or a failed attempt — see the submit handler below. Capped
	// to the most recent MAX_HISTORY_MESSAGES so the request/prompt doesn't
	// grow unbounded over a long conversation.
	var conversation = [];
	var MAX_HISTORY_MESSAGES = 12;

	// Bumped on every submit so a slower, earlier request's response can't
	// clobber a later one's if a visitor sends more than one message in
	// quick succession.
	var activeRequestId = 0;

	var turnstileWidgetId = null;
	var turnstileToken = "";
	var turnstileLoadStarted = false;

	// Loads and explicitly renders the Turnstile widget into #ask-turnstile,
	// the first time it's called. Lazy (called from openPanel, not at page
	// load) so visitors who never open the ask panel never fetch the extra
	// third-party script. Safe to call repeatedly; only does anything once.
	function loadTurnstile() {
		if (turnstileLoadStarted || !turnstileContainer) return;
		turnstileLoadStarted = true;

		window.__onAskTurnstileLoad = function () {
			try {
				// "interaction-only" keeps the widget invisible unless Cloudflare
				// decides an actual challenge is needed (this widget's
				// server-side mode, "managed", supports this appearance).
				turnstileWidgetId = window.turnstile.render(turnstileContainer, {
					sitekey: turnstileContainer.getAttribute("data-sitekey"),
					appearance: "interaction-only",
					callback: function (token) {
						turnstileToken = token;
					},
					"error-callback": function () {
						turnstileToken = "";
					},
					"expired-callback": function () {
						turnstileToken = "";
					},
				});
			} catch (err) {
				console.error("Ask widget: Turnstile render failed", err);
			}
		};

		var script = document.createElement("script");
		script.src =
			"https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__onAskTurnstileLoad&render=explicit";
		script.async = true;
		script.defer = true;
		script.onerror = function () {
			console.error("Ask widget: failed to load Turnstile script");
		};
		document.head.appendChild(script);
	}

	function openPanel() {
		panel.hidden = false;
		toggle.setAttribute("aria-expanded", "true");
		input.focus();
		loadTurnstile();
	}

	function closePanel() {
		panel.hidden = true;
		toggle.setAttribute("aria-expanded", "false");
	}

	if (toggle && panel) {
		toggle.addEventListener("click", function () {
			if (panel.hidden) {
				openPanel();
			} else {
				closePanel();
			}
		});

		// Other "Chat with this website" calls to action (e.g. the hero's)
		// only ever open the panel — unlike the floating button above, they
		// don't also need to close it again on a second click.
		document.querySelectorAll("[data-ask-open]").forEach(function (el) {
			if (el === toggle) return;
			el.addEventListener("click", openPanel);
		});

		// Close on a click/tap outside the widget (button + panel) — but not
		// on a click on one of those other calls to action, which live
		// outside #ask-widget and would otherwise immediately re-close the
		// panel they just opened, since this listener also runs on that
		// same (bubbled) click.
		document.addEventListener("click", function (e) {
			if (panel.hidden) return;
			if (widget.contains(e.target)) return;
			if (e.target.closest && e.target.closest("[data-ask-open]")) return;
			closePanel();
		});

		// Close on Escape, and return focus to the toggle button.
		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape" && !panel.hidden) {
				closePanel();
				toggle.focus();
			}
		});
	}

	var emptyPlaceholder = messagesEl.querySelector(".ask-empty");

	function scrollToBottom() {
		messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	// Appends a chat bubble (role "user"/"assistant"), an error notice
	// (role "error"), or the transient "Thinking…" indicator (role
	// "loading", removed again via the returned element) to the chat.
	function appendMessage(role, text) {
		if (emptyPlaceholder) {
			emptyPlaceholder.remove();
			emptyPlaceholder = null;
		}

		var el = document.createElement("div");
		if (role === "loading") {
			el.className = "ask-message ask-message-loading";
			el.textContent = text;
		} else if (role === "error") {
			el.className = "ask-message-error";
			el.textContent = text;
		} else {
			el.className = "ask-message ask-message-" + role;
			el.textContent = text;
		}

		messagesEl.appendChild(el);
		scrollToBottom();
		return el;
	}

	// Resets the Turnstile widget after each /api/ask attempt (success,
	// rejection, or error alike) so a fresh token is ready for the next
	// message — tokens are single-use and expire after 5 minutes.
	function resetTurnstile() {
		turnstileToken = "";
		if (turnstileWidgetId !== null && window.turnstile) {
			window.turnstile.reset(turnstileWidgetId);
		}
	}

	// Calls the Cloudflare Worker's POST /api/ask (see internal/ask), which
	// verifies the Turnstile token before answering using Workers AI,
	// grounded in the site's data.json content and the conversation so far
	// (messages: an array of {role: "user"|"assistant", content}). Rejects
	// on any non-2xx response — including a 403 for a missing/invalid/expired
	// Turnstile token, or a 503 if /api/ask isn't configured (see
	// internal/ask.Config) — network error, or malformed/empty payload; the
	// caller shows a plain error message in that case (see the submit
	// handler below).
	function askAI(messages) {
		return fetch("/api/ask", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ messages: messages, turnstileToken: turnstileToken }),
		})
			.then(function (res) {
				if (!res.ok) throw new Error("ask endpoint responded with " + res.status);
				return res.json();
			})
			.then(function (data) {
				var answer = data && data.answer;
				if (!answer || typeof answer !== "string") throw new Error("ask endpoint returned no answer");
				return answer;
			});
	}

	if (form) {
		form.addEventListener("submit", function (e) {
			e.preventDefault();
			var question = (input.value || "").trim();
			if (!question) return;

			// Guards against a slower, earlier request's response landing after
			// a later one's, if a visitor sends more than one message in
			// quick succession.
			var requestId = ++activeRequestId;

			input.value = "";
			input.disabled = true;
			submitButton.disabled = true;

			appendMessage("user", question);
			var pending = conversation.concat([{ role: "user", content: question }]);
			var loadingEl = appendMessage("loading", "Thinking\u2026");

			askAI(pending)
				.then(function (answer) {
					if (requestId !== activeRequestId) return;
					loadingEl.remove();
					appendMessage("assistant", answer);

					// Only committed to history now that the request actually
					// succeeded — a failed attempt (see .catch below) never
					// pollutes the context sent on the next message.
					conversation = pending.concat([{ role: "assistant", content: answer }]);
					if (conversation.length > MAX_HISTORY_MESSAGES) {
						conversation = conversation.slice(conversation.length - MAX_HISTORY_MESSAGES);
					}
				})
				.catch(function (err) {
					if (requestId !== activeRequestId) return;
					console.error("Ask widget: /api/ask failed", err);
					loadingEl.remove();
					appendMessage("error", "Sorry, I couldn't answer that right now. Please try again in a moment.");
				})
				.then(function () {
					if (requestId !== activeRequestId) return;
					resetTurnstile();
					input.disabled = false;
					submitButton.disabled = false;
					input.focus();
				});
		});
	}

	widget.hidden = false;
})();
