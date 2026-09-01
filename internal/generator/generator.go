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

	"github.com/geidelguerra/website/internal/data"
	"github.com/geidelguerra/website/internal/web"
	"github.com/geidelguerra/website/internal/web/views"
)

// Generate renders d into outDir as a static site: outDir/index.html,
// outDir/data.json, outDir/favicon.ico and outDir/static/**.
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

// copyStatic copies the embedded assets into outDir, mirroring the URL
// layout served by the live server: favicon.ico stays at the root, and
// everything else lives under static/.
func copyStatic(outDir string) error {
	staticFS := web.Static()

	return fs.WalkDir(staticFS, ".", func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if path == "." {
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
