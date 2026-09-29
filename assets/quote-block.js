/* Magnolia Gardens — shared quote block (conversion handoff §2 / §3).
   One line on a page that has no form:

     <script src="/assets/quote-block.js" data-service="mowing" defer></script>
     <script src="/assets/quote-block.js" data-area="Kingsport" defer></script>

   renders, directly above the script tag, a phone-only capture form plus an
   optional detail section. Phone alone is required —
   the default path stays maximum-ease (handoff §2); the estimator is offered
   alongside, never imposed. If JS fails the page's existing raw-HTML sms:/tel:
   buttons still work, untouched.

   Contact destinations come from /assets/pricing.js (loaded on demand). */
(function(){
  "use strict";
  var mount = document.currentScript;
  if (!mount || !mount.parentNode) return;
  var service = mount.getAttribute('data-service') || '';
  var area    = mount.getAttribute('data-area') || '';

  // A timed-out request may still reach the server; show unknown delivery, never auto-retry.
  function postWithDeadline(url, options) {
    var controller = new AbortController(), timeout;
    var deadline = new Promise(function (_, reject) {
      timeout = setTimeout(function () {
        controller.abort();
        reject(new Error('formspree_timeout'));
      }, 15000);
    });
    return Promise.race([
      Promise.resolve().then(function () { return fetch(url, Object.assign({}, options, { signal: controller.signal })); }),
      deadline
    ]).finally(function () { clearTimeout(timeout); });
  }

  function track(name, props){
    try{
      if (typeof window.gtag === 'function') window.gtag('event', name, props || {});
      if (typeof window.plausible === 'function') window.plausible(name, { props: props || {} });
    }catch(e){}
  }


  /* What the visitor is asking about, for the SMS prefill + Formspree subject. */
  var TOPIC = {
    mowing:'recurring mowing', maintenance:'full grounds care',
    cleanup:'a yard cleanup', mulch:'mulch and beds', brush:'brush clearing'
  };
  var topic = TOPIC[service] || 'lawn care';

  /* Every primary service link opens the same quick request. */
  var EST_KEYS = { mowing:1, maintenance:1, cleanup:1, mulch:1, brush:1 };
  var isProject = ['cleanup','mulch','brush'].indexOf(service) >= 0;
  var estHref = '/estimate/' + (EST_KEYS[service] ? '?service=' + service : '');

  var CSS = [
    '.mgqb{border:1px solid var(--edge,#D6CFC0);border-radius:var(--r,2px);background:var(--surface,#FAF6EA);',
    '  padding:22px 20px;margin:18px 0 22px;max-width:560px}',
    '.mgqb-eye{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-d,#2E7D69);margin-bottom:8px}',
    '.mgqb-h{font-family:var(--serif,Georgia,serif);font-size:21px;font-weight:600;color:var(--bright,#1F1D18);margin:0 0 6px}',
    '.mgqb-sub{font-size:14px;color:var(--muted,#5C574E);margin:0 0 14px;line-height:1.5}',
    '.mgqb-row{display:flex;gap:10px;flex-wrap:wrap}',
    '.mgqb input[type=tel]{flex:1 1 180px;font-size:16px;padding:12px 13px;border:1.5px solid var(--edge,#D6CFC0);',
    '  border-radius:var(--r,2px);background:#fff;color:var(--body,#2A2823);font-family:inherit}',
    '.mgqb input[type=tel]:focus{outline:none;border-color:var(--gold,#005343)}',
    '.mgqb button{min-height:44px;font-family:inherit;font-weight:600;font-size:15px;border:none;border-radius:var(--r,2px);',
    '  padding:12px 20px;cursor:pointer;background:var(--gold,#005343);color:#FAF6EA}',
    '.mgqb button:hover{background:var(--gold-l,#00402F)}',
    '.mgqb button[disabled]{opacity:.55;cursor:default}',
    '.mgqb-alt{font-size:14px;margin:12px 0 0}',
    '.mgqb-alt a{color:var(--gold,#005343)}',
    '.mgqb-err{color:#9a3b2f;font-size:13px;margin:8px 0 0;display:none}',
    '.mgqb-err.show{display:block}',
    '.mgqb-hp{position:absolute;left:-9999px}',
    '.mgqb-panel p{font-size:15px;color:var(--body,#2A2823);margin:0 0 10px;line-height:1.55}',
    '.mgqb-panel a{color:var(--gold,#005343)}',
    '#mgqb-sticky{position:fixed;left:0;right:0;bottom:0;z-index:60;padding:10px 14px calc(10px + env(safe-area-inset-bottom));',
    '  background:rgba(250,246,234,.96);backdrop-filter:blur(10px);border-top:1px solid var(--edge,#D6CFC0)}',
    '#mgqb-sticky a{display:block;text-align:center;background:var(--gold,#005343);color:#FAF6EA;font-weight:600;',
    '  font-size:15px;padding:13px 20px;border-radius:var(--r,2px);text-decoration:none}',
    '#mgqb-sticky a:active{background:var(--gold-l,#00402F)}',
    '@media(min-width:768px){#mgqb-sticky{display:none}}'
  ].join('\n');

  function render(P){
    if (!document.getElementById('mgqb-css')){
      var st = document.createElement('style');
      st.id = 'mgqb-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }

    var box = document.createElement('div');
    box.className = 'mgqb';
    box.innerHTML =
      '<div class="mgqb-eye">Quick request</div>' +
      '<h3 class="mgqb-h">Request a quote</h3>' +
      '<p class="mgqb-sub">Leave your number. We’ll follow up about your yard.</p>' +
      '<form novalidate>' +
        '<label for="mgqb-phone" style="display:block;font-size:15px;margin-bottom:6px">Phone number</label>' +
        '<div class="mgqb-row">' +
          '<input id="mgqb-phone" type="tel" name="phone" inputmode="tel" autocomplete="tel" aria-describedby="mgqb-error" placeholder="(423) 555-0123" required>' +
        '</div>' +
        '<details class="optional-details"><summary>Add details <span>(optional)</span></summary><div class="optional-fields">' +
          '<label for="mgqb-notes">Tell us about the work<textarea id="mgqb-notes" name="message" rows="3" maxlength="2000" placeholder="Share as much or as little as you like."></textarea></label>' +
          '<label for="mgqb-name">Name<input id="mgqb-name" name="name" autocomplete="name"></label>' +
          '<label for="mgqb-address">Address or ZIP<input id="mgqb-address" name="address" autocomplete="street-address"></label>' +
          '<label for="mgqb-email">Email<input id="mgqb-email" type="email" name="email" autocomplete="email" aria-describedby="mgqb-error"></label>' +
          '<p class="detail-help">All details are optional. You can text photos after sending your request.</p>' +
        '</div></details>' +
        '<label class="mgqb-hp" aria-hidden="true">Leave this field empty<input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label>' +
        '<p class="mgqb-err" id="mgqb-error" role="alert" tabindex="-1">Add a phone number so we can follow up about your request.</p>' +
        '<button type="submit" style="width:100%">Request My Quote</button>' +
        '<p class="mgqb-alt">No obligation. Reply STOP to opt out of texts.</p>' +
      '</form>' +
      '<p class="quick-contact"><a href="'+smsHref()+'">Text us</a><span>or</span><a href="'+P.PUBLISHED.telHref+'">Call '+P.PUBLISHED.phoneDisplay+'</a></p>' +
      (!isProject ? '<p class="mgqb-alt"><a href="/estimate/planning/">Explore a mowing price range</a></p>' : '');
    mount.parentNode.insertBefore(box, mount);

    var form = box.querySelector('form');
    var phone = form.querySelector('input[name=phone]');
    var btn = form.querySelector('button');
    var err = box.querySelector('.mgqb-err');
    var pagePath = location.pathname;
    var stages = window.MG_FORM_METRICS && window.MG_FORM_METRICS.bind(form, 'quote_block', function () {
      return {service:service, frequency:['cleanup','mulch','brush'].indexOf(service)>=0?'one_off':'unknown'};
    });

    /* funnel: form_view once on scroll into view, form_start on first touch */
    if ('IntersectionObserver' in window){
      var seen = false;
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if (en.isIntersecting && !seen){ seen = true; track('form_view', { form_location:'quote_block', page_path:pagePath }); io.disconnect(); }
        });
      }, { threshold:0.25 });
      io.observe(box);
    }
    var started = false;
    function firstTouch(){ if (!started){ started = true; track('form_start', { form_location:'quote_block', page_path:pagePath }); } }
    form.addEventListener('click', firstTouch);
    form.addEventListener('input', firstTouch);
    form.addEventListener('focusin', firstTouch);

    var altLink = box.querySelector('.mgqb-alt a');
    if (altLink) altLink.addEventListener('click', function(){
      track('estimator_entry', { source:'quote_block', page_path:pagePath, transport_type:'beacon' });
    });

    /* Keep a quick request within reach after the hero scrolls away. */
    if (!document.getElementById('mgqb-sticky')){
      var bar = document.createElement('div');
      bar.id = 'mgqb-sticky';
      var sa = document.createElement('a');
      sa.href = estHref;
      sa.textContent = 'Request My Quote';
      sa.addEventListener('click', function(){ track('estimator_entry', { source:'sticky_mobile', page_path:pagePath, transport_type:'beacon' }); });
      bar.appendChild(sa);
      document.body.appendChild(bar);
    }

    var submitting = false;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (submitting || form.style.display === 'none') return;

      // honeypot: pretend it worked, send nothing
      if (form.elements._gotcha && form.elements._gotcha.value){ showThanks(); return; }

      if (phone.value.replace(/\D/g,'').length < 10){
        err.textContent = 'Please enter a phone number with at least 10 digits.';
        phone.setAttribute('aria-invalid','true');
        err.classList.add('show');
        track('lead_submit_invalid', { missing:'phone', form_location:'quote_block' });
        phone.focus();
        return;
      }
      phone.setAttribute('aria-invalid','false');
      var email=form.elements.email;
      if(!email.validity.valid){
        form.querySelector('details').open=true;
        err.textContent='Please enter a valid email address, or leave email blank.';
        err.classList.add('show');email.setAttribute('aria-invalid','true');email.focus();return;
      }
      email.setAttribute('aria-invalid','false');
      err.classList.remove('show');

      var fd = new FormData(form);
      fd.set('phone', phone.value.trim());
      fd.append('service', topic);
      fd.append('source', 'quote-block');
      fd.append('page_url', location.href);
      fd.append('referrer', document.referrer || '');
      fd.append('submitted_at', new Date().toISOString());
      fd.append('_subject', 'Lawn quote request (quote block: ' + (service || area || pagePath) + ') - magnoliagardenslandscaping.com');
      try{
        var params = new URLSearchParams(location.search);
        ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function(k){
          fd.append(k, params.get(k) || '');
        });
      }catch(e2){}

      submitting = true;
      form.setAttribute('aria-busy', 'true');
      btn.disabled = true;
      var orig = btn.textContent;
      btn.textContent = 'Sending…';

      postWithDeadline(P.PUBLISHED.formspree, { method:'POST', body:fd, headers:{ 'Accept':'application/json' } })
        .then(function(res){
          if (!res.ok) throw new Error('Formspree returned ' + res.status);
          showThanks();
          track('lead_submit', { form_location:'quote_block', service:service || 'area', page_path:pagePath });
          if (stages) stages.accepted();
          track('generate_lead', { form_id:'quoteBlockForm' });
        })
        .catch(function(e3){
          showError();
          track('form_submit_error', { reason:(e3 && e3.message) || 'unknown', form_location:'quote_block' });
        })
        .finally(function(){
          submitting = false;
          form.removeAttribute('aria-busy');
          btn.disabled = false;
          btn.textContent = orig;
        });
    });

    function smsHref(){
      var apple=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
      var notes=form&&form.elements.message.value.trim();
      var address=form&&form.elements.address.value.trim();
      return P.PUBLISHED.smsHref + (apple?'&':'?') + 'body=' + encodeURIComponent('Hi, I’d like a quote for ' + topic + (address?' at '+address:'') + '.' + (notes?' '+notes:''));
    }

    function showThanks(){
      form.style.display = 'none';
      var p = document.createElement('div');
      p.className = 'mgqb-panel';
      p.innerHTML = '<p><b>Your request was sent.</b> To add photos or details, text <a href="' + smsHref() + '">' + P.PUBLISHED.phoneDisplay + '</a>.</p>';
      form.parentNode.insertBefore(p, form);
      wireLinks(p);
      p.tabIndex = -1;
      p.focus({preventScroll:true});
      p.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }

    function showError(){
      form.style.display = 'none';
      var p = document.createElement('div');
      p.className = 'mgqb-panel';
      p.innerHTML = '<p>We couldn’t confirm delivery. Text us at <a href="' + smsHref() + '">' + P.PUBLISHED.phoneDisplay + '</a> ' +
        'or call <a href="' + P.PUBLISHED.telHref + '">' + P.PUBLISHED.phoneDisplay + '</a> and we’ll quote from there.</p>';
      form.parentNode.insertBefore(p, form);
      wireLinks(p);
      p.tabIndex = -1;
      p.focus({preventScroll:true});
      p.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }

    /* Result links are added after the page's existing click handlers. */
    function wireLinks(scope){
      scope.querySelectorAll('[href^="sms:"]').forEach(function(a){
        a.setAttribute('target','_blank');
        a.addEventListener('click', function(ev){
          track('click_to_text', { location:'quote_block' });
          a.href = smsHref();
        });
      });
      scope.querySelectorAll('[href^="tel:"]').forEach(function(a){
        a.addEventListener('click', function(){ track('click_to_call', { location:'quote_block' }); });
      });
    }
  }

  if (window.MG_PRICING){ render(window.MG_PRICING); }
  else {
    var s = document.createElement('script');
    s.src = '/assets/pricing.js?v=20260928';
    s.onload = function(){ if (window.MG_PRICING) render(window.MG_PRICING); };
    document.head.appendChild(s);
  }
})();
