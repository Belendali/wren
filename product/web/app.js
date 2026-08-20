/* ══════════════════════════════════════════════════════
   Wren —— 从「说出一件事」到「听完它」的完整链路。

   屏的顺序和 Figma 主流程 section 一一对应：
     home → listening → heard / offer → generating → picker
          → intro → player → finish
   ══════════════════════════════════════════════════════ */

/* ── 小工具 ─────────────────────────────────────── */
const $ = (s, r = document) => r.querySelector(s);

function el(tag, props = {}, ...kids) {
  const [t, ...cls] = tag.split('.');
  const n = document.createElement(t || 'div');
  if (cls.length) n.className = cls.join(' ');
  for (const [k, v] of Object.entries(props)) {
    if (k === 'html') n.innerHTML = v;
    else if (k === 'style') Object.assign(n.style, v);
    else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(k));
  return n;
}

const icon = (name, cls = '') => el('img' + (cls ? '.' + cls : ''), { src: 'assets/icon/' + name, alt: '' });
const iconBtn = (name, cls, onclick) =>
  el('button.icon-btn' + (cls ? '.' + cls.split(' ').join('.') : ''), { onclick, type: 'button' }, icon(name));

const mmss = (s) => {
  s = Math.max(0, Math.round(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

/* ── 状态 ───────────────────────────────────────── */
const KEY = 'wren.product.v1';
const COVERS = [
  'assets/img/cover-podium.png',
  'assets/covers/cover-1.jpg', 'assets/covers/cover-2.jpg', 'assets/covers/cover-3.jpg',
  'assets/covers/cover-4.jpg', 'assets/covers/cover-5.jpg', 'assets/covers/cover-6.jpg',
  'assets/covers/cover-7.jpg'
];

let S = load();
function fresh() {
  return {
    // onboarding 会往这个对象里灌数据。dream 是最要紧的一项 ——
    // Home 上的每日三段和快捷入口都从它派生。
    profile: { name: '', people: [], bodyAnchor: 'chest', desire: '', work: '', dream: '' },
    account: null,        // Auth.current() —— 真鉴权接进来时这里放 provider 返回的身份
    onboarded: false,
    today: null,          // { date, sessions, suggestions } —— 隔天重新拿
    history: [],
    ambient: true
  };
}
const todayKey = () => new Date().toISOString().slice(0, 10);
function load() {
  let base;
  try { base = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch (_) { base = fresh(); }
  // 身份单独存在 auth.js 那边，以它为准
  base.account = Auth.current() || base.account || null;
  return base;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} }
window.wrenReset = () => { localStorage.removeItem(KEY); Auth.forget(); location.reload(); };

// 一次会话内的临时状态
let draft = { text: '', offered: false, refusals: 0 };
let run = { sessions: [], chosen: 0, played: [], source: '', intent: '' };

/* 同一句话每次进来配同一张封面 —— 她回到 Library 时要认得出。 */
function hashOf(seed) {
  let h = 0;
  const str = String(seed || '');
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function coverFor(seed) { return COVERS[hashOf(seed) % COVERS.length]; }

/* 一排卡片里不要出现两张一样的图 —— 只有 8 张，撞得很容易。
   仍然是确定性的：同一组标题永远得到同一组图。 */
function coversFor(seeds) {
  const used = new Set();
  return seeds.map(seed => {
    let i = hashOf(seed) % COVERS.length;
    for (let n = 0; n < COVERS.length && used.has(i); n++) i = (i + 1) % COVERS.length;
    used.add(i);
    return COVERS[i];
  });
}

/* ── 路由 ───────────────────────────────────────── */
const SURFACE = {
  home: 'clay', listening: 'clay', heard: 'clay', offer: 'clay',
  generating: 'clay', picker: 'clay',
  intro: 'dark', player: 'dark', finish: 'dark'
};
// onboarding 整段用 morning 那张底，不是 Home 的陶土色
const surfaceFor = (name) => name.startsWith('ob-') ? 'morning' : (SURFACE[name] || 'clay');
const PHOTO = ['intro', 'player', 'finish'];

let current = null;
let currentName = '';

function go(name, data) {
  const build = SCREENS[name];
  if (!build) return;
  const old = current;
  const node = build(data || {});
  node.classList.add('screen');
  node.dataset.screen = name;
  $('#stage').append(node);

  const phone = $('#phone');
  phone.dataset.surface = surfaceFor(name);
  phone.classList.toggle('on-photo', PHOTO.includes(name));
  currentName = name;

  if (old) {
    old.classList.add('leaving');
    old.classList.remove('on');
    setTimeout(() => old.remove(), 420);
  }
  current = node;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('on'), 2800);
}

/* ── 复用块 ─────────────────────────────────────── */
function statusClock() {
  const now = new Date();
  $('#clock').textContent = now.getHours() % 12 || 12;
  $('#clock').textContent += ':' + String(now.getMinutes()).padStart(2, '0');
}

function waveBars(n = 30) {
  const w = el('div.wave');
  for (let i = 0; i < n; i++) w.append(el('i', { style: { height: '8px' } }));
  return w;
}

function driveWave(bars) {
  Speech.meter(v => {
    [...bars.children].forEach((b, i) => {
      const h = 8 + v * 64 * (.4 + Math.abs(Math.sin(Date.now() / 150 + i * .7)) * .6);
      b.style.height = Math.min(72, h) + 'px';
    });
  });
}

function scene(src, playing) {
  return el('div.scene' + (playing ? '.playing' : ''), {},
    el('div.shot', { style: { backgroundImage: `url('${src}')` } }),
    el('div.dim'),
    el('div.top-scrim'),
    el('div.bottom-scrim'));
}

/* ══════════════════════════════════════════════════
   01 · Home
   ══════════════════════════════════════════════════ */
function homeScreen() {
  const name = (S.profile.name || 'Hey').trim();
  const input = el('input', {
    type: 'text',
    placeholder: 'Say it out loud…',
    autocomplete: 'off',
    autocapitalize: 'sentences',
    enterkeyhint: 'go',
    value: draft.text || ''
  });

  const submit = () => {
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    draft.text = text;
    checkThenGenerate(text);
  };

  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  // 有字就是发送箭头，空的时候是麦克风 —— 语音是设定的一部分，默认露在外面
  const round = el('button.round', { type: 'button' });
  const paint = () => {
    round.innerHTML = '';
    round.append(icon(input.value.trim() ? 'send-52.svg' : 'mic-52.svg'));
  };
  round.addEventListener('click', () => {
    if (input.value.trim()) return submit();
    if (!Speech.canListen()) { input.focus(); return toast('这个浏览器不支持语音，先打字吧'); }
    go('listening');
  });
  input.addEventListener('input', paint);
  paint();

  /* 快捷入口：她 onboarding 里说过的话，点一下就填进输入框 */
  const chips = el('div.home-suggestions', {});
  const paintChips = (list) => {
    chips.innerHTML = '';
    (list || []).forEach(text => chips.append(el('button.suggestion', {
      type: 'button',
      onclick: () => { input.value = text; paint(); input.focus(); }
    }, text)));
  };
  paintChips(S.today && S.today.suggestions);

  /* For you today —— 她还没开口，Wren 先带回来的三段 */
  const rail = el('div.session-rail', {});
  const paintRail = (sessions) => {
    rail.innerHTML = '';
    if (!sessions) {
      for (let i = 0; i < 3; i++) rail.append(el('div.session-card.skeleton', {}, el('div.art'), el('div.body')));
      return;
    }
    const covers = coversFor(sessions.map(s => s.title));
    sessions.forEach((session, i) => {
      rail.append(el('button.session-card', {
        type: 'button',
        onclick: () => {
          run = { sessions, chosen: i, played: [], source: S.today.source || '', intent: S.profile.dream || '' };
          go('intro');
        }
      },
        el('div.art', {},
          el('img', { src: `assets/img/art-${session.art}.jpg`, alt: '' }),
          el('img.photo', { src: covers[i], alt: '' }),
          el('p.caption.mins', {}, session.label)),
        el('div.body', {}, el('h3', {}, session.title))));
    });
  };
  paintRail(S.today && S.today.sessions);

  loadToday().then(today => {
    if (currentName !== 'home' || !today) return;
    paintChips(today.suggestions);
    paintRail(today.sessions);
  });

  const tab = (name, label, onclick, on) =>
    el('button.icon-btn.tab' + (on ? '.on' : ''), { type: 'button', 'aria-label': label, onclick }, icon(name));

  return el('div.home', {},
    el('div.home-hero', {}, el('img', { src: 'assets/img/home-hero.png', alt: '' })),
    el('div.home-head', {},
      el('p.wordmark', {}, 'Wren'),
      el('div.home-actions', {},
        iconBtn('frost-saved.svg', '', () => toast('Saved —— 这一期先不做')),
        iconBtn('frost-history.svg', '', () => showHistory()))),
    el('div.home-ask', {},
      el('h1', {}, `${name}, what do you want to manifest today?`),
      el('div.home-input', {}, el('div.pill', {}, input, round), chips)),
    el('div.for-you', {}, el('h2', {}, 'For you today')),
    rail,
    el('div.tabbar', {},
      tab('tab-home.svg', 'Home', () => {}, true),
      tab('tab-library.svg', 'Library', () => toast('Library —— 这一期先不做')),
      tab('tab-me.svg', 'Me', () => toast('Me —— 这一期先不做'))));
}

/* 每天第一次进 Home 时拿一次。当天已经有了就不再请求。 */
let todayPending = null;
function loadToday() {
  if (S.today && S.today.date === todayKey()) return Promise.resolve(S.today);
  if (todayPending) return todayPending;
  todayPending = API.daily(withRecent(S.profile))
    .then(res => {
      S.today = {
        date: todayKey(),
        sessions: res.sessions,
        suggestions: res.suggestions,
        source: res.source
      };
      save();
      return S.today;
    })
    .catch(err => { console.warn('[wren] 每日推荐拿不到：', err); return null; })
    .finally(() => { todayPending = null; });
  return todayPending;
}

/* 把最近听过的标题带上，免得每天推同样的三段 */
function withRecent(profile) {
  return Object.assign({}, profile, {
    recentTitles: S.history.slice(0, 12).map(h => h.title)
  });
}

function showHistory() {
  if (!S.history.length) return toast('还没有记录 —— 先说一件事');
  const last = S.history[0];
  toast('上一次：' + last.intent.slice(0, 40));
}

/* ══════════════════════════════════════════════════
   02 · Home speak —— 在听
   ══════════════════════════════════════════════════ */
function listeningScreen() {
  const bars = waveBars(30);
  const live = el('p.live', {});
  const timer = el('p', {
    style: { font: '400 22px/28px var(--serif)', color: 'var(--fg-secondary)', textAlign: 'center', width: '390px', margin: '0' }
  }, '0:00');

  let heard = '';
  let t0 = Date.now();
  const tick = setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    timer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, 500);

  const paint = (text) => {
    live.innerHTML = '';
    live.append(text || '');
    live.append(el('i.cursor'));
    live.scrollTop = live.scrollHeight;   // 封了高度，最新那句要自己滚上来
  };
  paint('');

  const cleanup = () => { clearInterval(tick); Speech.stopMeter(); };
  const finish = (text) => {
    cleanup();
    draft.text = (text || heard).trim();
    if (!draft.text) { go('home'); return; }
    go('heard');
  };

  driveWave(bars);
  Speech.listen({
    onPartial: t => { heard = t; paint(t); },
    onFinal: t => finish(t || heard),
    onError: () => { cleanup(); toast('麦克风用不了 —— 打字也行'); go('home'); }
  });

  return el('div.speak', {},
    el('div.head', {}, el('p.wordmark', {}, 'Wren')),
    el('div.speaking', {},
      el('p.q.dim', {}, `${S.profile.name}, what do you want to manifest today?`),
      live),
    el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' } },
      bars,
      timer,
      el('p.label', { style: { color: 'var(--fg-muted)', textAlign: 'center', width: '390px' } }, "Wren's listening"),
      el('button.mic-big', { type: 'button', onclick: () => Speech.stopListening() }, el('div.square')),
      iconBtn('cancel-26.svg', 'cancel', () => { Speech.stopListening(); cleanup(); go('home'); })));
}

/* ══════════════════════════════════════════════════
   03 · Speak clear —— Wren heard
   ══════════════════════════════════════════════════ */
function heardScreen() {
  const field = el('textarea', { rows: 4, spellcheck: 'false' });
  field.value = draft.text;

  const go_ = () => {
    const text = field.value.trim();
    if (!text) { field.focus(); return; }
    draft.text = text;
    checkThenGenerate(text);
  };

  return el('div.speak', {},
    el('div.head', {}, el('p.wordmark', {}, 'Wren')),
    el('div.heard', {},
      el('p.q', {}, `${S.profile.name}, what do you want to manifest today?`),
      el('p.caption.cap', {}, 'Wren heard'),
      el('div.heard-field', {}, field),
      el('p.heard-hint', {}, 'Tap to fix anything it misheard.'),
      el('button.chip.again', {
        type: 'button',
        onclick: () => { draft.text = ''; go('listening'); }
      }, icon('mic-18.svg'), 'Say it again')),
    el('button.btn.speak-cta', { type: 'button', onclick: go_ }, "That's it"));
}

/* ══════════════════════════════════════════════════
   04 · Speak not clear —— 转译层
   小鸟从不说「太模糊」。它说：这个我能带，不过……
   ══════════════════════════════════════════════════ */
function offerScreen({ reflection, options }) {
  const take = (extra) => {
    const base = draft.text.replace(/[.。!?]+$/, '').trim();
    draft.text = extra ? `${base} — ${extra}.` : draft.text;
    generateNow(draft.text);
  };

  const chips = el('div.offer-chips', {});
  (options || []).forEach(o => chips.append(el('button.chip', { type: 'button', onclick: () => take(o) }, o)));
  // 「就按我说的带上去」这个出口必须一直在，而且不能做得像放弃
  chips.append(el('button.chip', {
    type: 'button',
    onclick: () => { draft.refusals++; take(null); }
  }, 'Take it as I said it  →'));

  return el('div.speak', {},
    el('div.head', {}, el('p.wordmark', {}, 'Wren')),
    el('div.transcript', {},
      el('p', {
        style: { margin: '0', font: '400 23px/33px var(--serif)', fontVariationSettings: 'var(--wonk)' }
      }, draft.text),
      el('p.reflect', {}, reflection || 'I can carry that.\nIt flies further if I know what it looks like.'),
      chips),
    el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' } },
      el('button.icon-btn.mic-idle', {
        type: 'button',
        onclick: () => { draft.text = ''; go('listening'); }
      }, icon('mic-96.svg')),
      iconBtn('cancel-26.svg', 'cancel', () => go('home'))));
}

