/* ══════════════════════════════════════════════════════
   Onboarding —— Figma section「Onboarding · Stella 弧线 + Wren 落点」

   文档 2026-08-18 把 21 屏砍成 6 步问题 + 一个梦想提问，这里按简化版做：
     Welcome → 名字 → 想改变什么(语音) →〔回应〕→ 重要的人 → 工作
            →〔换挡〕→ 梦想的生活(语音) → 转写确认 → 承诺 → 生成…

   最后那个梦想回答（profile.dream）是整个产品后面所有内容的料 ——
   Home 的每日三段和快捷入口都从它派生。
   ══════════════════════════════════════════════════════ */

const Onboarding = (() => {

  /* 一共 9 格进度。屏与屏之间的顺序写死在这里，别的地方不要再排一遍。 */
  const FLOW = ['name', 'desire', 'mirror1', 'people', 'work', 'mirror2', 'dream', 'transcribed', 'promise'];
  const stepOf = (name) => FLOW.indexOf(name) + 1;

  const fill = (s) => (s || '').replace(/\{name\}/g, (S.profile.name || 'you').trim());

  /* 顶部：返回箭头 + 细进度条。设计稿里 back 在 (28,62) 26px，
     track 在 (66,73) 296×4，透明度 22 / 55。 */
  function topbar(screen, onBack) {
    const pct = stepOf(screen) / FLOW.length;
    return el('div.ob-top', {},
      el('button.icon-btn.ob-back', { type: 'button', onclick: onBack }, icon('ob-back.svg')),
      el('div.ob-track', {}, el('i', { style: { width: (pct * 100) + '%' } })));
  }

  /* ── 00 · Welcome ─────────────────────────────── */
  function welcome() {
    return el('div.ob', {},
      el('img.ob-logo', { src: 'assets/img/logo-1024.png', alt: 'Wren' }),
      el('h1.ob-brand', {}, 'Wren'),
      el('div.ob-tagline', { html: 'Small bird. The whole sky hears it.<br>Say it out loud — Wren carries the rest.' }),
      el('button.btn.ob-cta', { type: 'button', onclick: () => go('ob-name') }, 'Begin'));
  }

  /* ── 文字题（名字 / 工作）─────────────────────── */
  function textStep({ screen, question, note, placeholder, field, next, back }) {
    const input = el('input', {
      type: 'text', placeholder, autocomplete: 'off', enterkeyhint: 'next',
      autocapitalize: field === 'name' ? 'words' : 'sentences',
      value: S.profile[field] || ''
    });
    const commit = () => {
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      S.profile[field] = v; save(); go(next);
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });

    const node = el('div.ob', {},
      topbar(screen, () => go(back)),
      el('h1.ob-q', { html: fill(question).replace(/\n/g, '<br>') }),
      note ? el('p.ob-note', {}, fill(note)) : null,
      el('div.ob-foot', {},
        el('div.pill', {}, input,
          el('button.round', { type: 'button', onclick: commit }, icon('send-52.svg')))));
    setTimeout(() => input.focus(), 420);
    return node;
  }

  /* ── 语音题（想改变什么）───────────────────────
     开放式问题默认语音 —— 犹豫、断句、用词都是生成素材。 */
  function voiceStep({ screen, question, note, placeholder, field, next, back }) {
    const input = el('input', {
      type: 'text', placeholder, autocomplete: 'off', enterkeyhint: 'next',
      value: S.profile[field] || ''
    });
    const commit = () => {
      const v = input.value.trim();
      if (!v) { input.focus(); return; }
      S.profile[field] = v; save(); go(next);
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });

    const round = el('button.round', { type: 'button' });
    const paint = () => {
      round.innerHTML = '';
      round.append(icon(input.value.trim() ? 'send-52.svg' : 'mic-52.svg'));
    };
    round.addEventListener('click', () => {
      if (input.value.trim()) return commit();
      if (!Speech.canListen()) { input.focus(); return toast('这个浏览器不支持语音，打字也行'); }
      dictate(input, paint);
    });
    input.addEventListener('input', paint);
    paint();

    return el('div.ob', {},
      topbar(screen, () => go(back)),
      el('h1.ob-q', { html: fill(question).replace(/\n/g, '<br>') }),
      el('div.ob-foot', {},
        note ? el('p.ob-note.above-pill', {}, fill(note)) : null,
        el('div.pill', {}, input, round)));
  }

  /* 就地口述：压一层遮罩 + 波形，说完把文字填回输入框 */
  function dictate(input, paint) {
    const bars = waveBars(26);
    const label = el('p.label.center', { style: { color: 'var(--fg-muted)', marginTop: '14px' } }, "Wren's listening");
    const box = el('div.dictate', {}, bars, label);
    const scrim = el('div.scrim.on', { onclick: () => Speech.stopListening() });
    $('#phone').append(scrim, box);
    driveWave(bars);
    const done = () => { Speech.stopMeter(); scrim.remove(); box.remove(); paint && paint(); };
    Speech.listen({
      onPartial: t => { input.value = t; },
      onFinal: t => { if (t) input.value = t; done(); },
      onError: () => { done(); toast('麦克风用不了 —— 打字也行'); }
    });
  }

  /* ── 回应屏 ────────────────────────────────────
     Stella 把回应卡在情绪成本最高的那题之后当奖励。照搬这个位置。 */
  function mirror({ screen, body, next, back }) {
    return el('div.ob', {},
      topbar(screen, () => go(back)),
      el('div.ob-mirror', { html: fill(body).replace(/\n/g, '<br>') }),
      el('button.btn.ob-cta', { type: 'button', onclick: () => go(next) }, 'Go on'));
  }

  /* ── 重要的人 ──────────────────────────────────
     整套 onboarding 里最值钱的一屏：名字 + 一句「他是谁」。
     专有名词是「这段是为我写的」那种感觉的唯一来源。 */
  function people() {
    const list = el('div.ob-people', {});

    const draw = () => {
      list.innerHTML = '';
      (S.profile.people || []).forEach((p, i) => {
        list.append(el('div.person-card', {},
          el('div.copy', {},
            el('p.who', {}, p.name),
            el('p.note', {}, p.note || '')),
          el('button.icon-btn.remove', {
            type: 'button', 'aria-label': 'Remove ' + p.name,
            onclick: () => { S.profile.people.splice(i, 1); save(); draw(); }
          }, icon('ob-remove.svg'))));
      });
      list.append(el('button.add-person', { type: 'button', onclick: sheet },
        icon('ob-plus.svg'), 'Add a person'));
    };
    draw();

    function sheet() {
      const nameI = el('input', { type: 'text', placeholder: 'Their name', autocapitalize: 'words' });
      const noteI = el('textarea', { rows: 2, placeholder: 'Who are they to you?' });
      const panel = el('div.ob-sheet', {},
        el('div.grabber'),
        el('p.sheet-title', {}, 'Add Person'),
        el('button.icon-btn.sheet-close', { type: 'button', onclick: close }, icon('ob-sheet-close.svg')),
        el('div.field', {}, nameI),
        el('div.field.tall', {}, noteI),
        el('button.btn.sheet-add', {
          type: 'button',
          onclick: () => {
            const n = nameI.value.trim();
            if (!n) { nameI.focus(); return; }
            S.profile.people = S.profile.people || [];
            S.profile.people.push({ name: n, note: noteI.value.trim() });
            save(); draw(); close();
          }
        }, 'Add'));
      const scrim = el('div.scrim.on', { onclick: close });
      $('#phone').append(scrim, panel);
      setTimeout(() => { panel.classList.add('on'); nameI.focus(); }, 20);
      function close() {
        panel.classList.remove('on');
        scrim.remove();
        setTimeout(() => panel.remove(), 380);
      }
    }

    return el('div.ob', {},
      topbar('people', () => go('ob-mirror1')),
      el('h1.ob-q', { html: 'Who are the people<br>Wren should know<br>matter most to you?' }),
      el('p.ob-note', {}, 'Wren carries their names too.'),
      list,
      el('button.btn.ob-cta', { type: 'button', onclick: () => go('ob-work') }, 'Continue'));
  }

  /* ── 梦想那一问 ────────────────────────────────
     换挡之后的第一屏。这是整套里最大的一块料 —— 后面每天的内容都从它派生。 */
  function dream() {
    const strip = el('div.wave-strip', {});
    const H = [6, 11, 18, 9, 24, 14, 7, 20, 26, 12, 8, 17, 23, 10, 15, 27, 13, 6, 19, 25, 11, 16, 9, 22, 14, 8, 21, 12];
    H.forEach(h => strip.append(el('i', { style: { height: h + 'px' } })));

    return el('div.ob', {},
      topbar('dream', () => go('ob-mirror2')),
      el('h1.ob-q', { html: 'What does your dream<br>life look like?' }),
      el('p.ob-note', {}, "The house, the job, the people. Whatever's actually in your head."),
      el('div.ob-dream-block', {},
        strip,
        el('button.icon-btn.ob-mic', { type: 'button', onclick: () => go('ob-listening') }, icon('ob-mic-96.svg')),
        el('p.label.center', { style: { color: 'var(--fg-secondary)' } }, 'Tap and talk'),
        el('button.ob-type', { type: 'button', onclick: () => { draft.text = ''; go('ob-transcribed'); } }, 'Type')));
  }

  /* ── 在听 ─────────────────────────────────────── */
  function listening() {
    const bars = waveBars(30);
    const live = el('p.live', {});
    const timer = el('p.ob-timer', {}, '0:00');
    let heard = '';
    const t0 = Date.now();
    const tick = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      timer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }, 500);

    const paint = (t) => { live.innerHTML = ''; live.append(t || ''); live.append(el('i.cursor')); };
    paint('');
    const cleanup = () => { clearInterval(tick); Speech.stopMeter(); };
    const finish = (t) => {
      cleanup();
      draft.text = (t || heard).trim();
      go(draft.text ? 'ob-transcribed' : 'ob-dream');
    };

    driveWave(bars);
    Speech.listen({
      onPartial: t => { heard = t; paint(t); },
      onFinal: t => finish(t || heard),
      onError: () => { cleanup(); toast('麦克风用不了 —— 打字也行'); go('ob-dream'); }
    });

    return el('div.ob', {},
      topbar('dream', () => { Speech.stopListening(); cleanup(); go('ob-dream'); }),
      el('h1.ob-q.dim', { html: 'What does your dream<br>life look like?' }),
      el('div.speaking ob-live', {}, live),
      el('div.ob-mic-block', {},
        bars, timer,
        el('p.label.center', { style: { color: 'var(--fg-muted)' } }, "Wren's listening"),
        el('button.mic-big', { type: 'button', onclick: () => Speech.stopListening() }, el('div.square'))));
  }

  /* ── 转写确认 ─────────────────────────────────── */
  function transcribed() {
    const field = el('textarea', { rows: 4, spellcheck: 'false' });
    field.value = draft.text || '';
    const commit = () => {
      const v = field.value.trim();
      if (!v) { field.focus(); return; }
      S.profile.dream = v; save(); go('ob-promise');
    };
    const node = el('div.ob', {},
      topbar('transcribed', () => go('ob-dream')),
      el('h1.ob-q', { html: 'What does your dream<br>life look like?' }),
      el('div.heard ob-heard', {},
        el('p.caption.cap', {}, 'Wren heard'),
        el('div.heard-field', {}, field),
        el('p.heard-hint', {}, 'Tap to fix anything it misheard.'),
        el('button.chip.again', {
          type: 'button', onclick: () => { draft.text = field.value.trim(); go('ob-listening'); }
        }, icon('mic-18.svg'), 'Say it again')),
      el('button.btn.ob-cta', { type: 'button', onclick: commit }, "That's it"));
    if (!draft.text) setTimeout(() => field.focus(), 420);
    return node;
  }

  /* ── 承诺 ──────────────────────────────────────
     照片位是「她描述的那种生活」的脸。生成封面还没做，
     先用实拍图按她那段话选一张 —— 同一段话永远同一张。 */
  function promise() {
    return el('div.ob', {},
      topbar('promise', () => go('ob-transcribed')),
      el('h1.ob-promise-q', {}, 'Ready to see the life you just described?'),
      el('div.ob-portrait', {}, el('img', { src: coverFor(S.profile.dream), alt: '' })),
      el('p.ob-portrait-note', {}, 'You can change it any time.'),
      el('button.btn.ob-cta.promise', {
        type: 'button',
        onclick: () => {
          S.onboarded = true; save();
          // 第一段音频就是她刚描述的那种生活
          generateNow(S.profile.dream, { first: true });
        }
      }, "I'm ready"));
  }

  return {
    screens: {
      'ob-welcome': welcome,
      'ob-name': () => textStep({
        screen: 'name', field: 'name', next: 'ob-desire', back: 'ob-welcome',
        question: 'What should Wren call\nyou?',
        note: 'Wren says it out loud before it goes.',
        placeholder: 'Maya'
      }),
      'ob-desire': () => voiceStep({
        screen: 'desire', field: 'desire', next: 'ob-mirror1', back: 'ob-name',
        question: '{name}, what are you\nhoping changes\nright now?',
        note: 'Wren can hear and understand you',
        placeholder: 'Confidence, calm, a decision…'
      }),
      'ob-mirror1': () => mirror({
        screen: 'mirror1', next: 'ob-people', back: 'ob-desire',
        body: 'I can hear how much this one matters, {name}.\n\nYou said it twice without noticing.'
      }),
      'ob-people': people,
      'ob-work': () => textStep({
        screen: 'work', field: 'work', next: 'ob-mirror2', back: 'ob-people',
        question: 'What do you do\nfor work?',
        placeholder: 'Product designer'
      }),
      'ob-mirror2': () => mirror({
        screen: 'mirror2', next: 'ob-dream', back: 'ob-work',
        body: "I've got all of that now, {name}.\n\nI think you are the one who can get what you want…"
      }),
      'ob-dream': dream,
      'ob-listening': listening,
      'ob-transcribed': transcribed,
      'ob-promise': promise
    }
  };
})();
