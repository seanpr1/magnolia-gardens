/* Homepage presentation and navigation. Shared form behavior: form-core.js. */
(function () {

  var core = window.MG_FORM_CORE;
  if (!core) return; // Native form and call/text links remain available.
  var track = core.track;

  /* ── Helpers ─────────────────────────────── */
  var lastPointerType = '';
  document.addEventListener('pointerdown', function (event) { lastPointerType = event.pointerType; }, true);
  document.addEventListener('keydown', function () { lastPointerType = ''; }, true);

  /* Page-relative CTA location for text_click / call_click events.
     Lets GA4 slice CTA performance by where the click came from. */
  function getCtaLocation(el) {
    if (el.id === 'float-sms' || el.id === 'float-call-mob') return 'floating';
    if (el.closest('nav')) return 'nav';
    if (el.closest('.hero')) return 'hero';
    if (el.closest('.intake-error')) return 'error_panel';
    if (el.closest('.final-cta')) return 'final_cta';
    if (el.closest('footer')) return 'footer';
    return 'other';
  }

  // Presentation callbacks only; validation, delivery, attribution and events
  // are owned by form-core.js for every request form.
  function wireQuoteForm(cfg) {
    var form = cfg.form;
    if (!form) return;
    var validation = document.createElement('p');
    validation.className = 'field-validation';
    validation.id = form.id + 'Validation';
    validation.setAttribute('role', 'alert');
    validation.tabIndex = -1;
    validation.hidden = true;
    cfg.submitBtn.before(validation);
    ['phone', 'email'].forEach(function(name) {
      if (form.elements[name]) form.elements[name].setAttribute('aria-describedby', validation.id);
    });
    var label = cfg.submitBtn.textContent;
    function show(panel) {
      cfg.thanksPanel.hidden = true;
      cfg.errorPanel.hidden = true;
      form.style.display = 'none';
      panel.hidden = false;
      var heading = panel.querySelector('h3'), message = panel.querySelector('.intake-thanks-body');
      if (heading) {
        if (message) { message.id = panel.id + 'Message'; heading.setAttribute('aria-describedby', message.id); }
        heading.tabIndex = -1;
        heading.focus({preventScroll:true});
        // Hiding the form changes page height. Cancel an earlier smooth scroll
        // and keep the result below the fixed navigation after layout settles.
        function revealResult(){heading.scrollIntoView({block:'center',behavior:'instant'});}
        revealResult();
        if(window.requestAnimationFrame)window.requestAnimationFrame(revealResult);
      }
    }
    core.bind(form, {
      location: cfg.formLocation,
      mirror: true,
      readValues: function() { return {service:form.elements.service.value}; },
      onInvalid: function(info) {
        validation.hidden = false;
        validation.textContent = info.reason === 'invalid_phone'
          ? 'Please enter a phone number with at least 10 digits.'
          : 'Please enter a valid email address, or leave email blank.';
        var field = info.field;
        if (field && field.closest('details')) field.closest('details').open = true;
        var target = lastPointerType === 'touch' || lastPointerType === 'pen' ? validation : field;
        if (target) { target.focus({preventScroll:true}); target.scrollIntoView({block:'nearest'}); }
      },
      onBusy: function(busy) {
        validation.hidden = true;
        cfg.submitBtn.textContent = busy ? 'Sending…' : label;
      },
      onResult: function(status) {
        if (status !== 'accepted') {
          cfg.errorPanel.querySelector('h3').textContent = 'We couldn’t confirm delivery.';
          cfg.errorPanel.appendChild(core.recoveryDetails(form));
        }
        show(status === 'accepted' ? cfg.thanksPanel : cfg.errorPanel);
      }
    });
  }

  /* ── Scroll to and focus the hero quote form (repeated CTAs). */
  function focusHeroForm(source) {
    var hero = document.getElementById('heroIntakeForm');
    if (!hero) return;
    track('cta_jump', { source: source || 'cta_repeat' });
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    hero.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'center' });
    var first = hero.querySelector(lastPointerType === 'touch' || lastPointerType === 'pen' ? '.hero-quote-h' : 'input[name="phone"]');
    if (first && !first.matches('input')) first.tabIndex = -1;
    if (first) setTimeout(function () {
      try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); }
    }, reduceMotion ? 0 : 420);
  }

  /* ── Accordion toggle ────────────────────── */
  var toggle = document.getElementById('estToggle');
  var body   = document.getElementById('estBody');

  function setToggleOpen(open, source) {
    if (!toggle || !body) return;
    var wasOpen = toggle.classList.contains('open');
    toggle.classList.toggle('open', open);
    body.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    // Only fire form_open on a real closed→open transition. The form is
    // defaulted open in markup, so most page loads never fire this - when
    // it does fire it's a meaningful "re-engagement" signal.
    if (open && !wasOpen) track('form_open', { source: source || 'toggle' });
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      setToggleOpen(!toggle.classList.contains('open'), 'toggle');
    });
    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setToggleOpen(!toggle.classList.contains('open'), 'toggle');
      }
    });
  }

  /* ── Intake form ─────────────────────────── */
  var form        = document.getElementById('intakeForm');
  var thanksPanel = document.getElementById('intakeThanks');
  var errorPanel  = document.getElementById('intakeError');
  var submitBtn   = document.getElementById('intakeSubmit');

  /* ── Wire both quote forms ───────────────────────────────────────
     Detailed #intakeForm and the hero quick form share one submit
     pipeline (wireQuoteForm above). Each posts to the same Formspree
     endpoint and carries the same UTM / honeypot hidden fields; the
     only difference GA4 sees is form_location and the lead props. */
  wireQuoteForm({
    form: form,
    thanksPanel: thanksPanel,
    errorPanel: errorPanel,
    submitBtn: submitBtn,
    formLocation: 'detailed'
  });

  var heroForm = document.getElementById('heroIntakeForm');
  wireQuoteForm({
    form: heroForm,
    thanksPanel: document.getElementById('heroThanks'),
    errorPanel: document.getElementById('heroError'),
    submitBtn: document.getElementById('heroSubmit'),
    formLocation: 'hero'
  });

  /* Keep text links native, including desktops with a messaging app. */
  document.querySelectorAll('[href^="sms:"]').forEach(function (a) {
    a.href = core.smsHref('');
    a.setAttribute('target', '_blank');
    a.addEventListener('click', function (e) {
      track('click_to_text', { location: getCtaLocation(a) });
    });
  });

  /* ── tel: links: track calls ─────────────── */
  document.querySelectorAll('[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('click_to_call', { location: getCtaLocation(a) });
    });
  });

  /* ── /estimate/ links: estimator entry rate (handoff §5) ──
     beacon transport so the event survives the same-tab navigation. */
  document.querySelectorAll('a[href^="/estimate/"]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('estimator_entry', {
        source: a.getAttribute('data-cta-source') || getCtaLocation(a),
        transport_type: 'beacon'
      });
    });
  });

  /* ── Repeated "Request a Free Quote" CTAs → hero quick form ── */
  document.querySelectorAll('.cta-jump').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      focusHeroForm(b.getAttribute('data-cta-source') || 'cta_repeat');
    });
  });

})();
