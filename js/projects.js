/* ================================================================
   PROJECTS.JS
   Loaded only on projects.html (Design Bible rule 38 — no page pays
   for logic it doesn't run). Handles:
   - category filtering
   - accessible project detail modal (focus trap, Escape to close,
     focus restoration)
   - opting project cards into the cursor-tilt effect (Design Bible
     rule 21 — signature interaction unique to this page)
   ================================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initTiltOnCards();
    initFilters();
    initProjectModal();
  });

  /* --------------------------------------------------------------
     Tilt: opt every project card on this page into the shared
     effect exposed by animations.js.
     -------------------------------------------------------------- */
  function initTiltOnCards() {
    document.querySelectorAll(".project-card").forEach(function (card) {
      if (window.__initCardTilt) {
        window.__initCardTilt(card);
      }
    });
  }

  /* --------------------------------------------------------------
     Filtering — filter chips toggle visibility of cards by
     [data-category]. "All" is always present and always resets.
     -------------------------------------------------------------- */
  function initFilters() {
    var filterBar = document.querySelector(".project-filters");
    var cards = document.querySelectorAll("[data-category]");
    var emptyState = document.querySelector(".project-grid__empty");
    if (!filterBar || !cards.length) return;

    filterBar.addEventListener("click", function (event) {
      var chip = event.target.closest(".project-filters__chip");
      if (!chip) return;

      filterBar
        .querySelectorAll(".project-filters__chip")
        .forEach(function (btn) {
          btn.classList.remove("project-filters__chip--active");
          btn.setAttribute("aria-pressed", "false");
        });
      chip.classList.add("project-filters__chip--active");
      chip.setAttribute("aria-pressed", "true");

      var filter = chip.dataset.filter;
      var visibleCount = 0;

      cards.forEach(function (card) {
        var matches = filter === "all" || card.dataset.category === filter;
        card.hidden = !matches;
        if (matches) visibleCount += 1;
      });

      if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
      }
    });
  }

  /* --------------------------------------------------------------
     Project detail modal — each card's "Read the case study"
     trigger opens a shared modal populated from the card's own
     data attributes, so adding a project never requires new modal
     markup (Design Bible rule 49).
     -------------------------------------------------------------- */
  function initProjectModal() {
    var modal = document.getElementById("project-modal");
    if (!modal) return;

    var dialog = modal.querySelector(".project-modal__dialog");
    var closeBtn = modal.querySelector(".project-modal__close");
    var titleEl = modal.querySelector("#project-modal-title");
    var categoryEl = modal.querySelector(".project-modal__category");
    var bodyEl = modal.querySelector(".project-modal__full-description");
    var imageEl = modal.querySelector(".project-modal__image");
    var lastFocusedTrigger = null;

    document.querySelectorAll("[data-modal-trigger]").forEach(function (trigger) {
      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        var card = trigger.closest("[data-category]");
        if (!card) return;

        lastFocusedTrigger = trigger;

        titleEl.textContent = card.dataset.title || "";
        categoryEl.textContent = card.dataset.category || "";
        bodyEl.textContent = card.dataset.fullDescription || "";
        imageEl.src = card.dataset.image || "";
        imageEl.alt = card.dataset.imageAlt || "";

        openModal();
      });
    });

    function openModal() {
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
      document.addEventListener("keydown", onKeydown);
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeydown);
      if (lastFocusedTrigger) lastFocusedTrigger.focus();
    }

    function onKeydown(event) {
      if (event.key === "Escape") {
        closeModal();
        return;
      }

      // Focus trap: Tab/Shift+Tab cycle within the dialog only
      // (Design Bible rule 32).
      if (event.key === "Tab") {
        var focusable = dialog.querySelectorAll(
          'button, a[href], [tabindex]:not([tabindex="-1"])'
        );
        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal(); // click on backdrop
    });
  }
})();
