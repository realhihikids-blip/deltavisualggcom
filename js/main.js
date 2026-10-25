/* DELTA VISUALS — main.js
   GSAP + ScrollTrigger + Lenis. Every effect degrades gracefully if a CDN script fails. */
(function () {
  'use strict';
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var animate = hasGsap && !reduce;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lenis = null;

  if (!animate) html.classList.remove('js-anim');          // content visible, no preloader
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  if (animate && window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();                                           // locked during preloader
  }
  window.DeltaScroll = function (target, offset) {
    var el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: offset || 0, duration: 1.6 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  $$('[data-scroll]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      e.preventDefault();
      if (id === '#top') { if (lenis) lenis.scrollTo(0, { duration: 1.6 }); else window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else window.DeltaScroll(id);
    });
  });

  /* ---------- helpers ---------- */
  function splitChars(el) {
    var text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement('span');
      s.className = 'ch'; s.setAttribute('aria-hidden', 'true');
      s.textContent = text[i] === ' ' ? '\u00A0' : text[i];
      el.appendChild(s);
    }
  }
  $$('[data-split]').forEach(splitChars);

  /* ---------- FAQ (works without GSAP) ---------- */
  $$('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.parentElement, open = !item.classList.contains('open');
      $$('.faq-item.open').forEach(function (i) { i.classList.remove('open'); $('.faq-q', i).setAttribute('aria-expanded', 'false'); });
      if (open) { item.classList.add('open'); q.setAttribute('aria-expanded', 'true'); }
      if (hasGsap) setTimeout(function () { ScrollTrigger.refresh(); }, 520);
    });
  });

  /* ---------- card spotlight + tilt, button highlight (work without GSAP) ---------- */
  $$('[data-card]').forEach(function (card) {
    var rx, ry;
    if (animate && fine) {
      gsap.set(card, { transformPerspective: 900 });
      rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    }
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px'); card.style.setProperty('--my', y + 'px');
      if (rx) { ry((x / r.width - 0.5) * 9); rx(-(y / r.height - 0.5) * 9); }
    });
    card.addEventListener('pointerleave', function () { if (rx) { rx(0); ry(0); } });
  });
  $$('.btn').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--mx', (e.clientX - r.left) + 'px'); b.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- aura sliders without GSAP are handled in aura.js ---------- */

  /* ---------- no-GSAP fallbacks ---------- */
  if (!hasGsap) {
    $('#preloader') && $('#preloader').remove();
    $$('[data-count]').forEach(function (el) { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
    var mq = $('#marquee'); if (mq) mq.classList.add('marquee-css');
    return;
  }
  if (reduce) {
    $('#preloader') && $('#preloader').remove();
    $$('[data-count]').forEach(function (el) { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
    var mq2 = $('#marquee'); if (mq2) mq2.classList.add('marquee-css');
  }

  /* ---------- cursor ---------- */
  if (animate && fine) {
    html.classList.add('has-cursor');
    var cur = $('#cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring');
    gsap.set([dot, ring], { x: -100, y: -100 });
    var dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'none' }), dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'none' });
    var rxq = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' }), ryq = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) { dx(e.clientX); dy(e.clientY); rxq(e.clientX); ryq(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var h = e.target.closest && e.target.closest('a,button,[data-hover],input,label,.hud,summary');
      cur.classList.toggle('is-hover', !!h);
    });
    window.addEventListener('pointerdown', function () { cur.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { cur.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { gsap.to(cur, { opacity: 0, duration: 0.2 }); });
    document.addEventListener('mouseenter', function () { gsap.to(cur, { opacity: 1, duration: 0.2 }); });
  }

  /* ---------- magnetic buttons ---------- */
  if (animate && fine) {
    $$('[data-magnetic]').forEach(function (el) {
      var xq = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,0.45)' });
      var yq = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,0.45)' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xq((e.clientX - (r.left + r.width / 2)) * 0.35);
        yq((e.clientY - (r.top + r.height / 2)) * 0.5);
      });
      el.addEventListener('pointerleave', function () { xq(0); yq(0); });
    });
  }

  /* ---------- progress bar, nav, 3D scroll link ---------- */
  var bar = $('#progress'), nav = $('#nav');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      bar.style.transform = 'scaleX(' + self.progress + ')';
      if (window.DeltaScene) window.DeltaScene.setScroll(self.progress);
      var y = self.scroll();
      nav.classList.toggle('scrolled', y > 40);
      nav.classList.toggle('hide', self.direction === 1 && y > 500);
      if (self.direction === -1) nav.classList.remove('hide');
    }
  });

  /* ---------- marquee driven by scroll velocity ---------- */
  (function () {
    var track = $('.marquee-track'), row = track && $('.marquee-row', track);
    if (!track || !row || reduce) return;
    var x = 0, boost = 0, dir = -1, skew = 0, lastY = window.scrollY;
    gsap.ticker.add(function () {
      var y = window.scrollY, dv = y - lastY; lastY = y;
      if (dv > 0.5) dir = -1; else if (dv < -0.5) dir = 1;
      boost += (Math.min(Math.abs(dv), 90) * 0.08 - boost) * 0.1;
      x += dir * (0.7 + boost);
      var w = row.offsetWidth;
      if (x <= -w) x += w; if (x > 0) x -= w;
      skew += ((-Math.max(-40, Math.min(40, dv)) * 0.18) - skew) * 0.12;
      track.style.transform = 'translate3d(' + x + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
    });
  })();

  /* ---------- horizontal pinned modules ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 1001px)', function () {
    var track = $('#htrack'), hbar = $('#hbar');
    if (!track) return;
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var tween = gsap.to(track, {
      x: function () { return -dist(); },
      ease: 'none',
      scrollTrigger: {
        trigger: '.hscroll-pin', start: 'top top',
        end: function () { return '+=' + dist(); },
        pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1,
        onUpdate: function (self) { hbar.style.transform = 'scaleX(' + self.progress + ')'; }
      }
    });
    $$('[data-hpanel]').forEach(function (p) {
      gsap.fromTo(p, { opacity: 0.3, scale: 0.93 }, {
        opacity: 1, scale: 1, ease: 'none',
        scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 96%', end: 'left 58%', scrub: true }
      });
      var big = $('.panel-big', p);
      gsap.fromTo(big, { x: -80 }, {
        x: 80, ease: 'none',
        scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
      });
    });
  });

  /* ---------- scroll reveals ---------- */
  if (animate) {
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out', overwrite: true }); }
    });
  }

  /* ---------- counters ---------- */
  $$('[data-count]').forEach(function (el) {
    if (!animate) return;
    var end = parseFloat(el.dataset.count), suf = el.dataset.suffix || '';
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: function () {
        var o = { v: 0 };
        gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v) + suf; }, onComplete: function () { el.textContent = end + suf; } });
      }
    });
  });

  /* ---------- install timeline line, footer word, floating icon ---------- */
  gsap.to('#stepsLine', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#steps', start: 'top 70%', end: 'bottom 70%', scrub: true } });
  gsap.fromTo('#footerWord', { '--p': '0%' }, { '--p': '100%', ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top 92%', end: 'bottom bottom', scrub: true } });
  if (animate) gsap.to('.dl-icon', { y: -12, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });

  /* ---------- hero scroll-out ---------- */
  if (animate) {
    gsap.to('.hero-inner', { yPercent: -14, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 20%', scrub: true } });
    gsap.fromTo('.hero-meta,.scroll-hint', { opacity: 1 }, { opacity: 0, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '#hero', start: 'top top', end: '40% top', scrub: true } });
  }

  /* ---------- preloader → hero intro ---------- */
  function heroIntro() {
    if (lenis) lenis.start();
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    gsap.set('[data-hero]', { y: 24 });
    tl.fromTo('#bg', { opacity: 0 }, { opacity: 1, duration: 2.4, ease: 'power2.out' }, 0)
      .from('.hero-title .ch', { yPercent: 118, rotate: 7, duration: 1.5, stagger: 0.045 }, 0.05)
      .to('[data-hero]', { opacity: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.4)
      .from('.nav', { yPercent: -100, duration: 1.1, clearProps: 'transform' }, 0.5);
  }

  function runPreloader() {
    var pre = $('#preloader');
    if (!pre || !animate) { if (animate) heroIntro(); return; }
    var num = $('#preNum'), paths = $$('.pre-path', pre), o = { v: 0 };
    var loaded = new Promise(function (res) {
      if (document.readyState === 'complete') res();
      else { window.addEventListener('load', res); setTimeout(res, 4000); }
    });
    var counting = new Promise(function (res) {
      var tl = gsap.timeline({ onComplete: res });
      tl.to(paths, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', stagger: 0.25 }, 0)
        .to(o, { v: 100, duration: 1.9, ease: 'power2.inOut', onUpdate: function () { num.textContent = Math.round(o.v); } }, 0);
    });
    Promise.all([loaded, counting]).then(function () {
      var out = gsap.timeline({ onComplete: function () { pre.style.display = 'none'; ScrollTrigger.refresh(); } });
      out.to('.pre-core', { opacity: 0, scale: 0.9, duration: 0.5, ease: 'power2.in' })
         .to('.pre-curtain--top', { scaleY: 0, duration: 1.05, ease: 'expo.inOut' }, '>-0.05')
         .to('.pre-curtain--bot', { scaleY: 0, duration: 1.05, ease: 'expo.inOut' }, '<')
         .add(heroIntro, '<0.38');
    });
    // safety net: never trap the visitor behind the preloader
    setTimeout(function () { if (pre.style.display !== 'none') { pre.style.display = 'none'; if (lenis) lenis.start(); gsap.set(['[data-hero]', '#bg'], { opacity: 1, y: 0 }); gsap.set('.hero-title .ch', { yPercent: 0, rotate: 0 }); } }, 9000);
  }
  runPreloader();

  /* ---------- refresh after load / fonts ---------- */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
