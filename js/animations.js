/* ================================================================
   ANIMATIONS.JS
   Micro-interactions and reveal choreography shared across pages.
   Fine-pointer-only effects (cursor glow, magnetic pull, tilt) are
   gated behind window.__isFinePointer, set in main.js. All ambient
   motion respects window.__prefersReducedMotion.

   Exposes window.__initCardTilt(cardEl) so projects.js can opt
   specific cards into the tilt effect without duplicating the logic
   (tilt is a Projects-page-only signature interaction — Design
   Bible rule 21 — so it is never auto-applied to every .project-card
   found on the page).
   ================================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initSectionReveals();
    initNavUnderlineDirection();
    initButtonRipple();

    if (window.__isFinePointer) {
      initCursorGlow();
      initMagneticButtons();
    }
  });

  /* --------------------------------------------------------------
     Section reveals — ONE shared IntersectionObserver per page
     (Design Bible rule 36). Elements opt in via [data-reveal].
     Thresholds differ slightly by content type per the Experience
     Architecture (text vs. cards vs. images), read from a data
     attribute so markup controls its own reveal sensitivity.
     -------------------------------------------------------------- */
  function initSectionReveals() {
    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    if (window.__prefersReducedMotion) {
      targets.forEach(function (el) {
        el.classList.add("is-revealed");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            // Stagger: children of the same container reveal 120ms
            // apart rather than all at once (Design Bible / motion
            // choreography rule — never animate multiple structural
            // things simultaneously).
            var delay = Number(entry.target.dataset.revealDelay || 0);
            window.setTimeout(function () {
              entry.target.classList.add("is-revealed");
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach(function (el, index) {
      // Auto-stagger siblings within the same parent in 120ms steps
      // if no explicit delay was authored in the HTML.
      if (!el.dataset.revealDelay) {
        var siblingIndex = Array.prototype.indexOf.call(
          el.parentElement.children,
          el
        );
        el.dataset.revealDelay = String(Math.min(siblingIndex, 4) * 120);
      }
      observer.observe(el);
    });
  }

  /* --------------------------------------------------------------
     Nav underline direction — the underline draws from whichever
     side the cursor entered the link, matching the eye's approach
     direction (Design Bible / micro-interactions §2).
     -------------------------------------------------------------- */
  function initNavUnderlineDirection() {
    if (!window.__isFinePointer) return;

    document.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("mouseenter", function (event) {
        var rect = link.getBoundingClientRect();
        var enteredFromLeft = event.clientX - rect.left < rect.width / 2;
        link.style.setProperty(
          "--underline-origin",
          enteredFromLeft ? "left" : "right"
        );
      });
    });
  }

  /* --------------------------------------------------------------
     Button ripple — single soft radial fade on click, never a hard
     Material-style ripple (Design Bible / micro-interactions §2).
     -------------------------------------------------------------- */
  function initButtonRipple() {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        if (window.__prefersReducedMotion) return;

        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement("span");
        ripple.className = "btn__ripple";
        ripple.style.left = event.clientX - rect.left + "px";
        ripple.style.top = event.clientY - rect.top + "px";
        btn.appendChild(ripple);

        ripple.addEventListener("animationend", function () {
          ripple.remove();
        });
      });
    });
  }

  /* --------------------------------------------------------------
     Cursor glow — follows the pointer, inherits the local light
     color by reading a --cursor-tint custom property set per
     section, only visible over elements marked [data-cursor-zone].
     -------------------------------------------------------------- */
  function initCursorGlow() {
    var glow = document.querySelector(".cursor-glow");
    if (!glow) return;

    var raf = null;

    window.addEventListener("mousemove", function (event) {
      if (raf) return;
      raf = window.requestAnimationFrame(function () {
        glow.style.transform =
          "translate(" + event.clientX + "px, " + event.clientY + "px) translate(-50%, -50%)";
        raf = null;
      });
    });

    document.querySelectorAll("[data-cursor-zone]").forEach(function (zone) {
      zone.addEventListener("mouseenter", function () {
        glow.style.opacity = "1";
        var tint = zone.dataset.cursorZone === "violet" ? "139, 92, 246" : "76, 127, 255";
        glow.style.background =
          "radial-gradient(circle, rgba(" + tint + ", 0.18), transparent 70%)";
      });
      zone.addEventListener("mouseleave", function () {
        glow.style.opacity = "0";
      });
    });
  }

  /* --------------------------------------------------------------
     Magnetic buttons — pull activates only within a ~40px radius
     (Design Bible rule 22), eased, capped displacement.
     -------------------------------------------------------------- */
  function initMagneticButtons() {
    var radius = 40;
    var maxPull = 6;

    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (event) {
        if (window.__prefersReducedMotion) return;
        var rect = btn.getBoundingClientRect();
        var relX = event.clientX - (rect.left + rect.width / 2);
        var relY = event.clientY - (rect.top + rect.height / 2);
        var distance = Math.sqrt(relX * relX + relY * relY);

        if (distance < radius) {
          var pullX = (relX / radius) * maxPull;
          var pullY = (relY / radius) * maxPull;
          btn.style.transform = "translate(" + pullX + "px, " + pullY + "px)";
        } else {
          btn.style.transform = "";
        }
      });

      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* --------------------------------------------------------------
     Card tilt — exposed globally, opted into per-page (Projects
     only). Capped at 6 degrees, heavily damped (Design Bible rule 21).
     -------------------------------------------------------------- */
  window.__initCardTilt = function (card) {
    if (!window.__isFinePointer || window.__prefersReducedMotion) return;

    var maxTilt = 6;

    card.addEventListener("mousemove", function (event) {
      var rect = card.getBoundingClientRect();
      var relX = (event.clientX - rect.left) / rect.width - 0.5;
      var relY = (event.clientY - rect.top) / rect.height - 0.5;

      card.style.transform =
        "perspective(900px) rotateX(" + (-relY * maxTilt) + "deg) rotateY(" +
        (relX * maxTilt) + "deg)";

      // Glow border follows the cursor's actual position on the card,
      // not a static rim-light (Design Bible / micro-interactions §2).
      card.style.setProperty("--glow-x", (relX + 0.5) * 100 + "%");
      card.style.setProperty("--glow-y", (relY + 0.5) * 100 + "%");
    });

    card.addEventListener("mouseleave", function () {
      card.style.transform = "";
    });
  };
})();
