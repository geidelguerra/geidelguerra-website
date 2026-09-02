// Package generator renders the site to a static directory (index.html +
// static assets), so it can be hosted without running the Go binary.
package generator

import (
	"context"
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/geidelguerra/website/internal/cv"
	"github.com/geidelguerra/website/internal/data"
	"github.com/geidelguerra/website/internal/seo"
	"github.com/geidelguerra/website/internal/web"
	"github.com/geidelguerra/website/internal/web/views"
)

// Generate renders d into outDir as a static site: outDir/index.html,
// outDir/data.json, outDir/cv.pdf, outDir/favicon.ico and outDir/static/**.
func Generate(d *data.Data, outDir string) error {
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return fmt.Errorf("create output dir: %w", err)
	}

	if err := writeIndex(d, outDir); err != nil {
		return err
	}

	if err := writeDataJSON(d, outDir); err != nil {
		return err
	}

	if err := writeCV(d, outDir); err != nil {
		return err
	}

	if err := writeSEOFiles(outDir); err != nil {
		return err
	}

	if err := copyStatic(outDir); err != nil {
		return err
	}

	return nil
}

func writeIndex(d *data.Data, outDir string) error {
	f, err := os.Create(filepath.Join(outDir, "index.html"))
	if err != nil {
		return fmt.Errorf("create index.html: %w", err)
	}
	defer f.Close()

	if err := views.IndexPage(d).Render(context.Background(), f); err != nil {
		return fmt.Errorf("render index.html: %w", err)
	}

	return nil
}

// writeDataJSON exposes the same content as machine-readable JSON, mirroring
// the /data.json endpoint served live, for scrapers/AI agents consuming the
// static export.
func writeDataJSON(d *data.Data, outDir string) error {
	body, err := json.MarshalIndent(d, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal data.json: %w", err)
	}

	if err := os.WriteFile(filepath.Join(outDir, "data.json"), body, 0o644); err != nil {
		return fmt.Errorf("write data.json: %w", err)
	}

	return nil
}

// writeCV renders the printable PDF resume, mirroring the /cv.pdf endpoint
// served live, for consumers of the static export.
func writeCV(d *data.Data, outDir string) error {
	photo, err := web.ProfilePhoto()
	if err != nil {
		return fmt.Errorf("read profile photo: %w", err)
	}

	body, err := cv.Generate(d, photo)
	if err != nil {
		return fmt.Errorf("generate cv.pdf: %w", err)
	}

	if err := os.WriteFile(filepath.Join(outDir, "cv.pdf"), body, 0o644); err != nil {
		return fmt.Errorf("write cv.pdf: %w", err)
	}

	return nil
}

// writeSEOFiles writes robots.txt and sitemap.xml, mirroring the routes
// served live, for crawlers consuming the static export.
func writeSEOFiles(outDir string) error {
	if err := os.WriteFile(filepath.Join(outDir, "robots.txt"), seo.RobotsTXT(), 0o644); err != nil {
		return fmt.Errorf("write robots.txt: %w", err)
	}

	if err := os.WriteFile(filepath.Join(outDir, "sitemap.xml"), seo.SitemapXML(), 0o644); err != nil {
		return fmt.Errorf("write sitemap.xml: %w", err)
	}

	return nil
}

// hashedStaticAssets are served via a hashed, cache-busted URL (see
// web.StaticAssetPath) rather than their plain path, so the static export
// must write them at that exact hashed path: unlike the live server's
// web.Handler(), a plain static file host can't parse/verify a hash suffix
// and fall back to the real file on its own.
var hashedStaticAssets = []string{"css/style.css", "js/app.js", "js/ask.js"}

// copyStatic copies the embedded assets into outDir, mirroring the URL
// layout served by the live server: favicon.ico stays at the root,
// css/style.css, js/app.js (both minified) and js/ask.js are written at
// their hashed filename, and everything else lives under static/ as-is.
func copyStatic(outDir string) error {
	staticFS := web.Static()
	assets := web.HashedAssets()

	hashed := make(map[string]bool, len(hashedStaticAssets))
	for _, name := range hashedStaticAssets {
		hashed[name] = true

		content, err := fs.ReadFile(assets, name)
		if err != nil {
			return fmt.Errorf("read %s: %w", name, err)
		}

		dest := filepath.Join(outDir, "static", filepath.FromSlash(assets.HashName(name)))
		if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(dest, content, 0o644); err != nil {
			return fmt.Errorf("write %s: %w", dest, err)
		}
	}

	return fs.WalkDir(staticFS, ".", func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if path == "." || hashed[path] {
			return nil
		}

		dest := filepath.Join(outDir, "static", path)
		if path == "favicon.ico" {
			dest = filepath.Join(outDir, "favicon.ico")
		}

		if entry.IsDir() {
			return os.MkdirAll(dest, 0o755)
		}

		if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
			return err
		}

		content, err := fs.ReadFile(staticFS, path)
		if err != nil {
			return fmt.Errorf("read %s: %w", path, err)
		}

		if err := os.WriteFile(dest, content, 0o644); err != nil {
			return fmt.Errorf("write %s: %w", dest, err)
		}

		return nil
	})
}
