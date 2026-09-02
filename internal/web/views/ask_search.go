package views

import (
	"fmt"
	"strings"

	"github.com/geidelguerra/website/internal/data"
)

// searchDoc is one searchable "card" for the ask-about-this-website widget:
// a human-readable title/text pair plus extra keywords (beyond the words
// already in the title/text) that a visitor might type to find it. Matching
// happens entirely client-side (see static/js/ask.js): this struct is
// serialized once, at render time, and embedded directly in the page as
// JSON (no extra network round trip, no server involved in answering
// questions).
type searchDoc struct {
	Title    string   `json:"title"`
	Text     string   `json:"text"`
	Keywords []string `json:"keywords"`
}

// buildSearchIndex turns the site's content into a flat list of searchDocs:
// one for the profile/about blurb, one for skills, one for the toolkit, one
// for spoken languages, one per job, one per project, one per education
// entry, and one for contact links.
func buildSearchIndex(d *data.Data) []searchDoc {
	var docs []searchDoc

	docs = append(docs, searchDoc{
		Title:    "About " + d.Name,
		Text:     fmt.Sprintf("%s — %s. %s", d.Name, d.Title, d.Summary),
		Keywords: []string{"about", "who", "bio", "background", "summary", "introduction", "experience", "years"},
	})

	if len(d.Skills) > 0 {
		parts := make([]string, 0, len(d.Skills))
		keywords := []string{"skills", "programming", "languages", "technologies", "stack", "tools", "tech", "know", "knows"}
		for _, s := range d.Skills {
			parts = append(parts, fmt.Sprintf("%s (%s yr)", s.Label, s.Years))
			keywords = append(keywords, s.Label)
		}
		docs = append(docs, searchDoc{
			Title:    "Skills",
			Text:     "Skills: " + strings.Join(parts, ", "),
			Keywords: keywords,
		})
	}

	if len(d.Toolkit) > 0 {
		parts := make([]string, 0, len(d.Toolkit))
		keywords := []string{"toolkit", "setup", "workstation", "editor", "terminal", "shell", "os"}
		for _, t := range d.Toolkit {
			parts = append(parts, fmt.Sprintf("%s: %s", t.Category, strings.Join(t.Tools, "/")))
			keywords = append(keywords, t.Category)
			keywords = append(keywords, t.Tools...)
		}
		docs = append(docs, searchDoc{
			Title:    "Workstation / toolkit",
			Text:     "Workstation: " + strings.Join(parts, "; "),
			Keywords: keywords,
		})
	}

	if len(d.Languages) > 0 {
		parts := make([]string, 0, len(d.Languages))
		keywords := []string{"languages", "spoken", "speak", "speaks", "fluent", "native"}
		for _, l := range d.Languages {
			parts = append(parts, fmt.Sprintf("%s (%s)", l.Label, l.Score))
			keywords = append(keywords, l.Label)
		}
		docs = append(docs, searchDoc{
			Title:    "Spoken languages",
			Text:     "Spoken languages: " + strings.Join(parts, ", "),
			Keywords: keywords,
		})
	}

	for _, e := range d.Experience {
		keywords := []string{"experience", "job", "work", "career", "company", "employer", e.Company, e.Name}
		keywords = append(keywords, e.Tech...)
		docs = append(docs, searchDoc{
			Title:    e.Name + " at " + e.Company,
			Text:     fmt.Sprintf("%s at %s (%s): %s", e.Name, e.Company, e.DateRange, e.Description),
			Keywords: keywords,
		})
	}

	for _, p := range d.Projects {
		keywords := []string{"project", "projects", "built", "made", "created", p.Name}
		docs = append(docs, searchDoc{
			Title:    p.Name,
			Text:     fmt.Sprintf("%s (%s): %s", p.Name, p.DateRange, p.Description),
			Keywords: keywords,
		})
	}

	for _, s := range d.Studies {
		keywords := []string{"education", "study", "studies", "school", "university", "degree", s.Name, s.School}
		docs = append(docs, searchDoc{
			Title:    s.Name,
			Text:     fmt.Sprintf("%s, %s (%s)", s.Name, s.School, s.DateRange),
			Keywords: keywords,
		})
	}

	if len(d.Networks) > 0 {
		parts := make([]string, 0, len(d.Networks))
		keywords := []string{"contact", "reach", "email", "social", "network", "networks"}
		for _, n := range d.Networks {
			parts = append(parts, fmt.Sprintf("%s (%s)", n.Label, n.URL))
			keywords = append(keywords, n.Label)
		}
		docs = append(docs, searchDoc{
			Title:    "Contact",
			Text:     "Get in touch via: " + strings.Join(parts, ", "),
			Keywords: keywords,
		})
	}

	return docs
}