/* ══════════════════════════════════════════════════
   05 · Generating
   ══════════════════════════════════════════════════ */
function generatingScreen() {
  return el('div', {},
    // 底下那层是被吹虚的 Home —— 她还没离开这个房间
    el('div.gen-blur', {},
      el('div.home-hero', {}, el('img', { src: 'assets/img/home-hero.png', alt: '' })),
      el('div.home-head', {}, el('p.wordmark', {}, 'Wren')),
      el('div.home-ask', {},
        el('h1', {}, `${S.profile.name}, what do you want to manifest today?`),
        el('div.pill', {}, el('div', { style: { flex: '1' } }), el('div.round')))),
    el('div.gen-scrim'),
    iconBtn('back-28.svg', 'abs back-28', () => { cancelGeneration(); go('home'); }),
    el('img.gen-bird', { src: 'assets/img/wren-bird-flying-up-transparent.webp', alt: '' }),
    el('p.display-lg.gen-title', {}, "Wren's gone with it."),
    el('p.body.gen-sub', {}, "Take three breaths. It won't be long."));
}

/* ══════════════════════════════════════════════════
   06 · Vision Picker
   ══════════════════════════════════════════════════ */
function pickerScreen() {
  const rail = el('div.vp-rail', {});
  const dots = el('div.vp-dots', {});

  run.sessions.forEach((session, i) => {
    const art = el('div.art', {},
      el('img', { src: `assets/img/art-${session.art}.jpg`, alt: '' }),
      el('p.caption.cap', {}, `Session 0${i + 1} · ${session.label}`));
    // active 那张才盖照片 —— 你在的那张才对上焦
    const photo = el('img.photo', {
      src: coverFor(session.title),
      alt: '',
      style: { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover', opacity: '0', transition: 'opacity .32s var(--ease)' }
    });
    art.insertBefore(photo, art.lastChild);
    if (i !== 1) art.append(el('img', {
      src: 'assets/icon/orb-mark.svg', alt: '',
      style: { position: 'absolute', left: '50%', top: '38%', transform: 'translate(-50%,-50%)', width: '64px', opacity: '.9' }
    }));

    const card = el('button.vision', { type: 'button', 'data-i': i },
      art,
      el('div.body', {},
        el('h3', {}, session.title),
        el('img.play', { src: 'assets/icon/play-63.svg', alt: 'Play' })));

    card.addEventListener('click', () => {
      if (Number(card.dataset.i) !== run.chosen) return centre(i);
      choose(i);
    });
    rail.append(card);
    dots.append(el('i'));
  });

  const cards = () => [...rail.querySelectorAll('.vision')];

  function mark(i) {
    run.chosen = i;
    cards().forEach((c, n) => {
      c.classList.toggle('active', n === i);
      c.classList.toggle('peek-left', n < i);
      c.classList.toggle('peek-right', n > i);
      const p = c.querySelector('.photo');
      if (p) p.style.opacity = n === i ? '.8' : '0';
    });
    [...dots.children].forEach((d, n) => d.classList.toggle('on', n === i));
  }

  function centre(i) {
    const c = cards()[i];
    if (c) rail.scrollTo({ left: c.offsetLeft - (390 - 292) / 2 + 0, behavior: 'smooth' });
    mark(i);
  }

  let idle = null;
  rail.addEventListener('scroll', () => {
    clearTimeout(idle);
    idle = setTimeout(() => {
      const mid = rail.scrollLeft + 195;
      let best = 0, dist = 1e9;
      cards().forEach((c, n) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < dist) { dist = d; best = n; }
      });
      mark(best);
    }, 90);
  });

  const node = el('div', {},
    iconBtn('vp-back.svg', 'abs back-28', () => go('home')),
    el('img.vp-bird', { src: 'assets/img/bird-perch.gif', alt: '' }),
    el('h1.vp-title', { html: 'Wren came back<br><em>with three.</em>' }),
    rail,
    dots,
    el('p.caption.vp-hint', {}, '‹  Swipe to the one you want  ›'));

  // 第二张是设计稿里的默认位 —— 从中间那张进
  setTimeout(() => { const c = cards()[1]; if (c) { rail.scrollLeft = c.offsetLeft - 49; } mark(1); }, 30);
  return node;
}

