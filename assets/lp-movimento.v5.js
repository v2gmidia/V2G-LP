/* V2G — movimento que acompanha a leitura.
   O conteúdo nasce visível. Sem ciclos contínuos e sem deslocar o telefone. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktop = window.matchMedia('(min-width: 960px)');
  var mobile = window.matchMedia('(max-width: 760px)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var activeAnimations = new Set();
  var ease = 'cubic-bezier(.16,1,.3,1)';
  var hasObserver = 'IntersectionObserver' in window;
  document.documentElement.classList.add('js');
  document.documentElement.classList.toggle('mov', !reduce.matches);

  function listenMedia(query, callback) {
    if (query.addEventListener) query.addEventListener('change', callback);
    else if (query.addListener) query.addListener(callback);
  }

  function cancelOn(element) {
    if (!element || !element.getAnimations) return;
    element.getAnimations().forEach(function (animation) {
      if (activeAnimations.has(animation)) {
        animation.cancel();
        activeAnimations.delete(animation);
      }
    });
  }

  function animate(element, keyframes, options) {
    if (!element || !element.animate || reduce.matches || document.hidden) return;
    var animation = element.animate(keyframes, options);
    activeAnimations.add(animation);
    function release() { activeAnimations.delete(animation); }
    animation.addEventListener('finish', release, { once: true });
    animation.addEventListener('cancel', release, { once: true });
    return animation;
  }

  /* Revelação por linha: a animação nunca é requisito para ler o título. */
  var revealed = new WeakSet();
  var revealTargets = document.querySelectorAll('[data-reveal]');
  function reveal(element) {
    if (revealed.has(element)) return;
    revealed.add(element);
    var lines = element.querySelectorAll('.reveal-line');
    if (!lines.length) lines = [element];
    Array.prototype.forEach.call(lines, function (line, index) {
      animate(line, [
        { opacity: 0.25, filter: 'blur(6px)', transform: 'translateY(14px)' },
        { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' }
      ], { duration: 620, delay: Math.min(index * 80, 240), easing: ease, fill: 'backwards' });
    });
  }
  if (hasObserver) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    revealTargets.forEach(function (element) {
      if (element.closest('.hero')) reveal(element);
      else revealObserver.observe(element);
    });
  } else revealTargets.forEach(reveal);

  /* Caminhos explicativos: uma passagem, pausada fora da tela e em outra aba. */
  var sequences = Array.prototype.map.call(document.querySelectorAll('[data-sequence]'), function (element) {
    element.classList.add('sequence-ready');
    return {
      element: element,
      steps: Array.prototype.slice.call(element.querySelectorAll('[data-sequence-step]')),
      individual: element.classList.contains('operation-flow'),
      index: -1,
      visible: false,
      done: false,
      timer: 0,
      startedAt: 0,
      remaining: 430
    };
  });

  function paintSequence(sequence) {
    sequence.steps.forEach(function (step, index) {
      step.classList.toggle('is-reached', index <= sequence.index);
      step.classList.toggle('is-current', !sequence.done && index === sequence.index);
    });
    var progress = sequence.steps.length > 1 ? sequence.index / (sequence.steps.length - 1) : 1;
    sequence.element.style.setProperty('--sequence-progress', String(Math.max(0, Math.min(1, progress))));
  }

  function pauseSequence(sequence) {
    if (!sequence.timer) return;
    window.clearTimeout(sequence.timer);
    sequence.timer = 0;
    sequence.remaining = Math.max(0, sequence.remaining - (performance.now() - sequence.startedAt));
  }

  function finishSequence(sequence) {
    pauseSequence(sequence);
    sequence.index = sequence.steps.length - 1;
    sequence.done = true;
    paintSequence(sequence);
  }

  function runSequence(sequence) {
    if (reduce.matches || !hasObserver) { finishSequence(sequence); return; }
    if (sequence.individual && mobile.matches) return;
    if (sequence.done || sequence.timer || !sequence.visible || document.hidden || !sequence.steps.length) return;
    if (sequence.index < 0) {
      sequence.index = 0;
      paintSequence(sequence);
    }
    sequence.startedAt = performance.now();
    sequence.timer = window.setTimeout(function () {
      sequence.timer = 0;
      sequence.remaining = 430;
      if (sequence.index >= sequence.steps.length - 1) {
        finishSequence(sequence);
        return;
      }
      sequence.index += 1;
      paintSequence(sequence);
      runSequence(sequence);
    }, sequence.remaining);
  }

  var mobileStepVisibility = new Map();
  var mobileStepsSeen = new WeakSet();
  function reachMobileStep(step) {
    if (mobileStepsSeen.has(step) || document.hidden) return;
    mobileStepsSeen.add(step);
    step.classList.add('is-reached');
    var sequence = sequences.find(function (item) { return item.steps.indexOf(step) !== -1; });
    if (sequence) {
      sequence.steps.forEach(function (item) { item.classList.toggle('is-current', item === step); });
      var reached = sequence.steps.filter(function (item) { return item.classList.contains('is-reached'); }).length;
      sequence.element.style.setProperty('--sequence-progress', String(reached / sequence.steps.length));
    }
    animate(step, [
      { opacity: 0.72, transform: 'translateY(5px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 400, easing: ease });
  }

  if (hasObserver) {
    var sequenceObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var sequence = sequences.find(function (item) { return item.element === entry.target; });
        if (!sequence) return;
        sequence.visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        if (sequence.visible) runSequence(sequence);
        else pauseSequence(sequence);
      });
    }, { threshold: [0, 0.2] });
    var mobileStepObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
        mobileStepVisibility.set(entry.target, visible);
        if (visible && mobile.matches && !reduce.matches) reachMobileStep(entry.target);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -5% 0px' });
    sequences.forEach(function (sequence) {
      sequenceObserver.observe(sequence.element);
      if (sequence.individual) sequence.steps.forEach(function (step) { mobileStepObserver.observe(step); });
      if (reduce.matches) finishSequence(sequence);
    });
  } else sequences.forEach(finishSequence);

  listenMedia(mobile, function () {
    sequences.forEach(function (sequence) {
      if (!sequence.individual) return;
      pauseSequence(sequence);
      if (reduce.matches) { finishSequence(sequence); return; }
      if (mobile.matches) {
        sequence.steps.forEach(function (step) {
          if (mobileStepVisibility.get(step)) reachMobileStep(step);
        });
      } else {
        if (sequence.done) paintSequence(sequence);
        else runSequence(sequence);
      }
    });
  });

  /* A faixa se desloca uma única vez, mantendo todas as palavras legíveis. */
  var bandTracks = document.querySelectorAll('.verb-band .verb-track');
  function moveBand(track) {
    if (reduce.matches) return;
    animate(track, [{ transform: 'translateX(24px)' }, { transform: 'translateX(0)' }],
      { duration: 1400, easing: ease });
  }
  if (hasObserver) {
    var bandObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        moveBand(entry.target);
        bandObserver.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    bandTracks.forEach(function (track) { bandObserver.observe(track); });
  }

  /* Só o conteúdo troca: a moldura e o viewport do telefone ficam estáveis. */
  var journey = document.querySelector('.journey');
  var steps = Array.prototype.slice.call(document.querySelectorAll('.journey .journey-step'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.screen-tab'));
  var screens = Array.prototype.slice.call(document.querySelectorAll('.phone-screen'));
  var phoneViewport = document.querySelector('.phone-viewport');
  var tabGroup = document.querySelector('.screen-tabs');
  var followButton = document.querySelector('.follow-journey');
  var selectedScreen = '';
  var followScroll = true;
  var journeyWasVisible = false;
  var currentStep = null;

  function setFollow(enabled) {
    followScroll = enabled;
    if (followButton) followButton.setAttribute('aria-pressed', String(enabled));
    if (journey) journey.classList.toggle('is-manual', !enabled);
  }

  function selectScreen(value, fromScroll) {
    var next = document.getElementById('phone-screen-' + value);
    if (!next || screens.indexOf(next) === -1 || selectedScreen === String(value)) return;
    if (fromScroll && screens.some(function (screen) {
      return screen !== next && screen.contains(document.activeElement);
    })) return;
    screens.forEach(function (screen) {
      cancelOn(screen);
      screen.hidden = screen !== next;
    });
    tabs.forEach(function (tab) {
      var selected = tab.getAttribute('data-screen') === String(value);
      tab.setAttribute('aria-pressed', String(selected));
      tab.classList.toggle('is-active', selected);
    });
    selectedScreen = String(value);
    if (phoneViewport) phoneViewport.scrollTop = 0;
    animate(next, [
      { opacity: 0.55, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 240, easing: ease });
  }

  if (phoneViewport && tabs.length && screens.length) {
    phoneViewport.classList.add('screens-ready');
    phoneViewport.addEventListener('focusin', function () { setFollow(false); });
    if (tabGroup) tabGroup.hidden = false;
    if (followButton) followButton.hidden = false;
    tabs.forEach(function (tab) {
      tab.hidden = false;
      tab.addEventListener('focus', function () { setFollow(false); });
      tab.addEventListener('click', function () {
        setFollow(false);
        selectScreen(tab.getAttribute('data-screen'), false);
      });
    });
    if (followButton) followButton.addEventListener('click', function () {
      setFollow(true);
      scheduleReading();
    });
    var initialTab = tabs.find(function (tab) { return tab.getAttribute('aria-pressed') === 'true'; }) || tabs[0];
    selectScreen(initialTab.getAttribute('data-screen'), false);
    setFollow(true);
  }

  /* Leitura e mudança de etapa: um só cálculo por evento de rolagem. */
  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.reading-progress');
  var scrollFrame = 0;

  function updateReading() {
    scrollFrame = 0;
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    var height = window.innerHeight || document.documentElement.clientHeight;
    var travel = Math.max(0, document.documentElement.scrollHeight - height);
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (progress) progress.style.transform = 'scaleX(' + (travel ? Math.max(0, Math.min(1, y / travel)) : 0) + ')';
    if (!journey || !steps.length) return;
    var bounds = journey.getBoundingClientRect();
    var visible = bounds.top < height && bounds.bottom > 0;
    if (visible && !journeyWasVisible) setFollow(true);
    journeyWasVisible = visible;
    if (!visible) return;

    var center = height * 0.5;
    var closest = steps[0];
    var distance = Infinity;
    steps.forEach(function (step) {
      var stepBounds = step.getBoundingClientRect();
      var delta = Math.abs(stepBounds.top + stepBounds.height * 0.5 - center);
      if (delta < distance) { distance = delta; closest = step; }
    });
    if (closest !== currentStep) {
      steps.forEach(function (step) { step.classList.toggle('is-current', step === closest); });
      currentStep = closest;
    }
    if (desktop.matches && followScroll && phoneViewport) selectScreen(closest.getAttribute('data-screen'), true);
  }

  function scheduleReading() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateReading);
  }
  window.addEventListener('scroll', scheduleReading, { passive: true });
  window.addEventListener('resize', scheduleReading, { passive: true });
  window.addEventListener('load', scheduleReading, { once: true });
  listenMedia(desktop, scheduleReading);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleReading);
  scheduleReading();

  var milestones = document.querySelectorAll('.journey-step, .phase');
  if (hasObserver) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    milestones.forEach(function (element) { observer.observe(element); });
  } else milestones.forEach(function (element) { element.classList.add('is-visible'); });

  /* A fotografia assenta no recorte; o acompanhamento chega logo depois. */
  var heroArt = document.querySelector('.hero-art');
  var photo = heroArt && heroArt.querySelector('.photo-frame img');
  var account = heroArt && heroArt.querySelector('.account-preview');
  animate(photo, [
    { opacity: 0.75, transform: 'scale(1.035)' },
    { opacity: 1, transform: 'scale(1)' }
  ], { duration: 660, easing: ease });
  animate(account, [
    { opacity: 0.65, transform: 'translateY(16px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 540, delay: 100, easing: ease, fill: 'backwards' });

  var pointerFrame = 0;
  var pointerPosition = null;
  function moveAccount() {
    pointerFrame = 0;
    if (!account || !heroArt || reduce.matches || !finePointer.matches) return;
    var x = 0, y = 0;
    if (pointerPosition) {
      var bounds = heroArt.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      x = Math.max(-1, Math.min(1, (pointerPosition.x - bounds.left) / bounds.width * 2 - 1)) * 5;
      y = Math.max(-1, Math.min(1, (pointerPosition.y - bounds.top) / bounds.height * 2 - 1)) * 4;
    }
    var previous = window.getComputedStyle(account).transform;
    cancelOn(account);
    var target = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
    account.style.transform = target;
    animate(account, [{ transform: previous === 'none' ? 'translate3d(0,0,0)' : previous }, { transform: target }],
      { duration: 180, easing: ease });
  }
  function schedulePointer() {
    if (!pointerFrame) pointerFrame = window.requestAnimationFrame(moveAccount);
  }
  if (heroArt && account) {
    heroArt.addEventListener('pointermove', function (event) {
      if (reduce.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
      pointerPosition = { x: event.clientX, y: event.clientY };
      schedulePointer();
    }, { passive: true });
    heroArt.addEventListener('pointerleave', function () {
      pointerPosition = null;
      schedulePointer();
    }, { passive: true });
  }

  function clearPointer() {
    pointerPosition = null;
    if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    if (account) {
      cancelOn(account);
      account.style.removeProperty('transform');
    }
  }
  listenMedia(finePointer, clearPointer);
  listenMedia(reduce, function () {
    document.documentElement.classList.toggle('mov', !reduce.matches);
    if (reduce.matches) {
      activeAnimations.forEach(function (animation) { animation.cancel(); });
      activeAnimations.clear();
      clearPointer();
      bandTracks.forEach(function (track) { track.style.removeProperty('transform'); });
      sequences.forEach(finishSequence);
    }
    scheduleReading();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      sequences.forEach(pauseSequence);
      activeAnimations.forEach(function (animation) { animation.cancel(); });
      activeAnimations.clear();
      clearPointer();
    } else {
      sequences.forEach(runSequence);
      if (mobile.matches && !reduce.matches) mobileStepVisibility.forEach(function (visible, step) {
        if (visible) reachMobileStep(step);
      });
      scheduleReading();
    }
  });
})();
