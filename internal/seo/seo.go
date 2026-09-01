// Package seo centralizes SEO-related constants and static assets
// (robots.txt, sitemap.xml) shared by the live server, the static
// generator, and the templ views.
package seo

// SiteURL is the canonical, public origin for the site (no trailing slash).
const SiteURL = "https://geidelguerra.com"

// RobotsTXT returns the content of /robots.txt: allow everything, point
// crawlers at the sitemap.
func RobotsTXT() []byte {
	return []byte("User-agent: *\nAllow: /\n\nSitemap: " + SiteURL + "/sitemap.xml\n")
}

// SitemapXML returns the content of /sitemap.xml. The site is a single
// page, so there is only one URL to list.
func SitemapXML() []byte {
	return []byte(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>` + SiteURL + `/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`)
}
