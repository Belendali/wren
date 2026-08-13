/* ═══════════════════════════════════════════════════
   app.js — 全流程。没有后端，状态存在 localStorage。
   ═══════════════════════════════════════════════════ */

/* ── 小工具 ─────────────────────────────────── */
const $ = (s, r = document) => r.querySelector(s);
function el(tag, props = {}, ...kids) {
  const [t, ...cls] = tag.split('.');
  const n = document.createElement(t || 'div');
  if (cls.length) n.className = cls.join(' ');
  for (const [k, v] of Object.entries(props)) {
    if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style') Object.assign(n.style, v);
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(k));
  return n;
}
const ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 4 7 12l8 8"/></svg>',
  mic:  '<svg viewBox="0 0 24 24"><rect x="9.5" y="3" width="5" height="9" rx="2.5"/><path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3"/></svg>',
  up:   '<svg viewBox="0 0 24 24"><path d="M12 19V6m0 0-5 5m5-5 5 5"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="7" y="5" width="3.5" height="14" rx="1.4"/><rect x="13.5" y="5" width="3.5" height="14" rx="1.4"/></svg>',
  b10:  '<svg viewBox="0 0 24 24"><path d="M12 5a7 7 0 1 1-6.5 4.5M12 5 8.5 2.5M12 5 8.5 8"/></svg>',
  f10:  '<svg viewBox="0 0 24 24"><path d="M12 5a7 7 0 1 0 6.5 4.5M12 5l3.5-2.5M12 5l3.5 3"/></svg>',
  home: '<svg class="filled" viewBox="0 0 24 24"><path d="M4 10.2 12 4l8 6.2V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/></svg>',
  lib:  '<svg viewBox="0 0 24 24"><path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15a2.5 2.5 0 0 1 5 0v2a2.5 2.5 0 0 1-5 0zm11 0a2.5 2.5 0 0 1 5 0v2a2.5 2.5 0 0 1-5 0z"/></svg>',
  me:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.8"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M12 20s-8-5-8-10.2A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.8C20 15 12 20 12 20z"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.2h4.2M12 8.5V12l2.6 2"/></svg>'
};
const BIRD_SVG = '<svg viewBox="0 0 96 80"><path fill-rule="evenodd" d="M2 40 15 34.5C17.5 21.5 29 12 43 12C57.5 12 69 22 71 35.5L88 24.5 92.5 31 76 42C75.5 57 64 68 48 68C28 68 14.5 58 12 46.5ZM28 32a4 4 0 1 0 8 0a4 4 0 1 0-8 0Z"/></svg>';
const PERCH_SVG = '<svg viewBox="0 0 326 24" preserveAspectRatio="none"><path d="M0 14h236l6-9 5 18 6-13 5 6 4-4h58"/></svg>';

/* ── 状态 ───────────────────────────────────── */
const KEY = 'wren.v1';
let S = load();
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (_) { return fresh(); }
}
function fresh() {
  return { name: '', city: '', kids: '', desire: '', why: '', obstacle: '', work: '', workFeel: '',
           about: '', past: '', people: [], bodyAnchor: 'chest', facts: [], sessions: [], onboarded: false };
}
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
function reset() { localStorage.removeItem(KEY); S = fresh(); go('welcome'); }
window.wrenReset = reset;

/* ── 路由 ───────────────────────────────────── */
const stage = () => $('#stage');
let current = null;
function go(name, data) {
  const build = SCREENS[name];
  if (!build) return console.warn('no screen', name);
  const old = current;
  const node = build(data || {});
  node.classList.add('screen');
  node.dataset.screen = name;
  stage().append(node);
  requestAnimationFrame(() => {
    node.classList.add('on');
    if (old) { old.classList.add('leaving'); old.classList.remove('on');
      setTimeout(() => old.remove(), 360); }
  });
  current = node;
  node.classList.toggle('on-photo', name === 'player' || name === 'storyintro');
  $('#phone').classList.toggle('clay', name === 'home');
  $('#tabs').style.display = ['home', 'library', 'me'].includes(name) ? 'flex' : 'none';
  setTab(name);
  window.scrollTo(0, 0);
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2600);
}

/* ── 复用块 ─────────────────────────────────── */
function topbar(pct, onBack) {
  return el('div.topbar', {},
    el('div.back', { html: ICON.back, onclick: onBack || (() => history.back()) }),
    pct == null ? null : el('div.progress', {}, el('i', { style: { width: (pct * 100) + '%' } }))
  );
}
/* 品牌方放进 Figma 的实拍封面。脸都是侧的或转开的 —— 留出位置给用户站进去。 */
const COVERS = ['assets/covers/cover-1.jpg','assets/covers/cover-2.jpg','assets/covers/cover-3.jpg',
                'assets/covers/cover-4.jpg','assets/covers/cover-5.jpg','assets/covers/cover-6.jpg',
                'assets/covers/cover-7.jpg'];
