/* ============================================================
   DMH ELECTRICAL INSTALLATIONS — interactions
   ============================================================ */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const hasST = typeof ScrollTrigger !== 'undefined';
  const canAnimate = hasGSAP && hasST && !reduced;

  if (!canAnimate) {
    document.documentElement.classList.add('no-anim');
  }

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (canAnimate && typeof Lenis !== 'undefined') {
    try {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } catch (e) { lenis = null; }
  }
  if (canAnimate) gsap.registerPlugin(ScrollTrigger);

  const scrollToEl = (target) => {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -60, duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  /* scroll lock helpers — keep native + lenis in sync */
  const lockScroll = () => {
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  };
  const unlockScroll = () => {
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  };

  /* anchor links */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        document.body.classList.remove('menu-open');
        unlockScroll();
        scrollToEl(id);
      }
    });
  });

  /* ---------- Split helpers ---------- */
  const splitWords = (el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = w;
      span.style.display = 'inline-block';
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return el.querySelectorAll('.w');
  };

  const splitLines = (el) => {
    // wrap each visual line by words -> measure offsetTop
    const words = splitWords(el);
    const lines = [];
    let current = [], top = null;
    words.forEach(w => {
      if (top === null) top = w.offsetTop;
      if (w.offsetTop !== top) { lines.push(current); current = []; top = w.offsetTop; }
      current.push(w);
    });
    if (current.length) lines.push(current);
    el.innerHTML = '';
    const lineSpans = lines.map(group => {
      const line = document.createElement('span');
      line.className = 'line';
      const inner = document.createElement('span');
      inner.textContent = group.map(w => w.textContent).join(' ');
      line.appendChild(inner);
      el.appendChild(line);
      return inner;
    });
    return lineSpans;
  };

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById('preloader');
  const preCount = document.getElementById('preCount');
  let introDone = false;

  const intro = () => {
    if (introDone) return;
    introDone = true;
    if (!canAnimate) {
      preloader.style.display = 'none';
      return;
    }
    const tl = gsap.timeline();
    tl.to(preloader.querySelector('.preloader__inner'), { opacity: 0, y: -30, duration: .5, ease: 'power2.in' })
      .to(preloader.querySelector('.preloader__curtain'), { yPercent: -100, duration: .9, ease: 'power4.inOut' }, '-=.1')
      .set(preloader, { display: 'none' })
      // hero intro
      .to('.hero__line > span, .hero__line em', { y: 0, duration: 1.1, ease: 'power4.out', stagger: .12 }, '-=.45')
      .to('.hero__eyebrow', { opacity: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .1 }, '-=.8')
      .to('.hero__sub, .hero__ctas, .hero__badges', { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .12 }, '-=.7')
      .to('.hero__media', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=.9');
  };

  if (canAnimate) {
    let n = 0;
    const tick = setInterval(() => {
      n = Math.min(100, n + Math.floor(Math.random() * 12) + 4);
      preCount.textContent = String(n).padStart(2, '0');
      if (n >= 100) { clearInterval(tick); setTimeout(intro, 250); }
    }, 90);
    // safety: never trap the user
    setTimeout(intro, 4000);
  } else {
    intro();
  }

  if (!canAnimate) return;

  /* ---------- Custom cursor ---------- */
  if (!isTouch) {
    const dot = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { x: pos.x, y: pos.y };
    addEventListener('mousemove', e => { pos.x = e.clientX; pos.y = e.clientY; });
    gsap.ticker.add(() => {
      ringPos.x += (pos.x - ringPos.x) * .16;
      ringPos.y += (pos.y - ringPos.y) * .16;
      dot.style.transform = `translate(${pos.x - 4}px,${pos.y - 4}px)`;
      ring.style.transform = `translate(${ringPos.x - ring.offsetWidth / 2}px,${ringPos.y - ring.offsetHeight / 2}px)`;
    });
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor], a, button, summary');
      ring.classList.toggle('is-view', t && t.dataset.cursor === 'view');
      ring.classList.toggle('is-hover', t && t.dataset.cursor !== 'view');
    });
  }

  /* ---------- Nav ---------- */
  const nav = document.getElementById('nav');
  const progress = document.getElementById('scrollProgress');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: () => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 40);
      if (y > 400 && y > lastY && !document.body.classList.contains('menu-open')) nav.classList.add('is-hidden');
      else nav.classList.remove('is-hidden');
      lastY = y;
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
  });

  document.getElementById('burger').addEventListener('click', () => {
    document.body.classList.toggle('menu-open');
    document.body.classList.contains('menu-open') ? lockScroll() : unlockScroll();
  });

  /* ---------- Generic reveals ---------- */
  gsap.utils.toArray('[data-reveal]').forEach(el => {
    if (el.closest('.hero')) return; // hero handled by intro timeline
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  /* h2 line splits */
  gsap.utils.toArray('[data-split-lines]').forEach(el => {
    const inners = splitLines(el);
    gsap.to(inners, {
      y: 0, duration: 1.1, ease: 'power4.out', stagger: .1,
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  /* contact title split (block spans already exist) */
  gsap.utils.toArray('.contact__title span, .contact__title em').forEach(el => {
    gsap.fromTo(el, { yPercent: 110 }, {
      yPercent: 0, duration: 1.1, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  /* ---------- Parallax ---------- */
  gsap.utils.toArray('[data-parallax]').forEach(img => {
    const amt = parseFloat(img.dataset.parallax) || 8;
    gsap.fromTo(img, { yPercent: -amt }, {
      yPercent: amt, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- Magnetic buttons ---------- */
  if (!isTouch) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const strength = 22;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) / r.width * strength,
          y: (e.clientY - r.top - r.height / 2) / r.height * strength,
          duration: .4, ease: 'power3.out'
        });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.4)' }));
    });
  }

  /* ---------- Services: accordion + hover preview ---------- */
  const preview = document.getElementById('svcPreview');
  const previewImg = preview.querySelector('img');
  const svcList = document.getElementById('servicesList');
  let previewVisible = false;

  if (!isTouch) {
    svcList.addEventListener('mousemove', e => {
      gsap.to(preview, { x: e.clientX + 24, y: e.clientY - 160, duration: .6, ease: 'power3.out' });
    });
  }

  document.querySelectorAll('.svc').forEach(svc => {
    const head = svc.querySelector('.svc__head');
    const body = svc.querySelector('.svc__body');

    head.addEventListener('click', () => {
      const isOpen = svc.classList.contains('is-open');
      // close all
      document.querySelectorAll('.svc.is-open').forEach(o => {
        if (o !== svc) {
          o.classList.remove('is-open');
          gsap.to(o.querySelector('.svc__body'), { height: 0, duration: .6, ease: 'power3.inOut' });
        }
      });
      svc.classList.toggle('is-open', !isOpen);
      gsap.to(body, {
        height: isOpen ? 0 : body.querySelector('.svc__body-inner').offsetHeight,
        duration: .7, ease: 'power3.inOut',
        onComplete: () => ScrollTrigger.refresh()
      });
    });

    if (!isTouch) {
      svc.addEventListener('mouseenter', () => {
        previewImg.src = svc.dataset.img;
        preview.classList.add('is-on');
        previewVisible = true;
      });
      svc.addEventListener('mouseleave', () => {
        preview.classList.remove('is-on');
        previewVisible = false;
      });
    }
  });

  /* ---------- Gallery lightbox ---------- */
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  const items = [...document.querySelectorAll('.work__item')];
  let lbIndex = 0;

  const openLb = (i) => {
    lbIndex = (i + items.length) % items.length;
    const img = items[lbIndex].querySelector('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = items[lbIndex].querySelector('figcaption').textContent;
    lb.classList.add('is-open');
    lockScroll();
  };
  const closeLb = () => { lb.classList.remove('is-open'); unlockScroll(); };

  items.forEach((item, i) => item.addEventListener('click', () => openLb(i)));
  document.getElementById('lbClose').addEventListener('click', closeLb);
  document.getElementById('lbPrev').addEventListener('click', e => { e.stopPropagation(); openLb(lbIndex - 1); });
  document.getElementById('lbNext').addEventListener('click', e => { e.stopPropagation(); openLb(lbIndex + 1); });
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
    if (e.key === 'ArrowRight') openLb(lbIndex + 1);
  });

  /* ---------- FAQ smooth open ---------- */
  document.querySelectorAll('.qa').forEach(d => {
    d.addEventListener('toggle', () => ScrollTrigger.refresh());
  });

  /* ---------- Quote form -> mailto ---------- */
  document.getElementById('quoteForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const subject = encodeURIComponent(`Free quote request — ${f.get('name') || 'Website enquiry'}`);
    const body = encodeURIComponent(
      `Name: ${f.get('name') || ''}\nPhone: ${f.get('phone') || ''}\nEmail: ${f.get('email') || ''}\nAddress: ${f.get('address') || ''}\n\nJob details:\n${f.get('message') || ''}`
    );
    window.location.href = `mailto:office@dmhelectricalinstallations.co.uk?subject=${subject}&body=${body}`;
  });

})();
