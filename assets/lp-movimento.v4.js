/* ============================================================
   V2G — movimento da landing · v4
   Só roda com html.mov (JS ligado + sem "reduzir movimento").
   Anima só transform e opacity. Sem bibliotecas.
   ============================================================ */
(function () {
  'use strict';
  var raiz = document.documentElement;
  if (!raiz.classList.contains('mov')) return;
  window.V2G_MOV_OK = true;

  // se a pessoa ligar "reduzir movimento" com a página aberta, para tudo
  var pedeReduzir = matchMedia('(prefers-reduced-motion: reduce)');
  var paraTudo = function () { if (pedeReduzir.matches) raiz.classList.remove('mov'); };
  if (pedeReduzir.addEventListener) pedeReduzir.addEventListener('change', paraTudo);
  else if (pedeReduzir.addListener) pedeReduzir.addListener(paraTudo);
  var semMov = function () { return !raiz.classList.contains('mov'); };

  var mouseFino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var naTela = function (el, cb, limiar) {
    if (!('IntersectionObserver' in window)) { cb(true, null); return null; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting, io); }); },
      { threshold: limiar || 0, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return io;
  };
  var umaVez = function (el, classe, limiar) {
    naTela(el, function (v, io) { if (v) { el.classList.add(classe); if (io) io.unobserve(el); } }, limiar);
  };
  // troca um <img>/<svg><use> por uma cópia inline do SVG, para animar peça por peça
  var inline = function (url, alvo, classe, pronto) {
    if (!window.fetch) return;
    fetch(url).then(function (r) { return r.text(); }).then(function (txt) {
      var svg = new DOMParser().parseFromString(txt, 'image/svg+xml').documentElement;
      if (!svg || svg.nodeName !== 'svg') throw 0;
      svg = document.importNode(svg, true);
      svg.removeAttribute('role'); svg.removeAttribute('aria-label');
      svg.setAttribute('class', classe);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      alvo.replaceWith(svg);
      pronto(svg);
    }).catch(function () { if (alvo.style) alvo.style.opacity = 1; });
  };

  /* ---------- título do hero: palavra por palavra ---------- */
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
    h1.style.setProperty('--atraso-ponto', (n * 70 + 320) + 'ms');
    h1.classList.add('partido');
  }

  /* ---------- textura do hero: grade de pontos ---------- */
  var img = document.querySelector('img.textura');
  var hero = document.querySelector('.hero');
  if (img && hero) inline(img.src, img, 'textura', montaTextura);

  function montaTextura(svg) {
    var VB = svg.viewBox.baseVal;
    var pontos = Array.prototype.map.call(svg.querySelectorAll('circle'), function (c) {
      return { el: c, cx: +c.getAttribute('cx'), cy: +c.getAttribute('cy'), base: +c.getAttribute('opacity'), lift: 0 };
    });

    // montagem: os pontos aparecem do canto forte para o fraco (< 1,2 s)
    pontos.forEach(function (p) {
      var d = (VB.width - p.cx) / VB.width + (VB.height - p.cy) / VB.height;
      p.el.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: p.base }],
        { duration: 380, delay: Math.round(d * 380), easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' });
    });

    // campo que reage ao mouse (desktop) e onda no toque (celular)
    var mouse = null, ondas = [], rodando = false, ativo = true;
    function quadro(t) {
      var bb = svg.getBoundingClientRect(), esc = bb.width / VB.width, mexendo = false;
      ondas = ondas.filter(function (o) { return t - o.t0 < 1500; });
      pontos.forEach(function (p) {
        var px = bb.left + p.cx * esc, py = bb.top + p.cy * esc, alvo = 0;
        if (mouse) alvo = Math.max(0, 1 - Math.hypot(px - mouse.x, py - mouse.y) / 140);
        ondas.forEach(function (o) {
          var raio = (t - o.t0) * 0.6, d = Math.hypot(px - o.x, py - o.y);
          var v = Math.max(0, 1 - Math.abs(d - raio) / 50) * (1 - (t - o.t0) / 1500);
          if (v > alvo) alvo = v;
        });
        p.lift += (alvo - p.lift) * 0.16;
        if (Math.abs(alvo - p.lift) > 0.002 || p.lift > 0.002) mexendo = true;
        if (p.lift > 0.002) {
          p.el.style.transform = 'scale(' + (1 + p.lift * 1.3).toFixed(3) + ')';
          p.el.style.opacity = (p.base + (1 - p.base) * p.lift).toFixed(3);
        } else if (p.el.style.transform) {
          p.el.style.transform = ''; p.el.style.opacity = '';
        }
      });
      if (!semMov() && (mexendo || mouse || ondas.length)) requestAnimationFrame(quadro); else rodando = false;
    }
    var liga = function () { if (!rodando && ativo && !semMov()) { rodando = true; requestAnimationFrame(quadro); } };

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
    naTela(hero, function (visivel) { ativo = visivel; if (!visivel) { mouse = null; ondas = []; } });
  }

  /* ---------- seções: fade + subida, com escada nos cards ---------- */
  var grupos = [
    '.secao .sobretitulo', '.secao .titulo-l', '.duas-colunas .texto', '.atencao', '.frase-forte',
    '.faz-lista > li', '.cartoes-dois > .cartao', '.passo', '.resultado', '.quem-grade > .cartao',
    '.etapa', '.faq details', '.form-caixa', '.cta-fim'
  ];
  // Conteúdo visível por padrão: só esconde o que está bem abaixo da tela na carga,
  // e revela com folga (35% da altura da tela antes de entrar). Rolar rápido não deixa buraco.
  var revelador = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visivel'); revelador.unobserve(e.target); } });
  }, { rootMargin: '0px 0px 35% 0px', threshold: 0 }) : null;
  grupos.forEach(function (sel) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
      if (!revelador || el.closest('.hero') || el.closest('.form-cabeca')) return;
      if (el.getBoundingClientRect().top < innerHeight * 1.35) return; // já perto da tela: fica como está
      el.classList.add('revela');
      var irmaos = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.matches(sel); });
      el.style.setProperty('--i', Math.min(irmaos.indexOf(el), 4));
      revelador.observe(el);
    });
  });

  /* ---------- problema: contas chegando, atenção diminuindo ---------- */
  var atencao = document.querySelector('.atencao');
  if (atencao) {
    var quadros = Array.prototype.slice.call(atencao.querySelectorAll('.atencao-grade i:not(.sua)'));
    quadros.map(function (q, i) { return { q: q, k: (i * 37) % 23 }; })
      .sort(function (a, b) { return a.k - b.k; })
      .forEach(function (o, i) { o.q.style.setProperty('--d', (0.35 + i * 0.09).toFixed(2) + 's'); });
    naTela(atencao, function (v, io) {
      if (!v) return;
      atencao.classList.add('acende');
      if (io) io.unobserve(atencao);
      // depois que todas chegaram, o hover/toque responde sem atraso
      setTimeout(function () { atencao.classList.add('pronta'); }, 2900);
    }, 0.45);
  }

  /* ---------- para quem é: checks se desenham; "não é" risca em sequência ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.marcados, .riscados'), function (lista) { umaVez(lista, 'visto', 0.5); });

  /* ---------- linhas desenhadas pela rolagem (como funciona, onde estamos) ---------- */
  function linhaDeRolagem(caixa, linha, marcos, classeMarco, horizontalQuando) {
    var medidas = null, pedido = false, perto = false;
    var horizontal = function () { return !!(horizontalQuando && horizontalQuando.matches); };
    // posição pelo layout (offsets), não pela tela: ignora o deslize de entrada dos cards
    var pos = function (el) { var x = 0, y = 0; while (el && el !== caixa) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x: x, y: y }; };
    var mede = function () {
      var h = horizontal();
      caixa.classList.toggle('horizontal', h);
      var cr = caixa.getBoundingClientRect();
      var centros = marcos.map(function (m) {
        var p = pos(m);
        return h ? p.x + m.offsetWidth / 2 : p.y + m.offsetHeight / 2;
      });
      var ini = centros[0], fim = centros[centros.length - 1];
      if (h) {
        // na horizontal, a linha passa pelo centro vertical dos marcadores
        linha.style.top = (pos(marcos[0]).y + marcos[0].offsetHeight / 2 - linha.offsetHeight / 2) + 'px'; linha.style.bottom = '';
        linha.style.left = ini + 'px'; linha.style.right = (caixa.offsetWidth - fim) + 'px';
      } else {
        linha.style.left = ''; linha.style.right = '';
        linha.style.top = ini + 'px'; linha.style.bottom = (caixa.offsetHeight - fim) + 'px';
      }
      medidas = { h: h, topo: cr.top + scrollY, ini: ini, alt: Math.max(1, fim - ini), centros: centros.map(function (c) { return c - ini; }) };
    };
    var atualiza = function () {
      pedido = false;
      if (!medidas) mede();
      var p;
      if (medidas.h) {
        // na horizontal a linha anda conforme a seção sobe na tela
        var r = caixa.getBoundingClientRect();
        p = (innerHeight * 0.85 - r.top) / (innerHeight * 0.55);
      } else {
        p = (scrollY + innerHeight * 0.62 - (medidas.topo + medidas.ini)) / medidas.alt;
      }
      p = Math.min(1, Math.max(0, p));
      linha.style.setProperty('--progresso', p.toFixed(4));
      var feito = p * medidas.alt;
      marcos.forEach(function (m, i) {
        var item = m.closest('li');
        if (item) item.classList.toggle(classeMarco, medidas.centros[i] <= feito + 2);
      });
    };
    var pede = function () { if (perto && !pedido) { pedido = true; requestAnimationFrame(atualiza); } };
    addEventListener('scroll', pede, { passive: true });
    addEventListener('resize', function () { medidas = null; pede(); }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { medidas = null; pede(); });
    var io = naTela(caixa, function (v) { perto = v; if (v) { medidas = null; pede(); } });
    if (!io) { perto = true; pede(); }
  }
  var passosCaixa = document.querySelector('.passos-caixa');
  if (passosCaixa) {
    linhaDeRolagem(passosCaixa, passosCaixa.querySelector('.passos-linha'),
      Array.prototype.slice.call(passosCaixa.querySelectorAll('.passo-num')), 'aceso', null);
  }
  var trilha = document.querySelector('.trilha');
  if (trilha) {
    linhaDeRolagem(trilha, trilha.querySelector('.trilha-linha'),
      Array.prototype.slice.call(trilha.querySelectorAll('.etapa-ponto')), 'alcancada', matchMedia('(min-width: 960px)'));
  }

  /* ---------- formulário: pixels da marca ao lado do título ---------- */
  var pix = document.querySelector('.form-pixels svg');
  if (pix) {
    inline('/assets/marca/simbolo.svg', pix, 'form-pixels-svg', function (svg) {
      // ordem que percorre o símbolo como um "carregando"
      var ordem = [0, 2, 6, 7, 5, 1, 3, 4];
      Array.prototype.forEach.call(svg.querySelectorAll('rect'), function (r, i) { r.style.setProperty('--k', ordem.indexOf(i)); });
    });
  }

  /* ---------- botões: brilho também no toque ---------- */
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    var b = e.target.closest && e.target.closest('.botao');
    if (!b) return;
    b.classList.remove('toque');
    void b.offsetWidth;
    b.classList.add('toque');
    setTimeout(function () { b.classList.remove('toque'); }, 800);
  }, { passive: true });

  /* ---------- formulário: pixels comemorando o envio ---------- */
  window.V2G_comemora = function (origem) {
    if (!origem || !origem.animate || semMov()) return;
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
