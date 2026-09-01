package cv

import (
	"errors"
	"strings"
	"testing"

	"github.com/geidelguerra/website/internal/data"
)

func sampleData() *data.Data {
	return &data.Data{
		Name:  "Test Person",
		Title: "Software Developer",
		AboutParagraphs: []string{
			"A short first paragraph about the candidate's background and interests.",
			"A short second paragraph about their current focus areas.",
		},
		Networks: []data.Network{
			{Label: "LinkedIn", URL: "https://linkedin.com/in/test"},
			{Label: "GitHub", URL: "https://github.com/test"},
		},
		Experience: []data.Experience{
			{
				Name:       "Engineer",
				Company:    "Acme",
				CompanyURL: "https://acme.example",
				DateRange:  "2020 - Present",
				Duration:   "5 years",
				Description: "Built things and did stuff for a company that makes widgets " +
					"and other useful items for customers around the world.",
			},
		},
		Studies: []data.Study{
			{Name: "BSc Computer Science", School: "Example University", DateRange: "2010 - 2014", Duration: "4 years"},
		},
		Skills: []data.Skill{
			{Label: "Go", Years: "5", Preferred: true},
			{Label: "SQL", Years: "5"},
		},
	}
}

func TestGenerateFitsOnePage(t *testing.T) {
	body, err := Generate(sampleData(), nil)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}
	if len(body) == 0 {
		t.Fatal("Generate() returned an empty PDF")
	}
}

func TestGenerateFailsWhenContentOverflowsOnePage(t *testing.T) {
	d := sampleData()

	longParagraph := strings.Repeat(
		"This sentence is repeated many times to inflate the About section far beyond "+
			"what can fit on a single printable page. ", 40,
	)
	d.AboutParagraphs = []string{longParagraph, longParagraph, longParagraph}

	_, err := Generate(d, nil)
	if err == nil {
		t.Fatal("Generate() error = nil, want an error for content overflowing one page")
	}
	if !errors.Is(err, ErrTooManyPages) {
		t.Fatalf("Generate() error = %v, want errors.Is(err, ErrTooManyPages)", err)
	}
}

func TestGenerateCapsExperienceEntries(t *testing.T) {
	d := sampleData()

	base := d.Experience[0]
	d.Experience = nil
	for i := 0; i < maxExperienceEntries+5; i++ {
		e := base
		e.Name = base.Name
		d.Experience = append(d.Experience, e)
	}

	if _, err := Generate(d, nil); err != nil {
		t.Fatalf("Generate() error = %v, want nil (entries beyond the cap should be dropped, not overflow the page)", err)
	}
}
