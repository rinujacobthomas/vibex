// ===== vibex fitness waitlist (Apps Script friendly) =====
// Endpoint already set earlier
const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbywI4nT8sQp-8RumBOoXQ2JlmfB_s02Yvw4-46UQpVAKfg7U4bXH86l5jJNfeH40ny90w/exec";

async function subscribeWaitlist(e){
  e.preventDefault();
  const form = e.target;
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');
  const label = button.querySelector('.btn-label');
  const setStatus = (msg, kind) => {
    status.textContent = msg;
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  };

  const data = new FormData(form);
  const payload = {
    name: data.get('name')?.trim(),
    email: data.get('email')?.trim(),
    phone: data.get('phone')?.trim() || null,
    source: 'vibex-site',
    ts: new Date().toISOString()
  };

  if(!payload.name || !payload.email){
    setStatus('Please enter your name and email.', 'err');
    return false;
  }

  button.disabled = true;
  label.textContent = 'Sending…';
  setStatus('');

  try {
    // Use text/plain to avoid CORS preflight (Apps Script friendly)
    const res = await fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    let ok = false;
    try {
      const text = await res.text();
      const maybe = JSON.parse(text);
      ok = !!maybe.ok || res.ok;
    } catch(_) {
      ok = res.ok; // if response isn't JSON, rely on HTTP status
    }

    if(ok){
      setStatus('Thanks! You are on the list. We\'ll notify you when we launch.', 'ok');
      form.reset();
    } else {
      setStatus('Sorry, something went wrong. Please try again later.', 'err');
    }
  } catch (err){
    console.error('Waitlist error:', err);
    setStatus('Sorry, something went wrong. Please try again later.', 'err');
  } finally {
    button.disabled = false;
    label.textContent = 'Notify me';
  }
  return false;
}

document.getElementById('year').textContent = new Date().getFullYear();

// ===== UI chrome (works with or without the animation libraries) =====
const root = document.documentElement;
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = [...document.querySelectorAll('.nav a')];

function setMenu(open){
  document.body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if(window.lenis) open ? window.lenis.stop() : window.lenis.start();
}
menuToggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
navLinks.forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if(e.key === 'Escape') setMenu(false); });

// Hide header on scroll down, reveal on scroll up
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 40);
  header.classList.toggle('is-hidden', y > 300 && y > lastY && !document.body.classList.contains('menu-open'));
  lastY = y;
}, { passive: true });

