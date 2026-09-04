// Command website serves geidelguerra.com and can also export it as a
// static site.
//
// Usage:
//
//	website                        run the live HTTP server (default);
//	                               configured via HOST/PORT env vars (or a
//	                               local .env file), no CLI flags needed
//	website generate [-out dist]   export a static build
package main

import (
	_ "embed"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"

	"github.com/geidelguerra/website/internal/data"
	"github.com/geidelguerra/website/internal/generator"
	"github.com/geidelguerra/website/internal/httpserver"
)

// embeddedData is the site content, baked into the binary at build time.
// There is no dynamic/runtime read of data.json from disk: edit this file
// and rebuild to change the site's content.
//
//go:embed data.json
var embeddedData []byte

func main() {
	// Optional: load a local .env file (never committed — see .gitignore)
	// so HOST/PORT don't have to be exported by hand during local
	// development. Real environment variables always win; see
	// loadDotEnv's doc comment.
	loadDotEnv(".env")

	args := os.Args[1:]

	cmd := "serve"
	if len(args) > 0 && !isFlag(args[0]) {
		cmd = args[0]
		args = args[1:]
	}

	switch cmd {
	case "serve":
		runServe()
	case "generate", "build":
		runGenerate(args)
	case "help", "-h", "--help":
		printUsage()
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n\n", cmd)
		printUsage()
		os.Exit(1)
	}
}

func isFlag(s string) bool {
	return len(s) > 0 && s[0] == '-'
}

func printUsage() {
	fmt.Fprintln(os.Stderr, `Usage:
  website                        run the live HTTP server (default)
  website generate [-out dist]   export a static build

The live server takes no CLI flags: it's configured entirely via
environment variables (or a local .env file):
  HOST   interface to bind (default: all interfaces)
  PORT   port to listen on (default: 8080)`)
}

func runServe() {
	host := getenv("HOST", "")
	port := getenv("PORT", "8080")
	addr := host + ":" + port

	d, err := data.Load(embeddedData)
	if err != nil {
		log.Fatalf("data: %v", err)
	}

	handler, err := httpserver.New(d)
	if err != nil {
		log.Fatalf("build server: %v", err)
	}

	log.Printf("listening on %s", displayURL(addr))
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// displayURL turns a listen address (e.g. ":8080", "0.0.0.0:8080",
// "127.0.0.1:3000") into a clickable http:// URL for the terminal. An empty
// or wildcard host (":8080", "0.0.0.0:8080", "[::]:8080") is displayed as
// localhost, since that's what actually resolves in a browser.
func displayURL(addr string) string {
	host, port, err := net.SplitHostPort(addr)
	if err != nil {
		return addr
	}

	if host == "" || host == "0.0.0.0" || host == "::" {
		host = "localhost"
	}

	return fmt.Sprintf("http://%s:%s", host, port)
}

func runGenerate(args []string) {
	fset := flag.NewFlagSet("generate", flag.ExitOnError)
	out := fset.String("out", "dist", "output directory")
	fset.Parse(args)

	d, err := data.Load(embeddedData)
	if err != nil {
		log.Fatalf("data: %v", err)
	}

	if err := generator.Generate(d, *out); err != nil {
		log.Fatalf("generate: %v", err)
	}

	log.Printf("static site generated in %s/", *out)
}
