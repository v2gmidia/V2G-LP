(() => {
  'use strict';
  const route = document.querySelector('.process-route');
  const steps = Array.from(document.querySelectorAll('.product-step'));
  const links = route ? Array.from(route.querySelectorAll('a[href^="#etapa-"]')) : [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (route && steps.length === links.length) {
    let scheduled = false;
    const updateRoute = () => {
      scheduled = false;
      const readingLine = Math.min(window.innerHeight * .42, 420);
      let current = 0;
      steps.forEach((step, index) => { if (step.getBoundingClientRect().top <= readingLine) current = index; });
      route.style.setProperty('--stage-progress', String((current + 1) / steps.length));
      links.forEach((link, index) => {
        if (index === current) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
      steps.forEach((step, index) => step.classList.toggle('is-current', index === current));
    };
    const scheduleRoute = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(updateRoute);
    };
    window.addEventListener('scroll', scheduleRoute, { passive: true });
    window.addEventListener('resize', scheduleRoute, { passive: true });
    updateRoute();
  }

  // A captura real aparece quando a etapa entra na área de leitura.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (reducedMotion.matches) return;
        const frame = entry.target.querySelector('.product-frame');
        if (!frame || !frame.animate) return;
        frame.animate([
          { opacity: .72, clipPath: 'inset(0 7% 0 0)' },
          { opacity: 1, clipPath: 'inset(0 0 0 0)' }
        ], { duration: 690, easing: 'cubic-bezier(.16,1,.3,1)' });
      });
    }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });
    steps.forEach((step) => observer.observe(step));
  }

  // O nome acessível do link permanece intacto; a duplicação é apenas sombra visual.
  document.querySelectorAll('.hero-actions > .button-blue, .product-close > .button-blue, .plan-offer > .button-blue').forEach((button) => {
    const textNode = Array.from(button.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (!textNode) return;
    const wrapper = document.createElement('span');
    wrapper.className = 'motion-label';
    const label = document.createElement('span');
    label.textContent = textNode.textContent.trim();
    wrapper.append(label);
    textNode.replaceWith(wrapper);
    button.classList.add('motion-fill-button');
  });
})();