const coverFor = (seed) => {
  let h = 0; const str = String(seed || '');
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return COVERS[h % COVERS.length];
};

/* 品牌素材的四个状态。同一只鸟，四个时刻。 */
const HERO_SRC = {
  full:      'assets/wren-home-01-thought-to-voice-animated.gif',
  listening: 'assets/wren-home-02-listening-animated.gif',
  rehearse:  'assets/wren-home-03-rehearsing-animated.webp',
  ready:     'assets/wren-home-04-ready-to-go-animated.webp',
  flying:    'assets/wren-bird-flying-up-transparent.webp'
};
const HERO_FALLBACK = {
  full:      'assets/wren-home-01-thought-to-voice.png',
  listening: 'assets/wren-home-02-listening.png',
  rehearse:  'assets/wren-home-03-rehearsing.png',
  ready:     'assets/wren-home-04-ready-to-go.png',
  flying:    'assets/wren-home-01-thought-to-voice.png'
};
function hero(state = 'full') {
  const img = el('img', { src: HERO_SRC[state], alt: '' });
  img.addEventListener('error', () => { img.src = HERO_FALLBACK[state]; }, { once: true });
  return el('div.hero', { 'data-state': state }, img);
}
/* 点进去之后还在同一张图里 —— 封面重度模糊 + 压暗 */
function sceneBg(src) {
  return el('div.scene', {},
    el('div.shot', { style: { backgroundImage: `url('${src}')` } }),
    el('div.dim'), el('div.vig'));
}
function waveBars(n = 28, live = false) {
  const w = el('div.wave' + (live ? '' : '.idle'));
  for (let i = 0; i < n; i++) w.append(el('i'));
  return w;
}
function setTab(name) {
  [...$('#tabs').children].forEach(b => b.classList.toggle('on', b.dataset.tab === name));
}

/* ═══════════════════════════════════════════════
   ONBOARDING —— 数据驱动
   ═══════════════════════════════════════════════ */
const STEPS = [
  { k: 'city',     type: 'text',  q: 'Where do you live?', ph: 'Seattle' },
  { k: 'name',     type: 'text',  q: 'What should Wren\ncall you?', note: 'Wren says it out loud before it goes.', ph: 'Maya' },
  { k: 'kids',     type: 'choice',q: 'Do you have kids?', note: 'It changes what your mornings look like.', opts: ['Yes', 'No'] },
  { k: 'desire',   type: 'voice', q: '{name}, what are you\nhoping changes\nright now?', ph: 'Confidence, calm, a decision…' },
  { k: 'why',      type: 'voice', q: 'Why does this matter\nso much right now?', ph: 'What would change if it did?' },
  { k: '_mirror1', type: 'mirror',body: 'I can hear how much this one matters, {name}.\n\nYou said it twice without noticing.' },
  { k: 'obstacle', type: 'voice', q: 'What feels like the\nbiggest thing standing\nin your way?', ph: 'Doubt, timing, money, fear…' },
  { k: '_people',  type: 'people',q: 'Who are the people\nWren should know\nmatter most to you?', note: 'Wren carries their names too.' },
  { k: 'work',     type: 'text',  q: 'What do you do\nfor work?', ph: 'Product designer' },
  { k: 'workFeel', type: 'choice',q: 'How do you feel\nabout your work?', stack: true,
    opts: ['Love it', 'It’s fine for now', 'I’m ready for something new', 'I’m building something on the side'] },
  { k: 'about',    type: 'voice', q: 'Since we’ve never met,\n{name} — what should\nWren know about you?', ph: 'I am a…' },
  { k: 'past',     type: 'voice', q: 'Is there anything from\nyour past that still\nshapes this?', ph: 'Only share what feels relevant…' },
  { k: '_mirror2', type: 'mirror',body: 'I’ve got all of that now, {name}.\n\nOne more thing — and it’s the only one that has to be out loud.' },
  { k: '_carries', type: 'mirror',body: 'Now the part Wren takes up.\n\n<i>Tomorrow morning, or ten years out</i> — the bird flies either way.\n\nSay it clearly. Clear things travel further.' }
];
const fill = (s) => (s || '').replace(/\{name\}/g, S.name || 'you');

