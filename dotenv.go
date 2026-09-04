package main

import (
	"os"
	"strings"
)

// loadDotEnv reads simple KEY=VALUE lines from path (typically ".env") into
// the process environment, for local-development convenience only — it's
// entirely optional, and silently does nothing if the file doesn't exist.
//
// Real environment variables always take precedence: a variable already set
// in the environment is never overridden by the .env file. This means the
// same .env file can safely be left in place while overriding individual
// values ad hoc, e.g. `PORT=3000 go run .`.
//
// This is intentionally a minimal, dependency-free parser rather than a
// full dotenv implementation: blank lines and "#" comments are skipped, an
// optional "export " prefix is stripped, and values may optionally be
// wrapped in single or double quotes. It does not support multi-line
// values, variable interpolation, or escape sequences.
func loadDotEnv(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}

	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		line = strings.TrimPrefix(line, "export ")

		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		if key == "" {
			continue
		}

		value = strings.TrimSpace(value)
		if n := len(value); n >= 2 {
			if (value[0] == '"' && value[n-1] == '"') || (value[0] == '\'' && value[n-1] == '\'') {
				value = value[1 : n-1]
			}
		}

		if _, exists := os.LookupEnv(key); exists {
			continue
		}
		os.Setenv(key, value)
	}
}
