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

1. Copies the binary to the server over `scp`.
2. Over `ssh`, creates a dedicated `website` user/group (if missing),
   installs the binary at `/apps/geidelguerra-website/website`, writes a
   systemd unit (`geidelguerra-website.service`) that runs
   `website serve -addr :8080`, and enables + restarts it.

Since `data.json` is embedded in the binary, there's nothing else to copy or
seed on the server — every deploy is a single self-contained binary.

Requires `SERVER` to be set to an SSH target with key-based access and root
(or equivalent) privileges, e.g.:

```sh
SERVER=root@geidelguerra.com task deploy
```

Put a reverse proxy (e.g. nginx/Caddy) in front of port 8080 for TLS and to
serve the domain on 443/80.

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