function stepScreen({ i = 0 }) {
  const step = STEPS[i];
  const pct = (i + 1) / (STEPS.length + 3);
  const next = () => (i + 1 < STEPS.length) ? go('step', { i: i + 1 }) : go('sayit');
  const back = () => i === 0 ? go('welcome') : go('step', { i: i - 1 });
  const wrap = el('div', {}, topbar(pct, back));

  if (step.type === 'mirror') {
    wrap.append(el('div.mirror', { html: fill(step.body) }));
    wrap.append(el('div.foot', {}, el('button.btn', { onclick: next }, 'Go on')));
    return wrap;
  }

  wrap.append(el('h1.q', { html: fill(step.q).replace(/\n/g, '<br>') }));
  if (step.note) wrap.append(el('p.note', {}, fill(step.note)));

  if (step.type === 'text' || step.type === 'voice') {
    const input = el('input', { type: 'text', placeholder: step.ph, value: S[step.k] || '' });
    const commit = () => { S[step.k] = input.value.trim(); save(); if (S[step.k]) next(); };
    const speakable = step.type === 'voice';
    const btn = el('button.round', { html: speakable ? ICON.mic : ICON.up, onclick: () => {
      if (speakable && Speech.canListen()) micInto(input, commit);
      else commit();
    }});
    input.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); });
    if (speakable) wrap.append(el('p.note', { style: { marginTop: '18px' } },
      'Wren hears you better than it reads you.'));
    wrap.append(el('div.foot', {}, el('div.pill', {}, input, btn),
      el('button.btn.ghost', { onclick: commit }, 'Next')));
    setTimeout(() => input.focus(), 380);
    return wrap;
  }

  if (step.type === 'choice') {
    const chips = el('div.chips' + (step.stack ? '.stack' : ''), { style: { marginTop: '32px' } });
    step.opts.forEach(o => chips.append(el('button.chip' + (S[step.k] === o ? '.on' : ''), {
      onclick: (e) => { S[step.k] = o; save();
        [...chips.children].forEach(c => c.classList.remove('on'));
        e.currentTarget.classList.add('on'); }
    }, o)));
    wrap.append(chips);
    wrap.append(el('div.foot', {}, el('button.btn', { onclick: next }, 'Continue')));
    return wrap;
  }

  if (step.type === 'people') {
    const list = el('div.stack.gap-s', { style: { marginTop: '28px' } });
    const draw = () => {
      list.innerHTML = '';
      S.people.forEach((p, idx) => list.append(el('div.person', {},
        el('div.who', {}, el('b', {}, p.name), el('span', {}, p.note || '')),
        el('div.x', { onclick: () => { S.people.splice(idx, 1); save(); draw(); } }, '×'))));
      list.append(el('button.dashed', { onclick: openPerson }, '+  Add a person'));
    };
    draw();
    wrap.append(list);
    wrap.append(el('div.foot', {}, el('button.btn', { onclick: next }, 'Continue')));
    function openPerson() {
      const nameI = el('input', { placeholder: 'Their name' });
      const noteI = el('textarea', { rows: 3, placeholder: 'Who are they to you?' });
      const sheet = el('div.sheet', {},
        el('div.center', {}, el('div', { style: { font: '400 22px/28px var(--serif)' } }, 'Add Person')),
        nameI, noteI,
        el('button.btn', { style: { marginTop: '18px' }, onclick: () => {
          if (nameI.value.trim()) { S.people.push({ name: nameI.value.trim(), note: noteI.value.trim() }); save(); draw(); }
          close();
        }}, 'Add'));
      const scrim = el('div.scrim', { onclick: close });
      $('#phone').append(scrim, sheet);
      requestAnimationFrame(() => { scrim.classList.add('on'); sheet.classList.add('on'); nameI.focus(); });
      function close() { sheet.classList.remove('on'); scrim.classList.remove('on');
        setTimeout(() => { sheet.remove(); scrim.remove(); }, 380); }
    }
    return wrap;
  }
  return wrap;
}

/* 让任意输入框可以口述 */
function micInto(input, done) {
  const scrim = el('div.scrim.on');
  const bars = waveBars(30, true);
  const label = el('p.note.center', { style: { marginTop: '10px' } }, 'Wren’s listening');
  const box = el('div', { style: { position: 'absolute', left: '32px', right: '32px', bottom: '150px',
    zIndex: '21', textAlign: 'center' } }, bars, label);
  $('#phone').append(scrim, box);
  Speech.meter(v => { [...bars.children].forEach((b, i) => {
    const h = 8 + v * 60 * (0.45 + Math.abs(Math.sin((Date.now() / 160) + i)) * 0.55);
    b.style.height = Math.min(70, h) + 'px'; }); });
  Speech.listen({
    onPartial: t => { input.value = t; },
    onFinal: t => { if (t) input.value = t; cleanup(); if (t) done && done(); },
    onError: () => { cleanup(); toast('Mic isn’t available — type it instead.'); }
  });
  scrim.onclick = () => { Speech.stopListening(); };
  function cleanup() { Speech.stopMeter(); scrim.remove(); box.remove(); }
}

