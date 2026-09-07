# geidelguerra.com

Single-page portfolio site. Go + [chi](https://github.com/go-chi/chi) +
[templ](https://templ.guide), vanilla CSS/JS (no frontend frameworks or
libraries), all assets embedded into a single, statically-linked binary
(`CGO_ENABLED=0`, no libc/dynamic dependencies; verify with `file`/`ldd`).
Supports light/dark theme via CSS variables.

## Requirements

- Go 1.23+
- [templ](https://templ.guide) CLI (`go install github.com/a-h/templ/cmd/templ@latest`)
- [Task](https://taskfile.dev) (`go install github.com/go-task/task/v3/cmd/task@latest`), optional but recommended

## Content

All page content lives in [`data.json`](./data.json): name, title, about,
networks, skills, toolkit, languages, studies, experience and projects. Edit
that file to change the site's content.

`data.json` is embedded into the binary at build time via `go:embed` (see
`main.go`) and is the *only* source of content: there is no dynamic/runtime
read from disk. Editing `data.json` requires rebuilding (`task build` /
`task generate`) and redeploying for the change to take effect.

## Replacing the photo / favicon

- Profile photo: `internal/web/static/images/profile.jpg`
- Favicon (png, used in `<link>`): `internal/web/static/images/favicon.png`
- Favicon (ico, served at `/favicon.ico`): `internal/web/static/favicon.ico`

Just overwrite these files (keep the same names) and rebuild.

## Tasks

```sh
task build             # build a static, stripped binary into bin/website
task build:linux       # cross-compile a static binary for linux/amd64 (used by deploy)
task run               # go run the live server (PORT=3000 task run to override the port)
task dev               # live server + templ --watch, regenerating on .templ changes
task generate          # export a static build into dist/
task serve:static      # serve dist/ locally for previewing the static export
task fmt               # templ fmt + go fmt
task test              # go test ./...
task deploy:ssh        # build for linux/amd64 and deploy via deploy_ssh.sh (VPS/SSH)
task deploy:cloudflare # deploy via deploy_cloudflare.sh (Cloudflare Containers)
task clean             # remove bin/ and dist/
```

## CLI

The compiled binary takes no flags to run — it just works:

```sh
website                        # run the live HTTP server (default)
website generate [-out dist]   # export a static build
```

Running the binary with no arguments starts the live HTTP server,
configured entirely via environment variables (or a local `.env` file, see
`dotenv.go`):

- `HOST` — interface to bind (default: all interfaces)
- `PORT` — port to listen on (default: `8080`)

`generate` renders the same page to a static `index.html` plus its static
assets, so the site can be hosted on any static host without running Go at
all.

## Machine-readable data & CV

- `GET /data.json`: the same site content as pretty-printed JSON, with
  `Access-Control-Allow-Origin: *`, meant for scrapers/crawlers/AI agents.
  Linked from `<head>` via `<link rel="alternate" type="application/json">`
  and from a small link in the page footer.
- `GET /cv.pdf`: a single-page printable PDF resume generated on the fly
  from the same data (`internal/cv`): photo, name, title, networks and bio,
  then experience, education, then skills. Always rendered in the site's
  light color palette. Also linked from the footer. `Generate()` refuses to
  return a PDF that spills onto a second page (see `ErrTooManyPages`), so
  content that no longer fits fails loudly instead of shipping broken.

Both are always returned fresh (no caching headers), so a redeploy is
visible immediately. Both are rendered once at startup (not per-request,
since the content is static for the process's lifetime) and are also
produced by `task generate` (`dist/data.json`, `dist/cv.pdf`), so the
static export stays in sync with the live server.

## Chat with this website

A small chat widget lets visitors have a real, multi-turn conversation
about Geidel/this site ("Chat with this website") — both a floating button
(bottom-right, always reachable while scrolling) and a call-to-action
button in the hero, right at the top of the page next to "See my work"/"Get
in touch", open the same panel (see "How it works" below). Questions are
answered by an actual LLM, run via [Cloudflare
Workers AI](https://developers.cloudflare.com/workers-ai/), grounded
entirely in `data.json`'s content — the same file that drives the rest of
the site (see "Machine-readable data & CV" above) — so it can talk about
real skills, jobs, and projects without needing a separate content pipeline
or going stale. The conversation so far (not just the latest message) is
sent on every request, so follow-up questions ("which of those has he used
the longest?") work naturally; it's kept in memory client-side only (see
`static/js/ask.js`), so it resets on page reload — there's no server-side
session/history to manage or clean up.

An earlier iteration of this feature ran a tiny LLM (GGUF, via
[wllama](https://github.com/ngxson/wllama)/WebAssembly) fully client-side.
That was dropped: CPU-only WASM inference of even a small (~0.5B/360M
parameter) model was too slow for a snappy experience on modest hardware
(tens of seconds per reply in testing), and fine-tuning a model to fix that
only helps quality/prompt size, not raw per-token decode speed. A brief
follow-up iteration replaced it with pure client-side fuzzy keyword search
(fast and accurate, but not conversational). A later iteration answered
questions via Workers AI, but only from the Cloudflare Worker directly
(using the `AI` binding) — which meant the widget only worked on the
Cloudflare deployment, with no way to test it against a local `task run` or
the `deploy_ssh.sh` deployment. **`POST /api/ask` is now implemented once,
in Go** (`internal/ask`), calling Cloudflare's plain HTTPS REST APIs
(Workers AI's "run a model" endpoint and Turnstile's siteverify endpoint)
instead of a Worker-only binding — so it works identically everywhere this
binary runs: a local `task run`, `deploy_ssh.sh`, and
`deploy_cloudflare.sh` (where `cloudflare/src/index.js` is back to being a
plain proxy, no special-casing there; see "Deployment" below).

How it works:

- `internal/web/views/ask.templ`'s `AskWidget` renders the floating
  toggle/panel; `index.templ`'s `Hero` renders the hero's call-to-action
  button. Both share a `data-ask-open` attribute, which `static/js/ask.js`
  wires up generically (any element with it opens the panel), so adding
  further entry points elsewhere on the page needs no JS changes.
- `internal/ask.NewHandler` turns the site's content (`*data.Data`) into a
  compact plain-text briefing (`buildContext`) once, at startup — same
  lifecycle as everything else built from `data.json` (see
  "Machine-readable data & CV" above).
- `internal/httpserver.New` registers it as `POST /api/ask`, which accepts
  `{ messages: [{role, content}, ...], turnstileToken }` — the whole
  conversation so far, not just the latest message. On each request, the
  handler validates/bounds that conversation (`sanitizeMessages`: only
  `user`/`assistant` roles allowed, must end in a `user` message, capped
  length/count), verifies the Turnstile token (see "Turnstile protection"
  below), then sends the briefing as a system prompt — along with an
  instruction to answer only from it, in the third person, and to say so
  rather than guess if the answer isn't there — followed by the
  conversation, to Workers AI (`@cf/meta/llama-3.1-8b-instruct-fp8`, via a
  plain
  `POST https://api.cloudflare.com/client/v4/accounts/{id}/ai/run/{model}`
  call, authenticated with a Cloudflare API Token), and returns its reply
  as JSON.
- `internal/web/static/js/ask.js` keeps the conversation in a plain
  in-memory array (`conversation`), rendered as chat bubbles in
  `#ask-messages`. On submit, it appends the new user message, sends the
  whole conversation so far (plus a Turnstile token) to `/api/ask`, shows a
  "Thinking…" bubble, then appends the reply — only committing the new
  turn to `conversation` once the request actually succeeds, so a failed
  attempt never pollutes the context sent on the next message. Capped to
  the most recent 12 messages (`MAX_HISTORY_MESSAGES`) so the request/prompt
  doesn't grow unbounded over a long conversation; `internal/ask` enforces
  its own generous caps server-side too (`maxMessages`/`maxMessageLength`),
  regardless of what the client sends.

**Configuration**: `/api/ask` needs three environment variables (see
`.env.example`) — if any are unset, it responds 503 to every request
instead of guessing, and the rest of the site is unaffected:

| Variable | Notes |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Not a secret. |
| `CLOUDFLARE_API_TOKEN` | Must be able to call Workers AI. An existing token already used to deploy this app (e.g. via the "Edit Cloudflare Workers" template) typically already covers this — no need for a separate one. |
| `TURNSTILE_SECRET_KEY` | Secret key for the sitekey in `AskTurnstileSiteKey` (`internal/web/views/ask.templ`). Get/rotate it from the [Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile). |

- **Local dev / `deploy_ssh.sh`**: set them in the repo root's `.env` (used
  by both `task run` and, via Taskfile's `dotenv`, `task deploy:ssh` —
  which forwards them into the remote systemd service's environment; see
  `deploy_ssh.sh`).
- **`deploy_cloudflare.sh`**: set as Worker secrets
  (`wrangler secret put CLOUDFLARE_ACCOUNT_ID`, etc., or the dashboard) —
  see "Deployment" below for how they reach the container from there.

**Turnstile protection**: `POST /api/ask` triggers a real (metered) Workers
AI call, so it's gated by a [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
challenge to keep it from being scripted for free/unlimited LLM calls.
`ask.js` loads the Turnstile script lazily — only once a visitor first opens
the ask panel — and renders it into `#ask-turnstile` (see `ask.templ`) in
`interaction-only` appearance, so it stays invisible for the common case
and only shows an interactive challenge if Cloudflare's risk assessment
actually calls for one. The resulting token is sent to `/api/ask` and
verified server-side (`internal/ask`'s `verifyTurnstile`) against
Cloudflare's siteverify API *before* the Workers AI call is made; an
invalid/missing/expired token gets a 403, which `ask.js` treats the same as
any other `/api/ask` failure (see "No fallback" below). The widget's
sitekey (`AskTurnstileSiteKey` in `ask.templ`) is public and safe to embed
client-side; only the matching secret (`TURNSTILE_SECRET_KEY`, see
"Configuration" above) can verify tokens. Turnstile itself is free.

The widget's allowed domains (configured on the widget itself, in the
Cloudflare dashboard's Turnstile page, or via the
[Turnstile widgets API](https://developers.cloudflare.com/api/resources/challenges/subresources/widgets/))
include `geidelguerra.com`, `localhost`, and `127.0.0.1`, so the challenge
renders/verifies successfully in local testing too (e.g. against
`task run`), not just in production.

**No fallback**: if `POST /api/ask` isn't configured (see "Configuration"
above), returns a non-2xx status (including a 403 for a
missing/invalid/expired Turnstile token), or times out/errors, `ask.js`
shows a plain "Sorry, I couldn't answer that right now" message (see
`renderError`) rather than trying to answer some other way. The widget
itself still stays `hidden` until its (essentially instant) client-side
setup runs, then reveals itself; on any JS error during that initial setup
it just never reveals itself, instead of showing a broken widget.

## SEO

- **Meta tags**: description, canonical URL, `robots`, Open Graph (title,
  description, type, url, image + dimensions, site name, locale) and
  Twitter Card tags, all driven by `data.json` (see `views.SEO` in
  `internal/web/views/layout.templ`).
- **Structured data**: a `schema.org` `Person` JSON-LD block (name, url,
  image, jobTitle, description, `sameAs` linking to all `networks` in
  `data.json`), rendered safely via `templ.JSONScript` (which JSON-encodes
  and escapes for a `<script>` context; don't hand-build this by
  interpolating a Go string into a `<script>` tag, that reliably breaks:
  templ's default HTML-escaping mangles JSON's quotes into invalid script
  content).
- **`GET /robots.txt`** and **`GET /sitemap.xml`** (`internal/seo`): allow
  everything, point crawlers at the sitemap; the sitemap lists the single
  page URL (this is a single-page site, so there's only one URL to list).
  Both are also written by `task generate` (`dist/robots.txt`,
  `dist/sitemap.xml`).
- **theme-color** meta tags (light/dark, matching the CSS `--bg` variables)
  for the mobile browser chrome.
- Single `<h1>` (the name, in the hero) with one `<h2>` per section and
  descriptive link text/`alt` attributes throughout.

## Performance

- CSS and JS are minified once at startup/build time (`internal/web/minify.go`,
  using `github.com/tdewolff/minify/v2`, pure Go) and served from memory,
  no build step or external tool required.
- The minified CSS/JS (`style.css`, `app.js`) plus `ask.js` are served at a
  content-hashed filename (e.g. `style-<sha256>.css`) via
  [`github.com/benbjohnson/hashfs`](https://github.com/benbjohnson/hashfs)
  (`internal/web/hashed.go`; `web.StaticAssetPath` builds the URL, used in
  `layout.templ`). Hashed URLs are cached for a year
  (`Cache-Control: public, max-age=31536000`); since the filename itself
  changes whenever the content does, this is always safe: a redeploy can
  never serve a stale asset under a URL a browser already has cached. The
  plain (unhashed) filename still resolves too, just without the
  aggressive caching, so nothing breaks if something links to it directly.
- Everything else under `/static/*` (images, `/favicon.ico`) still gets a
  flat `Cache-Control: public, max-age=2592000, immutable` directly from
  the Go server, so caching is correct even without nginx in front (nginx
  adds the same header again when deployed, see Deployment below). These
  aren't hashed since they're either rarely-changing (photo, favicon) or
  referenced by a fixed conventional path (`/favicon.ico`).
- `internal/web/static/images/profile.jpg` and `favicon.png` are pre-sized
  for how they're actually displayed (160px hero avatar, favicon/touch
  icon) rather than shipping the original photo resolution; if you
  replace either file, keep it reasonably close to its display size
  (roughly 320×320 and 180×180 respectively) to avoid regressing this.

## Theming

Colors are defined as CSS variables in `internal/web/static/css/style.css`,
scoped under `[data-theme="light"]` and `[data-theme="dark"]`. A small inline
script in the page `<head>` sets the theme before first paint (from
`localStorage`, falling back to the OS preference) to avoid a flash of the
wrong theme. The toggle button in the nav bar flips and persists the choice.

## Deployment

The binary itself needs nothing but `HOST`/`PORT` (see CLI above) to run;
two ready-made deploy scripts cover the common cases.

### `deploy_ssh.sh` (VPS / SSH)

Run via `task deploy:ssh`, which first cross-compiles `bin/website` for
`linux/amd64`, then:

1. Renders a systemd unit, an nginx server block, and a single `.env` file
   (containing just `PORT`) to local temp files (kept as separate files,
   then `scp`'d verbatim, specifically to avoid nginx's own
   `$host`/`$scheme`/etc. variables being mistaken for shell variables and
   expanded away when embedded in a remote `ssh` command).
2. Copies the binary + those files to the server over `scp` (the `.env`
   file is transferred mode-600, though there's nothing secret in it
   today — same pattern as the other config files).
3. Over `ssh`: creates a dedicated `website` user/group (if missing),
   installs the binary at `/apps/website/website`, installs the `.env`
   file at `/apps/website/.env`, writes/enables/restarts a systemd unit
   (`website.service`) that runs the binary directly (no CLI flags) with
   `EnvironmentFile=/apps/website/.env` supplying `PORT` (`HOST` is left
   unset so it binds all interfaces, which nginx's `proxy_pass` to
   `127.0.0.1:$PORT` relies on).
4. Installs `nginx` if it's missing, writes the rendered server block to
   `/etc/nginx/conf.d/website.conf` (reverse-proxying `DOMAIN` on port 80 to
   `127.0.0.1:8080`), runs `nginx -t`, and reloads/restarts it.

Since `data.json` is embedded in the binary, there's nothing else to copy or
seed on the server; every deploy is a single self-contained binary plus its
nginx front door.

Requires `SERVER` (an SSH target with key-based access and root, or
equivalent, privileges) and `DOMAIN` (the hostname nginx should listen for),
either passed inline:

```sh
SERVER=root@geidelguerra.com DOMAIN=geidelguerra.com task deploy:ssh
```

or set once in a `.env` file (copy `.env.example` to `.env`), which
`Taskfile.yaml` loads automatically for every task via its `dotenv` key:

```sh
cp .env.example .env
# edit .env with your SERVER/DOMAIN
task deploy:ssh
```

The generated nginx config:

- Trusts `X-Forwarded-Proto` (if set by a reverse proxy/CDN in front) for
  the visitor's real scheme, falling back to nginx's own `$scheme` if it's
  ever missing.
- Sets long-lived, immutable `Cache-Control` on `/static/*` and
  `/favicon.ico` so any CDN/edge in front and browsers cache them
  aggressively, and `Cache-Control: no-cache` on everything else (the
  page, `/data.json`, `/cv.pdf`) so a redeploy is visible immediately
  without needing a cache purge.
- Enables gzip for text-based responses.

The generated nginx config is plain HTTP on port 80; run `certbot --nginx
-d <DOMAIN>` on the server for real TLS, or terminate TLS at a CDN/proxy
in front of it instead.

### `deploy_cloudflare.sh` (Cloudflare Containers)

An alternative to `deploy_ssh.sh` that runs the *same* Go binary —
unmodified — as a [Cloudflare Container](https://developers.cloudflare.com/containers/)
instead of on a VM you manage. A small Worker (`cloudflare/src/index.js`)
is a plain proxy: every request, including `POST /api/ask`, goes straight
to the container, which answers it exactly the same way `task run` or
`deploy_ssh.sh` would (see "Chat with this website" above) — there's no
Worker-side special-casing.

Unlike a typical Worker deploy, this app has almost no secrets or
environment-specific config to inject at deploy time (no email provider —
this is a static portfolio site with no contact form), so
`cloudflare/wrangler.jsonc` is committed and deployed as-is; there's no
generated/gitignored config variant to worry about.

The one exception is the three variables `/api/ask` needs (see "Ask about
this website" > "Configuration" above): `CLOUDFLARE_ACCOUNT_ID`,
`CLOUDFLARE_API_TOKEN`, `TURNSTILE_SECRET_KEY`. These are set as Worker
secrets (not in `wrangler.jsonc`, and not container env vars directly) —
`src/index.js`'s `Website` constructor reads them off the Worker's own
`env` and forwards them into the container's `envVars`, so main.go's
`getenv()` picks them up exactly like it would from a local `.env` file.
Set each one once per Worker with:

```sh
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID --name geidelguerra-website
npx wrangler secret put CLOUDFLARE_API_TOKEN --name geidelguerra-website
npx wrangler secret put TURNSTILE_SECRET_KEY --name geidelguerra-website
```

(or via the dashboard's Worker settings). These persist across
`wrangler deploy` runs, so this is a one-time setup step per Worker, not a
per-deploy one. Workers AI usage is billed per Cloudflare's
[Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
(a free daily allocation is included even on the Workers Paid plan this
site already requires for Containers).

Requirements:

- A Cloudflare account on the [Workers Paid plan](https://developers.cloudflare.com/workers/platform/pricing/)
  ($5/month minimum) — Containers aren't available on the Free plan.
- `DOMAIN` already added as an **active Cloudflare zone** (i.e. its DNS is
  managed by Cloudflare) — both Containers and the
  [Custom Domain](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
  this script sets up require it.
- [Node.js/npm](https://nodejs.org/) and a running
  [Docker](https://www.docker.com/)-compatible engine locally —
  `wrangler deploy` uses it to build the container image.

Usage:

```sh
DOMAIN=geidelguerra.com task deploy:cloudflare
# or, without Task:
DOMAIN=geidelguerra.com ./deploy_cloudflare.sh
```

What it does:

1. Installs npm dependencies in `cloudflare/` (`wrangler`,
   `@cloudflare/containers`) if not already present.
2. Runs `npx wrangler deploy --domain "$DOMAIN"`, which builds
   `cloudflare/Dockerfile` with Docker, pushes the image to Cloudflare's
   registry, deploys the Worker (`cloudflare/src/index.js`), and binds it
   to `DOMAIN` as a [Custom Domain](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

The `Website` class in `cloudflare/src/index.js` runs a single, on-demand
container instance (`instance_type: "lite"` — 1/16 vCPU, 256 MiB RAM,
plenty for this binary) that sleeps after 30 minutes of inactivity to save
on [Container billing](https://developers.cloudflare.com/containers/platform/pricing/);
the next request after that pays a small cold-start cost (documented at
[1-3 seconds](https://developers.cloudflare.com/containers/concepts/architecture/#cold-starts)).
Adjust `sleepAfter`/`instance_type`/`max_instances` there and in
`cloudflare/wrangler.jsonc` if traffic grows.

**Keep-warm Cron Trigger:** `wrangler.jsonc`'s `triggers.crons`
(`*/15 12-23,0 * * *`) pings `/robots.txt` every 15 minutes during roughly
8am-8pm Eastern (handled in `cloudflare/src/index.js`'s `scheduled`
handler) — adjust to your own timezone/traffic pattern, or drop the
`triggers` block entirely if the cold-start latency doesn't matter enough
to justify the extra Container uptime.


## Project layout

```
data.json                        content for all sections (embedded via go:embed)
main.go                          entry point: runs the live server by default, or `generate`
dotenv.go                        optional .env loader for local development (HOST/PORT/...)
deploy_ssh.sh                    deploy the bin/website binary over ssh/scp (see task deploy:ssh)
deploy_cloudflare.sh             deploy as a Cloudflare Container (see task deploy:cloudflare)
cloudflare/                      Worker + Container plumbing for deploy_cloudflare.sh
  src/index.js                   Worker entrypoint: plain proxy into the Container (see internal/ask)
  wrangler.jsonc                 Worker/Container config
  Dockerfile                     builds the Go binary into a container image
internal/
  ask/                           POST /api/ask: Workers AI + Turnstile, via Cloudflare's REST APIs
  data/                          data.json structs + parsing/formatting helpers
  seo/                           robots.txt, sitemap.xml, canonical site URL
  web/
    assets.go                    go:embed of static/
    hashed.go                    hashfs-wrapped, minified CSS/JS (see Performance)
    minify.go                    CSS/JS minification helpers
    static/                      css, js, images, favicon.ico
      js/ask.js                  "Chat with this website" widget: calls /api/ask, no fallback (see above)
    views/                       templ components (layout + page sections)
      ask.templ                 "Chat with this website" widget markup
  httpserver/                    chi router for the live server
  generator/                     static site exporter
  cv/                            PDF resume generator (github.com/go-pdf/fpdf)
    fonts/                       bundled Noto Sans (SIL OFL) for full Unicode/accent support
```
