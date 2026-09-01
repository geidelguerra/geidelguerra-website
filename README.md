# geidelguerra.com

Single-page portfolio site. Go + [chi](https://github.com/go-chi/chi) +
[templ](https://templ.guide), vanilla CSS/JS (no frontend frameworks or
libraries), all assets embedded into a single, statically-linked binary
(`CGO_ENABLED=0`, no libc/dynamic dependencies — verify with `file`/`ldd`).
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

- `GET /data.json` — the same site content as pretty-printed JSON, with
  `Access-Control-Allow-Origin: *`, meant for scrapers/crawlers/AI agents.
  Linked from `<head>` via `<link rel="alternate" type="application/json">`
  and from a small link in the page footer.
- `GET /cv.pdf` — a single-page printable PDF resume generated on the fly
  from the same data (`internal/cv`): photo, name, title, networks and bio,
  then experience, education, then skills. Always rendered in the site's
  light color palette. Also linked from the footer. `Generate()` refuses to
  return a PDF that spills onto a second page (see `ErrTooManyPages`), so
  content that no longer fits fails loudly instead of shipping broken.

Both are rendered once at startup (not per-request, since the content is
static for the process's lifetime) and are also produced by `task generate`
(`dist/data.json`, `dist/cv.pdf`), so the static export stays in sync with
the live server.

## Theming

Colors are defined as CSS variables in `internal/web/static/css/style.css`,
scoped under `[data-theme="light"]` and `[data-theme="dark"]`. A small inline
script in the page `<head>` sets the theme before first paint (from
`localStorage`, falling back to the OS preference) to avoid a flash of the
wrong theme. The toggle button in the nav bar flips and persists the choice.

## Deployment

`deploy.sh` builds nothing itself — run it via `task deploy`, which first
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
seed on the server — every deploy is a single self-contained binary plus its
nginx front door.

Requires `SERVER` (an SSH target with key-based access and root, or
equivalent, privileges) and `DOMAIN` (the hostname nginx should listen for):

```sh
SERVER=root@geidelguerra.com DOMAIN=geidelguerra.com task deploy
```

The generated nginx config assumes the domain is proxied through Cloudflare
(orange-clouded DNS) and:

- Restores the real visitor IP from Cloudflare's `CF-Connecting-IP` header
  (via `set_real_ip_from`/`real_ip_header`, using Cloudflare's published IP
  ranges), instead of logging Cloudflare's edge IP for every request.
- Trusts Cloudflare's `X-Forwarded-Proto` for the visitor's real scheme
  (falls back to nginx's own `$scheme` if it's ever missing).
- Optionally (**off by default**) restricts direct access to the origin to
  Cloudflare's IP ranges plus localhost (`allow`/`deny` in the server
  block), so the origin can't be reached by hitting its IP directly,
  bypassing Cloudflare entirely. Opt in with
  `RESTRICT_TO_CLOUDFLARE=true SERVER=... DOMAIN=... task deploy` — **only**
  if `DOMAIN`'s DNS record is actually proxied through Cloudflare
  (orange-clouded), otherwise every request will get a 403.
- Sets long-lived, immutable `Cache-Control` on `/static/*` and
  `/favicon.ico` so Cloudflare's edge and browsers cache them aggressively,
  and `Cache-Control: no-cache` on everything else (the page, `/data.json`,
  `/cv.pdf`) so a redeploy is visible immediately without needing a cache
  purge.
- Enables gzip for text-based responses.

Cloudflare's IP ranges are hardcoded in `deploy.sh` (`CLOUDFLARE_IPS`); check
https://www.cloudflare.com/ips/ occasionally and update that list if they
change. The generated nginx config is plain HTTP on port 80 — typically
paired with Cloudflare's "Flexible" SSL mode, or run `certbot --nginx -d
<DOMAIN>` on the server for real TLS to the origin ("Full"/"Full strict").


## Project layout

```
data.json                        content for all sections (embedded via go:embed)
main.go                          CLI entry point (serve / generate)
deploy.sh                        deploy the bin/website binary over ssh/scp (see task deploy)
internal/
  data/                          data.json structs + parsing/formatting helpers
  web/
    assets.go                    go:embed of static/
    static/                      css, js, images, favicon.ico
    views/                       templ components (layout + page sections)
  httpserver/                    chi router for the live server
  generator/                     static site exporter
  cv/                            PDF resume generator (github.com/go-pdf/fpdf)
    fonts/                       bundled Noto Sans (SIL OFL) for full Unicode/accent support
```