/* ═══════════════════════════════════════════════
   说给小鸟听 —— 三态：待机 / 在听 / 转写
   ═══════════════════════════════════════════════ */
let draft = { text: '', mode: 'thing' };

function sayitScreen() {
  const pct = (STEPS.length + 1) / (STEPS.length + 3);
  return el('div', {},
    topbar(pct, () => go('step', { i: STEPS.length - 1 })),
    el('h1.q', { html: 'What do you want<br>Wren to carry up?' }),
    el('p.note', {}, 'Out loud. Wren can’t carry what it hasn’t heard.'),
    el('div.grow'),
    el('div.stack.center.gap-m', { style: { paddingBottom: '20px' } },
      waveBars(28, false),
      el('button.big', { style: { margin: '0 auto', width: '96px', height: '96px' },
        html: ICON.mic, onclick: () => go('listening') }),
      el('p.note.center', {}, 'Tap and talk'),
      el('button.btn.ghost', { onclick: () => { draft.text = ''; go('transcribed'); } },
        'or type it — but out loud travels further'))
  );
}

function listeningScreen() {
  const bars = waveBars(30, true);
  const live = el('div', { style: { font: '400 23px/33px var(--serif)', marginTop: '24px', minHeight: '99px' } });
  const timer = el('div.center', { style: { font: '400 22px/28px var(--serif)', color: 'var(--fg-2)' } }, '0:00');
  let t0 = Date.now();
  const tick = setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    timer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, 500);

  Speech.meter(v => { [...bars.children].forEach((b, i) => {
    const h = 8 + v * 64 * (0.4 + Math.abs(Math.sin((Date.now() / 150) + i * .7)) * 0.6);
    b.style.height = Math.min(72, h) + 'px'; }); });

  let got = '';
  Speech.listen({
    onPartial: t => { got = t; live.textContent = t; },
    onFinal: t => { finish(t || got); },
    onError: () => { toast('Mic isn’t available — type it instead.'); finish(''); }
  });
  function finish(t) { clearInterval(tick); Speech.stopMeter(); draft.text = t; go('transcribed'); }

  return el('div', {},
    topbar(null, () => { Speech.stopListening(); clearInterval(tick); Speech.stopMeter(); go('sayit'); }),
    el('h1.q', { html: 'What do you want<br>Wren to carry up?', style: { opacity: '.42' } }),
    live,
    el('div.grow'),
    el('div.stack.gap-m', { style: { paddingBottom: '18px' } },
      bars, timer, el('p.note.center', {}, 'Wren’s listening'),
      el('button.big', { style: { margin: '10px auto 0' },
        html: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="7" y="7" width="10" height="10" rx="2.6"/></svg>',
        onclick: () => Speech.stopListening() }))
  );
}

function transcribedScreen() {
  const field = el('textarea.field', { rows: 4, placeholder: 'Say it, or type it here…' });
  field.value = draft.text;
  const box = el('div', { style: { marginTop: '20px' } });
  const check = () => {
    box.innerHTML = '';
    const r = Wren.clarity(field.value, S);
    if (r.ok || r.empty) return;
    // 不否定，不代写 —— 只是把那个空心的词指出来，然后提议
    box.append(el('p.note', { html:
      `Wren can carry that. It flies further if it knows what <span class="vague">${r.word || 'it'}</span> looks like.` }));
    const sug = el('div.suggests');
    (r.suggestions || []).forEach(s => sug.append(el('button.chip', { onclick: () => {
      field.value = field.value.replace(/[.\s]+$/, '') + ' — ' + s;
      check();
    }}, s)));
    box.append(sug);
  };
  field.addEventListener('input', () => { draft.text = field.value; });
  field.addEventListener('blur', check);
  setTimeout(check, 200);

  const pct = (STEPS.length + 2) / (STEPS.length + 3);
  return el('div', {},
    topbar(S.onboarded ? null : pct, () => go(S.onboarded ? 'home' : 'sayit')),
    el('h1.q', { html: 'What do you want<br>Wren to carry up?' }),
    el('p.eyebrow', { style: { marginTop: '22px' } }, 'Wren heard'),
    el('div', { style: { marginTop: '10px' } }, field),
    box,
    el('div.foot', {},
      el('button.btn.paper', { onclick: () => go('listening') }, 'Say it again'),
      el('button.btn', { onclick: () => {
        draft.text = field.value.trim();
        if (!draft.text) return toast('Wren needs something to carry.');
        S.facts = [...new Set([...(S.facts || []), draft.text])].slice(-12);
        save();
        go(S.onboarded ? 'generating' : 'caught');
      }}, 'That’s it'))
  );
}

