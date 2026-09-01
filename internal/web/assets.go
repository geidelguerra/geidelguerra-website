// Package web holds the embedded static assets (css/js/images/favicon) and
// the templ views used to render the site.
//
// To replace the profile photo or favicon, simply overwrite the files at
// static/images/profile.jpg / static/images/favicon.png / static/favicon.ico
// and rebuild — no code changes required.
package web

import (
	"embed"
	"io/fs"
)

//go:embed static
var embeddedStatic embed.FS

// Static returns the embedded static assets rooted at "static/", so paths
// look like "css/style.css", "js/app.js", "images/profile.jpg", "favicon.ico".
func Static() fs.FS {
	sub, err := fs.Sub(embeddedStatic, "static")
	if err != nil {
		// Can't happen: "static" is embedded at build time.
		panic(err)
	}
	return sub
}
