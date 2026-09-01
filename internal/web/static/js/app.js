(function () {
	"use strict";

	// ---- Theme toggle -----------------------------------------------------
	var themeToggle = document.getElementById("theme-toggle");
	if (themeToggle) {
		themeToggle.addEventListener("click", function () {
			var current = document.documentElement.getAttribute("data-theme");
			var next = current === "dark" ? "light" : "dark";
			document.documentElement.setAttribute("data-theme", next);
			try {
				localStorage.setItem("theme", next);
			} catch (e) {
				/* localStorage unavailable, ignore */
			}
		});
	}

	// ---- Mobile nav toggle -------------------------------------------------
	var navToggle = document.getElementById("nav-toggle");
	var navMenu = document.getElementById("nav-menu");
	if (navToggle && navMenu) {
		navToggle.addEventListener("click", function () {
			var isOpen = navMenu.classList.toggle("open");
			navToggle.setAttribute("aria-expanded", String(isOpen));
		});

		navMenu.querySelectorAll(".nav-link").forEach(function (link) {
			link.addEventListener("click", function () {
				navMenu.classList.remove("open");
				navToggle.setAttribute("aria-expanded", "false");
			});
		});
	}

	// ---- Active section highlighting --------------------------------------
	var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
	var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));

	if (sections.length && navLinks.length && "IntersectionObserver" in window) {
		var linkFor = function (id) {
			return navLinks.filter(function (link) {
				return link.getAttribute("href") === "#" + id;
			})[0];
		};

		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					var link = linkFor(entry.target.id);
					if (!link) return;

					if (entry.isIntersecting) {
						navLinks.forEach(function (l) {
							l.classList.remove("active");
						});
						link.classList.add("active");
					}
				});
			},
			{ rootMargin: "-45% 0px -50% 0px", threshold: 0 }
		);

		sections.forEach(function (section) {
			observer.observe(section);
		});
	}

	// ---- Footer year -------------------------------------------------------
	var year = document.getElementById("year");
	if (year) {
		year.textContent = String(new Date().getFullYear());
	}
})();
