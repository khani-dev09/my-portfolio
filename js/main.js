/* ================================================================
   MAIN.JS
   Shared, page-agnostic behavior loaded on every page:
   - mobile nav drawer toggle
   - depth rail scroll progress + active-section tracking
   - site-wide cool-to-warm lighting drift (Aurora-A -> Aurora-B)
   - footer utilities (year, back-to-top)
   - pointer-type feature detection (used by animations.js too)

   Architecture rules followed (Design Bible §31):
   - one shared IntersectionObserver per page
   - one shared scroll listener, throttled via requestAnimationFrame
   - everything degrades gracefully if JS fails to load
   ================================================================ */

(function () {
  "use strict";

  /* --------------------------------------------------------------
     Pointer-type detection. Exposed on window so animations.js and
     projects.js can reuse it without a second matchMedia call.
     Design Bible rule 26 — cursor glow, tilt, magnetic buttons are
     fine-pointer-only, never faked on touch.
     -------------------------------------------------------------- */
  window.__isFinePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  window.__prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  document.addEventListener("DOMContentLoaded", function () {
    initNavToggle();
    initDepthRail();
    initFooterUtilities();
  });

  /* --------------------------------------------------------------
     Mobile nav drawer
     -------------------------------------------------------------- */
  function initNavToggle() {
    var toggle = document.querySelector(".nav__toggle");
    var menu = document.querySelector(".nav__menu");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      menu.classList.toggle("is-open", !isOpen);
      document.body.style.overflow = isOpen ? "" : "hidden";
    });

    // Close the drawer whenever a link inside it is followed —
    // prevents a stale open drawer greeting the visitor on the next page.
    menu.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });

    // Escape closes the drawer, matching modal behavior elsewhere
    // on the site (Design Bible rule 32).
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menu.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
        document.body.style.overflow = "";
        toggle.focus();
      }
    });
  }

  /* --------------------------------------------------------------
     Depth rail: scroll progress fill + active section tracking +
     site-wide lighting drift. All driven by ONE scroll listener,
     throttled via requestAnimationFrame (Design Bible rule 37).
     -------------------------------------------------------------- */
  function initDepthRail() {
    var fill = document.querySelector(".depth-rail__fill");
    var ticks = document.querySelectorAll(".depth-rail__tick");
    var sections = Array.prototype.map.call(ticks, function (tick) {
      return document.getElementById(tick.dataset.section);
    });
    var auroraA = document.querySelector(".aurora__source--a");
    var auroraB = document.querySelector(".aurora__source--b");

    if (!fill) return; // depth rail markup not present on this page (shouldn't happen — rule 54)

    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var scrollTop = window.scrollY;
      var scrollHeight = doc.scrollHeight - doc.clientHeight;
      var progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

      fill.style.height = Math.min(progress * 100, 100) + "%";

      // Lighting drift: Aurora-A fades down, Aurora-B fades up as the
      // visitor moves through the page (Design Bible §16 / rule 55 —
      // only ever these two sources, just a continuous cross-fade).
      if (auroraA && auroraB && !window.__prefersReducedMotion) {
        auroraA.style.opacity = String(0.4 - progress * 0.22);
        auroraB.style.opacity = String(0.18 + progress * 0.3);
      }

      // Active section tracking — find the last section whose top has
      // scrolled past the upper third of the viewport.
      var activeIndex = 0;
      sections.forEach(function (section, index) {
        if (!section) return;
        var rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.35) {
          activeIndex = index;
        }
      });

      ticks.forEach(function (tick, index) {
        tick.classList.toggle("depth-rail__tick--active", index === activeIndex);
      });

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    update(); // run once on load so state is correct before the first scroll event
  }

  /* --------------------------------------------------------------
     Footer: current year + back-to-top
     -------------------------------------------------------------- */
  function initFooterUtilities() {
    var yearEl = document.getElementById("current-year");
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }

    var backToTop = document.querySelector(".site-footer__back-to-top");
    if (backToTop) {
      backToTop.addEventListener("click", function () {
        window.scrollTo({
          top: 0,
          behavior: window.__prefersReducedMotion ? "auto" : "smooth",
        });
      });
    }
  }
})();
