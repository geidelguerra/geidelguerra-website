// Package data loads and enriches the site content from data.json.
package data

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
)

// Network is a social/profile link shown in the hero and footer.
type Network struct {
	Label string `json:"label"`
	URL   string `json:"url"`
}

// Skill is a technology the site owner knows, with years of experience.
type Skill struct {
	Label     string `json:"label"`
	URL       string `json:"url"`
	Years     string `json:"years"`
	Preferred bool   `json:"preferred"`
}

// ToolkitCategory groups tools used day to day (OS, editor, terminal, etc).
type ToolkitCategory struct {
	Category string   `json:"category"`
	Tools    []string `json:"tools"`
}

// Language is a spoken language and proficiency level.
type Language struct {
	Label string `json:"label"`
	Score string `json:"score"`
	URL   string `json:"url"`
}

// Study is an education entry.
type Study struct {
	Name      string `json:"name"`
	School    string `json:"school"`
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate"`

	DateRange string `json:"-"`
	Duration  string `json:"-"`
}

// Experience is a job entry.
type Experience struct {
	Name        string   `json:"name"`
	Company     string   `json:"company"`
	CompanyURL  string   `json:"companyUrl"`
	StartDate   string   `json:"startDate"`
	EndDate     string   `json:"endDate"`
	Description string   `json:"description"`
	Tech        []string `json:"tech"`

	DateRange string `json:"-"`
	Duration  string `json:"-"`
	Current   bool   `json:"-"`
}

// Project is a portfolio project entry.
type Project struct {
	Name        string `json:"name"`
	URL         string `json:"url"`
	StartDate   string `json:"startDate"`
	EndDate     string `json:"endDate"`
	ImageURL    string `json:"image_url"`
	Description string `json:"description"`
	Personal    bool   `json:"personal"`

	DateRange string `json:"-"`
}

// Data is the full set of content used to render the site.
type Data struct {
	Name       string            `json:"name"`
	Title      string            `json:"title"`
	About      string            `json:"about"`
	StartDate  string            `json:"startDate"`
	Networks   []Network         `json:"networks"`
	Skills     []Skill           `json:"skills"`
	Toolkit    []ToolkitCategory `json:"toolkit"`
	Languages  []Language        `json:"languages"`
	Studies    []Study           `json:"studies"`
	Experience []Experience      `json:"experience"`
	Projects   []Project         `json:"projects"`

	ExperienceYears string   `json:"-"`
	AboutParagraphs []string `json:"-"`
	Summary         string   `json:"-"`
}

// Load reads the site content. It prefers the file at path (so content can
// be edited without rebuilding the binary) and falls back to fallback
// (typically an embedded copy of data.json) when path does not exist or
// can't be read.
func Load(fallback []byte, path string) (*Data, error) {
	raw := fallback

	if path != "" {
		if b, err := os.ReadFile(path); err == nil {
			raw = b
		}
	}

	var d Data
	if err := json.Unmarshal(raw, &d); err != nil {
		return nil, fmt.Errorf("parse data: %w", err)
	}

	d.enrich()

	return &d, nil
}

func (d *Data) enrich() {
	now := time.Now()

	d.ExperienceYears = dateDiff(parseDate(d.StartDate), now)
	d.AboutParagraphs = splitParagraphs(d.About)
	if len(d.AboutParagraphs) > 0 {
		d.Summary = d.AboutParagraphs[0]
	}

	// Preferred skills first, keeping the original relative order otherwise.
	sort.SliceStable(d.Skills, func(i, j int) bool {
		return d.Skills[i].Preferred && !d.Skills[j].Preferred
	})

	for i := range d.Studies {
		s := &d.Studies[i]
		s.DateRange = fmt.Sprintf("%s - %s", formatDate(s.StartDate), formatDate(s.EndDate))
		s.Duration = dateDiff(parseDate(s.StartDate), parseDate(s.EndDate))
	}

	for i := range d.Experience {
		e := &d.Experience[i]
		e.Current = strings.EqualFold(e.EndDate, "present")

		end := now
		if !e.Current {
			end = parseDate(e.EndDate)
		}

		e.DateRange = fmt.Sprintf("%s - %s", formatDate(e.StartDate), formatDate(e.EndDate))
		e.Duration = dateDiff(parseDate(e.StartDate), end)
	}

	for i := range d.Projects {
		p := &d.Projects[i]
		p.DateRange = fmt.Sprintf("%s - %s", formatDate(p.StartDate), formatDate(p.EndDate))
	}
}

func splitParagraphs(s string) []string {
	normalized := strings.ReplaceAll(s, "\r\n", "\n")
	if normalized == "" {
		return nil
	}

	parts := strings.Split(normalized, "\n\n")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}

	return out
}

// parseDate parses dates in "YYYY", "YYYY-MM" or "YYYY-MM-DD" form.
// "present" (any case) and empty strings resolve to now.
func parseDate(s string) time.Time {
	if strings.EqualFold(s, "present") || s == "" {
		return time.Now()
	}

	parts := strings.Split(s, "-")
	for len(parts) < 3 {
		parts = append(parts, "01")
	}

	t, err := time.Parse("2006-01-02", strings.Join(parts, "-"))
	if err != nil {
		return time.Now()
	}

	return t
}

// formatDate renders a date string for display, e.g. "2025-02" -> "Feb 2025".
func formatDate(s string) string {
	if strings.EqualFold(s, "present") || s == "" {
		return "Present"
	}

	parts := strings.Split(s, "-")
	if len(parts) == 1 {
		return parts[0]
	}

	return parseDate(s).Format("Jan 2006")
}

// dateDiff renders a human readable duration between two dates in years.
func dateDiff(start, end time.Time) string {
	days := end.Sub(start).Hours() / 24
	years := days / 360

	if years < 1 {
		return "less than a year"
	}
	if years < 2 {
		return trimFloat(math.Round(years*10)/10) + " year"
	}

	return trimFloat(math.Round(years)) + " years"
}

func trimFloat(f float64) string {
	return strconv.FormatFloat(f, 'f', -1, 64)
}
