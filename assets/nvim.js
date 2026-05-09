// nvim-flavored interactivity for trung-dt.com
// Commands, keymaps, mode switching, theme toggle. Vanilla JS, zero deps.

(function () {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const cmd       = $('#cmd');
  const cmdForm   = $('#cmdform');
  const toast     = $('#toast');
  const help      = $('#helpOverlay');
  const modeEl    = $('#status-mode');
  const fileEl    = $('#status-file');
  const posEl     = $('#status-pos');
  const tabs      = $$('.nvim-tab');

  const TAB_TARGETS = {
    'whoami':  '#top',
    'news':    '#news',
    'pubs':    '#pubs',
    'contact': '#contact'
  };

  const TAB_FILES = {
    'whoami':  '~/trung-dao/whoami.lua',
    'news':    '~/trung-dao/news.md',
    'pubs':    '~/trung-dao/publications.bib',
    'contact': '~/trung-dao/contact.json',
    'blog':    '~/trung-dao/blog/'
  };

  // -------- mode + status -------------------------------------------------
  let mode = 'NORMAL';
  function setMode(m) {
    mode = m;
    if (!modeEl) return;
    modeEl.textContent = m;
    modeEl.classList.remove('cmd', 'ins', 'vis');
    if (m === 'COMMAND') modeEl.classList.add('cmd');
    if (m === 'INSERT')  modeEl.classList.add('ins');
    if (m === 'VISUAL')  modeEl.classList.add('vis');
  }

  function pulsePos() {
    if (!posEl) return;
    const pct = Math.max(0, Math.round((window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight)) * 100));
    if (window.scrollY < 80) { posEl.textContent = '16,11'; return; }
    posEl.textContent = `${pct}%`;
  }
  window.addEventListener('scroll', pulsePos, { passive: true });
  pulsePos();

  // -------- toast ---------------------------------------------------------
  let toastTimer;
  function echo(msg, kind) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('err', 'info');
    if (kind === 'err')  toast.classList.add('err');
    if (kind === 'info') toast.classList.add('info');
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  // -------- tabs ----------------------------------------------------------
  function activateTab(tabName) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    if (fileEl && TAB_FILES[tabName]) fileEl.textContent = TAB_FILES[tabName];
  }
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      const name = t.dataset.tab;
      if (name === 'blog') return; // real link
      activateTab(name);
    });
  });
  // sync tab on hash change
  window.addEventListener('hashchange', () => {
    const h = location.hash;
    const found = Object.entries(TAB_TARGETS).find(([, sel]) => sel === h);
    if (found) activateTab(found[0]);
  });

  // -------- theme ---------------------------------------------------------
  const THEMES = ['mocha', 'latte'];
  function applyTheme(name) {
    document.body.classList.remove('theme-mocha', 'theme-latte');
    document.body.classList.add('theme-' + name);
    try { localStorage.setItem('nvim-theme', name); } catch (_) {}
  }
  try {
    const saved = localStorage.getItem('nvim-theme');
    if (saved && THEMES.includes(saved)) applyTheme(saved);
  } catch (_) {}

  // -------- commands ------------------------------------------------------
  const COMMANDS = {
    help:    () => { help.classList.add('show'); help.setAttribute('aria-hidden', 'false'); echo(':help — press Esc to close', 'info'); },
    h:       () => COMMANDS.help(),
    about:   () => scrollTo('#top', 'whoami'),
    whoami:  () => scrollTo('#top', 'whoami'),
    news:    () => scrollTo('#news', 'news'),
    pubs:    () => scrollTo('#pubs', 'pubs'),
    publications: () => scrollTo('#pubs', 'pubs'),
    contact: () => scrollTo('#contact', 'contact'),
    blog:    () => { window.location.href = '/blog/'; },
    cv:      () => { window.open('/cv.pdf', '_blank'); echo('opening cv.pdf'); },
    gh:      () => { window.open('https://github.com/trungdt880', '_blank'); echo('→ github.com/trungdt880'); },
    github:  () => COMMANDS.gh(),
    scholar: () => { window.open('https://scholar.google.com/citations?user=FZmxEYYAAAAJ&hl=en', '_blank'); echo('→ google scholar'); },
    linkedin:() => { window.open('https://www.linkedin.com/in/trung-dt880', '_blank'); echo('→ linkedin'); },
    gallery: () => { window.open('https://www.flickr.com/photos/bomcon123456/', '_blank'); echo('→ gallery'); },
    goodreads: () => { window.open('https://www.goodreads.com/user/show/106769734-trung-dao', '_blank'); echo('→ goodreads'); },
    email:   () => { window.location.href = 'mailto:tdao6@wisc.edu'; echo('opening mail client…'); },
    theme:   (arg) => {
      const t = (arg || '').trim().toLowerCase() || 'mocha';
      if (!THEMES.includes(t)) { echo(`E: theme '${t}' not found. try mocha|latte`, 'err'); return; }
      applyTheme(t);
      echo(`theme=${t}`, 'info');
    },
    set:     (arg) => {
      const m = /^theme=(\w+)/.exec((arg || '').trim());
      if (m) return COMMANDS.theme(m[1]);
      echo(`E: unknown :set ${arg || ''}`, 'err');
    },
    q:       () => echo('E37: no write since last change. try :wq', 'err'),
    'q!':    () => echo('bye 👋 (in spirit)', 'info'),
    wq:      () => echo('saved. see you in /pubs ♥', 'info'),
    quit:    () => COMMANDS.q(),
    clear:   () => { echo(''); toast.classList.remove('show'); },
    sudo:    (arg) => {
      if ((arg || '').trim() === 'make me a sandwich') {
        echo('🥪 here you go.', 'info');
      } else {
        echo('permission denied. nice try 😏', 'err');
      }
    },
    vim:     () => echo('we are already in vim. metavim engaged.', 'info'),
    emacs:   () => echo('E: ctrl+x ctrl+c not bound. you sure?', 'err'),
    ':':     () => echo('E492: not an editor command: ::', 'err'),
  };

  function scrollTo(selector, tabName) {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (tabName) activateTab(tabName);
    }
  }

  function runCommand(raw) {
    const input = raw.replace(/^:+/, '').trim();
    if (!input) return;
    const [name, ...rest] = input.split(/\s+/);
    const arg = rest.join(' ');
    const fn = COMMANDS[name.toLowerCase()];
    if (fn) {
      fn(arg);
    } else {
      echo(`E492: not an editor command: ${name}`, 'err');
    }
  }

  // -------- cmdline focus / submit ---------------------------------------
  cmdForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runCommand(cmd.value);
    cmd.value = '';
    cmd.blur();
    setMode('NORMAL');
  });
  cmd.addEventListener('focus', () => setMode('COMMAND'));
  cmd.addEventListener('blur',  () => setMode('NORMAL'));
  cmd.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cmd.value = '';
      cmd.blur();
    }
  });

  // -------- global keymaps -----------------------------------------------
  let lastKey = '';
  let lastKeyAt = 0;

  document.addEventListener('keydown', (e) => {
    // ignore when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === ':') { e.preventDefault(); cmd.focus(); return; }
    if (e.key === '?') { e.preventDefault(); COMMANDS.help(); return; }
    if (e.key === 'Escape') {
      help.classList.remove('show');
      help.setAttribute('aria-hidden', 'true');
      return;
    }

    // gg / G
    if (e.key === 'g') {
      const now = Date.now();
      if (lastKey === 'g' && now - lastKeyAt < 500) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        echo('gg', 'info');
        lastKey = ''; return;
      }
      lastKey = 'g'; lastKeyAt = now; return;
    }
    if (e.key === 'G') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      echo('G', 'info');
      lastKey = ''; return;
    }
    if (e.key === 'j') { window.scrollBy({ top: 80,  behavior: 'smooth' }); lastKey=''; return; }
    if (e.key === 'k') { window.scrollBy({ top: -80, behavior: 'smooth' }); lastKey=''; return; }

    // numeric jump
    const numToTab = { '1':'whoami', '2':'news', '3':'pubs', '4':'contact' };
    if (numToTab[e.key]) {
      const t = numToTab[e.key];
      scrollTo(TAB_TARGETS[t], t);
      echo(':b' + e.key, 'info');
      lastKey = ''; return;
    }
    if (e.key === '5') { window.location.href = '/blog/'; return; }

    lastKey = e.key;
  });

  // close help on click outside panel
  help.addEventListener('click', (e) => {
    if (e.target === help) {
      help.classList.remove('show');
      help.setAttribute('aria-hidden', 'true');
    }
  });

  // -------- konami easter egg --------------------------------------------
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let kIdx = 0;
  document.addEventListener('keydown', (e) => {
    const want = KONAMI[kIdx];
    if (e.key === want || e.key.toLowerCase() === want) {
      kIdx++;
      if (kIdx === KONAMI.length) {
        kIdx = 0;
        rainMatrix();
      }
    } else {
      kIdx = 0;
    }
  });

  function rainMatrix() {
    echo('☄ matrix mode ☄', 'info');
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:90;pointer-events:none;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const cols = Math.floor(canvas.width / 14);
    const drops = Array(cols).fill(0).map(() => Math.random() * -100);
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01TRUNGDAO{}();=';
    let frames = 0;
    const tick = () => {
      ctx.fillStyle = 'rgba(17,17,27,0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px JetBrainsMono, monospace';
      ctx.fillStyle = '#cba6f7';
      drops.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * 14, y * 14);
        drops[i] = (y * 14 > canvas.height && Math.random() > 0.975) ? 0 : y + 1;
      });
      frames++;
      if (frames < 360) requestAnimationFrame(tick);
      else { canvas.remove(); }
    };
    tick();
  }

  // -------- nudge: pulse cmdline once on load to show interactivity ------
  setTimeout(() => {
    if (toast && !toast.classList.contains('show')) {
      echo('hint: press : to enter command mode, ? for help', 'info');
    }
  }, 1400);

  // sync initial tab from hash
  if (location.hash) {
    const found = Object.entries(TAB_TARGETS).find(([, sel]) => sel === location.hash);
    if (found) activateTab(found[0]);
  }
})();
