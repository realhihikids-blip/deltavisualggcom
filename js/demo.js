/* DELTA VISUALS — interactive ClickGUI + HUD editor demo (no dependencies) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var gui = $('#gui'), side = $('#guiSide'), modsEl = $('#guiMods'), setEl = $('#guiSet'), game = $('#game');
  if (!gui || !side || !modsEl || !setEl || !game) return;

  /* ---------------- theme ---------------- */
  var PRESETS = [
    { n: 'Violet',  a: '#7342da', b: '#c084fc' },
    { n: 'Cyan',    a: '#0891b2', b: '#22d3ee' },
    { n: 'Rose',    a: '#e11d48', b: '#fb7185' },
    { n: 'Emerald', a: '#059669', b: '#34d399' },
    { n: 'Amber',   a: '#d97706', b: '#fbbf24' }
  ];
  var theme = { a: PRESETS[0].a, b: PRESETS[0].b, preset: 0, opacity: 92 };

  function rgb(h) {
    h = h.replace('#', '');
    var n = parseInt(h, 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }
  function applyTheme() {
    var r = document.documentElement.style;
    r.setProperty('--accent', theme.a);
    r.setProperty('--accent2', theme.b);
    r.setProperty('--a-rgb', rgb(theme.a));
    r.setProperty('--b-rgb', rgb(theme.b));
    r.setProperty('--gui-op', (theme.opacity / 100).toString());
    if (window.DeltaScene) window.DeltaScene.setColors(theme.a, theme.b);
    if (window.DeltaAura) window.DeltaAura.setColors(theme.a, theme.b);
  }

  /* ---------------- data ---------------- */
  var CATS = ['Controls', 'Visuals', 'Cosmetics', 'Player', 'World', 'Configs', 'Theme'];
  var B = function (k, label, v) { return { k: k, label: label, type: 'bool', v: v }; };
  var N = function (k, label, v, min, max, step, unit) { return { k: k, label: label, type: 'num', v: v, min: min, max: max, step: step, unit: unit || '' }; };
  var Mo = function (k, label, opts, v) { return { k: k, label: label, type: 'mode', opts: opts, v: v || 0 }; };
  var A = function (label, btn, fn) { return { type: 'action', label: label, btn: btn, fn: fn }; };

  var MODS = [
    { id: 'gui', cat: 'Controls', name: 'Click GUI', desc: 'Opens this menu. Change the key with the Keybind button.', on: true, lock: true,
      sets: [{ type: 'info', text: 'Always on. In the real mod you can rebind the key with the Keybind button.' }] },
    { id: 'hudedit', cat: 'Controls', name: 'HUD Editor', desc: 'Drag, scale, enable and reset HUD elements.', on: true, lock: true,
      sets: [A('Drag, wheel = scale, R = reset hovered', 'Open Editor', function () { editMode(); })] },

    { id: 'watermark', cat: 'Visuals', name: 'Watermark', desc: 'Client name tag with optional FPS.', on: true, sets: [B('fps', 'Show FPS', true)] },
    { id: 'reach', cat: 'Visuals', name: 'Reach Display', desc: 'Distance to your current target.', on: true,
      sets: [N('dec', 'Decimals', 2, 0, 3, 1), B('label', 'Show Label', true), B('target', 'Show Target Name', true)] },
    { id: 'armor', cat: 'Visuals', name: 'Armor HUD', desc: 'Your armor and its durability.', on: true,
      sets: [Mo('layout', 'Layout', ['Vertical', 'Horizontal'], 0), B('pct', 'Durability Percent', true)] },
    { id: 'info', cat: 'Visuals', name: 'Info HUD', desc: 'Ping, coordinates, facing, clock and FPS.', on: true,
      sets: [B('ping', 'Ping', true), B('coords', 'Coordinates', true), B('facing', 'Facing', true), B('time', 'Clock', true), B('fps', 'FPS', false)] },
    { id: 'items', cat: 'Visuals', name: 'Item Status', desc: 'Shows if Pearl / Totem / Elytra shortcuts are ready.', on: true,
      sets: [B('pearl', 'Pearl', true), B('totem', 'Totem', true), B('elytra', 'Elytra', true)] },

    { id: 'aura', cat: 'Cosmetics', name: 'Aura', desc: 'Cosmetic particle aura around your character.', on: true,
      sets: [B('two', 'Two Colors', true), B('fp', 'Show In First Person', false),
             A('Try every effect in the playground', 'Open playground', function () { if (window.DeltaScroll) window.DeltaScroll('#aura'); })] },

    { id: 'elytra', cat: 'Player', name: 'Elytra Swap', desc: 'Inventory open: swap between elytra and chestplate.', on: true,
      sets: [N('delay', 'Anti-Spam Delay', 250, 0, 1000, 50, ' ms'), B('msg', 'Show Messages', true)] },
    { id: 'pearl', cat: 'Player', name: 'Pearl Swap', desc: 'Select the ender pearl in your hotbar.', on: true,
      sets: [B('back', 'Press Again To Go Back', true), B('msg', 'Show Messages', true)] },
    { id: 'totem', cat: 'Player', name: 'Totem Swap', desc: 'Move a totem to the off-hand.', on: true,
      sets: [Mo('out', 'Inventory Closed', ['Select Hotbar Totem', 'Do Nothing'], 0), N('delay', 'Anti-Spam Delay', 250, 0, 1000, 50, ' ms'), B('msg', 'Show Messages', true)] },

    { id: 'radius', cat: 'World', name: 'Radius Circle', desc: 'A circle around the crosshair target.', on: false,
      sets: [N('r', 'Radius', 3, 1, 6, 0.5, ' blocks'), Mo('style', 'Style', ['Solid', 'Dashed', 'Double'], 0)] },

    { id: 'profiles', cat: 'Configs', name: 'Profiles', desc: 'Switch, duplicate and reset configuration profiles.', on: true, lock: true,
      sets: [Mo('p', 'Active Profile', ['Default', 'Minimal', 'Showcase'], 0),
             A('Cycle to the next profile', 'Next Profile', function () { cycleProfile(); }),
             A('Store the current setup', 'Save Now', function () { toast('Saved'); }),
             A('Back to defaults', 'Reset', function () { setProfile(0); toast('All settings reset'); })] },
    { id: 'theme', cat: 'Configs', name: 'Theme', desc: 'Restyle the whole GUI. On this page it restyles the website too.', on: true, lock: true,
      sets: [{ type: 'presets' }, { type: 'color', k: 'a', label: 'Accent' }, { type: 'color', k: 'b', label: 'Accent 2' }, { type: 'themeop', label: 'Panel Opacity' }] }
  ];
  // The Theme module is reachable via the Theme tab as well as under Configs.
  MODS.forEach(function (m) { if (m.id === 'theme') m.cat = 'Theme'; });
  var byId = {}; MODS.forEach(function (m) { byId[m.id] = m; });
  function val(id, k) { var m = byId[id]; for (var i = 0; i < m.sets.length; i++) if (m.sets[i].k === k) return m.sets[i]; return null; }
  function sv(id, k) { var s = val(id, k); return s ? s.v : null; }

  var PROFILES = [
    { watermark: 1, reach: 1, armor: 1, info: 1, items: 1, radius: 0 },
    { watermark: 1, reach: 0, armor: 0, info: 1, items: 0, radius: 0 },
    { watermark: 1, reach: 1, armor: 1, info: 1, items: 1, radius: 1 }
  ];
  function setProfile(i) {
    byId.profiles.sets[0].v = i;
    var p = PROFILES[i];
    for (var k in p) byId[k].on = !!p[k];
    renderAll();
  }
  function cycleProfile() { var n = (byId.profiles.sets[0].v + 1) % PROFILES.length; setProfile(n); toast('Profile: ' + ['Default', 'Minimal', 'Showcase'][n]); }

  var curCat = 'Visuals', cur = byId.watermark;

  /* ---------------- render GUI ---------------- */
  function renderSide() {
    side.innerHTML = CATS.map(function (c) {
      return '<li><button data-cat="' + c + '" class="' + (c === curCat ? 'on' : '') + '" data-hover>' + c + '</button></li>';
    }).join('');
  }
  function renderMods() {
    var list = MODS.filter(function (m) { return m.cat === curCat; });
    if (list.indexOf(cur) < 0) cur = list[0];
    modsEl.innerHTML = list.map(function (m) {
      return '<li><button class="gm' + (m === cur ? ' sel' : '') + '" data-mod="' + m.id + '" data-hover><span>' + m.name + '</span>' +
        (m.lock ? '' : '<span class="sw' + (m.on ? ' on' : '') + '" role="switch" aria-checked="' + m.on + '" data-sw="' + m.id + '"></span>') + '</button></li>';
    }).join('');
  }
  function fillRange(el) {
    var pct = (el.value - el.min) / (el.max - el.min) * 100;
    el.style.setProperty('--fill', pct + '%');
  }
  function renderSet() {
    var m = cur, html = '<h5>' + m.name.toUpperCase() + '</h5><p class="desc">' + m.desc + '</p>';
    m.sets.forEach(function (s, i) {
      if (s.type === 'bool') {
        html += '<div class="set"><span>' + s.label + '</span><button class="sw' + (s.v ? ' on' : '') + '" data-i="' + i + '" role="switch" aria-checked="' + !!s.v + '" data-hover></button></div>';
      } else if (s.type === 'num') {
        html += '<div class="set"><span>' + s.label + '</span><input type="range" data-i="' + i + '" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + s.v + '"><output>' + s.v + s.unit + '</output></div>';
      } else if (s.type === 'mode') {
        html += '<div class="set"><span>' + s.label + '</span><div class="seg">' + s.opts.map(function (o, j) {
          return '<button data-i="' + i + '" data-o="' + j + '" class="' + (j === s.v ? 'on' : '') + '" data-hover>' + o + '</button>';
        }).join('') + '</div></div>';
      } else if (s.type === 'action') {
        html += '<div class="set"><span>' + s.label + '</span><button class="abtn" data-i="' + i + '" data-hover>' + s.btn + '</button></div>';
      } else if (s.type === 'info') {
        html += '<p class="desc">' + s.text + '</p>';
      } else if (s.type === 'presets') {
        html += '<div class="set"><span>Preset</span><div class="presets">' + PRESETS.map(function (p, j) {
          return '<button data-preset="' + j + '" title="' + p.n + '" style="--p1:' + p.a + ';--p2:' + p.b + '" class="' + (j === theme.preset ? 'on' : '') + '" data-hover></button>';
        }).join('') + '</div></div>';
      } else if (s.type === 'color') {
        html += '<div class="set"><span>' + s.label + '</span><input type="color" data-color="' + s.k + '" value="' + theme[s.k] + '" data-hover></div>';
      } else if (s.type === 'themeop') {
        html += '<div class="set"><span>' + s.label + '</span><input type="range" data-op min="40" max="100" step="1" value="' + theme.opacity + '"><output>' + theme.opacity + '</output></div>';
      }
    });
    setEl.innerHTML = html;
    setEl.querySelectorAll('input[type=range]').forEach(fillRange);
  }
  function renderAll() { renderSide(); renderMods(); renderSet(); renderHud(); }

  /* ---------------- GUI events ---------------- */
  side.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]'); if (!b) return;
    curCat = b.dataset.cat;
    var list = MODS.filter(function (m) { return m.cat === curCat; });
    cur = list[0];
    renderSide(); renderMods(); renderSet();
  });
  modsEl.addEventListener('click', function (e) {
    var sw = e.target.closest('[data-sw]');
    var row = e.target.closest('[data-mod]'); if (!row) return;
    var m = byId[row.dataset.mod];
    if (sw) { m.on = !m.on; }
    cur = m;
    renderMods(); renderSet(); renderHud();
  });
  setEl.addEventListener('click', function (e) {
    var p = e.target.closest('[data-preset]');
    if (p) {
      var pr = PRESETS[+p.dataset.preset];
      theme.a = pr.a; theme.b = pr.b; theme.preset = +p.dataset.preset;
      applyTheme(); renderSet(); return;
    }
    var t = e.target.closest('[data-i]'); if (!t) return;
    var s = cur.sets[+t.dataset.i];
    if (s.type === 'bool') { s.v = !s.v; renderSet(); renderHud(); }
    else if (s.type === 'mode') { s.v = +t.dataset.o; renderSet(); renderHud(); if (cur.id === 'profiles') setProfile(s.v); }
    else if (s.type === 'action') { s.fn(); }
  });
  setEl.addEventListener('input', function (e) {
    var t = e.target;
    if (t.matches('[data-op]')) {
      theme.opacity = +t.value; t.nextElementSibling.textContent = t.value; fillRange(t); applyTheme(); return;
    }
    if (t.matches('[data-color]')) {
      theme[t.dataset.color] = t.value; theme.preset = -1; applyTheme();
      setEl.querySelectorAll('.presets button').forEach(function (b) { b.classList.remove('on'); });
      return;
    }
    if (t.matches('input[type=range][data-i]')) {
      var s = cur.sets[+t.dataset.i]; s.v = parseFloat(t.value);
      t.nextElementSibling.textContent = s.v + s.unit; fillRange(t); renderHud();
    }
  });

  /* ---------------- game view / HUD ---------------- */
  var hudEls = {};
  game.querySelectorAll('[data-hud]').forEach(function (el) {
    hudEls[el.dataset.hud] = el;
    el.dataset.x = el.style.getPropertyValue('--x'); el.dataset.y = el.style.getPropertyValue('--y');
    el.dataset.s = '1';
  });

  var ring = document.createElement('div'); ring.className = 'game-ring'; game.appendChild(ring);
  var toastEl = document.createElement('div'); toastEl.className = 'game-toast'; game.appendChild(toastEl);
  var toastT;
  function toast(t) {
    toastEl.textContent = '[Delta] ' + t; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }
  var editT;
  function editMode() {
    game.classList.add('edit'); clearTimeout(editT);
    editT = setTimeout(function () { game.classList.remove('edit'); }, 3200);
    toast('HUD Editor: drag, wheel = scale, R = reset');
    if (window.DeltaScroll) window.DeltaScroll(game, -90);
  }

  var tick = 0, coords = { x: 128.5, y: 64, z: -302.2 };
  var FACING = ['South (+Z)', 'West (-X)', 'North (-Z)', 'East (+X)'];
  var ARMOR = [['Helmet', '#7dd3fc', 98], ['Chestplate', '#a78bfa', 73], ['Leggings', '#7dd3fc', 91], ['Boots', '#a78bfa', 55]];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(n, d) { return n.toFixed(d); }

  function renderHud() {
    tick++;
    coords.x += Math.sin(tick / 9) * 0.31; coords.z += Math.cos(tick / 11) * 0.27;
    var fps = Math.round(238 + Math.sin(tick / 3) * 9 + Math.random() * 6);
    var ping = Math.round(26 + Math.sin(tick / 5) * 3 + Math.random() * 2);
    var d = new Date();

    // watermark
    var w = byId.watermark;
    hudEls.watermark.classList.toggle('off', !w.on);
    hudEls.watermark.innerHTML = '<span class="wm">DELTA <span class="acc">VISUALS</span></span>' + (sv('watermark', 'fps') ? ' <span class="dim">· ' + fps + ' FPS</span>' : '');

    // info
    var i = byId.info, L = [];
    if (sv('info', 'ping')) L.push('Ping <span class="acc">' + ping + 'ms</span>');
    if (sv('info', 'coords')) L.push('XYZ <span class="acc">' + fmt(coords.x, 1) + ' ' + fmt(coords.y, 0) + ' ' + fmt(coords.z, 1) + '</span>');
    if (sv('info', 'facing')) L.push('Facing <span class="acc">' + FACING[Math.floor(tick / 40) % 4] + '</span>');
    if (sv('info', 'time')) L.push('Time <span class="acc">' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + '</span>');
    if (sv('info', 'fps')) L.push('FPS <span class="acc">' + fps + '</span>');
    hudEls.info.classList.toggle('off', !i.on || !L.length);
    hudEls.info.innerHTML = L.join('<br>');

    // reach
    var dist = 3.1 + Math.sin(tick / 4) * 0.6;
    hudEls.reach.classList.toggle('off', !byId.reach.on);
    hudEls.reach.innerHTML = (sv('reach', 'label') ? 'Reach ' : '') + '<span class="acc">' + fmt(dist, sv('reach', 'dec')) + '</span>' + (sv('reach', 'target') ? ' <span class="dim">· Zombie</span>' : '');

    // armor
    var horiz = sv('armor', 'layout') === 1, pct = sv('armor', 'pct');
    hudEls.armor.classList.toggle('off', !byId.armor.on);
    hudEls.armor.innerHTML = '<div class="armor ' + (horiz ? '' : 'v') + '">' + ARMOR.map(function (a) {
      return '<div title="' + a[0] + '"><i style="--c:' + a[1] + '"></i>' + (pct ? '<span class="dim">' + a[2] + '%</span>' : '') + '</div>';
    }).join('') + '</div>';

    // item status
    var it = [];
    function st(label, mod, key) {
      if (!sv('items', key)) return;
      var ok = byId[mod].on;
      it.push(label + ': <span class="' + (ok ? 'ok' : 'bad') + '">' + (ok ? 'ready' : 'off') + '</span>');
    }
    st('Pearl', 'pearl', 'pearl'); st('Totem', 'totem', 'totem'); st('Elytra', 'elytra', 'elytra');
    hudEls.items.classList.toggle('off', !byId.items.on || !it.length);
    hudEls.items.innerHTML = it.join('<br>');

    // radius circle
    var rc = byId.radius, st2 = sv('radius', 'style');
    ring.style.display = rc.on ? 'block' : 'none';
    ring.style.setProperty('--d', Math.round(sv('radius', 'r') * 64) + 'px');
    ring.dataset.style = ['solid', 'dashed', 'double'][st2];
  }

  /* drag / wheel / reset */
  var hovered = null;
  Object.keys(hudEls).forEach(function (k) {
    var el = hudEls[k];
    el.addEventListener('mouseenter', function () { hovered = el; });
    el.addEventListener('mouseleave', function () { if (hovered === el) hovered = null; });
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var gr = game.getBoundingClientRect(), er = el.getBoundingClientRect();
      var ox = e.clientX - er.left, oy = e.clientY - er.top;
      el.classList.add('drag'); el.setPointerCapture(e.pointerId);
      function move(ev) {
        var x = Math.min(Math.max(ev.clientX - gr.left - ox, 0), gr.width - er.width);
        var y = Math.min(Math.max(ev.clientY - gr.top - oy, 0), gr.height - er.height);
        el.style.setProperty('--x', (x / gr.width * 100).toFixed(2) + '%');
        el.style.setProperty('--y', (y / gr.height * 100).toFixed(2) + '%');
      }
      function up() {
        el.classList.remove('drag');
        el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      }
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      var s = parseFloat(el.dataset.s) * (e.deltaY < 0 ? 1.08 : 0.92);
      s = Math.min(Math.max(s, 0.6), 2.2);
      el.dataset.s = s.toFixed(3); el.style.setProperty('--s', s.toFixed(3));
    }, { passive: false });
  });
  window.addEventListener('keydown', function (e) {
    if ((e.key === 'r' || e.key === 'R') && hovered && !e.ctrlKey && !e.metaKey) {
      hovered.style.setProperty('--x', hovered.dataset.x); hovered.style.setProperty('--y', hovered.dataset.y);
      hovered.style.setProperty('--s', '1'); hovered.dataset.s = '1';
      toast('HUD element reset');
    }
  });

  applyTheme();
  renderAll();
  setInterval(function () { if (!document.hidden) renderHud(); }, 250);
})();
