package web

import (
	"bytes"
	"fmt"
	"io/fs"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/benbjohnson/hashfs"
)

// hashedFS wraps Static() with content-addressed filenames (via
// github.com/benbjohnson/hashfs), e.g. "css/style.css" is served as
// "css/style-<sha256>.css". This lets those URLs be cached aggressively and
// safely forever, since the URL itself changes whenever the file's content
// does: no more stale, long-cached CSS/JS after a redeploy.
//
// CSS/JS are minified first (see minify.go), so the hash reflects the
// actually-served (minified) bytes, not the raw embedded source.
var hashedFS = hashfs.NewFS(newMinifiedOverlay())

// StaticAssetPath returns the hashed, cache-busted URL for a static asset
// under /static/, e.g. StaticAssetPath("css/style.css") returns
// "/static/css/style-<hash>.css". Use this in templates for any asset that
// should be aggressively cached, instead of hardcoding "/static/..." paths.
func StaticAssetPath(name string) string {
	return "/static/" + hashedFS.HashName(strings.TrimPrefix(name, "/"))
}

// Handler serves static assets. A request for a hashed filename (as
// returned by StaticAssetPath) is cached aggressively; a request for the
// original, unhashed filename (e.g. images not referenced via
// StaticAssetPath) still works, falling through to the plain content.
func Handler() http.Handler {
	return hashfs.FileServer(hashedFS)
}

// HashedAssets exposes the underlying hashfs.FS for callers (the static
// site exporter) that need to read file contents/hashed names directly
// rather than only generating URLs for them.
func HashedAssets() *hashfs.FS {
	return hashedFS
}

// newMinifiedOverlay wraps Static() so that reads of css/style.css and
// js/app.js transparently return their minified contents; every other path
// (images, favicon, js/ask.js, ...) passes through unchanged. Panics if the
// embedded CSS/JS fail to minify: that can't happen with the CSS/JS
// actually checked into this repo, and would indicate a real bug rather
// than something safe to silently serve broken.
func newMinifiedOverlay() fs.FS {
	overrides := make(map[string][]byte, 2)

	cssSrc, err := fs.ReadFile(Static(), "css/style.css")
	if err != nil {
		panic(fmt.Errorf("read style.css: %w", err))
	}
	css, err := MinifyCSS(cssSrc)
	if err != nil {
		panic(fmt.Errorf("minify style.css: %w", err))
	}
	overrides["css/style.css"] = css

	jsSrc, err := fs.ReadFile(Static(), "js/app.js")
	if err != nil {
		panic(fmt.Errorf("read app.js: %w", err))
	}
	js, err := MinifyJS(jsSrc)
	if err != nil {
		panic(fmt.Errorf("minify app.js: %w", err))
	}
	overrides["js/app.js"] = js

	return &overlayFS{base: Static(), overrides: overrides}
}

// overlayFS serves files from overrides first, falling back to base.
type overlayFS struct {
	base      fs.FS
	overrides map[string][]byte
}

func (o *overlayFS) Open(name string) (fs.File, error) {
	if data, ok := o.overrides[name]; ok {
		return &memFile{Reader: bytes.NewReader(data), name: path.Base(name), size: int64(len(data))}, nil
	}
	return o.base.Open(name)
}

// memFile is a minimal in-memory fs.File (with Seek, so hashfs/http can
// serve it via http.ServeContent) for the overridden (minified) files above.
type memFile struct {
	*bytes.Reader
	name string
	size int64
}

func (f *memFile) Stat() (fs.FileInfo, error) { return memFileInfo{f.name, f.size}, nil }
func (f *memFile) Close() error               { return nil }

type memFileInfo struct {
	name string
	size int64
}

func (i memFileInfo) Name() string       { return i.name }
func (i memFileInfo) Size() int64        { return i.size }
func (i memFileInfo) Mode() fs.FileMode  { return 0o444 }
func (i memFileInfo) ModTime() time.Time { return time.Time{} }
func (i memFileInfo) IsDir() bool        { return false }
func (i memFileInfo) Sys() any           { return nil }