function choose(i) {
  run.chosen = i;
  go('intro');
}

/* ══════════════════════════════════════════════════
   07 · Story Intro —— 音频在准备
   ══════════════════════════════════════════════════ */
function introScreen() {
  const session = run.sessions[run.chosen];
  const cover = coverFor(session.title);
  const bar = el('i');
  const pct = el('p.abs.intro-pct', {}, '0%');
  const status = el('p.body.abs.intro-status', {}, 'Coming back to you…');
  let cancelled = false;

  const setPct = (v) => {
    const n = Math.max(0, Math.min(1, v));
    bar.style.width = (n * 100) + '%';
    pct.textContent = Math.round(n * 100) + '%';
  };

  (async () => {
    const prepared = await Player.prepare(session, { onProgress: setPct });
    if (cancelled) return;
    setPct(1);
    status.textContent = 'It came back.';
    if (!prepared.real && API.realVoice) toast('这一段用浏览器的声音念 —— TTS 没接上');
    setTimeout(() => { if (!cancelled) go('player', { prepared }); }, 620);
  })();

  return el('div', {},
    scene(cover, false),
    el('button.icon-btn.abs.close-46', {
      type: 'button',
      onclick: () => { cancelled = true; Player.stop(); go('picker'); }
    }, icon('close-46.svg')),
    el('p.display-xl.abs.intro-line', {}, session.openingLine),
    status,
    el('div.abs.intro-track', {}, bar),
    pct);
}

