# geidelguerra.com

Single-page portfolio site. Go + [chi](https://github.com/go-chi/chi) +
[templ](https://templ.guide), vanilla CSS/JS (no frontend frameworks or
libraries), all assets embedded into a single binary. Supports light/dark
theme via CSS variables.

## Requirements

- Go 1.23+
- [templ](https://templ.guide) CLI (`go install github.com/a-h/templ/cmd/templ@latest`)
- [Task](https://taskfile.dev) (`go install github.com/go-task/task/v3/cmd/task@latest`), optional but recommended

## Content

All page content lives in [`data.json`](./data.json): name, title, about,
networks, skills, toolkit, languages, studies, experience and projects. Edit
that file to update the site — no code changes required.

At runtime the server reads `data.json` from disk next to the binary (so you
can edit it live without rebuilding). A copy is also embedded into the binary
at build time as a fallback, so the binary still works standalone if
`data.json` isn't present on disk.

## Replacing the photo / favicon

- Profile photo: `internal/web/static/images/profile.jpg`
- Favicon (png, used in `<link>`): `internal/web/static/images/favicon.png`
- Favicon (ico, served at `/favicon.ico`): `internal/web/static/favicon.ico`

Just overwrite these files (keep the same names) and rebuild.

## Tasks

```sh
task build           # go build a single binary into bin/website
task run              # go run the live server (task run -- -addr :3000)
task dev              # live server + templ --watch, regenerating on .templ changes
task generate         # export a static build into dist/
task serve:static      # serve dist/ locally for previewing the static export
task fmt               # templ fmt + go fmt
task test              # go test ./...
task clean             # remove bin/ and dist/
```

## CLI

The compiled binary supports two subcommands (defaults to `serve`):

```sh
website serve [-addr :8080] [-data data.json]
website generate [-out dist] [-data data.json]
```

`serve` runs the live HTTP server. `generate` renders the same page to a
static `index.html` plus its static assets, so the site can be hosted on any
static host without running Go at all.

## Machine-readable data & CV

- `GET /data.json` — the same site content as pretty-printed JSON, with
  `Access-Control-Allow-Origin: *`, meant for scrapers/crawlers/AI agents.
  Linked from `<head>` via `<link rel="alternate" type="application/json">`
  and from a small link in the page footer.
- `GET /cv.pdf` — a printable PDF resume generated on the fly from the same
  data (`internal/cv`): photo, name, title and bio, then education, then
  skills. Always rendered in the site's light color palette. Also linked
  from the footer.

Both are also produced by `task generate` (`dist/data.json`, `dist/cv.pdf`),
so the static export stays in sync with the live server.

## Theming

Colors are defined as CSS variables in `internal/web/static/css/style.css`,
scoped under `[data-theme="light"]` and `[data-theme="dark"]`. A small inline
script in the page `<head>` sets the theme before first paint (from
`localStorage`, falling back to the OS preference) to avoid a flash of the
wrong theme. The toggle button in the nav bar flips and persists the choice.

## Project layout

```
data.json                        content for all sections
main.go                          CLI entry point (serve / generate)
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
