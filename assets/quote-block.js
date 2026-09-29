/* Magnolia Gardens — shared quote block (conversion handoff §2 / §3).
   One line on a page that has no form:

     <script src="/assets/quote-block.js" data-service="mowing" defer></script>
     <script src="/assets/quote-block.js" data-area="Kingsport" defer></script>

   renders, directly above the script tag, a phone-only capture form plus an
   optional detail section. Phone alone is required —
   the default path stays maximum-ease (handoff §2); the estimator is offered
   alongside, never imposed. If JS fails the page's existing raw-HTML sms:/tel:
   buttons still work, untouched.

   Contact destinations come from the generated site-config.js. Behavior is shared in form-core.js. */
(function(){
  "use strict";
  var mount = document.currentScript;
  if (!mount || !mount.parentNode) return;
  var service = mount.getAttribute('data-service') || '';
  var area    = mount.getAttribute('data-area') || '';

  var core = window.MG_FORM_CORE;
  var config = window.MG_SITE_CONFIG;
  if (!core || !config) return;
  var track = core.track;

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



  function render(C){

    var box = document.createElement('div');
    box.className = 'mgqb';
    box.innerHTML =
      '<div class="mgqb-eye">Quick request</div>' +
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
      '<p class="quick-contact"><a href="'+smsHref()+'">Text us</a><span>or</span><a href="'+C.contact.telHref+'">Call '+C.contact.phoneDisplay+'</a></p>' +
      (!isProject ? '<p class="mgqb-alt"><a href="/estimate/planning/">Explore a mowing price range</a></p>' : '');
    mount.parentNode.insertBefore(box, mount);
    mount.parentNode.classList.add('has-quick-request');

    var form = box.querySelector('form');
    var phone = form.querySelector('input[name=phone]');
    var btn = form.querySelector('button');
    var err = box.querySelector('.mgqb-err');
    var pagePath = location.pathname;
    var touch=false;
    form.addEventListener('pointerdown',function(e){touch=e.pointerType==='touch'||e.pointerType==='pen';});
    form.addEventListener('keydown',function(){touch=false;});
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
      document.body.classList.add('mgqb-ready');
      document.body.appendChild(bar);
    }

    core.bind(form, {
      location:'quote_block',
      mirror:false,
      readValues:function(){return {service:service,frequency:isProject?'one_off':'unknown'};},
      preparePayload:function(fd){
        fd.set('service', topic);
        fd.set('source', 'quote-block');
        fd.set('_subject', 'Lawn quote request (quote block: ' + (service || area || pagePath) + ') - magnoliagardenslandscaping.com');
      },
      onInvalid:function(info){
        err.textContent=info.reason==='invalid_phone'
          ? 'Please enter a phone number with at least 10 digits.'
          : 'Please enter a valid email address, or leave email blank.';
        err.classList.add('show');
        if(info.field && info.field.closest('details')) info.field.closest('details').open=true;
        var target=touch?err:info.field;
        if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest'});}
      },
      onBusy:function(busy){err.classList.remove('show');btn.textContent=busy?'Sending…':'Request My Quote';},
      onResult:function(status){if(status==='accepted')showThanks();else showError(status);}
    });
    // Use a fixed topic only. Typed addresses/notes never enter clicked URLs.
    function smsHref(){ return core.smsHref(service); }
    wireLinks(box);

    function showThanks(){
      form.style.display = 'none';
      var p = document.createElement('div');
      p.className = 'mgqb-panel';
      p.innerHTML = '<p><b>Your request was sent.</b> To add photos or details, text <a href="' + smsHref() + '">' + C.contact.phoneDisplay + '</a>.</p>';
      form.parentNode.insertBefore(p, form);
      wireLinks(p);
      p.tabIndex = -1;
      p.focus({preventScroll:true});
      p.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }

    function showError(status){
      form.style.display = 'none';
      var p = document.createElement('div');
      p.className = 'mgqb-panel';
      p.innerHTML = '<p>' + (status==='http_rejected'?'We couldn’t send your request.':'We couldn’t confirm delivery. Your request may already have arrived.') + ' Text us at <a href="' + smsHref() + '">' + C.contact.phoneDisplay + '</a> ' +
        'or call <a href="' + C.contact.telHref + '">' + C.contact.phoneDisplay + '</a> and we’ll quote from there.</p>';
      p.appendChild(core.recoveryDetails(form));
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

  render(config);
})();
