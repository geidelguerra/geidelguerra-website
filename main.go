// Command website serves geidelguerra.com and can also export it as a
// static site.
//
// Usage:
//
//	website serve [-addr :8080] [-data data.json]   run the live HTTP server (default)
//	website generate [-out dist] [-data data.json]  export a static build
package main

import (
	_ "embed"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/geidelguerra/website/internal/data"
	"github.com/geidelguerra/website/internal/generator"
	"github.com/geidelguerra/website/internal/httpserver"
)

// embeddedData is the fallback content used when no external data.json is
// found on disk, so the compiled binary works standalone.
//
//go:embed data.json
var embeddedData []byte

func main() {
	args := os.Args[1:]

	cmd := "serve"
	if len(args) > 0 && !isFlag(args[0]) {
		cmd = args[0]
		args = args[1:]
	}

	switch cmd {
	case "serve":
		runServe(args)
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
  website serve [-addr :8080] [-data data.json]   run the live HTTP server (default)
  website generate [-out dist] [-data data.json]  export a static build`)
}

func runServe(args []string) {
	fset := flag.NewFlagSet("serve", flag.ExitOnError)
	addr := fset.String("addr", ":8080", "address to listen on")
	dataPath := fset.String("data", "data.json", "path to data.json (falls back to the embedded copy)")
	fset.Parse(args)

	load := func() (*data.Data, error) {
		return data.Load(embeddedData, *dataPath)
	}

	if _, err := load(); err != nil {
		log.Fatalf("data: %v", err)
	}

	handler := httpserver.New(load)

	log.Printf("listening on %s", *addr)
	if err := http.ListenAndServe(*addr, handler); err != nil {
		log.Fatal(err)
	}
}

func runGenerate(args []string) {
	fset := flag.NewFlagSet("generate", flag.ExitOnError)
	out := fset.String("out", "dist", "output directory")
	dataPath := fset.String("data", "data.json", "path to data.json (falls back to the embedded copy)")
	fset.Parse(args)

	d, err := data.Load(embeddedData, *dataPath)
	if err != nil {
		log.Fatalf("data: %v", err)
	}

	if err := generator.Generate(d, *out); err != nil {
		log.Fatalf("generate: %v", err)
	}

	log.Printf("static site generated in %s/", *out)
}
