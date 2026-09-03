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
task build           # build a static, stripped binary into bin/website
task build:linux      # cross-compile a static binary for linux/amd64 (used by deploy)
task run              # go run the live server (task run -- -addr :3000)
task dev              # live server + templ --watch, regenerating on .templ changes
task generate         # export a static build into dist/
task serve:static      # serve dist/ locally for previewing the static export
task fmt               # templ fmt + go fmt
task test              # go test ./...
task deploy            # build for linux/amd64 and deploy via deploy.sh
task clean             # remove bin/ and dist/
```

## CLI

The compiled binary supports two subcommands (defaults to `serve`):

```sh
website serve [-addr :8080]
website generate [-out dist]
```

`serve` runs the live HTTP server. `generate` renders the same page to a
static `index.html` plus its static assets, so the site can be hosted on any
static host without running Go at all.

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

## Ask about this website

A small floating widget (bottom-right) lets visitors search the site's own
content from a text box ("Ask about this website"). This is a fast, fully
client-side **fuzzy keyword search**, not an LLM: there is no model, no
download, and no network request involved in answering a question, so
results appear instantly (a few milliseconds) on every device, with zero
external calls.

An earlier iteration of this feature ran a tiny LLM (GGUF, via
[wllama](https://github.com/ngxson/wllama)/WebAssembly) fully client-side
for conversational answers. It was dropped in favor of search: CPU-only
WASM inference of even a small (~0.5B/360M parameter) model was too slow
for a snappy experience on modest hardware (tens of seconds per reply in
testing), and fine-tuning a model to fix that only helps quality/prompt
size, not raw per-token decode speed. Search trades "conversational" for
"instant and always accurate" (it can only surface real content, so it
can't hallucinate either).

How it works:

- `internal/web/views/ask_search.go`'s `buildSearchIndex` turns the site's
  content (`*data.Data`) into a flat list of small documents: one for the
  about/profile blurb, one for skills, one for the toolkit, one for spoken
  languages, one per job, one per project, one per education entry, and
  one for contact links. This runs once, server-side, at the same time as
  everything else in `data.json`/`cv.pdf` (see below), so it's always in
  sync with the site's real content and needs no separate build step.
- `internal/web/views/ask.templ` embeds that index directly in the page as
  JSON (`templ.JSONScript`, same technique used for the `Person` JSON-LD
  block), so the client needs zero extra network round trips to search.
- `internal/web/static/js/ask.js` does the actual matching: it tokenizes
  each document's title plus its curated keywords (deliberately *not* the
  free-form description text, which would add too much incidental-match
  noise), then scores a query against them with exact/prefix/substring
  matches weighted highest and a length-scaled Levenshtein edit-distance
  check for basic typo tolerance. Scores are summed (not averaged) across
  query words so one strong, specific hit (e.g. a company name) isn't
  diluted by other unmatched words in a longer question. The top 3 matches
  above a minimum score are rendered; below it, a friendly "no direct
  match" message is shown instead of nothing.
- The widget stays `hidden` until this (essentially instant) setup runs,
  then reveals itself; on any JS error it just never reveals itself
  instead of showing a broken widget.

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

`deploy.sh` builds nothing itself; run it via `task deploy`, which first
cross-compiles `bin/website` for `linux/amd64`, then:

1. Renders a systemd unit and an nginx server block to local temp files
   (kept as separate files, then `scp`'d verbatim, specifically to avoid
   nginx's own `$host`/`$scheme`/etc. variables being mistaken for shell
   variables and expanded away when embedded in a remote `ssh` command).
2. Copies the binary + those two files to the server over `scp`.
3. Over `ssh`: creates a dedicated `website` user/group (if missing),
   installs the binary at `/apps/website/website`, writes/enables/restarts
   a systemd unit (`website.service`) that runs `website serve -addr :8080`.
4. Installs `nginx` if it's missing, writes the rendered server block to
   `/etc/nginx/conf.d/website.conf` (reverse-proxying `DOMAIN` on port 80 to
   `127.0.0.1:8080`), runs `nginx -t`, and reloads/restarts it.

Since `data.json` is embedded in the binary, there's nothing else to copy or
seed on the server; every deploy is a single self-contained binary plus its
nginx front door.

Requires `SERVER` (an SSH target with key-based access and root, or
equivalent, privileges) and `DOMAIN` (the hostname nginx should listen for):

```sh
SERVER=root@geidelguerra.com DOMAIN=geidelguerra.com task deploy
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


## Project layout

```
data.json                        content for all sections (embedded via go:embed)
main.go                          CLI entry point (serve / generate)
deploy.sh                        deploy the bin/website binary over ssh/scp (see task deploy)
internal/
  data/                          data.json structs + parsing/formatting helpers
  seo/                           robots.txt, sitemap.xml, canonical site URL
  web/
    assets.go                    go:embed of static/
    hashed.go                    hashfs-wrapped, minified CSS/JS (see Performance)
    minify.go                    CSS/JS minification helpers
    static/                      css, js, images, favicon.ico
      js/ask.js                  "Ask about this website" fuzzy search widget (see above)
    views/                       templ components (layout + page sections)
      ask.templ                 "Ask about this website" widget markup
      ask_search.go              builds the search index embedded in the page
  httpserver/                    chi router for the live server
  generator/                     static site exporter
  cv/                            PDF resume generator (github.com/go-pdf/fpdf)
    fonts/                       bundled Noto Sans (SIL OFL) for full Unicode/accent support
```
