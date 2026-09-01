package web

import (
	"bytes"
	"fmt"

	"github.com/tdewolff/minify/v2"
	"github.com/tdewolff/minify/v2/css"
	"github.com/tdewolff/minify/v2/js"
)

// MinifyCSS minifies CSS source bytes.
func MinifyCSS(src []byte) ([]byte, error) {
	var buf bytes.Buffer
	if err := css.Minify(minify.New(), &buf, bytes.NewReader(src), nil); err != nil {
		return nil, fmt.Errorf("minify css: %w", err)
	}
	return buf.Bytes(), nil
}

// MinifyJS minifies JavaScript source bytes.
func MinifyJS(src []byte) ([]byte, error) {
	var buf bytes.Buffer
	if err := js.Minify(minify.New(), &buf, bytes.NewReader(src), nil); err != nil {
		return nil, fmt.Errorf("minify js: %w", err)
	}
	return buf.Bytes(), nil
}