/* 提取到的细节 —— 可删 */
function caughtScreen() {
  const bits = extract(draft.text);
  const chosen = new Set(bits);
  const chips = el('div.chips', { style: { marginTop: '28px' } });
  bits.forEach(b => chips.append(el('button.chip', { onclick: (e) => {
    chosen.delete(b); e.currentTarget.remove();
  }}, b + '   ×')));
  return el('div', {},
    topbar((STEPS.length + 3) / (STEPS.length + 3), () => go('transcribed')),
    el('h1.q', { html: 'Here’s what<br>Wren caught.' }),
    el('p.note', {}, 'Tap to remove anything it misheard.'),
    chips,
    el('div.foot', {}, el('button.btn', { onclick: () => {
      S.facts = [...new Set([...(S.facts || []), ...chosen])].slice(-16);
      save(); go('promise');
    }}, 'That’s right'))
  );
}
function extract(text) {
  const out = [];
  const t = text || '';
  const proper = t.match(/(?!^)\b[A-Z][a-z]{2,}\b/g) || [];
  proper.forEach(p => out.push(p));
  const time = t.match(/\b(tomorrow|tonight|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\s?(?:am|pm)|\d+\s?(?:years?|months?|weeks?))\b/gi) || [];
  time.forEach(p => out.push(p.toLowerCase()));
  const noun = t.match(/\b(review|meeting|interview|call|presentation|conversation|house|rent|job|deadline|flight|date|exam)\b/gi) || [];
  noun.forEach(p => out.push('the ' + p.toLowerCase()));
  if (!out.length) out.push(Wren.keyPhrase(t) || 'what you said');
  return [...new Set(out)].slice(0, 6);
}

function promiseScreen() {
  return el('div', {},
    el('div', { style: { marginTop: '110px' } }, hero('full')),
    el('div.mirror', { style: { marginTop: '26px', fontSize: '25px', lineHeight: '37px' }, html:
      `OK. I’ve got a shape of you now, ${S.name || 'you'}.<br><br>` +
      `I’ll keep listening. The more mornings you give me, the better I know you — and the more exact what I carry up gets.<br><br>` +
      `<i>So does what the sky sends back.</i>` }),
    el('div.foot', {}, el('button.btn', { onclick: () => {
      S.onboarded = true; save(); go('home');
    }}, 'Take me in'))
  );
}

/* ═══════════════════════════════════════════════
   HOME
   ═══════════════════════════════════════════════ */
function homeScreen() {
  const input = el('input', { type: 'text', placeholder: 'Say it out loud…' });
  const send = () => { draft.text = input.value.trim(); draft.mode = 'thing';
    if (!draft.text) return go('listening'); go('transcribed'); };

  const sugg = (S.facts || []).slice(-3).reverse();
  const chips = el('div.chips', { style: { marginTop: '11px' } });
  (sugg.length ? sugg : ['The 3pm review', 'The house, eventually']).forEach(s =>
    chips.append(el('button.chip', { style: { fontFamily: 'var(--serif)', fontWeight: '400' },
      onclick: () => { input.value = s; input.focus(); } }, '+  ' + s)));

  const rail = el('div.rail', { style: { marginTop: '18px' } });
  const past = (S.sessions || []).slice(-6).reverse();
  (past.length ? past : [{ carry: 'Walking in already steady', mins: '3 min' },
                         { carry: 'I can take the long way', mins: '2 min' }])
    .forEach(x => rail.append(el('div.sess', { onclick: () => { draft.text = x.intent || x.carry;
        draft.mode = x.mode || 'thing'; go('generating'); } },
      el('div.art', { style: { backgroundImage: `url('${coverFor(x.carry)}')`,
                               backgroundSize: 'cover', backgroundPosition: 'center 30%' } }),
      el('div.body', {}, el('small', {}, x.mins || '3 min'), el('p', {}, x.carry)))));

  return el('div', { style: { paddingTop: '0' } },
    el('div.brand-top', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: '62px' } },
      el('div', { style: { font: '400 34px/42px var(--serif)', letterSpacing: '-.02em' } }, 'Wren'),
      el('div', { style: { display: 'flex', gap: '10px' } },
        el('div.ic', { html: ICON.heart, onclick: () => go('library') }),
        el('div.ic', { html: ICON.clock, onclick: () => go('library') }))),
    hero('listening'),
    el('h1.q', { style: { marginTop: '2px', textAlign: 'center' },
      html: `${S.name || 'You'}, what should<br>Wren <em>carry up</em>?` }),
    el('div.pill', { style: { marginTop: '20px' } }, input,
      el('button.round', { html: ICON.mic, onclick: () => { draft.text = ''; go('listening'); } })),
    el('p.eyebrow', { style: { marginTop: '20px' } }, 'Still on your mind'),
    chips,
    el('button', { style: { marginTop: '16px', background: 'none', border: '0', padding: '0',
        color: 'var(--signal)', font: '500 15px/20px var(--sans)', textAlign: 'left', cursor: 'pointer' },
      onclick: () => go('regular') }, 'Nothing today — just a regular day  →'),
    el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: '26px' } },
      el('div', { style: { font: '400 26px/34px var(--serif)' } }, 'For you'),
      el('button.chip', { onclick: () => go('me') }, 'What Wren knows')),
    rail,
    el('div', { style: { height: '96px' } })
  );
}

