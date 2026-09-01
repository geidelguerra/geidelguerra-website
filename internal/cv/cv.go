// Package cv renders a printable PDF resume from the site content. The PDF
// always uses the site's light color palette, regardless of the visitor's
// theme preference on the website, since it's meant to be printed/shared.
package cv

import (
	"bytes"
	_ "embed"
	"fmt"

	"github.com/go-pdf/fpdf"

	"github.com/geidelguerra/website/internal/data"
)

// Noto Sans (fonts/OFL.txt, SIL Open Font License) is embedded so accented
// characters (Spanish/Cuban names, etc.) render correctly without relying on
// system fonts or an external cp1252 code page descriptor.
//
//go:embed fonts/NotoSans-Regular.ttf
var fontRegular []byte

//go:embed fonts/NotoSans-Bold.ttf
var fontBold []byte

const fontFamily = "NotoSans"

// Colors mirror the site's light theme CSS variables (see style.css).
const (
	colorText            = "#1c1b29" // --text
	colorMuted           = "#5c5972" // --text-muted
	colorAccentStrong    = "#5443e6" // --accent-strong
	colorAccentSoft      = "#eee9ff" // --accent-soft
	colorAccent2Contrast = "#0f766e" // --accent-2-contrast
	colorBorder          = "#e7e4f5" // --surface-border
	colorChipBg          = "#f2f0fb" // --bg-alt
)

const pageMargin = 18.0

// Generate renders d (and its profile photo, JPEG bytes) into a single/multi
// page PDF CV: photo + name + title + bio, then education, then skills.
func Generate(d *data.Data, photo []byte) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.AddUTF8FontFromBytes(fontFamily, "", fontRegular)
	pdf.AddUTF8FontFromBytes(fontFamily, "B", fontBold)
	pdf.SetMargins(pageMargin, pageMargin, pageMargin)
	pdf.SetAutoPageBreak(true, pageMargin)
	pdf.SetTitle(fmt.Sprintf("%s CV", d.Name), true)
	pdf.SetAuthor(d.Name, true)
	pdf.SetSubject(d.Title, true)
	pdf.SetCreator("geidelguerra.com", true)
	pdf.AddPage()

	pageWidth, _ := pdf.GetPageSize()
	contentWidth := pageWidth - 2*pageMargin

	renderHeader(pdf, d, photo, contentWidth)
	renderAbout(pdf, d, contentWidth)
	renderStudies(pdf, d, contentWidth)
	renderSkills(pdf, d, contentWidth)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("render pdf: %w", err)
	}

	return buf.Bytes(), nil
}

func renderHeader(pdf *fpdf.Fpdf, d *data.Data, photo []byte, width float64) {
	left, top, _, _ := pdf.GetMargins()
	textX := left

	if len(photo) > 0 {
		const diameter = 30.0

		opts := fpdf.ImageOptions{ImageType: "JPG", ReadDpi: true}
		pdf.RegisterImageOptionsReader("profile", opts, bytes.NewReader(photo))

		pdf.ClipCircle(left+diameter/2, top+diameter/2, diameter/2, false)
		pdf.ImageOptions("profile", left, top, diameter, diameter, false, opts, 0, "")
		pdf.ClipEnd()

		textX = left + diameter + 8
	}

	pdf.SetXY(textX, top+2)
	setTextColor(pdf, colorText)
	pdf.SetFont(fontFamily, "B", 22)
	pdf.CellFormat(width-(textX-left), 9, d.Name, "", 2, "L", false, 0, "")

	pdf.SetX(textX)
	setTextColor(pdf, colorAccentStrong)
	pdf.SetFont(fontFamily, "B", 12)
	pdf.CellFormat(width-(textX-left), 7, d.Title, "", 2, "L", false, 0, "")

	if len(d.Networks) > 0 {
		pdf.SetXY(textX, pdf.GetY()+1)
		pdf.SetFont(fontFamily, "", 9.5)

		for i, n := range d.Networks {
			if i > 0 {
				setTextColor(pdf, colorMuted)
				sep := "   \u00b7   "
				pdf.CellFormat(pdf.GetStringWidth(sep), 6, sep, "", 0, "L", false, 0, "")
			}

			setTextColor(pdf, colorAccent2Contrast)
			pdf.SetFont(fontFamily, "U", 9.5)
			pdf.CellFormat(pdf.GetStringWidth(n.Label)+1, 6, n.Label, "", 0, "L", false, 0, n.URL)
			pdf.SetFont(fontFamily, "", 9.5)
		}

		pdf.Ln(6)
	}

	headerBottom := top + 32.0
	if y := pdf.GetY(); y > headerBottom {
		headerBottom = y
	}

	pdf.SetXY(left, headerBottom+6)
	setDrawColor(pdf, colorBorder)
	pdf.SetLineWidth(0.4)
	pdf.Line(left, pdf.GetY(), left+width, pdf.GetY())
	pdf.Ln(8)
}

