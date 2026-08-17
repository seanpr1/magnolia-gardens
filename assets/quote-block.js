/* Magnolia Gardens — shared quote block (conversion handoff §2 / §3).
   One line on a page that has no form:

     <script src="/assets/quote-block.js" data-service="mowing" defer></script>
     <script src="/assets/quote-block.js" data-area="Kingsport" defer></script>

   renders, directly above the script tag, a phone-only capture form plus a
   "see a price range first" link into /estimate/. Phone alone is required —
   the default path stays maximum-ease (handoff §2); the estimator is offered
   alongside, never imposed. If JS fails the page's existing raw-HTML sms:/tel:
   buttons still work, untouched.

   Price strings come from /assets/pricing.js (loaded on demand) so a price
   change never means editing this file or any page. */
(function(){
  "use strict";
  var mount = document.currentScript;
  if (!mount || !mount.parentNode) return;
  var service = mount.getAttribute('data-service') || '';
  var area    = mount.getAttribute('data-area') || '';

  function track(name, props){
    try{
      if (typeof window.gtag === 'function') window.gtag('event', name, props || {});
      if (typeof window.plausible === 'function') window.plausible(name, { props: props || {} });
    }catch(e){}
  }

  var isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* What the visitor is asking about, for the SMS prefill + Formspree subject. */
  var TOPIC = {
    mowing:'recurring mowing', maintenance:'full grounds care',
    cleanup:'a yard cleanup', mulch:'mulch and beds', brush:'brush clearing'
  };
  var topic = TOPIC[service] || 'lawn care';

  /* estimator deep link: services the engine can price get a pre-filled entry;
     brush has no estimator path, so its CTAs stay on the photo-text route. */
  var EST_KEYS = { mowing:1, maintenance:1, cleanup:1, mulch:1 };
  var estHref = '/estimate/' + (EST_KEYS[service] ? '?service=' + service : '');

  function priceLine(P){
    if (service === 'mowing' || service === 'maintenance' || area){
      return 'Lawn care starts at a ' + P.PUBLISHED.minimumText + ' minimum — most visits run ' +
        P.PUBLISHED.perVisitRange + ' by lot size and service level, with larger and estate properties quoted higher.';
    }
    // cleanup / mulch / brush: no published range yet — quoted from photos
    return 'Quoted from a photo or two, with a ' + P.PUBLISHED.minimumText + ' minimum.';
  }

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
    '.mgqb button{font-family:inherit;font-weight:600;font-size:15px;border:none;border-radius:var(--r,2px);',
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
      '<div class="mgqb-eye">About 15 seconds</div>' +
      '<h3 class="mgqb-h">Get your quote by text</h3>' +
      '<p class="mgqb-sub">' + priceLine(P) + ' Leave your number and we’ll text your quote, usually the same day. Reply STOP anytime to opt out.</p>' +
      '<form novalidate>' +
        '<div class="mgqb-row">' +
          '<input type="tel" name="phone" inputmode="tel" autocomplete="tel" aria-label="Mobile number" placeholder="(423) 555-0123" required>' +
          '<button type="submit">Text Me My Quote</button>' +
        '</div>' +
        '<label class="mgqb-hp" aria-hidden="true">Leave this field empty<input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label>' +
        '<p class="mgqb-err">Add a mobile number so we can text your quote.</p>' +
      '</form>' +
      (service === 'brush' ? '' :
      '<p class="mgqb-alt">Want a number right now? <a href="' + estHref + '">See your price range in about a minute</a>.</p>');
    mount.parentNode.insertBefore(box, mount);

    var form = box.querySelector('form');
    var phone = form.querySelector('input[name=phone]');
    var btn = form.querySelector('button');
    var err = box.querySelector('.mgqb-err');
    var pagePath = location.pathname;

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

    /* sticky mobile CTA: service/area pages have no other above-the-fold path
       to the estimator once the hero scrolls away. Brush stays on photo-text. */
    if (!document.getElementById('mgqb-sticky')){
      var bar = document.createElement('div');
      bar.id = 'mgqb-sticky';
      var sa = document.createElement('a');
      if (service === 'brush'){
        sa.href = smsHref();
        sa.textContent = 'Text Us for a Quote';
        sa.addEventListener('click', function(){ track('click_to_text', { location:'sticky_mobile', page_path:pagePath }); });
      } else {
        sa.href = estHref;
        sa.textContent = 'Get My Instant Estimate';
        sa.addEventListener('click', function(){ track('estimator_entry', { source:'sticky_mobile', page_path:pagePath, transport_type:'beacon' }); });
      }
      bar.appendChild(sa);
      document.body.appendChild(bar);
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();

      // honeypot: pretend it worked, send nothing
      if (form.elements._gotcha && form.elements._gotcha.value){ showThanks(); return; }

      if (phone.value.replace(/\D/g,'').length < 10){
        err.classList.add('show');
        track('lead_submit_invalid', { missing:'phone', form_location:'quote_block' });
        phone.focus();
        return;
      }
      err.classList.remove('show');

      var fd = new FormData();
      fd.append('phone', phone.value.trim());
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

      btn.disabled = true;
      var orig = btn.textContent;
      btn.textContent = 'Sending…';

      fetch(P.PUBLISHED.formspree, { method:'POST', body:fd, headers:{ 'Accept':'application/json' } })
        .then(function(res){
          if (!res.ok) throw new Error('Formspree returned ' + res.status);
          showThanks();
          track('lead_submit', { form_location:'quote_block', service:service || 'area', page_path:pagePath });
          track('generate_lead', { form_id:'quoteBlockForm' });
        })
        .catch(function(e3){
          showError();
          track('form_submit_error', { reason:(e3 && e3.message) || 'unknown', form_location:'quote_block' });
        })
        .finally(function(){
          btn.disabled = false;
          btn.textContent = orig;
        });
    });

    function smsHref(){
      return P.PUBLISHED.smsHref + '?body=' + encodeURIComponent('Hi, I’d like a quote for ' + topic + '.');
    }

    function showThanks(){
      form.style.display = 'none';
      var p = document.createElement('div');
      p.className = 'mgqb-panel';
      p.innerHTML = '<p><b>Got it.</b> We’ll text your quote, usually the same day. ' +
        'Want it faster? Text a photo of the yard to <a href="' + smsHref() + '">' + P.PUBLISHED.phoneDisplay + '</a>.</p>';
      form.parentNode.insertBefore(p, form);
      wireLinks(p);
    }

    function showError(){
      form.style.display = 'none';
      var p = document.createElement('div');
      p.className = 'mgqb-panel';
      p.innerHTML = '<p>That didn’t send. Text us at <a href="' + smsHref() + '">' + P.PUBLISHED.phoneDisplay + '</a> ' +
        'or call <a href="' + P.PUBLISHED.telHref + '">' + P.PUBLISHED.phoneDisplay + '</a> and we’ll quote from there.</p>';
      form.parentNode.insertBefore(p, form);
      wireLinks(p);
    }

    /* injected links miss the page's global sms/tel handlers — wire our own */
    function wireLinks(scope){
      scope.querySelectorAll('[href^="sms:"]').forEach(function(a){
        a.setAttribute('target','_blank');
        a.addEventListener('click', function(ev){
          track('click_to_text', { location:'quote_block' });
          if (isDesktop){ ev.preventDefault(); window.location.href = '/#estimate'; }
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
    s.src = '/assets/pricing.js';
    s.onload = function(){ if (window.MG_PRICING) render(window.MG_PRICING); };
    document.head.appendChild(s);
  }
})();