/* 平常的一天 —— 送一个状态上去 */
function regularScreen() {
  const STATES = ['steady', 'awake', 'patient', 'unhurried', 'light', 'generous'];
  let pick = null;
  const chips = el('div.chips', { style: { marginTop: '32px' } });
  STATES.forEach(s => chips.append(el('button.chip', { onclick: (e) => {
    pick = s; [...chips.children].forEach(c => c.classList.remove('on'));
    e.currentTarget.classList.add('on');
  }}, s)));
  return el('div', {},
    topbar(null, () => go('home')),
    el('h1.q', { html: 'A regular day, then.<br>What do you want<br>to carry through it?' }),
    el('p.note', {}, 'Not a thing to do. A way to be.'),
    chips,
    el('div.foot', {}, el('button.btn', { onclick: () => {
      if (!pick) return toast('Pick one.');
      draft.text = pick; draft.mode = 'state'; go('generating');
    }}, 'Send it up'))
  );
}

/* ═══════════════════════════════════════════════
   生成 → 选 → 播
   ═══════════════════════════════════════════════ */
let made = null;

function generatingScreen() {
  setTimeout(() => {
    made = Wren.visions(S, draft.text, draft.mode);
    go('picker');
  }, 2600);
  Speech.chirp({ near: true });
  return el('div', { style: { justifyContent: 'center', alignItems: 'center' } },
    el('div', { style: { marginTop: '-40px' } }, hero('flying')),
    el('div.center', { style: { marginTop: '26px', font: '400 30px/40px var(--serif)' } },
      'Wren’s gone', el('br'), 'with it.'),
    el('p.note.center', { style: { marginTop: '14px' } }, 'Take three breaths. It won’t be long.'),
    el('p.eyebrow.center', { style: { position: 'absolute', bottom: '76px', left: 0, right: 0 } },
      'It comes back in your own words')
  );
}

function pickerScreen() {
  const cards = el('div.rail', { style: { marginTop: '30px' } });
  made.alt.forEach((v, i) => cards.append(el('div.sess', {
    style: { flex: '0 0 258px' },
    onclick: () => go('storyintro', { i })
  }, el('div.art', { style: { height: '148px', backgroundImage: `url('${coverFor(v.title)}')`,
                              backgroundSize: 'cover', backgroundPosition: 'center 28%' } }),
     el('div.body', {}, el('small', {}, `Session 0${i + 1} · ${v.mins}`),
       el('p', { style: { fontSize: '21px', lineHeight: '28px' } }, v.title)))));
  return el('div', {},
    topbar(null, () => go('home')),
    el('div', { style: { marginTop: '96px' } }, hero('full')),
    el('h1.q', { style: { marginTop: '10px' },
      html: 'Wren came back<br><em>with three.</em>' }),
    cards,
    el('p.eyebrow.center', { style: { marginTop: '22px' } }, '‹  Swipe to the one you want  ›')
  );
}

