/* As capturas aparecem uma vez, conforme a leitura chega a cada etapa. */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      var frame = entry.target.querySelector('.product-frame');
      if (!frame || reduce.matches || !frame.animate) return;
      frame.animate([
        { opacity: .75, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
    });
  }, { threshold: .22, rootMargin: '0px 0px -4% 0px' });
  document.querySelectorAll('.product-step').forEach(function (step) { observer.observe(step); });
})();

