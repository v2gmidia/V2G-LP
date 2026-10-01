/* ============================================================
   V2G — Landing de pré-cadastro
   1) cronômetro do lançamento  2) formulário
   A validação de verdade acontece no servidor (api/pre-cadastro.js);
   esta aqui só poupa a pessoa de um envio com erro.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. cronômetro ---------- */
  // 09/11/2026 00:00 em Brasília. O Brasil não tem horário de verão desde 2019: -03:00 fixo.
  var LANCAMENTO = Date.parse('2026-11-09T00:00:00-03:00');
  var crono = document.getElementById('cronometro');

  if (crono) {
    var campos = {};
    crono.querySelectorAll('[data-unidade]').forEach(function (el) {
      campos[el.getAttribute('data-unidade')] = el;
    });
    var dois = function (n) { return n < 10 ? '0' + n : String(n); };
    var timer;
    var anima = document.documentElement.classList.contains('mov');

    // escreve dígito a dígito; com movimento, só o dígito que mudou vira
    var escreve = function (el, txt) {
      var antes = el.getAttribute('data-v') || '';
      if (antes === txt) return;
      el.setAttribute('data-v', txt);
      if (!anima || antes.length !== txt.length) {
        el.innerHTML = txt.split('').map(function (d) { return '<i class="dig"><b>' + d + '</b></i>'; }).join('');
        return;
      }
      for (var i = 0; i < txt.length; i++) {
        if (antes[i] === txt[i]) continue;
        var cel = el.children[i];
        while (cel.children.length > 1) cel.removeChild(cel.firstChild);
        var velho = cel.firstChild, novo = document.createElement('b');
        novo.textContent = txt[i];
        novo.className = 'entra';
        velho.className = 'sai';
        cel.appendChild(novo);
        setTimeout(function (v) { if (v.parentNode) v.parentNode.removeChild(v); }.bind(null, velho), 420);
      }
    };

    var chegou = function () {
      clearInterval(timer);
      crono.querySelector('.cronometro-relogio').remove();
      crono.querySelector('.cronometro-data').remove();
      var p = document.createElement('p');
      p.className = 'cronometro-chegou';
      p.textContent = 'O app V2G chegou.';
      crono.appendChild(p);
    };

    var atualiza = function () {
      var falta = LANCAMENTO - Date.now();
      if (falta <= 0) { chegou(); return; }
      var s = Math.floor(falta / 1000);
      escreve(campos.dias, String(Math.floor(s / 86400)));
      escreve(campos.horas, dois(Math.floor(s % 86400 / 3600)));
      escreve(campos.minutos, dois(Math.floor(s % 3600 / 60)));
      escreve(campos.segundos, dois(s % 60));
    };

    atualiza();
    if (Date.now() < LANCAMENTO) timer = setInterval(atualiza, 1000);
  }

  var ano = document.getElementById('ano');
  if (ano) ano.textContent = String(new Date().getFullYear());

  /* ---------- 2. formulário ---------- */
  var form = document.getElementById('form-pre-cadastro');
  if (!form) return;

  var $ = function (nome) { return form.elements[nome]; };
  var valorRadio = function (nome) {
    var marcado = form.querySelector('input[name="' + nome + '"]:checked');
    return marcado ? marcado.value : '';
  };

  // UTMs e página de origem
  var params = new URLSearchParams(location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) {
    var v = params.get(k);
    if (v) $(k).value = v.slice(0, 200);
  });
  $('pagina_origem').value = (location.origin + location.pathname).slice(0, 300);

  // máscara de WhatsApp: (11) 91234-5678
  var whats = $('whatsapp');
  whats.addEventListener('input', function () {
    var d = whats.value.replace(/\D/g, '');
    if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2); // colou com +55
    d = d.slice(0, 11);
    var v = d;
    if (d.length > 2) v = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 6) {
      var corte = d.length === 11 ? 7 : 6;
      v = '(' + d.slice(0, 2) + ') ' + d.slice(2, corte) + '-' + d.slice(corte);
    }
    whats.value = v;
  });

  // campos condicionais
  var campoOutro = document.getElementById('campo-nicho-outro');
  var campoFaixa = document.getElementById('campo-faixa');
  // sem JS os dois aparecem sempre; com JS, só quando fazem sentido
  campoOutro.hidden = $('nicho').value !== 'outro';
  campoFaixa.hidden = !form.querySelector('input[name="investe_anuncios"][value="sim"]:checked');
  $('nicho').addEventListener('change', function () {
    var outro = this.value === 'outro';
    campoOutro.hidden = !outro;
    $('nicho_outro').required = outro;
    if (!outro) { $('nicho_outro').value = ''; limpa('nicho_outro'); }
  });
  form.querySelectorAll('input[name="investe_anuncios"]').forEach(function (r) {
    r.addEventListener('change', function () {
      var sim = valorRadio('investe_anuncios') === 'sim';
      campoFaixa.hidden = !sim;
      $('faixa_investimento').required = sim;
      if (!sim) { $('faixa_investimento').value = ''; limpa('faixa_investimento'); }
    });
  });

  // @ do Instagram: aceita "@loja", "instagram.com/loja" ou "loja"
  var limpaInsta = function (v) {
    return v.trim()
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
      .replace(/^(www\.)?instagram\.com\//i, '')
      .replace(/^@/, '')
      .replace(/[/?#].*$/, '')
      .toLowerCase();
  };

  var regras = {
    nome: function (v) { return v.trim().length >= 2 ? '' : 'Escreva seu nome.'; },
    whatsapp: function (v) {
      var d = v.replace(/\D/g, '');
      if (d.length < 10 || d.length > 11 || d[0] === '0') return 'Coloque o WhatsApp com DDD, só números.';
      if (d.length === 11 && d[2] !== '9') return 'Confira o número: celular com 11 dígitos começa com 9 depois do DDD.';
      return '';
    },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Confira o e-mail.'; },
    negocio: function (v) { return v.trim().length >= 2 ? '' : 'Escreva o nome do negócio.'; },
    nicho: function (v) { return v ? '' : 'Escolha o ramo do negócio.'; },
    nicho_outro: function (v) { return $('nicho').value !== 'outro' || v.trim().length >= 2 ? '' : 'Conte qual é o ramo.'; },
    instagram: function (v) { return /^[a-z0-9._]{1,30}$/.test(limpaInsta(v)) ? '' : 'Coloque o @ do Instagram do negócio.'; },
    perfil: function () { return valorRadio('perfil') ? '' : 'Escolha uma opção.'; },
    vende_whatsapp: function () { return valorRadio('vende_whatsapp') ? '' : 'Escolha sim ou não.'; },
    investe_anuncios: function () { return valorRadio('investe_anuncios') ? '' : 'Escolha sim ou não.'; },
    faixa_investimento: function (v) { return valorRadio('investe_anuncios') !== 'sim' || v ? '' : 'Escolha uma faixa.'; },
    site: function (v) { v = v.trim(); return !v || /^(https?:\/\/)?[^\s./]+(\.[^\s./]+)+(\/\S*)?$/i.test(v) ? '' : 'Confira o endereço do site, ou deixe em branco.'; },
    consentimento: function () { return $('consentimento').checked ? '' : 'Para enviar, é preciso autorizar o contato.'; }
  };

  var campoDe = function (nome) {
    var el = document.getElementById('e-' + nome);
    return el ? el.closest('.campo') : null;
  };
  var limpa = function (nome) {
    var e = document.getElementById('e-' + nome);
    if (e) e.textContent = '';
    var c = campoDe(nome);
    if (c) c.classList.remove('invalido');
  };
  var marca = function (nome, msg) {
    var e = document.getElementById('e-' + nome);
    if (e) e.textContent = msg;
    var c = campoDe(nome);
    if (c) c.classList.toggle('invalido', !!msg);
    var el = $(nome);
    var alvo = el && el.length && !el.tagName ? el[0] : el;
    if (alvo && alvo.setAttribute) {
      if (msg) { alvo.setAttribute('aria-invalid', 'true'); alvo.setAttribute('aria-describedby', 'e-' + nome); }
      else { alvo.removeAttribute('aria-invalid'); }
    }
  };
  var valida = function (nome) {
    var el = $(nome);
    var v = el && typeof el.value === 'string' ? el.value : '';
    var msg = regras[nome](v);
    marca(nome, msg);
    return msg;
  };

  // revalida ao sair do campo (só depois do primeiro erro, para não brigar com quem está digitando)
  Object.keys(regras).forEach(function (nome) {
    var el = $(nome);
    if (!el) return;
    var lista = el.length && !el.tagName ? Array.prototype.slice.call(el) : [el];
    lista.forEach(function (x) {
      x.addEventListener(x.type === 'radio' || x.type === 'checkbox' || x.tagName === 'SELECT' ? 'change' : 'blur', function () {
        if (campoDe(nome) && campoDe(nome).classList.contains('invalido')) valida(nome);
      });
    });
  });

  var erroGeral = document.getElementById('e-geral');
  var botao = form.querySelector('button[type=submit]');
  var textoBotao = botao.textContent;

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    erroGeral.textContent = '';

    var primeiro = null;
    Object.keys(regras).forEach(function (nome) {
      if (valida(nome) && !primeiro) primeiro = nome;
    });
    if (primeiro) {
      var el = $(primeiro);
      (el.length && !el.tagName ? el[0] : el).focus();
      return;
    }

    var dados = {
      nome: $('nome').value.trim(),
      whatsapp: $('whatsapp').value.replace(/\D/g, ''),
      email: $('email').value.trim().toLowerCase(),
      negocio: $('negocio').value.trim(),
      nicho: $('nicho').value,
      nicho_outro: $('nicho_outro').value.trim(),
      instagram: limpaInsta($('instagram').value),
      perfil: valorRadio('perfil'),
      vende_whatsapp: valorRadio('vende_whatsapp'),
      investe_anuncios: valorRadio('investe_anuncios'),
      faixa_investimento: $('faixa_investimento').value,
      site: $('site').value.trim(),
      consentimento: $('consentimento').checked ? 'sim' : '',
      empresa_url: $('empresa_url').value,
      utm_source: $('utm_source').value,
      utm_medium: $('utm_medium').value,
      utm_campaign: $('utm_campaign').value,
      utm_content: $('utm_content').value,
      pagina_origem: $('pagina_origem').value
    };

    botao.disabled = true;
    botao.textContent = 'Enviando…';

    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(dados)
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (res) {
        if (res.status === 200 && res.j.ok) {
          var ok = document.getElementById('form-enviado');
          var troca = function () { form.hidden = true; ok.hidden = false; ok.focus(); };
          if (!document.documentElement.classList.contains('mov') || !form.animate) { troca(); return; }
          form.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }],
            { duration: 240, easing: 'ease-in', fill: 'forwards' });
          // a troca vai por timer, não pelo fim da animação: acontece mesmo se a aba não estiver desenhando
          setTimeout(function () {
            troca();
            ok.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
              { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
            if (window.V2G_comemora) window.V2G_comemora(ok.querySelector('.quadrado'));
          }, 250);
          return;
        }
        if (res.j.campos) {
          Object.keys(res.j.campos).forEach(function (nome) { marca(nome, res.j.campos[nome]); });
        }
        erroGeral.textContent = res.j.erro || 'Não conseguimos enviar agora. Tente de novo em alguns minutos.';
        erroGeral.scrollIntoView({ block: 'center' });
      })
      .catch(function () {
        erroGeral.textContent = 'Sem conexão. Confira a internet e tente de novo.';
      })
      .then(function () {
        botao.disabled = false;
        botao.textContent = textoBotao;
      });
  });
})();