func renderAbout(pdf *fpdf.Fpdf, d *data.Data, width float64) {
	if len(d.AboutParagraphs) == 0 {
		return
	}

	sectionHeading(pdf, "About")

	pdf.SetFont(fontFamily, "", 10.5)
	setTextColor(pdf, colorMuted)

	for i, p := range d.AboutParagraphs {
		pdf.MultiCell(width, 5.6, p, "", "L", false)
		if i != len(d.AboutParagraphs)-1 {
			pdf.Ln(2)
		}
	}

	pdf.Ln(6)
}

func renderStudies(pdf *fpdf.Fpdf, d *data.Data, width float64) {
	if len(d.Studies) == 0 {
		return
	}

	sectionHeading(pdf, "Education")

	for i, s := range d.Studies {
		pdf.SetFont(fontFamily, "B", 11.5)
		setTextColor(pdf, colorText)
		pdf.CellFormat(width, 6, s.Name, "", 2, "L", false, 0, "")

		pdf.SetFont(fontFamily, "B", 10)
		setTextColor(pdf, colorAccent2Contrast)
		pdf.CellFormat(width, 5.5, s.School, "", 2, "L", false, 0, "")

		pdf.SetFont(fontFamily, "", 9.5)
		setTextColor(pdf, colorMuted)
		pdf.CellFormat(width, 5.5, s.DateRange+"   \u00b7   "+s.Duration, "", 2, "L", false, 0, "")

		if i != len(d.Studies)-1 {
			pdf.Ln(4)
		}
	}

	pdf.Ln(6)
}

func renderSkills(pdf *fpdf.Fpdf, d *data.Data, width float64) {
	if len(d.Skills) == 0 {
		return
	}

	sectionHeading(pdf, "Skills")

	left, _, _, _ := pdf.GetMargins()
	rightLimit := left + width
	x, y := pdf.GetXY()
	const lineHeight = 7.2
	const gapX = 3.0
	const gapY = 3.0

	pdf.SetFont(fontFamily, "B", 9.5)

	for _, s := range d.Skills {
		label := s.Label
		if s.Years != "" {
			label = fmt.Sprintf("%s   \u00b7   %s yr", s.Label, s.Years)
		}
		w := pdf.GetStringWidth(label) + 7

		if x+w > rightLimit {
			x = left
			y += lineHeight + gapY
		}

		if y+lineHeight > pageBottomLimit(pdf) {
			pdf.AddPage()
			x, y = pdf.GetXY()
		}

		if s.Preferred {
			setFillColor(pdf, colorAccentSoft)
			setTextColor(pdf, colorAccentStrong)
		} else {
			setFillColor(pdf, colorChipBg)
			setTextColor(pdf, colorMuted)
		}

		pdf.RoundedRect(x, y, w, lineHeight, lineHeight/2, "1234", "F")
		pdf.SetXY(x, y)
		pdf.CellFormat(w, lineHeight, label, "", 0, "C", false, 0, "")

		x += w + gapX
	}

	pdf.SetXY(left, y+lineHeight+8)
}

func sectionHeading(pdf *fpdf.Fpdf, text string) {
	left, _, _, _ := pdf.GetMargins()

	pdf.SetFont(fontFamily, "B", 15)
	setTextColor(pdf, colorText)
	pdf.CellFormat(0, 8, text, "", 2, "L", false, 0, "")

	const underlineWidth = 16.0
	y := pdf.GetY() + 1.5

	setDrawColor(pdf, colorAccentStrong)
	pdf.SetLineWidth(1.1)
	pdf.Line(left, y, left+underlineWidth/2, y)
	setDrawColor(pdf, colorAccent2Contrast)
	pdf.Line(left+underlineWidth/2, y, left+underlineWidth, y)
	pdf.SetLineWidth(0.2)

	pdf.SetXY(left, y+6)
}

func pageBottomLimit(pdf *fpdf.Fpdf) float64 {
	_, pageHeight := pdf.GetPageSize()
	_, _, _, bottom := pdf.GetMargins()
	return pageHeight - bottom
}

func setTextColor(pdf *fpdf.Fpdf, hex string) {
	r, g, b := hexToRGB(hex)
	pdf.SetTextColor(r, g, b)
}

func setDrawColor(pdf *fpdf.Fpdf, hex string) {
	r, g, b := hexToRGB(hex)
	pdf.SetDrawColor(r, g, b)
}

func setFillColor(pdf *fpdf.Fpdf, hex string) {
	r, g, b := hexToRGB(hex)
	pdf.SetFillColor(r, g, b)
}

func hexToRGB(hex string) (int, int, int) {
	var r, g, b int
	fmt.Sscanf(hex, "#%02x%02x%02x", &r, &g, &b)
	return r, g, b
}
