// Package httpserver wires up the chi router that serves the site live.
package httpserver

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/geidelguerra/website/internal/cv"
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

	// /data.json exposes the site content as machine-readable JSON, for
	// scrapers, crawlers and AI agents that want structured data instead of
	// scraping the HTML.
	r.Get("/data.json", func(w http.ResponseWriter, r *http.Request) {
		d, err := load()
		if err != nil {
			log.Printf("load data: %v", err)
			http.Error(w, "failed to load site data", http.StatusInternalServerError)
			return
		}

		body, err := json.MarshalIndent(d, "", "  ")
		if err != nil {
			log.Printf("marshal data: %v", err)
			http.Error(w, "failed to encode site data", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Cache-Control", "no-store, must-revalidate")
		w.Write(body)
	})

	// /cv.pdf renders a printable PDF resume (photo, name, title, bio,
	// education, skills) from the same site content, always in light mode.
	r.Get("/cv.pdf", func(w http.ResponseWriter, r *http.Request) {
		d, err := load()
		if err != nil {
			log.Printf("load data: %v", err)
			http.Error(w, "failed to load site data", http.StatusInternalServerError)
			return
		}

		photo, err := web.ProfilePhoto()
		if err != nil {
			log.Printf("load profile photo: %v", err)
		}

		body, err := cv.Generate(d, photo)
		if err != nil {
			log.Printf("generate cv: %v", err)
			http.Error(w, "failed to generate CV", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/pdf")
		w.Header().Set("Content-Disposition", `inline; filename="`+cvFilename(d.Name)+`"`)
		w.Header().Set("Cache-Control", "no-store, must-revalidate")
		w.Write(body)
	})

	return r
}

func cvFilename(name string) string {
	slug := strings.ReplaceAll(strings.TrimSpace(name), " ", "-")
	if slug == "" {
		slug = "CV"
	}
	return slug + "-CV.pdf"
}
