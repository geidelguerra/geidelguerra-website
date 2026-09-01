// Package httpserver wires up the chi router that serves the site live.
package httpserver

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/geidelguerra/website/internal/data"
	"github.com/geidelguerra/website/internal/web"
	"github.com/geidelguerra/website/internal/web/views"
)

// DataLoader returns the current site content. It's called per request so
// edits to data.json are picked up without restarting the server.
type DataLoader func() (*data.Data, error)

// New builds the HTTP handler for the site.
func New(load DataLoader) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	staticFS := web.Static()
	fileServer := http.FileServer(http.FS(staticFS))

	r.Handle("/static/*", http.StripPrefix("/static/", fileServer))
	r.Get("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		fileServer.ServeHTTP(w, r)
	})

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		d, err := load()
		if err != nil {
			log.Printf("load data: %v", err)
			http.Error(w, "failed to load site data", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := views.IndexPage(d).Render(r.Context(), w); err != nil {
			log.Printf("render page: %v", err)
			http.Error(w, "failed to render page", http.StatusInternalServerError)
		}
	})

	return r
}