/* ══════════════════════════════════════════════════
   08 · Player
   ══════════════════════════════════════════════════ */
function playerScreen({ prepared }) {
  const session = run.sessions[run.chosen];
  const cover = coverFor(session.title);

  const line = el('p.display-xl.abs.player-line', {}, session.segments[0].text);
  const marquee = el('div.abs.player-marquee', {});
  const fill = el('i');
  const knob = el('div.abs.player-knob');
  const elapsed = el('p.abs.player-elapsed', {}, '00:00');
  const remain = el('p.abs.player-remain', {}, '-' + mmss(prepared.total));
  const track = el('div.abs.player-track', {}, fill);

  const bigGlyph = el('img', { src: 'assets/icon/p-pause88.svg', alt: 'Pause' });
  const bigBtn = el('button.big', { type: 'button', onclick: () => Player.toggle() }, bigGlyph);

  const loopBtn = el('button.icon-btn.abs.player-loop', { type: 'button' }, icon('p-loop.svg'));
  let looping = false;
  loopBtn.addEventListener('click', () => {
    looping = !looping;
    Player.setLoop(looping);
    loopBtn.classList.toggle('on', looping);
    toast(looping ? '这一段会一直循环' : '循环关了');
  });

  const ambientBtn = el('button.icon-btn.sm' + (S.ambient ? '.on' : ''), { type: 'button' }, icon('p-ambient.svg'));
  ambientBtn.addEventListener('click', () => {
    S.ambient = !S.ambient; save();
    Speech.setBird(S.ambient);
    ambientBtn.classList.toggle('on', S.ambient);
    toast(S.ambient ? '鸟叫开着' : '鸟叫关了');
  });
  Speech.setBird(S.ambient);

  const likeBtn = el('button.icon-btn.sm', { type: 'button' }, icon('p-like.svg'));
  likeBtn.addEventListener('click', () => { likeBtn.classList.toggle('on'); });

  /* 全文。她想读的时候能读到 —— 这是「回来的是你自己的话」的证据。 */
  const sheet = el('div.sheet', {}, ...session.segments.map(s => el('p', {}, s.text)));
  const scrim = el('div.scrim', { onclick: () => closeSheet() });
  const openSheet = () => { scrim.classList.add('on'); sheet.classList.add('on'); };
  const closeSheet = () => { scrim.classList.remove('on'); sheet.classList.remove('on'); };

  const node = el('div', {},
    scene(cover, true),
    el('button.icon-btn.abs.back-46', { type: 'button', onclick: () => { Player.stop(); go('picker'); } }, icon('p-back46.svg')),
    el('button.icon-btn.abs.close-46', { type: 'button', onclick: () => toast('播放设置 —— 这一期先不做') }, icon('p-settings.svg')),
    el('p.player-brand.abs', {}, 'Wren'),
    line,
    el('button.frost.abs.player-read', { type: 'button', onclick: openSheet }, icon('p-book.svg'), 'Read what came back'),
    marquee,
    loopBtn,
    track, knob, elapsed, remain,
    el('div.abs.transport', {},
      likeBtn,
      el('button.icon-btn.md', { type: 'button', onclick: () => Player.nudge(-10) }, icon('p-back10.svg')),
      bigBtn,
      el('button.icon-btn.md', { type: 'button', onclick: () => Player.nudge(10) }, icon('p-fwd10.svg')),
      ambientBtn),
    el('button.frost.abs.player-share', { type: 'button', onclick: () => share(session) }, icon('p-share.svg'), 'Share'),
    scrim, sheet);

  // 拖动进度
  const seekAt = (clientX) => {
    const r = track.getBoundingClientRect();
    Player.seek(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * Player.total);
  };
  track.addEventListener('pointerdown', (e) => {
    track.setPointerCapture(e.pointerId);
    seekAt(e.clientX);
    const move = (ev) => seekAt(ev.clientX);
    const up = () => { track.removeEventListener('pointermove', move); track.removeEventListener('pointerup', up); };
    track.addEventListener('pointermove', move);
    track.addEventListener('pointerup', up);
  });

  Player.start(prepared, {
    onLine: (i, text) => {
      line.style.opacity = '0';
      setTimeout(() => { line.textContent = text; line.style.opacity = '1'; }, 220);
      const next = session.segments[i + 1];
      marquee.textContent = next ? next.text : session.carry;
      [...sheet.children].forEach((p, n) => p.classList.toggle('now', n === i));
      // 读全文的时候，当前这句要自己跟上来
      if (sheet.classList.contains('on') && sheet.children[i]) {
        sheet.scrollTo({ top: Math.max(0, sheet.children[i].offsetTop - 180), behavior: 'smooth' });
      }
    },
    onProgress: (t, total) => {
      const f = total ? t / total : 0;
      fill.style.width = (f * 100) + '%';
      knob.style.left = (28 + f * 334 - 4) + 'px';
      elapsed.textContent = mmss(t);
      remain.textContent = '-' + mmss(total - t);
    },
    onState: (paused) => {
      bigGlyph.src = 'assets/icon/p-' + (paused ? 'play88' : 'pause88') + '.svg';
      bigGlyph.alt = paused ? 'Play' : 'Pause';
    },
    onDone: () => {
      if (!run.played.includes(run.chosen)) run.played.push(run.chosen);
      remember();
      go('finish');
    }
  });

  return node;
}

