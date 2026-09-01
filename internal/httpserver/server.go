// Package httpserver wires up the chi router that serves the site live.
package httpserver

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/geidelguerra/website/internal/cv"
	"github.com/geidelguerra/website/internal/data"
	"github.com/geidelguerra/website/internal/seo"
	"github.com/geidelguerra/website/internal/web"
	"github.com/geidelguerra/website/internal/web/views"
)

// New builds the HTTP handler for the site. d is parsed once from the
// embedded data.json (see main.go) and is immutable for the lifetime of the
// process: there is no dynamic/runtime re-read of data.json from disk.
// The JSON and PDF representations are also rendered once, up front, and
// served as static bytes on every request.
func New(d *data.Data) (http.Handler, error) {
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
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := views.IndexPage(d).Render(r.Context(), w); err != nil {
			log.Printf("render page: %v", err)
			http.Error(w, "failed to render page", http.StatusInternalServerError)
		}
	})

	// /data.json exposes the site content as machine-readable JSON, for
	// scrapers, crawlers and AI agents that want structured data instead of
	// scraping the HTML.
	dataJSON, err := json.MarshalIndent(d, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("marshal data.json: %w", err)
	}

	r.Get("/data.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Write(dataJSON)
	})

	// /cv.pdf serves a printable, single-page PDF resume (photo, name,
	// title, networks, bio, experience, education, skills) built from the
	// same site content, always in light mode.
	photo, err := web.ProfilePhoto()
	if err != nil {
		log.Printf("load profile photo: %v", err)
	}

	cvPDF, err := cv.Generate(d, photo)
	if err != nil {
		return nil, fmt.Errorf("generate cv.pdf: %w", err)
	}

	cvContentDisposition := `inline; filename="` + cvFilename(d.Name) + `"`

	r.Get("/cv.pdf", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/pdf")
		w.Header().Set("Content-Disposition", cvContentDisposition)
		w.Write(cvPDF)
	})

	// /robots.txt and /sitemap.xml: standard crawler discovery files.
	robotsTXT := seo.RobotsTXT()
	r.Get("/robots.txt", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Write(robotsTXT)
	})

	sitemapXML := seo.SitemapXML()
	r.Get("/sitemap.xml", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/xml; charset=utf-8")
		w.Write(sitemapXML)
	})

	return r, nil
}

func cvFilename(name string) string {
	slug := strings.ReplaceAll(strings.TrimSpace(name), " ", "-")
	if slug == "" {
		slug = "CV"
	}
	return slug + "-CV.pdf"
}
