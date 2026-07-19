/* ============================================================
   V2G — helpers compartilhados dos mockups
   Uso: window.V2G.{buildMark, fillBlocks, maskPhone, confettiBurst}
   Auto-init: .mark[data-mark] e .rail-blocks[data-blocks]
   ============================================================ */
(function () {
  'use strict';

  var MARK = [
    '011010',
    '110110',
    '011011',
    '110110',
    '011010'
  ];

  function buildMark(el) {
    if (!el || el.childNodes.length) return [];
    el.style.gridTemplateColumns = 'repeat(' + MARK[0].length + ', var(--px, 8px))';
    var lit = [];
    MARK.forEach(function (row) {
      row.split('').forEach(function (c) {
        var i = document.createElement('i');
        if (c === '1') { lit.push(i); } else { i.className = 'off'; }
        el.appendChild(i);
      });
    });
    return lit;
  }

  /* fillBlocks(el, total, litCount, cls) — cls: 'lit' (lima, concluído) | 'on' (cobalto, em andamento) */
  function fillBlocks(el, total, litCount, cls) {
    if (!el || el.childNodes.length) return;
    for (var i = 0; i < total; i++) {
      var b = document.createElement('i');
      if (i < litCount) b.className = cls;
      el.appendChild(b);
    }
  }

  function maskPhone(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function confettiBurst(layer) {
    if (!layer) return;
    layer.innerHTML = '';
    for (var i = 0; i < 44; i++) {
      var p = document.createElement('i');
      p.style.setProperty('--x', (Math.random() * 96 + 2) + '%');
      p.style.setProperty('--d', (Math.random() * 0.9).toFixed(2) + 's');
      p.style.setProperty('--yend', (Math.random() * 80) + '%');
      var s = 5 + Math.random() * 6;
      p.style.width = s + 'px';
      p.style.height = s + 'px';
      if (i % 4 === 0) p.className = 'ice';
      layer.appendChild(p);
    }
  }

  /* dispara confete quando a tela entra no viewport (uma vez) */
  function confettiOnVisible(screenEl, layer) {
    if (!screenEl || !layer) return;
    if (!('IntersectionObserver' in window) || reduced) { confettiBurst(layer); return; }
    var fired = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !fired) { fired = true; confettiBurst(layer); io.disconnect(); }
      });
    }, { threshold: 0.4 });
    io.observe(screenEl);
  }

  /* auto-init */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.mark[data-mark]').forEach(function (el) { buildMark(el); });
    document.querySelectorAll('.rail-blocks[data-blocks]').forEach(function (el) {
      /* data-blocks="lit:6" | "on:2" | "0" (vazio) */
      var spec = el.getAttribute('data-blocks');
      var m = spec.match(/^(lit|on):(\d+)$/);
      if (m) fillBlocks(el, 6, parseInt(m[2], 10), m[1]);
      else fillBlocks(el, 6, 0, '');
    });
  });

  window.V2G = {
    MARK: MARK,
    buildMark: buildMark,
    fillBlocks: fillBlocks,
    maskPhone: maskPhone,
    confettiBurst: confettiBurst,
    confettiOnVisible: confettiOnVisible,
    reducedMotion: reduced
  };
})();
