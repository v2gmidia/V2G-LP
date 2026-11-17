/* ============================================================
   V2G — Contato para contratação assistida
   Formulário com contrato de pré-cadastro preservado
   A validação de verdade acontece no servidor (api/pre-cadastro.js);
   esta aqui só poupa a pessoa de um envio com erro.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- interações (não são movimento: valem também com "reduzir movimento") ---------- */

  // "Uma pessoa. Muitas contas.": mouse ou toque num quadrado acende e diz qual conta é
  var grade = document.querySelector('.atencao-grade');
  var viva = document.querySelector('.atencao-viva');
  if (grade && viva) {
    var quadros = Array.prototype.slice.call(grade.children);
    var textoInicial = viva.textContent;
    var atual = null;
    var mostra = function (q) {
      if (atual === q) return;
      if (atual) atual.classList.remove('foco');
      atual = q;
      if (!q) { viva.textContent = textoInicial; return; }
      q.classList.add('foco');
      viva.textContent = q.classList.contains('sua') ? 'Essa é a sua' : 'Conta ' + (quadros.indexOf(q) + 1) + ' de ' + quadros.length;
    };
    var deEvento = function (e) {
      var el = document.elementFromPoint(e.clientX, e.clientY);
      return el && el.parentNode === grade ? el : null;
    };
    grade.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') mostra(deEvento(e)); });
    grade.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') mostra(null); });
    grade.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') mostra(deEvento(e)); });
    // arrastar o dedo pela grade vai trocando a conta
    grade.addEventListener('touchmove', function (e) {
      var t = e.touches[0]; if (!t) return;
      var el = document.elementFromPoint(t.clientX, t.clientY);
      if (el && el.parentNode === grade) mostra(el);
    }, { passive: true });
  }

  // barra fixa do celular: some quando o formulário está na tela.
  // botão do WhatsApp: some quando o formulário OU o rodapé estão na tela.
  var barra = document.getElementById('barra-fixa');
  var botaoWhats = document.querySelector('.whats-flutua'); // nome próprio: "whats" já é o campo do formulário
  var secaoForm = document.getElementById('pre-cadastro');
  var rodape = document.querySelector('.rodape');
  if ('IntersectionObserver' in window && secaoForm) {
    var visiveis = {};
    var aplica = function () {
      if (barra) barra.classList.toggle('escondida', !!visiveis.form);
      if (botaoWhats) botaoWhats.classList.toggle('escondido', !!(visiveis.form || visiveis.rodape));
    };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { visiveis[e.target === secaoForm ? 'form' : 'rodape'] = e.isIntersecting; });
      aplica();
    }, { threshold: 0.02 });
    io.observe(secaoForm);
    if (rodape) io.observe(rodape);
  }

  var ano = document.getElementById('ano');
  if (ano) ano.textContent = String(new Date().getFullYear());

  /* ---------- 2. formulário ---------- */
  var form = document.getElementById('form-pre-cadastro');
  if (!form) return;
  var botao = form.querySelector('button[type=submit]');
  var textoBotao = botao.textContent;
  var enviando = false;
  var qaComercial = document.body.getAttribute('data-comercial-qa') === 'true';
  var documentoFlexivel = false;

  var $ = function (nome) { return form.elements[nome]; };
  if (qaComercial && $('solicitacao_id') && !$('solicitacao_id').value &&
      window.crypto && window.crypto.randomUUID) $('solicitacao_id').value = window.crypto.randomUUID();
  var valorRadio = function (nome) {
    var marcado = form.querySelector('input[name="' + nome + '"]:checked');
    return marcado ? marcado.value : '';
  };

  // O legado grava um único negócio e não tem colunas para vários anunciantes.
  // Agência pode preparar seus dados na prévia, mas não deve enviar um briefing
  // inventado só para satisfazer a RPC antiga.
  var camposDireto = document.getElementById('campos-direto');
  var camposAgencia = document.getElementById('campos-agencia');
  var atualizarPerfil = function () {
    if (!camposDireto || !camposAgencia) return;
    var agencia = valorRadio('perfil') === 'agencia';
    camposDireto.hidden = agencia;
    camposAgencia.hidden = !agencia;
    botao.disabled = (agencia && !qaComercial) || enviando;
    var pendente = document.getElementById('agencia-envio-pendente');
    if (pendente && qaComercial) pendente.hidden = true;
  };
  form.querySelectorAll('input[name="perfil"]').forEach(function (radio) {
    radio.addEventListener('change', atualizarPerfil);
  });
  atualizarPerfil();
  if (!qaComercial) {
    fetch('/api/comercial-config', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (config) {
        if (!config || config.enabled !== true) return;
        var perfilComercial = document.getElementById('perfil-comercial');
        if (perfilComercial) perfilComercial.hidden = false;
        documentoFlexivel = config.environment === 'production';
        if (documentoFlexivel) {
          var documentLabel=document.querySelector('label[for="f-cnpj"]');
          if(documentLabel)documentLabel.textContent='CPF ou CNPJ do contratante';
          if($('cnpj'))$('cnpj').placeholder='CPF ou CNPJ';
          var comprar=document.getElementById('comprar-online');
          if(comprar&&config.checkoutEnabled===true&&config.checkoutUrl==='https://app.v2gmidia.com.br/contratar'){
            var pricingPurchase=document.getElementById('pricing-purchase');
            if(pricingPurchase)pricingPurchase.hidden=false;
            comprar.disabled=false;
            comprar.addEventListener('click',function(){window.location.assign('https://app.v2gmidia.com.br/contratar');});
            var checkoutNote=document.getElementById('checkout-note');
            if(checkoutNote)checkoutNote.textContent='Contrate para seu negócio ou para sua agência.';
          }
        }
        qaComercial = true;
        document.body.setAttribute('data-comercial-qa', 'true');
        form.action = '/api/comercial-interesse';
        if ($('solicitacao_id') && !$('solicitacao_id').value && window.crypto && window.crypto.randomUUID)
          $('solicitacao_id').value = window.crypto.randomUUID();
        atualizarPerfil();
      }).catch(function () { /* Fluxo legado permanece. */ });
  }

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

  // A LP confere os dígitos. Situação cadastral ativa exige consulta própria
  // e só é confirmada pela equipe antes de abrir a compra.
  var cnpj = $('cnpj');
  var cnpjLimpo = function (valor) { return String(valor || '').replace(/\D/g, '').slice(0, 14); };
  var cnpjComDigitosValidos = function (valor) {
    var d = cnpjLimpo(valor);
    if (!/^\d{14}$/.test(d) || /^(\d)\1{13}$/.test(d)) return false;
    var numeros = d.split('').map(Number);
    [[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]].forEach(function (pesos, indice) {
      var soma = pesos.reduce(function (total, peso, posicao) { return total + numeros[posicao] * peso; }, 0);
      var resto = soma % 11;
      if (numeros[12 + indice] !== (resto < 2 ? 0 : 11 - resto)) d = '';
    });
    return d.length === 14;
  };
  if (cnpj) cnpj.addEventListener('input', function () {
    var d = cnpjLimpo(cnpj.value);
    if(documentoFlexivel&&d.length<=11){cnpj.value=d;return;}
    var v = d;
    if (d.length > 2) v = d.slice(0, 2) + '.' + d.slice(2);
    if (d.length > 5) v = v.slice(0, 6) + '.' + d.slice(5);
    if (d.length > 8) v = v.slice(0, 10) + '/' + d.slice(8);
    if (d.length > 12) v = v.slice(0, 15) + '-' + d.slice(12);
    cnpj.value = v;
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
      if (d.length < 10 || d.length > 11 || d[0] === '0') return 'Confira o WhatsApp: DDD + número, como (11) 91234-5678.';
      if (d.length === 11 && d[2] !== '9') return 'Confira o número: celular com 11 dígitos começa com 9 depois do DDD.';
      return '';
    },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Confira o e-mail.'; },
    negocio: function (v) { return v.trim().length >= 2 ? '' : 'Escreva o nome do negócio.'; },
    cnpj: function (v) {
      var d=cnpjLimpo(v),cpfOk=false;
      if(documentoFlexivel&&/^\d{11}$/.test(d)&&!(/^(\d)\1{10}$/).test(d)){
        cpfOk=true;[9,10].forEach(function(n){var sum=0;for(var i=0;i<n;i++)sum+=Number(d[i])*(n+1-i);var digit=(sum*10)%11;if(Number(d[n])!==(digit===10?0:digit))cpfOk=false;});
      }
      return cnpjComDigitosValidos(v)||cpfOk?'':documentoFlexivel?'Confira o CPF ou CNPJ do contratante.':'Confira o CNPJ da empresa.';
    },
    nicho: function (v) { return v ? '' : 'Escolha o ramo do negócio.'; },
    nicho_outro: function (v) { return $('nicho').value !== 'outro' || v.trim().length >= 2 ? '' : 'Conte qual é o ramo.'; },
    instagram: function (v) { return /^[a-z0-9._]{1,30}$/.test(limpaInsta(v)) ? '' : 'Coloque o @ do Instagram do negócio.'; },
    perfil: function () { return valorRadio('perfil') ? '' : 'Escolha uma opção.'; },
    quantidade_anunciantes: function (v) {
      if (valorRadio('perfil') !== 'agencia') return '';
      var n = Number(v);
      return Number.isInteger(n) && n >= 1 && n <= 100 ? '' : 'Informe de 1 a 100 anunciantes.';
    },
    nomes_anunciantes: function (v) {
      if (valorRadio('perfil') !== 'agencia') return '';
      var n = Number($('quantidade_anunciantes').value);
      var nomes = v.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
      return nomes.length === n && nomes.every(function (s) { return s.length >= 2 && s.length <= 120; })
        ? '' : 'Escreva um nome por linha para cada anunciante.';
    },
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

  // valida ao sair do campo (blur) e ao escolher (change).
  // Campo de texto que a pessoa nem começou a preencher não ganha erro só por receber foco.
  Object.keys(regras).forEach(function (nome) {
    var el = $(nome);
    if (!el) return;
    var lista = el.length && !el.tagName ? Array.prototype.slice.call(el) : [el];
    lista.forEach(function (x) {
      var escolha = x.type === 'radio' || x.type === 'checkbox' || x.tagName === 'SELECT';
      var mexeu = false;
      if (!escolha) x.addEventListener('input', function () {
        mexeu = true;
        if (campoDe(nome) && campoDe(nome).classList.contains('invalido')) valida(nome); // some o erro assim que corrige
      });
      x.addEventListener(escolha ? 'change' : 'blur', function () {
        if (escolha || mexeu || x.value !== '' || (campoDe(nome) && campoDe(nome).classList.contains('invalido'))) valida(nome);
      });
    });
  });

  var erroGeral = document.getElementById('e-geral');
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (botao.disabled) return;
    erroGeral.textContent = '';

    var primeiro = null;
    Object.keys(regras).filter(function (nome) {
      return valorRadio('perfil') !== 'agencia' ||
        ['nome', 'whatsapp', 'email', 'negocio', 'cnpj', 'perfil', 'quantidade_anunciantes', 'nomes_anunciantes', 'consentimento'].indexOf(nome) !== -1;
    }).forEach(function (nome) {
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
      cnpj: cnpjLimpo($('cnpj').value),
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
    if (qaComercial) dados.solicitacao_id = $('solicitacao_id').value;
    if (valorRadio('perfil') === 'agencia') {
      ['nicho', 'nicho_outro', 'instagram', 'vende_whatsapp', 'investe_anuncios',
        'faixa_investimento', 'site'].forEach(function (key) { delete dados[key]; });
      dados.quantidade_anunciantes = $('quantidade_anunciantes').value;
      dados.nomes_anunciantes = $('nomes_anunciantes').value;
    }

    enviando = true;
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
          if (res.j.retomar) {
            var destino = new URL(res.j.retomar.url);
            var allowed=!documentoFlexivel&&destino.href==='https://v2g-webapp-qa.vercel.app/api/comercial/retomar'
              ||documentoFlexivel&&destino.href==='https://app.v2gmidia.com.br/api/comercial/retomar'
              ||!documentoFlexivel&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&destino.href==='http://localhost:3000/api/comercial/retomar';
            if (!allowed || destino.search || destino.hash) throw new Error('Destino de retomada inválido');
            var f = document.createElement('form');
            f.method = 'post'; f.action = destino.href; f.style.display = 'none';
            ['reference', 'resumeToken'].forEach(function (key) {
              var i = document.createElement('input'); i.type = 'hidden'; i.name = key;
              i.value = res.j.retomar[key]; f.appendChild(i);
            });
            document.body.appendChild(f); f.submit(); return;
          }
          var ok = document.getElementById('form-enviado');
          if (res.j.simulado) {
            document.getElementById('enviado-titulo').textContent = 'Prévia local';
            document.getElementById('enviado-mensagem').textContent = 'Nenhum contato foi salvo. Esta prévia mostra o caminho que a pessoa verá após o envio.';
            var ajuda = ok.querySelector('.enviado-ajuda');
            if (ajuda) ajuda.hidden = true;
          }
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
        enviando = false;
        atualizarPerfil();
        botao.textContent = textoBotao;
      });
  });
})();