function share(session) {
  const text = `${session.title}\n\n— Wren`;
  if (navigator.share) navigator.share({ title: 'Wren', text }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('复制好了'));
  else toast(session.title);
}

/* ══════════════════════════════════════════════════
   09 · Finish · 1 of 3
   ══════════════════════════════════════════════════ */
function finishScreen() {
  const done = run.played.length;
  const nextIndex = run.sessions.findIndex((_, i) => !run.played.includes(i));
  const next = nextIndex >= 0 ? run.sessions[nextIndex] : null;
  const cover = coverFor(run.sessions[run.chosen].title);

  const dots = el('div.dots', {}, ...run.sessions.map((_, i) =>
    el('i' + (run.played.includes(i) ? '.done' : ''))));

  const bar = el('i');
  let timer = null, countdown = null;

  const goNext = () => {
    clearTimeout(timer); clearInterval(countdown);
    if (nextIndex < 0) return go('home');
    run.chosen = nextIndex;
    go('intro');
  };

  const upNext = next
    ? el('button.up-next', { type: 'button', onclick: goNext },
        el('p.caption', {}, `UP NEXT · ${next.label}`),
        el('h3', {}, next.title))
    : null;

  const wrap = el('div', {},
    scene(cover, false),
    el('div.finish-scrim'),
    el('button.icon-btn.abs.back-46', { type: 'button', onclick: () => { clearTimeout(timer); clearInterval(countdown); go('home'); } }, icon('exit-back-46.svg')),
    el('p.player-brand.abs', {}, 'Wren'),
    el('div.finish', {},
      dots,
      el('p.caption.kicker', {}, `${['ONE', 'TWO', 'THREE'][done - 1] || 'ONE'} OF THREE · COMPLETE`),
      el('h2.display-lg', {}, 'Let it feel real.'),
      el('p.body.sub', {}, next
        ? `Feel it as if it were already here. Wren has ${3 - done === 1 ? 'one more' : 'two more'} for you.`
        : 'Feel it as if it were already here. That was all three.'),
      upNext ? el('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingTop: '30px' } },
        upNext,
        el('div.countdown', {}, bar),
        el('p.caption', { style: { color: 'var(--fg-muted)', opacity: '.82' } }, 'AUTOPLAY IN 8 SECONDS')) : null,
      el('div.actions', {},
        el('button.btn', { type: 'button', onclick: goNext }, next ? 'Continue' : 'Back to Home'),
        next ? el('button.btn-ghost', { type: 'button', onclick: () => { clearTimeout(timer); clearInterval(countdown); go('home'); } }, 'Back to Home') : null)));

  if (next) {
    // 自动续播。她闭着眼睛的时候，不该需要动手。
    let left = 8;
    bar.style.transition = 'transform 8s linear';
    setTimeout(() => { bar.style.transform = 'scaleX(0)'; }, 30);
    countdown = setInterval(() => {
      left -= 1;
      const label = wrap.querySelector('.countdown + .caption');
      if (label) label.textContent = `AUTOPLAY IN ${left} SECOND${left === 1 ? '' : 'S'}`;
    }, 1000);
    timer = setTimeout(goNext, 8200);
  }
  return wrap;
}