function storyIntroScreen({ i = 0 }) {
  let p = 0;
  const bar = el('i');
  const pct = el('div', { style: { textAlign: 'right', font: '500 15px/20px var(--sans)', color: 'var(--fg-2)' } }, '0%');
  const t = setInterval(() => {
    p += 4 + Math.random() * 9;
    if (p >= 100) { p = 100; clearInterval(t); setTimeout(() => go('player', { i }), 500); }
    bar.style.width = p + '%'; pct.textContent = Math.round(p) + '%';
  }, 130);
  return el('div', {},
    sceneBg(coverFor(made.alt[i].title)),
    topbar(null, () => { clearInterval(t); go('picker'); }),
    el('div.grow'),
    el('div.line', { style: { marginBottom: '90px' } }, made.alt[i].title),
    el('div.stack.gap-s', {},
      el('p.note', {}, 'Coming back to you…'),
      el('div.scrub', { style: { marginTop: '8px' } }, bar),
      pct)
  );
}

function playerScreen({ i = 0 }) {
  const v = made.alt[i];
  const scriptObj = i === 0 ? made.base : Wren.script(S, draft.text, draft.mode);
  const line = el('div.line', {}, '…');
  const bar = el('i');
  const tL = el('span', {}, '0:00'), tR = el('span', {}, '-' + fmt(scriptObj.seconds));
  const playBtn = el('button.big', { html: ICON.pause, onclick: togglePlay });

  Speech.play(scriptObj.segments, {
    onLine: (txt) => { line.textContent = txt; },
    onProgress: (r, e, total) => {
      bar.style.width = (r * 100) + '%';
      tL.textContent = fmt(e); tR.textContent = '-' + fmt(Math.max(0, total - e));
    },
    onDone: () => {
      playBtn.innerHTML = ICON.play;
      S.sessions.push({ intent: draft.text, mode: draft.mode, carry: scriptObj.carry,
                        mins: Math.round(scriptObj.seconds / 60) + ' min', at: Date.now() });
      save();
      toast('Wren’s up there with the rest of it.');
    }
  });

  function togglePlay() {
    const s = Speech.session;
    if (!s) { go('player', { i }); return; }
    if (s.paused) { s.resume(); playBtn.innerHTML = ICON.pause; }
    else { s.pause(); playBtn.innerHTML = ICON.play; }
  }
  function fmt(s) { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

  return el('div', {},
    sceneBg(coverFor(v.title)),
    topbar(null, () => { Speech.stop(); go('home'); }),
    el('div.center', { style: { marginTop: '70px', font: 'italic 400 22px/28px var(--serif)' } }, 'Wren'),
    el('div.grow'),
    line,
    el('div.grow'),
    el('div.stack.gap-s', { style: { paddingBottom: '10px' } },
      el('div.scrub', {}, bar),
      el('div.times', {}, tL, tR),
      el('div.transport', { style: { marginTop: '22px' } },
        el('div.ic', { html: ICON.b10 }), playBtn, el('div.ic', { html: ICON.f10 })))
  );
}

/* ═══════════════════════════════════════════════
   LIBRARY · ME
   ═══════════════════════════════════════════════ */
function libraryScreen() {
  const list = el('div.stack.gap-s', { style: { marginTop: '18px' } });
  const items = (S.sessions || []).slice().reverse();
  if (!items.length) list.append(el('p.note', {}, 'Nothing yet. What comes back will live here.'));
  items.forEach(x => list.append(el('div.person', { onclick: () => {
      draft.text = x.intent; draft.mode = x.mode; go('generating'); } },
    el('div.who', {}, el('b', {}, x.carry),
      el('span', {}, new Date(x.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' + x.mins)),
    el('div.x', { html: ICON.play, style: { width: '20px', opacity: '.5' } }))));
  return el('div', {},
    el('h1', { style: { marginTop: '62px', font: '400 34px/42px var(--serif)', letterSpacing: '-.02em' } }, 'Library'),
    el('p.eyebrow', { style: { marginTop: '26px' } }, 'Going up today'),
    el('div.sess', { style: { marginTop: '12px', flex: 'none' }, onclick: () => {
        draft.text = 'the week ahead'; draft.mode = 'state'; go('generating'); } },
      el('div.art', { style: { height: '150px', backgroundImage: `url('${coverFor('sunday night')}')`,
                               backgroundSize: 'cover', backgroundPosition: 'center 30%' } }),
      el('div.body', {}, el('small', {}, 'Trending · 3 min'),
        el('p', { style: { fontStyle: 'italic' } }, 'Sunday night, before the week'))),
    el('p.eyebrow', { style: { marginTop: '28px' } }, `What came back · ${items.length}`),
    list,
    el('div', { style: { height: '110px' } })
  );
}

function meScreen() {
  const facts = el('div.stack', { style: { marginTop: '16px' } });
  const all = (S.facts || []).slice().reverse();
  if (!all.length) facts.append(el('p.note', {}, 'Wren hasn’t learned anything yet.'));
  all.forEach((f, idx) => facts.append(el('div', {
    style: { display: 'flex', gap: '12px', alignItems: 'center', padding: '11px 0',
             borderTop: idx ? '1px solid var(--hairline)' : 'none' } },
    el('div', { style: { flex: '1', font: '400 16px/23px var(--serif)' } }, f),
    el('div.x', { onclick: (e) => { S.facts.splice(S.facts.length - 1 - idx, 1); save(); go('me'); } }, '×'))));

  const row = (k, v, onclick) => el('div', { onclick,
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
             padding: '15px 18px', borderTop: '1px solid var(--hairline)', cursor: 'pointer' } },
    el('div', { style: { font: '500 15px/20px var(--sans)' } }, k),
    el('div', { style: { font: '400 15px/20px var(--sans)', color: 'var(--fg-3)' } }, v + '  ›'));

  return el('div', {},
    el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '58px' } },
      el('div', {}, el('div', { style: { font: '400 34px/42px var(--serif)', letterSpacing: '-.02em' } }, S.name || 'You'),
        el('p.note', { style: { marginTop: '2px' } },
          `Listening since today · ${(S.sessions || []).length} carried`))),
    el('div.card', { style: { marginTop: '18px', padding: '18px 20px 14px' } },
      el('p.eyebrow', {}, 'What Wren remembers'), facts),
    el('p.eyebrow', { style: { marginTop: '26px' } }, 'Settings'),
    el('div.card', { style: { marginTop: '8px', padding: '0 0 2px' } },
      el('div', { style: { padding: '15px 18px', display: 'flex', justifyContent: 'space-between' } },
        el('div', { style: { font: '500 15px/20px var(--sans)' } }, 'Where it lands'),
        el('div', { style: { color: 'var(--fg-3)', font: '400 15px/20px var(--sans)' } }, S.bodyAnchor + '  ›')),
      row('Voice', 'System'),
      row('Plan', 'Free'),
      row('Start over', '', () => { if (confirm('Forget everything and start over?')) reset(); })),
    el('div', { style: { height: '110px' } })
  );
}

