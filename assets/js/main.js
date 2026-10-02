/* Multi Bau Berlin — site interactions */
(() => {
  const navbar = document.querySelector('[data-navbar]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const dropdown = document.querySelector('[data-dropdown]');
  const desktop = window.matchMedia('(min-width: 992px)');
  const widowOriginals = new Map(); /* text node → original text, so resizes can re-wrap from scratch */
  const reduceMotionPref = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Navbar: solid background after hero, hide on scroll down, show on scroll up */
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    navbar.classList.toggle('is-scrolled', y > 40);
    const menuOpen = navbar.classList.contains('menu-open') || dropdown?.classList.contains('is-open');
    navbar.classList.toggle('is-hidden', !menuOpen && y > 400 && y > lastY);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const setMenu = (open) => {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? toggle.dataset.labelClose : toggle.dataset.labelOpen);
    navbar.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) requestAnimationFrame(() => fixWidows(navbar));
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  /* close the mobile menu when jumping to a section on this page */
  navbar.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* Leistungen mega menu: hover on desktop, click everywhere */
  if (dropdown) {
    const btn = dropdown.querySelector('button');
    const setOpen = (open) => {
      dropdown.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      if (open) requestAnimationFrame(() => fixWidows(dropdown));
    };
    let timer;
    dropdown.addEventListener('mouseenter', () => { if (desktop.matches) { clearTimeout(timer); setOpen(true); } });
    dropdown.addEventListener('mouseleave', () => { if (desktop.matches) timer = setTimeout(() => setOpen(false), 180); });
    btn.addEventListener('click', () => setOpen(!dropdown.classList.contains('is-open')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dropdown.classList.contains('is-open')) { setOpen(false); btn.focus(); } });
    document.addEventListener('click', (e) => { if (desktop.matches && !dropdown.contains(e.target)) setOpen(false); });
  }

  /* Service tabs */
  document.querySelectorAll('[data-tabs]').forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const imgs = [...root.querySelectorAll('.svc-media img')];
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.classList.toggle('is-active', on);
        panel.hidden = !on;
        if (on) fixWidows(panel);
      });
      imgs.forEach((img) => img.classList.toggle('is-active', img.dataset.for === tab.getAttribute('aria-controls')));
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (dir) { e.preventDefault(); select(tabs[(i + dir + tabs.length) % tabs.length], true); }
      });
    });
  });

  /* Scroll reveal */
  const els = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Button hover effects ---------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Arrow swap: duplicate the arrow so one can leave while the other slides in */
  document.querySelectorAll('.arrow-link__icon > svg, .svc-media__pill > svg, .split-card__panel h4 > svg, .project-card__meta > svg').forEach((svg) => {
    const box = document.createElement('span');
    box.className = 'icon-swap';
    if (svg.querySelector('use')?.getAttribute('href') === '#i-arrow-ne') box.classList.add('icon-swap--ne');
    svg.replaceWith(box);
    box.append(svg, svg.cloneNode(true));
  });

  /* Service tabs: wrap the label so it can slide next to the indicator line */
  document.querySelectorAll('.svc-tab').forEach((tab) => {
    const node = [...tab.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!node) return;
    const label = document.createElement('span');
    label.className = 'svc-tab__label';
    label.textContent = node.textContent.trim();
    node.replaceWith(label);
  });

  /* Letter roll: split labels into letters; screen readers get the plain text */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.button, .arrow-link, .svc-media__pill, .nav-menu > li > .nav-link').forEach((el) => {
      [...el.childNodes].forEach((node) => {
        const text = node.nodeType === 3 ? node.textContent.trim() : '';
        if (!text) return;
        const roll = document.createElement('span');
        roll.className = 'roll';
        roll.setAttribute('aria-hidden', 'true');
        roll.style.setProperty('--stagger', `${Math.min(14, 260 / text.length)}ms`);
        [...text].forEach((ch, i) => {
          const c = document.createElement('span');
          c.className = 'roll__c';
          c.textContent = ch;
          c.style.setProperty('--i', i);
          roll.append(c);
        });
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = text;
        node.replaceWith(roll, sr);
      });
    });

    /* Filled buttons get an arrow that slides in on hover */
    document.querySelectorAll('.button:not(.button--small)').forEach((btn) => {
      btn.insertAdjacentHTML('beforeend', '<svg class="button__arrow" aria-hidden="true"><use href="#i-arrow"/></svg>');
    });
  }

  /* Liquid fill: grow from where the cursor enters, drain toward where it leaves */
  document.querySelectorAll('.button').forEach((btn) => {
    const place = (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--x', `${e.clientX - r.left}px`);
      btn.style.setProperty('--y', `${e.clientY - r.top}px`);
      btn.style.setProperty('--d', `${Math.hypot(r.width, r.height) * 2.1}px`);
    };
    btn.addEventListener('pointerenter', place);
    btn.addEventListener('pointerleave', place);
  });

  /* Magnetic pull on round arrow icons */
  if (finePointer && !reduceMotion) {
    const clamp = (v, max) => Math.max(-max, Math.min(max, v));
    document.querySelectorAll('.arrow-link, .hero-contact').forEach((link) => {
      const icon = link.querySelector('.arrow-link__icon');
      if (!icon) return;
      link.addEventListener('pointermove', (e) => {
        const r = icon.getBoundingClientRect();
        icon.style.setProperty('--mx', `${clamp((e.clientX - r.left - r.width / 2) * 0.3, 8)}px`);
        icon.style.setProperty('--my', `${clamp((e.clientY - r.top - r.height / 2) * 0.3, 8)}px`);
      });
      link.addEventListener('pointerleave', () => {
        icon.style.removeProperty('--mx');
        icon.style.removeProperty('--my');
      });
    });
  }

  /* ---------- Calculator ----------
     ЗАГЛУШКА: орієнтовні ставки (€/м², лише роботи) – замінити реальними параметрами від клієнта */
  const CALC_RATES = {
    bad:      { name: 'Ремонт ванної',      unit: 'Площа ванної кімнати', min: 2,  max: 20,  value: 6,  rate: [650, 950], minTotal: 3500 },
    wohnung:  { name: 'Ремонт квартири',    unit: 'Площа квартири',       min: 20, max: 150, value: 60, rate: [160, 290], minTotal: 2500 },
    boden:    { name: 'Роботи з підлогою',  unit: 'Площа підлоги',        min: 5,  max: 150, value: 30, rate: [28, 55],   minTotal: 600 },
    maler:    { name: 'Малярні роботи',     unit: 'Площа стін і стель',   min: 10, max: 400, value: 80, rate: [18, 34],   minTotal: 500 },
    sanitaer: { name: 'Сантехнічні роботи', unit: 'Площа ванної кімнати', min: 2,  max: 20,  value: 6,  rate: [380, 620], minTotal: 1800 },
  };
  const LEVELS = { standard: ['Стандарт', 1], comfort: ['Комфорт', 1.2], premium: ['Преміум', 1.45] };
  const calc = document.querySelector('[data-calc]');
  const fmt = new Intl.NumberFormat('uk-UA');
  if (calc) {
    const area = calc.querySelector('[data-area]');
    const q = (sel) => calc.querySelector(sel);
    let lastService = null;
    const animateNumber = (el, to) => {
      const from = Number(el.dataset.value || to);
      el.dataset.value = to;
      if (reduceMotionPref || from === to) { el.textContent = fmt.format(to); return; }
      const start = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - start) / 500);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt.format(Math.round((from + (to - from) * e) / 10) * 10);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const update = () => {
      const data = new FormData(calc);
      const key = data.get('service');
      const svc = CALC_RATES[key];
      if (key !== lastService) { /* new service → its own area range */
        area.min = svc.min; area.max = svc.max; area.value = svc.value;
        q('[data-area-label]').textContent = svc.unit;
        lastService = key;
      }
      const m2 = Number(area.value);
      const [levelName, levelK] = LEVELS[data.get('level')];
      let k = levelK;
      if (data.get('demo')) k *= 1.1;
      if (data.get('materials')) k *= 1.6;
      if (data.get('urgent')) k *= 1.12;
      const round = (v) => Math.round(v / 50) * 50;
      const from = round(Math.max(svc.minTotal, m2 * svc.rate[0] * k));
      const to = round(Math.max(svc.minTotal * 1.3, m2 * svc.rate[1] * k));
      area.style.setProperty('--p', `${((m2 - svc.min) / (svc.max - svc.min)) * 100}%`);
      q('[data-area-out]').textContent = `${m2} м²`;
      animateNumber(q('[data-price-from]'), from);
      animateNumber(q('[data-price-to]'), to);
      const price = q('.calc__price');
      price.classList.remove('is-bump'); void price.offsetWidth; price.classList.add('is-bump');
      q('[data-sum-service]').textContent = svc.name;
      q('[data-sum-area]').textContent = `${m2} м²`;
      q('[data-sum-level]').textContent = levelName;
      q('[data-sum-materials]').textContent = data.get('materials') ? 'Враховано' : 'Не враховано';
      calc.dataset.summary = `Розрахунок калькулятора: ${svc.name}, ${m2} м², рівень «${levelName}» – орієнтовно ${fmt.format(from)}–${fmt.format(to)} €.`;
    };
    calc.addEventListener('input', update);
    calc.addEventListener('submit', (e) => e.preventDefault());
    update();

    /* "Отримати точний кошторис" → pre-fill the feedback form */
    q('[data-calc-apply]')?.addEventListener('click', () => {
      const form = document.querySelector('[data-lead-form]');
      if (!form) return;
      const service = new FormData(calc).get('service');
      const { elements: f } = form;
      if (f.service) f.service.value = service;
      if (f.message && !f.message.value.trim()) f.message.value = calc.dataset.summary;
      setTimeout(() => f.name?.focus({ preventScroll: true }), 700);
    });
  }

  /* ---------- Gallery: filter + lightbox ---------- */
  const gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    const items = [...gallery.querySelectorAll('.g-item')];
    /* Filter: fade the grid out, swap the layout while it's invisible, then let the photos glide in one by one */
    let switchTimer;
    let settleTimer;
    const applyFilter = (f) => {
      const shown = [];
      items.forEach((item) => {
        const show = f === 'all' || item.dataset.cat === f;
        item.hidden = !show;
        item.classList.remove('is-lead');
        if (show) shown.push(item);
      });
      gallery.classList.toggle('is-filtered', f !== 'all');
      gallery.style.setProperty('--cols', Math.min(shown.length, 4));
      if (f !== 'all' && shown.length % 2) shown[0].classList.add('is-lead');
      shown.forEach((item, i) => {
        item.style.setProperty('--i', i);
        item.classList.add('is-entering');
      });
      gallery.classList.remove('is-switching');
      void gallery.offsetWidth; /* commit the start state before animating in */
      shown.forEach((item) => item.classList.remove('is-entering'));
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => shown.forEach((item) => item.style.removeProperty('--i')), 1200);
    };
    document.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('is-active')) return;
        document.querySelectorAll('[data-filter]').forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        clearTimeout(switchTimer);
        if (reduceMotionPref) { applyFilter(btn.dataset.filter); return; }
        gallery.classList.add('is-switching');
        switchTimer = setTimeout(() => applyFilter(btn.dataset.filter), 200);
      });
    });

    const dialog = document.querySelector('[data-lightbox-dialog]');
    if (dialog && dialog.showModal) {
      const img = dialog.querySelector('[data-lb-img]');
      let list = [];
      let current = 0;
      let opener = null;
      const show = (i) => {
        current = (i + list.length) % list.length;
        const btn = list[current];
        const src = btn.querySelector('img');
        img.src = src.currentSrc || src.src;
        img.alt = src.alt;
        img.classList.remove('is-swapping'); void img.offsetWidth; img.classList.add('is-swapping');
        dialog.querySelector('[data-lb-meta]').textContent = btn.querySelector('.g-item__cap .mono')?.textContent || '';
        dialog.querySelector('[data-lb-title]').textContent = btn.querySelector('.g-item__title')?.textContent || '';
        dialog.querySelector('[data-lb-count]').textContent = `${current + 1} / ${list.length}`;
        if (dialog.open) fixWidows(dialog);
      };
      gallery.querySelectorAll('[data-lightbox]').forEach((btn) => {
        btn.addEventListener('click', () => {
          list = items.filter((it) => !it.hidden).map((it) => it.querySelector('[data-lightbox]'));
          opener = btn;
          show(list.indexOf(btn));
          dialog.showModal();
          fixWidows(dialog);
          document.body.style.overflow = 'hidden';
        });
      });
      dialog.querySelector('[data-lb-prev]').addEventListener('click', () => show(current - 1));
      dialog.querySelector('[data-lb-next]').addEventListener('click', () => show(current + 1));
      dialog.querySelector('[data-lb-close]').addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', (e) => { if (e.target === dialog || e.target.classList.contains('lightbox__inner')) dialog.close(); });
      dialog.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') show(current + 1);
        if (e.key === 'ArrowLeft') show(current - 1);
      });
      dialog.addEventListener('close', () => { document.body.style.overflow = ''; opener?.focus(); });
    }
  }

  /* ---------- How we work: progress line follows the scroll ---------- */
  const stepsWrap = document.querySelector('[data-steps]');
  if (stepsWrap) {
    const bar = stepsWrap.querySelector('[data-steps-progress]');
    const steps = [...stepsWrap.querySelectorAll('.step')];
    let ticking = false;
    const paint = () => {
      ticking = false;
      const mark = window.innerHeight * 0.6;
      const r = stepsWrap.getBoundingClientRect();
      bar.style.setProperty('--progress', Math.max(0, Math.min(1, (mark - r.top - 30) / (r.height - 60))));
      steps.forEach((st) => {
        const n = st.querySelector('.step__num').getBoundingClientRect();
        st.classList.toggle('is-active', n.top + n.height / 2 < mark);
      });
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  }

  /* ---------- Testimonials carousel ---------- */
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('[data-track]');
    const prev = root.querySelector('[data-prev]');
    const next = root.querySelector('[data-next]');
    const progress = root.querySelector('[data-progress]');
    const stepSize = () => {
      const card = track.querySelector('li');
      return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 24) : track.clientWidth;
    };
    const sync = () => {
      const max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
      progress.style.setProperty('--p', track.scrollWidth ? (track.scrollLeft + track.clientWidth) / track.scrollWidth : 1);
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -stepSize(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: stepSize(), behavior: 'smooth' }));
    track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  /* ---------- Feedback form ----------
     ЗАГЛУШКА: відправку потрібно підключити до бекенду / сервісу форм */
  document.querySelectorAll('[data-lead-form]').forEach((form) => {
    const rules = {
      name: (v) => v.trim().length >= 2,
      phone: (v) => v.replace(/[^\d]/g, '').length >= 7,
      email: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    };
    const check = (name) => {
      const el = form.elements[name];
      const ok = name === 'consent' ? el.checked : rules[name](el.value);
      const field = el.closest('.form-field');
      field?.classList.toggle('is-invalid', !ok);
      if (name === 'consent') form.querySelector('[data-error-for="consent"]').classList.toggle('is-shown', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    ['name', 'phone', 'email'].forEach((n) => form.elements[n].addEventListener('blur', () => { if (form.elements[n].value) check(n); }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fields = ['name', 'phone', 'email', 'consent'];
      const results = fields.map(check);
      if (results.every(Boolean)) {
        form.classList.add('is-sent');
        form.querySelector('.lead-form__success').focus?.();
      } else {
        form.elements[fields[results.indexOf(false)]].focus();
      }
    });
  });

  /* ---------- Typography: never leave a single word on a line ----------
     Runs after layout at the real width: a word left alone on a line is joined to the word
     before it with a non-breaking space – kept only if it reduces one-word lines and nothing
     overflows. Re-runs from the original text whenever the viewport width changes. */
  function fixWidows(root = document.body) {
    const SKIP = '.roll, .sr-only, .marquee, script, style, svg, textarea, select, option, .skip-link';
    const groups = new Map();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || !n.textContent.trim() || el.closest(SKIP)) continue;
      let blk = el;
      while (blk !== root && blk.parentElement && ['inline', 'contents'].includes(getComputedStyle(blk).display)) blk = blk.parentElement;
      if (!groups.has(blk)) groups.set(blk, []);
      groups.get(blk).push(n);
    }
    const measure = (nodes) => {
      const lines = [];
      nodes.forEach((n) => {
        const re = /[^\s\u00A0]+/g;
        let m;
        while ((m = re.exec(n.textContent))) {
          const r = document.createRange();
          r.setStart(n, m.index);
          r.setEnd(n, m.index + m[0].length);
          const rect = r.getClientRects()[0];
          if (!rect) continue;
          const tok = { n, s: m.index, e: m.index + m[0].length, real: /[\p{L}\d]/u.test(m[0]) };
          const line = lines[lines.length - 1];
          if (line && Math.abs(rect.top - line.top) < Math.max(4, rect.height * 0.4)) line.items.push(tok);
          else lines.push({ top: rect.top, items: [tok] });
        }
      });
      return lines;
    };
    const singles = (lines) => (lines.length < 2 ? 0 : lines.filter((l) => l.items.filter((t) => t.real).length === 1).length);
    groups.forEach((nodes, blk) => {
      for (let pass = 0; pass < 8; pass++) {
        const lines = measure(nodes);
        const before = singles(lines);
        if (!before) break;
        /* candidate fixes for every one-word line: glue it to the previous word or to the next one */
        const space = (n, at) => (at >= 0 && /[ \t\n\r]/.test(n.textContent[at] || '') ? { n, at } : null);
        const candidates = [];
        lines.forEach((l, k) => {
          if (l.items.filter((t) => t.real).length !== 1) return;
          const first = l.items[0];
          const last = l.items[l.items.length - 1];
          if (k > 0) {
            const prev = lines[k - 1].items[lines[k - 1].items.length - 1];
            candidates.push(space(first.n, first.s - 1) || (prev.n !== first.n ? space(prev.n, prev.e) : null));
          }
          if (k < lines.length - 1) {
            const next = lines[k + 1].items[0];
            candidates.push(space(last.n, last.e) || (next.n !== last.n ? space(next.n, next.s - 1) : null));
          }
        });
        let improved = false;
        for (const c of candidates) {
          if (!c) continue;
          const original = c.n.textContent;
          const width = blk.scrollWidth;
          c.n.textContent = original.slice(0, c.at) + '\u00A0' + original.slice(c.at + 1);
          if (blk.scrollWidth <= width + 1 && singles(measure(nodes)) < before) {
            if (!widowOriginals.has(c.n)) widowOriginals.set(c.n, original);
            improved = true;
            break;
          }
          c.n.textContent = original;
        }
        if (!improved) break;
      }
    });
  }
  const rewrap = () => {
    widowOriginals.forEach((text, node) => { node.textContent = text; });
    widowOriginals.clear();
    fixWidows();
  };
  let lastWidth = window.innerWidth;
  let rewrapTimer;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(rewrapTimer);
    rewrapTimer = setTimeout(rewrap, 150);
  });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => fixWidows());

  /* ---------- Hero background video ----------
     Respects reduced motion / data saver and pauses while off-screen. */
  const heroVideo = document.querySelector('[data-hero-video]');
  if (heroVideo) {
    const saveData = navigator.connection && navigator.connection.saveData;
    const stayPaused = Boolean(reduceMotionPref || saveData);
    const play = () => { const r = heroVideo.play(); if (r && r.catch) r.catch(() => {}); };
    if (stayPaused) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) heroVideo.pause();
        else if (!stayPaused) play();
      }, { threshold: 0.05 }).observe(heroVideo);
    }
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