/* ══════════════════════════════════════════════════
   生成链路
   ══════════════════════════════════════════════════ */
let generation = null;

function cancelGeneration() { generation = null; }

/* 先问一句够不够具体 —— 只提议一次，被拒两次之后不再提。 */
async function checkThenGenerate(text) {
  if (draft.offered || draft.refusals >= 2) return generateNow(text);
  go('generating');
  const verdict = await API.clarify(text, S.profile);
  if (verdict.ok || !(verdict.options || []).length) return generateNow(text);
  draft.offered = true;
  go('offer', { reflection: verdict.reflection, options: verdict.options });
}

async function generateNow(text, opts = {}) {
  if (currentName !== 'generating') go('generating');
  const token = {};
  generation = token;
  try {
    const result = await API.generate(text, S.profile);
    if (generation !== token) return;
    run = { sessions: result.sessions, chosen: 1, played: [], source: result.source, intent: text };
    // onboarding 结尾这一次，生成的就是她描述的那种生活 —— 直接当今天的三段
    if (opts.first) {
      // /api/generate 不返回快捷入口（那是 /api/daily 的活），
      // 第一天先从她刚说的那段话里抽两条，明天起走 daily。
      const chips = (result.suggestions && result.suggestions.length)
        ? result.suggestions
        : Offline.suggestions(S.profile);
      S.today = { date: todayKey(), sessions: result.sessions, suggestions: chips, source: result.source };
      save();
    }
    if (result.source !== 'claude') {
      toast(API.caps.offline
        ? '静态预览：稿子是本地模板，声音是浏览器合成的'
        : '这一稿是本地模板 —— 填上 ANTHROPIC_API_KEY 就是真的');
    }
    go('picker');
  } catch (err) {
    if (generation !== token) return;
    console.error(err);
    toast('生成失败了，再说一次试试');
    go('home');
  }
}

function remember() {
  const session = run.sessions[run.chosen];
  S.history.unshift({
    at: Date.now(),
    intent: run.intent,
    title: session.title,
    carry: session.carry,
    cover: coverFor(session.title)
  });
  S.history = S.history.slice(0, 40);
  save();
}

/* ══════════════════════════════════════════════════
   启动
   ══════════════════════════════════════════════════ */
const SCREENS = Object.assign({}, Onboarding.screens, {
  home: homeScreen,
  listening: listeningScreen,
  heard: heardScreen,
  offer: offerScreen,
  generating: generatingScreen,
  picker: pickerScreen,
  intro: introScreen,
  player: playerScreen,
  finish: finishScreen
});

(async function boot() {
  statusClock();
  setInterval(statusClock, 20000);
  await API.boot();
  // 没登录 → 从头；登了但没答完 → 接着答；答完了 → Home
  go(!S.account ? 'ob-welcome' : (S.onboarded ? 'home' : 'ob-name'));
  // 预热封面，切到 Story Intro 的时候照片已经在了
  COVERS.forEach(src => { const i = new Image(); i.src = src; });
})();
