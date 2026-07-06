/* ================================================================
   CONTACT.JS
   Loaded only on contact.html. Handles lightweight client-side
   validation and the success-state choreography described in the
   Design Bible: submit -> loading label -> checkmark draws itself
   -> panel "exhales" -> success message. No confetti, no bounce
   (Design Bible rule 23).

   Note: this demonstrates the interaction only — wiring the form to
   a real email/backend endpoint is a deployment step outside the
   scope of the static frontend build.
   ================================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var emailInput = document.getElementById("contact-email");
    var emailError = document.getElementById("contact-email-error");
    var submitBtn = form.querySelector(".contact-form__submit");
    var submitLabel = form.querySelector(".contact-form__submit-label");
    var wrapper = form.closest(".contact-form-wrapper");
    var successEl = wrapper.querySelector(".contact-form__success");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
      emailError.hidden = isEmailValid;
      emailInput.setAttribute("aria-invalid", String(!isEmailValid));

      if (!form.checkValidity() || !isEmailValid) {
        if (!isEmailValid) emailInput.focus();
        return;
      }

      runSuccessSequence();
    });

    function runSuccessSequence() {
      // Step 1: button content morphs into a compact loading state.
      submitBtn.disabled = true;
      submitLabel.textContent = "Sending…";

      window.setTimeout(function () {
        // Step 2: form fades out, success panel (with the
        // self-drawing checkmark) fades in.
        form.hidden = true;
        successEl.hidden = false;
        successEl.classList.add("is-visible");

        // Step 3: panel gently "exhales" — a slight scale-down/settle.
        wrapper.classList.add("contact-form-wrapper--settled");
      }, 600);
    }
  });
})();
