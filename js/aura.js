/* DELTA VISUALS — aura playground (Canvas 2D). Illustration for the website. */
(function () {
  'use strict';
  var cv = document.getElementById('auraCanvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var S = { type: 'orbit', speed: 1, size: 3, density: 60, radius: 1, opacity: 0.9, two: true };
  var colA = [115, 66, 218], colB = [192, 132, 252];
  var W = 0, H = 0, dpr = 1, parts = [], visible = false, running = false, last = 0;

  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  window.DeltaAura = {
    setColors: function (a, b) { colA = hexToRgb(a); colB = hexToRgb(b); }
  };

  function resize() {
    var r = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function R() { return Math.min(W, H) * 0.34 * S.radius; }
  function cx() { return W / 2; }
  function cy() { return H * 0.52; }

  function spawn(p, first) {
    var r = R();
    p.c = S.two && Math.random() < 0.5 ? 1 : 0;
    p.ph = Math.random();
    p.ph2 = Math.random();
    p.life = 0;
    p.max = 1.6 + Math.random() * 1.8;
    switch (S.type) {
      case 'orbit':
        p.ang = Math.random() * Math.PI * 2;
        p.off = (Math.random() - 0.5) * 2 * r * 0.95;
        p.rr = 0.75 + Math.random() * 0.5;
        break;
      case 'helix':
        p.t = first ? Math.random() : 0;
        p.strand = Math.random() < 0.5 ? 0 : Math.PI;
        break;
      case 'rain':
        p.x = cx() + (Math.random() - 0.5) * 2 * r * 1.1;
        p.y = first ? cy() - r * 1.3 + Math.random() * r * 2.6 : cy() - r * 1.3;
        p.vy = 90 + Math.random() * 120;
        break;
      case 'burst':
        var a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * r * 0.9;
        p.x = cx(); p.y = cy();
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        if (first) p.life = Math.random() * p.max;
        break;
      case 'flame':
        p.x = cx() + (Math.random() - 0.5) * r * 0.7;
        p.y = cy() + r * 0.9 - Math.random() * 20;
        p.vx = (Math.random() - 0.5) * 20; p.vy = -(60 + Math.random() * 110);
        if (first) { p.life = Math.random() * p.max; p.y += p.vy * p.life; }
        break;
    }
  }

  function ensure() {
    var target = Math.round(S.density * (S.type === 'burst' ? 2.4 : 2));
    while (parts.length < target) { var p = {}; spawn(p, true); parts.push(p); }
    if (parts.length > target) parts.length = target;
  }

  function reset() { parts = []; ensure(); }

  function drawFigure() {
    var s = Math.min(W, H) / 520;
    var x = cx(), y = cy();
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    var line = 'rgba(' + colB.join(',') + ',.55)';
    function box(bx, by, bw, bh, fill) {
      ctx.fillStyle = fill; ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.strokeRect(bx + .5, by + .5, bw - 1, bh - 1);
    }
    ctx.shadowColor = 'rgba(' + colA.join(',') + ',.6)'; ctx.shadowBlur = 30;
    box(-26, -126, 52, 52, '#1a1428');      // head
    box(-26, -70, 52, 84, '#16111f');       // body
    box(-46, -70, 20, 80, '#1a1428');       // arm L
    box(26, -70, 20, 80, '#1a1428');        // arm R
    box(-26, 18, 25, 84, '#120e1a');        // leg L
    box(1, 18, 25, 84, '#120e1a');          // leg R
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(' + colB.join(',') + ',.9)';
    ctx.fillRect(-14, -108, 8, 8); ctx.fillRect(6, -108, 8, 8);   // eyes
    ctx.restore();
  }

  function color(c, a) {
    var k = c ? colB : colA;
    return 'rgba(' + k[0] + ',' + k[1] + ',' + k[2] + ',' + a.toFixed(3) + ')';
  }
  function dot(x, y, size, c, a) {
    if (a <= 0.01) return;
    ctx.fillStyle = color(c, a);
    ctx.shadowColor = color(c, a);
    ctx.shadowBlur = size * 3;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }

  function frame(now) {
    if (!visible) { last = 0; running = false; return; }
    requestAnimationFrame(frame);
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    if (reduce) dt = 0.0001;

    ctx.clearRect(0, 0, W, H);
    ensure();

    var r = R(), sp = S.speed, sz = S.size * Math.min(W, H) / 520 * 2, op = S.opacity;
    var front = [];

    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], x, y, z = 1, a = op, size = sz;
      p.life += dt * sp;

      if (S.type === 'orbit') {
        p.ang += dt * sp * (1 + p.ph * 0.6);
        x = cx() + Math.cos(p.ang) * r * p.rr;
        y = cy() + Math.sin(p.ang) * r * 0.28 + p.off * 0.9;
        z = Math.sin(p.ang);
        a = op * (0.35 + 0.65 * (z + 1) / 2);
        size = sz * (0.7 + 0.5 * (z + 1) / 2);
      } else if (S.type === 'helix') {
        p.t += dt * sp * 0.22;
        if (p.t > 1) { p.t -= 1; }
        var ang = p.t * Math.PI * 7 + p.strand;
        x = cx() + Math.cos(ang) * r * 0.62;
        y = cy() + r * 1.05 - p.t * r * 2.1;
        z = Math.sin(ang);
        a = op * Math.sin(Math.PI * p.t) * (0.4 + 0.6 * (z + 1) / 2);
        size = sz * (0.75 + 0.5 * (z + 1) / 2);
      } else if (S.type === 'rain') {
        p.y += p.vy * dt * sp;
        x = p.x; y = p.y;
        var k = (y - (cy() - r * 1.3)) / (r * 2.6);
        a = op * Math.sin(Math.PI * Math.min(1, Math.max(0, k)));
        if (k >= 1) spawn(p, false);
        z = p.ph > 0.5 ? 1 : -1;
      } else if (S.type === 'burst') {
        p.x += p.vx * dt * sp; p.y += p.vy * dt * sp;
        x = p.x; y = p.y;
        var kb = p.life / p.max;
        a = op * (1 - kb);
        size = sz * (1 - kb * 0.6);
        if (kb >= 1) spawn(p, false);
        z = 1;
      } else { // flame
        p.x += p.vx * dt * sp; p.y += p.vy * dt * sp;
        p.vx += Math.sin(p.life * 6 + p.ph * 10) * 30 * dt;
        x = p.x; y = p.y;
        var kf = p.life / p.max;
        a = op * (1 - kf);
        size = sz * (1 - kf * 0.75);
        if (kf >= 1) spawn(p, false);
        z = 1;
      }
      var item = [x, y, size, p.c, a];
      if (z < 0) dot(x, y, size, p.c, a); else front.push(item);
    }

    drawFigure();
    for (var j = 0; j < front.length; j++) { var f = front[j]; dot(f[0], f[1], f[2], f[3], f[4]); }
    ctx.shadowBlur = 0;
  }

  /* run only when visible */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && !running) { running = true; requestAnimationFrame(frame); }
    }, { threshold: 0.05 }).observe(cv);
  } else { visible = true; running = true; requestAnimationFrame(frame); }

  /* ---- controls ---- */
  function bindRange(id, key, fmt) {
    var el = document.getElementById('a-' + id), out = document.getElementById('o-' + id);
    if (!el) return;
    function upd() {
      S[key] = parseFloat(el.value);
      if (key === 'opacity') S[key] = S[key] / 100;
      out.textContent = fmt ? fmt(parseFloat(el.value)) : el.value;
      var pct = (el.value - el.min) / (el.max - el.min) * 100;
      el.style.setProperty('--fill', pct + '%');
    }
    el.addEventListener('input', upd); upd();
  }
  bindRange('speed', 'speed', function (v) { return v.toFixed(1); });
  bindRange('size', 'size');
  bindRange('density', 'density');
  bindRange('radius', 'radius', function (v) { return v.toFixed(2); });
  bindRange('opacity', 'opacity');

  var two = document.getElementById('a-two');
  if (two) two.addEventListener('change', function () { S.two = two.checked; reset(); });

  var seg = document.getElementById('auraType');
  if (seg) seg.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    seg.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
    S.type = b.dataset.v; reset();
  });

  reset();
})();
