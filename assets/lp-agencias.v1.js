(() => {
  const chart = document.querySelector('[data-churn-chart]');
  if (chart) {
    const buttons = [...chart.querySelectorAll('[data-churn-state]')];
    const readout = chart.querySelector('[data-churn-readout]');
    let scheduled;
    const setState = (state) => {
      chart.dataset.state = state;
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.churnState === state)));
      readout.textContent = state === 'after'
        ? 'A receita caiu. O custo da estrutura ficou.'
        : 'A receita cobre o custo da estrutura.';
    };
    buttons.forEach((button) => button.addEventListener('click', () => {
      clearTimeout(scheduled);
      setState(button.dataset.churnState);
    }));
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        scheduled = setTimeout(() => setState('after'), 850);
      }, { threshold: 0.45 });
      observer.observe(chart);
    }
  }

  const form = document.getElementById('form-pre-cadastro');
  if (!form) return;

  const niche = document.getElementById('campo-nicho-agencia');
  const nicheInput = document.getElementById('f-nicho-agencia');
  const updateNiche = () => {
    const selected = form.querySelector('input[name="agencia_nichada"]:checked')?.value;
    const shown = selected === 'sim';
    niche.hidden = !shown;
    nicheInput.required = shown;
    if (!shown) nicheInput.value = '';
  };
  form.querySelectorAll('input[name="agencia_nichada"]').forEach((radio) =>
    radio.addEventListener('change', updateNiche));
  updateNiche();

  const whatsapp = document.getElementById('f-whatsapp');
  whatsapp.addEventListener('input', () => {
    const digits = whatsapp.value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
    whatsapp.setCustomValidity(digits.length >= 10 && digits.length <= 11 ? '' : 'Informe DDD e número.');
  });

  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = false;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const digits = whatsapp.value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
    whatsapp.setCustomValidity(digits.length >= 10 && digits.length <= 11 ? '' : 'Informe DDD e número.');
    if (!form.reportValidity()) return;
    const value = (name) => String(form.elements.namedItem(name)?.value || '').trim();
    const chosen = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';
    const selectedPlan = document.querySelector('input[name="pricing-preview-choice"]:checked')?.value;
    const lines = [
      'Olá! Quero conversar sobre a parceria de mídia paga da V2G.',
      `Nome: ${value('nome')}`,
      `Agência: ${value('agencia')}`,
      `E-mail: ${value('email')}`,
      `Instagram: @${value('instagram_agencia').replace(/^@/, '')}`,
      `Agência nichada: ${chosen('agencia_nichada') === 'sim' ? 'sim' : 'não'}`,
      ...(chosen('agencia_nichada') === 'sim' ? [`Nicho: ${value('nicho_agencia')}`] : []),
      `Já oferece gestão de tráfego: ${chosen('oferece_trafego') === 'sim' ? 'sim' : 'não'}`,
      `Execução atual: ${form.elements.namedItem('executor_midia').selectedOptions[0]?.textContent || ''}`,
      `Interesse: ${selectedPlan === 'anual' ? 'anual à vista' : 'mensal'}`,
      ...(value('site_agencia') ? [`Site: ${value('site_agencia')}`] : [])
    ];
    window.location.assign(`https://wa.me/5521980351531?text=${encodeURIComponent(lines.join('\n'))}`);
  });
})();