// Highlight the nav link for the section in view
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(!entry.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach(s => sectionObserver.observe(s));

// ===== Motion =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader = document.querySelector('.loader');

if(!window.gsap || !window.ScrollTrigger || reduceMotion){
  // No libraries or the visitor prefers less motion: show everything as-is
  loader && loader.remove();
} else {
  initMotion();
}

function splitChars(el){
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.textContent = '';
  [...text].forEach(ch => {
    const span = document.createElement('span');
    span.className = 'char';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(span);
  });
  return el.querySelectorAll('.char');
}

function splitWords(el){
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');
  return el.querySelectorAll('.word');
}

function initMotion(){
  gsap.registerPlugin(ScrollTrigger);

  // --- Smooth scrolling (Lenis) synced with ScrollTrigger ---
  if(window.Lenis){
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        const target = id === '#top' ? 0 : document.querySelector(id);
        if(target === null) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: id === '#top' ? 0 : -70, duration: 1.6 });
      });
    });
  }

  // --- Scroll progress bar ---
  gsap.to('.scroll-progress span', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
  });

  // --- Split headlines into characters ---
  const splits = [...document.querySelectorAll('.split')];
  splits.forEach(splitChars);

  // --- Preloader → hero intro ---
  const heroChars = document.querySelectorAll('.hero .char');
  const leds = document.querySelectorAll('.hero-leds .led');
  leds.forEach(p => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
  });
  const ecg = document.querySelector('.loader-ecg path');
  const ecgLen = ecg.getTotalLength();
  gsap.set(ecg, { strokeDasharray: ecgLen, strokeDashoffset: ecgLen });
  gsap.set(heroChars, { yPercent: 110 });
  gsap.set(['.hero-eyebrow', '.hero-sub', '.hero-cta', '.scroll-cue'], { autoAlpha: 0, y: 30 });
  gsap.set('.site-header', { autoAlpha: 0, yPercent: -100 });

  const counter = { v: 0 };
  const countEl = document.getElementById('loaderCount');
  const pageLoaded = new Promise(res => {
    if(document.readyState === 'complete') res();
    else window.addEventListener('load', res, { once: true });
  });
  const minTime = new Promise(res => setTimeout(res, 1200));
  const maxTime = new Promise(res => setTimeout(res, 3500));

  const loadTl = gsap.timeline();
  loadTl
    .to(ecg, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0)
    .to(counter, { v: 90, duration: 1.2, ease: 'power1.out', onUpdate: () => countEl.textContent = Math.round(counter.v) }, 0);

  Promise.race([Promise.all([pageLoaded, minTime]), maxTime]).then(() => {
    const tl = gsap.timeline({
      onComplete: () => { loader.remove(); window.lenis && window.lenis.start(); ScrollTrigger.refresh(); }
    });
    tl.to(counter, { v: 100, duration: .35, onUpdate: () => countEl.textContent = Math.round(counter.v) })
      .to('.loader-inner', { autoAlpha: 0, y: -20, duration: .4, ease: 'power2.in' })
      .to('.loader-panel--top', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '<0.1')
      .to('.loader-panel--bottom', { yPercent: 100, duration: 1, ease: 'expo.inOut' }, '<')
      .to('.hero-img', { scale: 1, duration: 2.2, ease: 'expo.out' }, '<0.2')
      .to(heroChars, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.025 }, '<0.3')
      .to(leds, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut', stagger: 0.15 }, '<0.1')
      .to('.site-header', { autoAlpha: 1, yPercent: 0, duration: 1, ease: 'power3.out', clearProps: 'all' }, '<0.4')
      .to(['.hero-eyebrow', '.hero-sub', '.hero-cta', '.scroll-cue'],
          { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }, '<0.1');
  });

  // --- Hero scroll parallax ---
  const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero-media', { yPercent: 25, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero-content', { yPercent: -30, autoAlpha: 0, ease: 'none', scrollTrigger: { ...heroST, end: '80% top' } });
  gsap.to('.hero-leds', { yPercent: -15, opacity: .2, ease: 'none', scrollTrigger: heroST });

  // --- Velocity-reactive marquee ---
  const track = document.querySelector('.marquee-track');
  const loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 22, repeat: -1 });
  const skewTo = gsap.quickTo(track, 'skewX', { duration: .5, ease: 'power3' });
  let settle;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const v = self.getVelocity();
      const dir = self.direction;
      gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 250, 5)), duration: .2, overwrite: true });
      skewTo(gsap.utils.clamp(-10, 10, v / -150));
      clearTimeout(settle);
      settle = setTimeout(() => { gsap.to(loop, { timeScale: dir, duration: .8 }); skewTo(0); }, 120);
    }
  });

  // --- Generic reveals ---
  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.from(el, {
      y: 50, autoAlpha: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });
  gsap.utils.toArray('.stagger').forEach(group => {
    gsap.from(group.children, {
      y: 40, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .1,
      scrollTrigger: { trigger: group, start: 'top 85%' }
    });
  });
  gsap.utils.toArray('.reveal-clip').forEach(el => {
    gsap.fromTo(el,
      { clipPath: 'inset(100% 0% 0% 0% round 24px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  // --- Word-by-word statement lit by scroll ---
  document.querySelectorAll('[data-scrub-words]').forEach(el => {
    gsap.to(splitWords(el), {
      opacity: 1, stagger: .1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true }
    });
  });

  // --- Image parallax ---
  gsap.utils.toArray('[data-parallax]').forEach(img => {
    gsap.fromTo(img, { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // --- Responsive pieces ---
  const mm = gsap.matchMedia();

  // Pinned horizontal design tour (desktop / tablet landscape)
  mm.add('(min-width: 860px)', () => {
    const tourTrack = document.querySelector('.tour-track');
    const distance = () => tourTrack.scrollWidth - window.innerWidth;
    const scroller = gsap.to(tourTrack, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: '.tour', pin: '.tour-pin', start: 'top top',
        end: () => '+=' + distance(), scrub: 1, invalidateOnRefresh: true, anticipatePin: 1
      }
    });
    gsap.to('.tour-progress span', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.tour', start: 'top top', end: () => '+=' + distance(), scrub: 1, invalidateOnRefresh: true }
    });
    gsap.utils.toArray('.tour-card').forEach(card => {
      gsap.fromTo(card.querySelector('img'), { xPercent: -10 }, {
        xPercent: 0, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: scroller, start: 'left right', end: 'right left', scrub: true }
      });
      gsap.from(card.querySelector('.tour-meta'), {
        y: 30, autoAlpha: 0, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: card, containerAnimation: scroller, start: 'left 75%' }
      });
    });
  });

  // Stacked tour on small screens
  mm.add('(max-width: 859px)', () => {
    gsap.utils.toArray('.tour-card').forEach(card => {
      gsap.from(card, { y: 60, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 88%' } });
    });
  });

  // --- Zones: entry + 3D tilt with spotlight ---
  gsap.from('.zone', {
    y: 80, rotateX: -25, autoAlpha: 0, duration: 1.1, ease: 'expo.out', stagger: .12,
    scrollTrigger: { trigger: '.zone-grid', start: 'top 85%' }
  });
  if(window.matchMedia('(hover: hover) and (pointer: fine)').matches){
    document.querySelectorAll('[data-tilt]').forEach(card => {
      const rx = gsap.quickTo(card, 'rotateX', { duration: .6, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotateY', { duration: .6, ease: 'power3' });
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', px * 100 + '%');
        card.style.setProperty('--my', py * 100 + '%');
        ry((px - .5) * 14);
        rx((.5 - py) * 14);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  // --- Full-bleed break: frame opens up as you scroll ---
  gsap.to('.break-media', {
    clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
    scrollTrigger: { trigger: '.break', start: 'top 80%', end: 'center center', scrub: true }
  });
  gsap.fromTo('.break-media img', { yPercent: -10 }, {
    yPercent: 10, ease: 'none',
    scrollTrigger: { trigger: '.break', start: 'top bottom', end: 'bottom top', scrub: true }
  });
  gsap.from('.break .char', {
    yPercent: 110, duration: 1, ease: 'expo.out', stagger: .03,
    scrollTrigger: { trigger: '.break-title', start: 'top 75%' }
  });

  // --- Footer mega wordmark rises in ---
  gsap.from('.footer-mega', {
    yPercent: 40, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: true }
  });

  // --- Custom cursor + magnetic buttons (fine pointers only) ---
  if(window.matchMedia('(hover: hover) and (pointer: fine)').matches){
    const cursor = document.querySelector('.cursor');
    const dot = cursor.querySelector('.cursor-dot');
    const ring = cursor.querySelector('.cursor-ring');
    const dx = gsap.quickTo(dot, 'x', { duration: .1 }), dy = gsap.quickTo(dot, 'y', { duration: .1 });
    const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('pointermove', e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.querySelectorAll('a, button, [data-tilt], input').forEach(el => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
    });

    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
      const my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .3);
        my((e.clientY - r.top - r.height / 2) * .4);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  // Images loading late can shift layout; keep triggers accurate
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
