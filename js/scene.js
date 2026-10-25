/* DELTA VISUALS — 3D background (Three.js r128)
   Shader particle field + wireframe "delta" (tetrahedron) reacting to mouse and scroll. */
(function () {
  'use strict';
  var canvas = document.getElementById('bg');
  if (!canvas || !window.THREE) { window.DeltaScene = null; return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { window.DeltaScene = null; return; }

  var small = window.innerWidth < 700;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.set(0, 0, 26);

  var uniforms = {
    uTime:   { value: 0 },
    uScroll: { value: 0 },
    uPx:     { value: renderer.getPixelRatio() },
    uMouse:  { value: new THREE.Vector2(10, 10) },
    uA:      { value: new THREE.Color('#7342da') },
    uB:      { value: new THREE.Color('#c084fc') }
  };

  /* ---------- particle field ---------- */
  var N = small ? 1800 : 4800;
  var pos = new Float32Array(N * 3);
  var seed = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    var r = 7 + Math.pow(Math.random(), 0.65) * 38;
    var th = Math.random() * Math.PI * 2;
    var ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph) * 0.62;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    seed[i * 3] = Math.random(); seed[i * 3 + 1] = Math.random(); seed[i * 3 + 2] = Math.random();
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));

  var pMat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: [
      'attribute vec3 aSeed;',
      'uniform float uTime; uniform float uScroll; uniform float uPx; uniform vec2 uMouse;',
      'varying float vMix; varying float vAlpha;',
      'void main(){',
      '  vec3 p = position;',
      '  float ang = (uTime * 0.05 + uScroll * 2.4) * (0.4 + aSeed.x * 0.9);',
      '  float c = cos(ang), s = sin(ang);',
      '  p.xz = mat2(c, -s, s, c) * p.xz;',
      '  p.y += sin(uTime * 0.6 + aSeed.y * 6.2831) * 0.7;',
      '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
      '  vec4 clip = projectionMatrix * mv;',
      '  vec2 ndc = clip.xy / clip.w;',
      '  vec2 d = ndc - uMouse;',
      '  float f = smoothstep(0.32, 0.0, length(d));',
      '  mv.xy += normalize(d + vec2(0.0001)) * f * 3.2;',
      '  gl_Position = projectionMatrix * mv;',
      '  gl_PointSize = (1.1 + aSeed.z * 2.8) * uPx * (38.0 / -mv.z);',
      '  vMix = aSeed.x;',
      '  vAlpha = 0.30 + 0.70 * aSeed.z;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'precision mediump float;',
      'uniform vec3 uA; uniform vec3 uB;',
      'varying float vMix; varying float vAlpha;',
      'void main(){',
      '  float d = length(gl_PointCoord - 0.5);',
      '  if (d > 0.5) discard;',
      '  float a = smoothstep(0.5, 0.0, d);',
      '  gl_FragColor = vec4(mix(uA, uB, vMix), a * vAlpha);',
      '}'
    ].join('\n')
  });
  var points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  /* ---------- delta (tetrahedron) group ---------- */
  var delta = new THREE.Group();
  var lineMats = [];
  function addEdges(geo, opacity, color) {
    var m = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    lineMats.push({ m: m, base: opacity });
    var l = new THREE.LineSegments(new THREE.EdgesGeometry(geo), m);
    delta.add(l);
    return l;
  }
  var tet1 = addEdges(new THREE.TetrahedronGeometry(6.2, 0), 0.95, 0xc084fc);
  var tet2 = addEdges(new THREE.TetrahedronGeometry(3.4, 0), 0.8, 0x7342da);
  var ico  = addEdges(new THREE.IcosahedronGeometry(9.4, 1), 0.16, 0x7342da);
  var faceMat = new THREE.MeshBasicMaterial({ color: 0x7342da, transparent: true, opacity: 0.07, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  var faces = new THREE.Mesh(new THREE.TetrahedronGeometry(6.2, 0), faceMat);
  delta.add(faces);
  scene.add(delta);

  var baseX = small ? 0 : 8.2;
  delta.position.set(baseX, 0, 0);

  /* ---------- state ---------- */
  var mouse = new THREE.Vector2(0, 0), mouseS = new THREE.Vector2(0, 0), mouseT = new THREE.Vector2(10, 10);
  var scrollP = 0, scrollS = 0, speedBoost = 0;
  var colorA = new THREE.Color('#7342da'), colorB = new THREE.Color('#c084fc');

  window.addEventListener('pointermove', function (e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    mouseT.copy(mouse);
  }, { passive: true });
  document.addEventListener('mouseleave', function () { mouseT.set(10, 10); });

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    baseX = w < 700 ? 0 : Math.min(9, 5 + w / 280);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- loop ---------- */
  var clock = new THREE.Clock();
  var running = true;
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) { clock.getDelta(); loop(); }
  });

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = uniforms.uTime.value += reduce ? 0 : dt;

    mouseS.lerp(mouse, 1 - Math.pow(0.001, dt));
    scrollS += (scrollP - scrollS) * (1 - Math.pow(0.0008, dt));
    uniforms.uScroll.value = scrollS;
    uniforms.uMouse.value.lerp(mouseT, 1 - Math.pow(0.0005, dt));

    // colors ease to target
    uniforms.uA.value.lerp(colorA, 0.08);
    uniforms.uB.value.lerp(colorB, 0.08);
    tet1.material.color.lerp(colorB, 0.08);
    tet2.material.color.lerp(colorA, 0.08);
    ico.material.color.lerp(colorA, 0.08);
    faceMat.color.lerp(colorA, 0.08);

    // delta: spins, drifts with scroll, fades out after the hero
    var fade = Math.max(0, 1 - scrollS * 5.5);
    var spin = reduce ? 0 : dt;
    tet1.rotation.y += spin * 0.35; tet1.rotation.x += spin * 0.18;
    tet2.rotation.y -= spin * 0.7;  tet2.rotation.z += spin * 0.4;
    ico.rotation.y  += spin * 0.08; ico.rotation.x -= spin * 0.05;
    faces.rotation.copy(tet1.rotation);

    delta.rotation.y = mouseS.x * 0.5 + scrollS * 9;
    delta.rotation.x = -mouseS.y * 0.35 + scrollS * 4;
    delta.position.x = baseX - scrollS * 40;
    delta.position.y = Math.sin(t * 0.8) * 0.5 + mouseS.y * 0.8;
    var sc = 0.4 + 0.6 * fade;
    delta.scale.setScalar(sc);
    for (var i = 0; i < lineMats.length; i++) lineMats[i].m.opacity = lineMats[i].base * fade;
    faceMat.opacity = 0.07 * fade;

    // camera: parallax + scroll push
    camera.position.x += (mouseS.x * 2.4 - camera.position.x) * 0.05;
    camera.position.y += (mouseS.y * 1.6 - camera.position.y) * 0.05;
    camera.position.z = 26 - scrollS * 14;
    camera.lookAt(0, 0, 0);

    points.rotation.y = t * 0.012;
    renderer.render(scene, camera);
  }
  loop();

  window.DeltaScene = {
    setColors: function (a, b) { colorA.set(a); colorB.set(b); },
    setScroll: function (p) { scrollP = p; }
  };
})();
