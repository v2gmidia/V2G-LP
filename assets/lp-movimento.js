/* ============================================================
   V2G — movimento da landing.
   Só roda com html.mov (posto no <head> quando há JS e a pessoa
   não pediu "reduzir movimento"). Anima só transform e opacity.
   Sem bibliotecas.
   ============================================================ */
(function () {
  'use strict';
  var raiz = document.documentElement;
  if (!raiz.classList.contains('mov')) return;
  window.V2G_MOV_OK = true;

  var mouseFino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var naTela = function (el, cb, limiar) {
    if (!('IntersectionObserver' in window)) { cb(true); return null; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting, io); }); },
      { threshold: limiar || 0, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return io;
  };

  /* ---------- 3. título do hero: palavra por palavra ---------- */
  var h1 = document.getElementById('hero-titulo');
  if (h1) {
    var n = 0;
    var parte = function (no) {
      Array.prototype.slice.call(no.childNodes).forEach(function (filho) {
        if (filho.nodeType === 3) {
          var frag = document.createDocumentFragment();
          filho.textContent.split(/(\s+)/).forEach(function (pedaco) {
            if (!pedaco) return;
            if (/^\s+$/.test(pedaco)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = 'palavra';
            s.style.setProperty('--i', n++);
            s.textContent = pedaco;
            frag.appendChild(s);
          });
          no.replaceChild(frag, filho);
        } else if (filho.nodeType === 1 && !filho.classList.contains('ponto')) {
          parte(filho);
        }
      });
    };
    parte(h1);
    h1.style.setProperty('--atraso-ponto', (n * 75 + 380) + 'ms');
    h1.classList.add('partido');
  }

  /* ---------- 1. blocos pixelados do hero ---------- */
  var img = document.querySelector('img.hero-pixels');
  var hero = document.querySelector('.hero');
  if (img && hero && window.fetch) {
    fetch(img.src).then(function (r) { return r.text(); }).then(function (txt) {
      var svg = new DOMParser().parseFromString(txt, 'image/svg+xml').documentElement;
      if (!svg || svg.nodeName !== 'svg') throw 0;
      svg = document.importNode(svg, true);
      svg.setAttribute('class', 'hero-pixels');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      img.replaceWith(svg);
      montaBlocos(svg);
    }).catch(function () { img.style.opacity = 1; });
  }

  function montaBlocos(svg) {
    var LIMA = '#E0F84C';
    var VB = svg.viewBox.baseVal;
    var blocos = Array.prototype.map.call(svg.querySelectorAll('rect'), function (r) {
      var x = +r.getAttribute('x'), y = +r.getAttribute('y'), w = +r.getAttribute('width');
      return { el: r, cx: x + w / 2, cy: y + w / 2, col: Math.round(x / 22), lin: Math.round(y / 22), cor: r.getAttribute('fill'), lift: 0, alvo: 0 };
    });
    var linhas = Math.max.apply(null, blocos.map(function (b) { return b.lin; }));

    // montagem: a escada se forma de baixo para cima (< 1,2 s no total)
    blocos.forEach(function (b) {
      var atraso = (linhas - b.lin) * 55 + b.col * 11;
      b.el.animate([{ transform: 'translateY(-70px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 420, delay: atraso, easing: 'cubic-bezier(.2,.9,.3,1.15)', fill: 'backwards' });
    });

    // respiração lenta em 3 blocos claros
    blocos.filter(function (b) { return /^#(8F|C2|DC)/i.test(b.cor); }).slice(0, 3)
      .forEach(function (b) { b.el.classList.add('respira'); });

    // campo que reage ao mouse (desktop) e onda no toque (celular)
    var mouse = null, ondas = [], rodando = false, ativo = true;
    var caixa = function () { return svg.getBoundingClientRect(); };

    function quadro(t) {
      var bb = caixa(), esc = bb.width / VB.width, mexendo = false;
      ondas = ondas.filter(function (o) { return t - o.t0 < 1400; });
      blocos.forEach(function (b) {
        var px = bb.left + b.cx * esc, py = bb.top + b.cy * esc, alvo = 0;
        if (mouse) {
          var d = Math.hypot(px - mouse.x, py - mouse.y);
          alvo = Math.max(0, 1 - d / 150);
        }
        ondas.forEach(function (o) {
          var raio = (t - o.t0) * 0.55, d = Math.hypot(px - o.x, py - o.y);
          var v = Math.max(0, 1 - Math.abs(d - raio) / 45) * (1 - (t - o.t0) / 1400);
          if (v > alvo) alvo = v;
        });
        b.lift += (alvo - b.lift) * 0.16;
        if (Math.abs(alvo - b.lift) > 0.002 || b.lift > 0.002) mexendo = true;
        if (b.el.classList.contains('respira')) { b.el.style.transform = 'translateY(' + (-b.lift * 7).toFixed(2) + 'px)'; return; }
        b.el.style.transform = b.lift > 0.002 ? 'translateY(' + (-b.lift * 7).toFixed(2) + 'px)' : '';
        b.el.style.opacity = b.lift > 0.002 ? (1 - b.lift * 0.4).toFixed(3) : '';
      });
      if (mexendo || mouse || ondas.length) requestAnimationFrame(quadro); else rodando = false;
    }
    var liga = function () { if (!rodando && ativo) { rodando = true; requestAnimationFrame(quadro); } };

    if (mouseFino) {
      hero.addEventListener('pointermove', function (e) { mouse = { x: e.clientX, y: e.clientY }; liga(); }, { passive: true });
      hero.addEventListener('pointerleave', function () { mouse = null; liga(); });
    } else {
      hero.addEventListener('pointerdown', function (e) {
        if (e.target.closest('a, button')) return;
        ondas.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
        liga();
      }, { passive: true });
    }

    // o bloco verde-limão pula de lugar de vez em quando
    var lima = blocos.filter(function (b) { return b.cor.toUpperCase() === LIMA; });
    var marca = lima[lima.length - 1];
    var candidatos = blocos.filter(function (b) { return /^#(0048F8|0040E0|1A5BFF|3D74FF)$/i.test(b.cor); });
    var pula = function () {
      if (!ativo || document.hidden || !marca || !candidatos.length) return;
      var novo = candidatos[Math.floor(Math.random() * candidatos.length)];
      var antigo = marca;
      antigo.el.animate([{ transform: 'scale(1)' }, { transform: 'scale(.4)', opacity: 0.3 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-in-out' });
      setTimeout(function () { antigo.el.setAttribute('fill', novo.cor); }, 210);
      novo.el.setAttribute('fill', LIMA);
      novo.el.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.25)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      candidatos.splice(candidatos.indexOf(novo), 1, antigo);
      antigo.cor = novo.cor; novo.cor = LIMA;
      marca = novo;
    };
    setTimeout(function laço() { pula(); setTimeout(laço, 3800 + Math.random() * 2600); }, 2600);

    naTela(hero, function (visivel) { ativo = visivel; if (!visivel) { mouse = null; ondas = []; } });
  }

  /* ---------- 7. seções: fade + subida, com escada nos cards ---------- */
  var grupos = [
    '.secao .sobretitulo', '.secao .titulo-l', '.secao .faixa > .texto, .duas-colunas .texto',
    '.atencao', '.frase-forte', '.faz-lista > li', '.cartoes-dois > .cartao', '.passo', '.resultado',
    '.cartao-grande', '.quem-linha > .cartao', '.etapa', '.faq details', '.form-caixa', '.secao .botao-principal'
  ];
  grupos.forEach(function (sel) {
    var els = document.querySelectorAll(sel);
    Array.prototype.forEach.call(els, function (el, i) {
      if (el.closest('.hero')) return;
      el.classList.add('revela');
      // escada só entre irmãos do mesmo grupo
      var irmaos = el.parentNode ? Array.prototype.filter.call(el.parentNode.children, function (c) { return c.matches(sel); }) : [];
      el.style.setProperty('--i', Math.min(irmaos.indexOf(el), 6));
      naTela(el, function (v, io) { if (v) { el.classList.add('visivel'); io && io.unobserve(el); } }, 0.12);
    });
  });

  /* ---------- 4. problema: contas chegando, atenção diminuindo ---------- */
  var atencao = document.querySelector('.atencao');
  if (atencao) {
    var quadros = Array.prototype.slice.call(atencao.querySelectorAll('.atencao-grade i:not(.sua)'));
    // ordem embaralhada, mas sempre a mesma: as contas chegam de vários lados
    quadros.map(function (q, i) { return { q: q, k: (i * 37) % 23 }; })
      .sort(function (a, b) { return a.k - b.k; })
      .forEach(function (o, i) { o.q.style.setProperty('--d', (0.35 + i * 0.1).toFixed(2) + 's'); });
    naTela(atencao, function (v, io) { if (v) { atencao.classList.add('acende'); io && io.unobserve(atencao); } }, 0.45);
  }

  /* ---------- 5. como funciona: linha desenhada pela rolagem ---------- */
  var caixaPassos = document.querySelector('.passos-caixa');
  if (caixaPassos) {
    var linha = caixaPassos.querySelector('.passos-linha');
    var passos = Array.prototype.slice.call(caixaPassos.querySelectorAll('.passo'));
    var nums = passos.map(function (p) { return p.querySelector('.passo-num'); });
    var medidas = null, pedido = false, perto = false;

    var mede = function () {
      var topoCaixa = caixaPassos.getBoundingClientRect().top + scrollY;
      var centros = nums.map(function (n) { var r = n.getBoundingClientRect(); return r.top + scrollY + r.height / 2 - topoCaixa; });
      var ini = centros[0], fim = centros[centros.length - 1];
      linha.style.top = ini + 'px';
      linha.style.bottom = (caixaPassos.offsetHeight - fim) + 'px';
      medidas = { topo: topoCaixa + ini, alt: fim - ini, centros: centros.map(function (c) { return c - ini; }) };
    };
    var atualiza = function () {
      pedido = false;
      if (!medidas) mede();
      var ancora = scrollY + innerHeight * 0.62;
      var p = Math.min(1, Math.max(0, (ancora - medidas.topo) / medidas.alt));
      linha.style.setProperty('--progresso', p.toFixed(4));
      var desenhado = p * medidas.alt;
      passos.forEach(function (passo, i) { passo.classList.toggle('aceso', medidas.centros[i] <= desenhado + 2); });
    };
    var pede = function () { if (perto && !pedido) { pedido = true; requestAnimationFrame(atualiza); } };
    addEventListener('scroll', pede, { passive: true });
    addEventListener('resize', function () { medidas = null; pede(); }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { medidas = null; pede(); });
    var io5 = naTela(caixaPassos, function (v) { perto = v; if (v) { medidas = null; pede(); } });
    if (!io5) { perto = true; pede(); }
  }

  /* ---------- 8. botões: brilho também no toque ---------- */
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    var b = e.target.closest && e.target.closest('.botao');
    if (!b) return;
    b.classList.remove('toque');
    void b.offsetWidth;
    b.classList.add('toque');
    setTimeout(function () { b.classList.remove('toque'); }, 800);
  }, { passive: true });

  /* ---------- 9. formulário: pixels comemorando o envio ---------- */
  window.V2G_comemora = function (origem) {
    if (!origem || !origem.animate) return;
    var caixa = origem.parentNode;
    var cx = origem.offsetLeft + origem.offsetWidth / 2, cy = origem.offsetTop + origem.offsetHeight / 2;
    for (var i = 0; i < 9; i++) {
      var p = document.createElement('i');
      p.className = 'confete';
      p.style.left = (cx - 4.5) + 'px';
      p.style.top = (cy - 4.5) + 'px';
      caixa.appendChild(p);
      var ang = -Math.PI / 2 + (i - 4) * 0.33, dist = 46 + Math.random() * 30;
      p.animate([
        { transform: 'translate(0,0) scale(.4) rotate(0)', opacity: 1 },
        { transform: 'translate(' + (Math.cos(ang) * dist).toFixed(1) + 'px,' + (Math.sin(ang) * dist).toFixed(1) + 'px) scale(1) rotate(' + (i * 40) + 'deg)', opacity: 0 }
      ], { duration: 900 + i * 30, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      setTimeout(function (el) { el.remove(); }.bind(null, p), 1300);
    }
  };
})();