/* ═══════════════════════════════════════════════ */
function welcomeScreen() {
  const btn = el('button.btn.fade-up', { style: { animationDelay: '1.1s' },
    onclick: () => go(S.onboarded ? 'home' : 'step', { i: 0 }) }, S.onboarded ? 'Take me in' : 'Begin');
  return el('div', { style: { alignItems: 'center', textAlign: 'center' } },
    el('div.grow'),
    el('img.mark-img.fade-up', { src: 'assets/logo-1024.png', alt: 'Wren',
      style: { animationDelay: '.05s' } }),
    el('div.wordmark.fade-up', { style: { marginTop: '22px', animationDelay: '.35s' } }, 'Wren'),
    el('p.fade-up', { style: { marginTop: '14px', font: '400 15px/24px var(--sans)',
        color: 'var(--fg-2)', maxWidth: '300px', animationDelay: '.6s' } },
      'Small bird. The whole sky hears it.', el('br'),
      'Say it out loud — Wren carries the rest.'),
    el('button.chip.fade-up', { style: { marginTop: '24px', animationDelay: '.85s' }, onclick: () => {
      Speech.chirp({ near: true });
      setTimeout(() => Speech.play([{ text: 'Maya. It is Tuesday morning, and the room is quieter than you expected.', pause: .4 }], {}), 400);
    }}, '▶   Hear it first · 8 sec'),
    el('div.grow'),
    el('div.foot', { style: { width: '100%', marginTop: '0' } }, btn)
  );
}

const SCREENS = {
  welcome: welcomeScreen, step: stepScreen, sayit: sayitScreen, listening: listeningScreen,
  transcribed: transcribedScreen, caught: caughtScreen, promise: promiseScreen,
  home: homeScreen, regular: regularScreen, generating: generatingScreen, picker: pickerScreen,
  storyintro: storyIntroScreen, player: playerScreen, library: libraryScreen, me: meScreen
};

/* ── 启动 ───────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  const tabs = $('#tabs');
  [['home', ICON.home], ['library', ICON.lib], ['me', ICON.me]].forEach(([k, svg]) =>
    tabs.append(el('button', { 'data-tab': k, html: svg, onclick: () => go(k) })));
  $('#clock').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const fit = () => {
    const p = $('#phone');
    if (window.innerWidth <= 430) { p.style.transform = ''; return; }
    const k = Math.min(1, (window.innerHeight - 48) / 844);
    p.style.transform = k < 1 ? `scale(${k.toFixed(3)})` : '';
  };
  fit(); window.addEventListener('resize', fit);
  go(S.onboarded ? 'home' : 'welcome');
});
