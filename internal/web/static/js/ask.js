// "Ask about this website" widget.
//
// A small fuzzy search over the site's own content, pre-indexed once on the
// server (see internal/web/views/ask_search.go) and embedded directly in
// the page as JSON (#ask-search-index). There is no model, no download, no
// network request, and no server round trip involved in answering a
// question: everything below runs synchronously, client-side, so results
// appear instantly.
(function () {
	"use strict";

	var widget = document.getElementById("ask-widget");
	if (!widget) return;

	var toggle = document.getElementById("ask-toggle");
	var panel = document.getElementById("ask-panel");
	var form = document.getElementById("ask-form");
	var input = document.getElementById("ask-input");
	var results = document.getElementById("ask-results");
	var indexScript = document.getElementById("ask-search-index");

	function openPanel() {
		panel.hidden = false;
		toggle.setAttribute("aria-expanded", "true");
		input.focus();
	}

	function closePanel() {
		panel.hidden = true;
		toggle.setAttribute("aria-expanded", "false");
	}

	if (toggle && panel) {
		toggle.addEventListener("click", function () {
			if (panel.hidden) {
				openPanel();
			} else {
				closePanel();
			}
		});

		// Close on a click/tap outside the widget (button + panel).
		document.addEventListener("click", function (e) {
			if (panel.hidden) return;
			if (widget.contains(e.target)) return;
			closePanel();
		});

		// Close on Escape, and return focus to the toggle button.
		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape" && !panel.hidden) {
				closePanel();
				toggle.focus();
			}
		});
	}

	// Common words that carry little search signal on their own, so they
	// don't dilute matching against the (much more specific) keywords.
	var STOPWORDS = {
		the: 1, a: 1, an: 1, is: 1, are: 1, was: 1, were: 1, do: 1, does: 1,
		did: 1, what: 1, who: 1, whom: 1, which: 1, how: 1, why: 1, when: 1,
		where: 1, of: 1, in: 1, on: 1, at: 1, to: 1, for: 1, and: 1, or: 1,
		with: 1, tell: 1, me: 1, you: 1, your: 1, he: 1, his: 1, him: 1,
		this: 1, that: 1, website: 1, site: 1, has: 1, have: 1, can: 1,
		about: 1,
	};

	function tokenize(text) {
		return (text || "")
			.toLowerCase()
			.split(/[^a-z0-9+.#]+/)
			.filter(function (w) {
				return w.length > 1;
			});
	}

	// Plain Levenshtein edit distance, used only for short-word typo
	// tolerance (see wordScore). O(n*m) is plenty fast at these lengths.
	function levenshtein(a, b) {
		if (a === b) return 0;
		var al = a.length;
		var bl = b.length;
		if (al === 0) return bl;
		if (bl === 0) return al;

		var prev = new Array(bl + 1);
		for (var j = 0; j <= bl; j++) prev[j] = j;

		for (var i = 1; i <= al; i++) {
			var cur = [i];
			for (var j2 = 1; j2 <= bl; j2++) {
				var cost = a[i - 1] === b[j2 - 1] ? 0 : 1;
				cur[j2] = Math.min(prev[j2] + 1, cur[j2 - 1] + 1, prev[j2 - 1] + cost);
			}
			prev = cur;
		}

		return prev[bl];
	}

	// Scores how well a single query word (q) matches a single keyword (k),
	// favoring exact/prefix/substring matches, and only tolerating a typo
	// (small edit distance, scaled to word length) as a last resort and at a
	// lower weight, so gibberish doesn't coincidentally clear the threshold.
	function wordScore(q, k) {
		if (q === k) return 3;
		if (q.length >= 3 && k.length >= 3) {
			if (k.indexOf(q) === 0 || q.indexOf(k) === 0) return 2;
		}
		// A short word appearing *anywhere inside* a longer, unrelated one
		// (e.g. "tac" inside "con-tac-t") is coincidence, not a real match;
		// only count it once both words carry enough signal on their own.
		if (Math.min(q.length, k.length) >= 4 && (k.indexOf(q) !== -1 || q.indexOf(k) !== -1)) {
			return 1.2;
		}

		var maxLen = Math.max(q.length, k.length);
		if (maxLen >= 5) {
			var allowed = Math.floor(maxLen * 0.2); // e.g. 1 typo per ~5 chars
			if (levenshtein(q, k) <= allowed) return 0.6;
		}

		return 0;
	}

	// Only the doc's title and its curated keywords (company/skill/tech
	// names, category words like "experience") are indexed for matching.
	// The free-form description in doc.text is intentionally NOT tokenized
	// into keywords: it's long, prose-y text where many incidental words
	// would otherwise create false-positive fuzzy matches.
	function buildDocs() {
		if (!indexScript) return [];

		var raw;
		try {
			raw = JSON.parse(indexScript.textContent);
		} catch (err) {
			console.error("Ask widget: invalid search index", err);
			return [];
		}

		return raw.map(function (doc) {
			var keywordSet = {};
			tokenize(doc.title).forEach(function (w) {
				keywordSet[w] = true;
			});
			(doc.keywords || []).forEach(function (phrase) {
				keywordSet[phrase.toLowerCase()] = true;
				tokenize(phrase).forEach(function (w) {
					keywordSet[w] = true;
				});
			});

			return { title: doc.title, text: doc.text, keywords: Object.keys(keywordSet) };
		});
	}

	var docs = buildDocs();

	function search(query) {
		var queryWords = tokenize(query).filter(function (w) {
			return !STOPWORDS[w];
		});
		if (!queryWords.length) return [];

		// Scores are summed (not averaged) across query words on purpose: a
		// query like "his tech stack at Cerberu" should still surface the
		// Cerberu doc on the strength of that one exact, specific match, even
		// though "tech"/"stack" don't appear in it. Averaging would dilute
		// that single strong hit down below the threshold.
		var scored = docs.map(function (doc) {
			var total = 0;
			queryWords.forEach(function (q) {
				var best = 0;
				for (var i = 0; i < doc.keywords.length; i++) {
					var s = wordScore(q, doc.keywords[i]);
					if (s > best) best = s;
					if (best === 3) break;
				}
				total += best;
			});
			return { doc: doc, score: total };
		});

		scored.sort(function (a, b) {
			return b.score - a.score;
		});

		// 1.8 requires roughly one solid prefix/exact hit, or a couple of
		// corroborating weaker (substring/fuzzy) hits, filtering out
		// coincidental single-typo matches against unrelated content.
		return scored.filter(function (s) { return s.score >= 1.8; }).slice(0, 3);
	}

	function render(matches) {
		results.innerHTML = "";
		results.hidden = false;

		if (!matches.length) {
			var empty = document.createElement("p");
			empty.className = "ask-empty";
			empty.textContent =
				"No direct match. Try asking about skills, experience, projects, education, or contact info.";
			results.appendChild(empty);
			return;
		}

		matches.forEach(function (m) {
			var item = document.createElement("div");
			item.className = "ask-result";

			var title = document.createElement("h4");
			title.textContent = m.doc.title;
			item.appendChild(title);

			var text = document.createElement("p");
			text.textContent = m.doc.text;
			item.appendChild(text);

			results.appendChild(item);
		});
	}

	if (form) {
		form.addEventListener("submit", function (e) {
			e.preventDefault();
			var question = (input.value || "").trim();
			if (!question) return;
			render(search(question));
		});
	}

	widget.hidden = false;
})();
