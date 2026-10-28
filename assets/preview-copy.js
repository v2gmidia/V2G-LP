(() => {
  document.querySelectorAll('[data-app-link="login"]').forEach((link) => {
    link.href = 'https://v2g-deploy-webapp.vercel.app/entrar?modo=login';
  });

  const pain = document.querySelector('[data-pain-clock]');
  if (pain) {
    const clock = pain.querySelector('[data-pain-time]');
    const balance = pain.querySelector('[data-pain-budget]');
    const status = pain.querySelector('[data-pain-status]');
    const rail = pain.querySelector('.pain-budget-rail i');
    const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const duration = 8600;
    const draw = (elapsed) => {
      const seconds = Math.round(31620 * Math.min(1, elapsed / duration));
      const spendProgress = Math.min(1, Math.max(0, (elapsed - 400) / 6400));
      const spent = Math.min(1000, Math.floor(spendProgress * 50) * 20);
      const pad = (value) => String(value).padStart(2, '0');
      clock.textContent = `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds % 3600 / 60))}:${pad(seconds % 60)}`;
      balance.textContent = money.format(1000 - spent);
      rail.style.transform = `scaleX(${(1000 - spent) / 1000})`;
      if (spent === 1000) {
        pain.classList.add('is-exhausted');
        status.textContent = 'A verba zerou. O ajuste ainda espera.';
      }
    };
    const start = () => {
      pain.classList.add('is-playing');
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(duration); return; }
      const started = performance.now();
      const tick = (now) => {
        const elapsed = Math.min(duration, now - started);
        draw(elapsed);
        if (elapsed < duration) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          start();
          observer.disconnect();
        }
      }, { threshold: 0.35 });
      observer.observe(pain);
    } else start();
  }

  const bar = document.getElementById('barra-fixa');
  const whats = document.querySelector('.whats-flutua');
  const registration = document.getElementById('pre-cadastro');
  const footer = document.querySelector('.rodape');
  if ('IntersectionObserver' in window && registration) {
    const visible = { form: false, footer: false };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { visible[entry.target === registration ? 'form' : 'footer'] = entry.isIntersecting; });
      bar?.classList.toggle('escondida', visible.form);
      whats?.classList.toggle('escondido', visible.form || visible.footer);
    }, { threshold: 0.02 });
    observer.observe(registration);
    if (footer) observer.observe(footer);
  }
  const year = document.getElementById('ano');
  if (year) year.textContent = String(new Date().getFullYear());

  // A prévia valida localmente e jamais envia dados ou abre uma compra.
  const form = document.getElementById('form-pre-cadastro');
  if (form && form.getAttribute('action') === '/preview-nao-envia') {
    const field = (name) => form.elements.namedItem(name);
    const chosen = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';
    const digits = (value) => String(value || '').replace(/\D/g, '');
    const cpfValid = (value) => {
      const d = digits(value);
      if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
      for (let size = 9; size <= 10; size++) {
        let sum = 0;
        for (let i = 0; i < size; i++) sum += Number(d[i]) * (size + 1 - i);
        if (Number(d[size]) !== ((sum * 10) % 11) % 10) return false;
      }
      return true;
    };
    const cnpjValid = (value) => {
      const d = digits(value);
      if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
      for (const weights of [[5,4,3,2,9,8,7,6,5,4,3,2],[6,5,4,3,2,9,8,7,6,5,4,3,2]]) {
        const index = weights.length;
        const sum = weights.reduce((total, weight, i) => total + Number(d[i]) * weight, 0);
        const mod = sum % 11;
        if (Number(d[index]) !== (mod < 2 ? 0 : 11 - mod)) return false;
      }
      return true;
    };
    const params = new URLSearchParams(location.search);
    ['utm_source','utm_medium','utm_campaign','utm_content'].forEach((key) => {
      field(key).value = (params.get(key) || '').slice(0, 200);
    });
    field('pagina_origem').value = `${location.origin}${location.pathname}`.slice(0, 300);
    field('documento').addEventListener('input', () => {
      const d = digits(field('documento').value).slice(0, 14);
      field('documento').value = d.length <= 11
        ? d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        : d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    });
    field('whatsapp').addEventListener('input', () => {
      let d = digits(field('whatsapp').value);
      if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
      d = d.slice(0, 11);
      field('whatsapp').value = d.length > 6
        ? `(${d.slice(0,2)}) ${d.slice(2,d.length === 11 ? 7 : 6)}-${d.slice(d.length === 11 ? 7 : 6)}`
        : d.length > 2 ? `(${d.slice(0,2)}) ${d.slice(2)}` : d;
    });
    const other = document.getElementById('campo-nicho-outro');
    const spend = document.getElementById('campo-faixa');
    const updateConditional = () => {
      other.hidden = field('nicho').value !== 'outro';
      spend.hidden = chosen('investe_anuncios') !== 'sim';
      field('nicho_outro').required = !other.hidden;
      field('faixa_investimento').required = !spend.hidden;
    };
    form.addEventListener('change', updateConditional);
    updateConditional();
    const setError = (name, message) => {
      const error = document.getElementById(`e-${name}`);
      if (error) {
        error.textContent = message;
        error.closest('.campo')?.classList.toggle('invalido', Boolean(message));
      }
      const input = field(name);
      const target = input?.length && !input.tagName ? input[0] : input;
      if (target?.setAttribute) {
        if (message) target.setAttribute('aria-invalid', 'true');
        else target.removeAttribute('aria-invalid');
      }
    };
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const raw = (name) => field(name)?.value?.trim() || '';
      const rules = {
        nome: raw('nome').length >= 2 ? '' : 'Escreva seu nome.',
        whatsapp: /^\d{10,11}$/.test(digits(raw('whatsapp'))) ? '' : 'Confira o WhatsApp com DDD.',
        email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw('email')) ? '' : 'Confira o e-mail.',
        negocio: raw('negocio').length >= 2 ? '' : 'Escreva o nome do negócio.',
        documento: cpfValid(raw('documento')) || cnpjValid(raw('documento')) ? '' : 'Confira os dígitos do CPF ou CNPJ.',
        nicho: raw('nicho') ? '' : 'Escolha o ramo do negócio.',
        nicho_outro: other.hidden || raw('nicho_outro').length >= 2 ? '' : 'Conte qual é o ramo.',
        instagram: /^[a-z0-9._]{1,30}$/i.test(raw('instagram').replace(/^@/, '')) ? '' : 'Coloque o @ do Instagram.',
        perfil: chosen('perfil') ? '' : 'Escolha uma opção.',
        vende_whatsapp: chosen('vende_whatsapp') ? '' : 'Escolha sim ou não.',
        investe_anuncios: chosen('investe_anuncios') ? '' : 'Escolha sim ou não.',
        faixa_investimento: spend.hidden || raw('faixa_investimento') ? '' : 'Escolha uma faixa.',
        site: !raw('site') || /^(https?:\/\/)?[^\s./]+(\.[^\s./]+)+(\/\S*)?$/i.test(raw('site')) ? '' : 'Confira o site ou deixe em branco.',
        consentimento: field('consentimento').checked ? '' : 'Autorize o contato para continuar.'
      };
      Object.entries(rules).forEach(([name, message]) => setError(name, message));
      const first = Object.keys(rules).find((name) => rules[name]);
      if (first) {
        const input = field(first);
        (input?.length && !input.tagName ? input[0] : input)?.focus();
        return;
      }
      form.hidden = true;
      const success = document.getElementById('form-enviado');
      success.hidden = false;
      success.focus();
    });
  }

  const track = document.querySelector('[data-feedback-track]');
  const cards = [...document.querySelectorAll('.feedback-card')];
  const previous = document.querySelector('[data-feedback-prev]');
  const next = document.querySelector('[data-feedback-next]');
  const count = document.querySelector('[data-feedback-count]');
  if (!track || !cards.length) return;

  let active = 0;
  let frame = 0;
  const update = () => {
    const left = track.getBoundingClientRect().left;
    active = cards.reduce((best, card, index) =>
      Math.abs(card.getBoundingClientRect().left - left) <
      Math.abs(cards[best].getBoundingClientRect().left - left) ? index : best, 0);
    count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    previous.disabled = active === 0;
    next.disabled = active === cards.length - 1;
    frame = 0;
  };
  const goTo = (index) => {
    const destination = Math.max(0, Math.min(cards.length - 1, index));
    const left = cards[destination].getBoundingClientRect().left -
      track.getBoundingClientRect().left + track.scrollLeft;
    track.scrollTo({
      left,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  };
  previous.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active + 1));
  track.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
