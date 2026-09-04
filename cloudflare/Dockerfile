# Built with an `image_build_context` of the repository root (see
# ../wrangler.jsonc's `containers[0].image_build_context`), so this
# Dockerfile can see the full Go module: go.mod, internal/, data.json,
# main.go.

FROM golang:1.25-alpine AS build
WORKDIR /src

# Cache module downloads in their own layer, separate from source changes.
COPY go.mod go.sum ./
RUN go mod download

COPY . .
# Installed as a standalone module build (its own resolved deps), rather
# than `go run`/`go tool` from within this module — the templ CLI pulls in
# many more transitive deps than the templ *runtime* package this module
# already depends on, and those aren't in this module's go.sum.
RUN go install github.com/a-h/templ/cmd/templ@v0.3.1020
RUN templ generate
# CGO_ENABLED=0 gives a fully static binary — no dynamic dependencies, so it
# runs unmodified on the distroless base image below.
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/website .

# "static-debian12" bundles CA certificates but no shell or package
# manager — appropriate for a static Go binary. This site makes no
# outbound HTTPS calls itself, but the certs are harmless to keep around.
FROM gcr.io/distroless/static-debian12
COPY --from=build /out/website /website
EXPOSE 8080
ENTRYPOINT ["/website"]
