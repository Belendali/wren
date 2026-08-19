/* ═══════════════════════════════════════════════════
   generate.js — 稿子在本地拼，没有后端
   两件事：
     1  clarity()  判断一句话够不够具体，够不够鸟带
     2  script()   把用户的原话拼成五段式的三分钟
   ═══════════════════════════════════════════════════ */

const Wren = (() => {

  /* ── 1 · 够不够具体 ─────────────────────────
     只要有以下任意一项就放行。
     绝不强制要求时间 —— 「不在开口前先道歉」没有日期，但极其具体。 */

  const TIME = /\b(today|tonight|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening|next week|this week|month|year|years|spring|summer|autumn|fall|winter|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\s?(am|pm)|\d+\s?(o'clock|years?|months?|weeks?|days?))\b/i;
  const BEHAVIOUR = /\b(say|says|said|speak|speaking|talk|talking|ask|asking|walk|walking|stop|stopping|start|starting|leave|leaving|call|calling|tell|telling|send|sending|show up|apolog\w*|answer|answering|finish|finishing|hold|holding|put down|pick up|sit|stand|breathe|slow down|look up)\b/i;
  const SENSORY = /\b(feels?|feeling|sounds?|looks?|smells?|tastes?|quiet|loud|warm|cold|steady|light|heavy)\b/i;
  const VAGUE_NOUN = /\b(money|rich|wealth|happy|happiness|better|good|great|confident|confidence|success|successful|healthy|health|love|peace|calm|freedom|free|more|everything|anything|things|stuff|life)\b/i;

  function clarity(text, profile = {}) {
    const t = (text || '').trim();
    if (!t) return { ok: false, empty: true };

    const names = (profile.people || []).map(p => p.name).filter(Boolean);
    const hasName = names.some(n => new RegExp('\\b' + n + '\\b', 'i').test(t));
    // 句中的大写词 —— 专有名词的粗略信号
    const hasProper = /(?!^)\b[A-Z][a-z]{2,}\b/.test(t.replace(/^\W+/, ''));
    const hasPlace = /\b(room|office|kitchen|car|desk|stage|table|door|hallway|studio|gym|street)\b/i.test(t);

    const anchors = {
      time: TIME.test(t),
      who: hasName || hasProper,
      where: hasPlace,
      behaviour: BEHAVIOUR.test(t),
      sensory: SENSORY.test(t)
    };
    const count = Object.values(anchors).filter(Boolean).length;
    if (count > 0) return { ok: true, anchors };

    // 一项都没有 —— 找出那个空心的名词，好把记号画在它上面
    const m = t.match(VAGUE_NOUN);
    return {
      ok: false,
      anchors,
      word: m ? m[0] : null,
      suggestions: suggest(t, profile)
    };
  }

  /* 提议从她自己说过的话里检索，检索不到才兜底 */
  function suggest(text, p) {
    const out = [];
    const push = (s) => { if (s && out.length < 3 && !out.includes(s)) out.push(s); };

    const t = text.toLowerCase();
    if (/money|rich|wealth/.test(t)) {
      push('enough that rent week isn’t a week');
      if (p.work) push(`leaving ${p.work.toLowerCase()} without a plan B`);
      push('the house, eventually');
    } else if (/confiden|brave|nervous/.test(t)) {
      const who = (p.people || [])[0];
      push(who ? `not apologising before I speak to ${who.name}` : 'not apologising before I speak');
      push('finishing the sentence I started');
    } else if (/happy|peace|calm|better/.test(t)) {
      push('a morning that doesn’t start behind');
      push('putting the phone face down at dinner');
    }
    if (p.obstacle) push(`the day ${firstClause(p.obstacle).toLowerCase()} stops deciding`);
    if (p.desire) push(firstClause(p.desire));
    push('one afternoon this week where it’s already true');
    return out.slice(0, 3);
  }

  /* ── 2 · 稿子 ───────────────────────────────
     五段：Land · Breathe · See/Hold · Feel · Carry
     用户的原话原样出现，这是「回来的是你自己的话」落地的地方。 */

  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /* 在从句边界切，不在第 9 个词切 —— 「with Daniel, I always」这种断口
     一旦被念出来，整段就露馅了 */
  function keyPhrase(s) {
    if (!s) return '';
    const clean = s.replace(/^(i\s+(want|need|hope|wish)\s+(to\s+)?)/i, '').replace(/[.。!?]+$/, '').trim();
    const clause = clean.split(/[,;—]|\s+(?:and|but|because|so)\s+/i)[0].trim();
    const words = clause.split(/\s+/);
    if (words.length >= 3 && words.length <= 14) return clause;
    if (words.length > 14) return words.slice(0, 12).join(' ');
    // 从句太短就退回整句，仍然在词边界收
    const all = clean.split(/\s+/);
    return all.length <= 16 ? clean : all.slice(0, 14).join(' ');
  }
  function firstClause(s) {
    if (!s) return '';
    return s.split(/[,.;—]/)[0].trim();
  }

  /* 梦境里只放亲密关系。把经理写进她的梦想厨房，整段就废了。 */
  const INTIMATE = /\b(partner|husband|wife|boyfriend|girlfriend|fianc\w*|spouse|mum|mom|mother|dad|father|sister|brother|twin|son|daughter|kid|child|best friend|friend|dog|cat)\b/i;
  const intimateOf = (people) => (people || []).find(x => INTIMATE.test(x.note || '')) || null;

  function script(profile, intent, mode) {
    const name = profile.name || 'you';
    const day = DAYS[new Date().getDay()];
    const phrase = keyPhrase(intent);
    const anchor = (profile.bodyAnchor || 'chest').toLowerCase();
    const who = mode === 'dream' ? intimateOf(profile.people) : (profile.people || [])[0];
    const s = [];

    /* Land — 叫名字，报今天，把那件事说出口 */
    s.push({ text: `${name}.`, pause: 1.4 });
    s.push({ text: `It's ${day} morning.`, pause: 1.2 });
    if (mode === 'state') {
      s.push({ text: `Nothing in particular is asking for you today. That's its own kind of day.`, pause: 1.6 });
      s.push({ text: `You said you wanted to be ${intent}. So that's what we're carrying up.`, pause: 2.0 });
    } else if (mode === 'dream') {
      s.push({ text: `You told me what it looks like.`, pause: 1.4 });
      s.push({ text: `${phrase}.`, pause: 2.2 });
      s.push({ text: `Wren has all of it. It went up with the whole thing, not the careful version.`, pause: 2.0 });
    } else {
      s.push({ text: `You said: ${phrase}.`, pause: 2.0 });
      s.push({ text: `Wren has that. It's already gone up with it.`, pause: 1.8 });
    }
    s.push({ text: `Let the next breath out slowly. All of it.`, pause: 3.4, bird: true });

    /* Breathe — 三次呼吸，扫到她的躯体锚点 */
    s.push({ text: `Breathe in through your nose.`, pause: 3.0 });
    s.push({ text: `And out. Longer than you took it in.`, pause: 4.0 });
    s.push({ text: `Again. In.`, pause: 3.0 });
    s.push({ text: `And out.`, pause: 4.0 });
    s.push({ text: `Find your ${anchor}. Notice what it's holding without being asked.`, pause: 3.2 });
    s.push({ text: `Let it come down half a centimetre. Not all the way. Just half.`, pause: 3.6 });

    /* See / Hold — 具体场景，或平常日子的状态 */
    if (mode === 'dream') {
      s.push({ text: `Now put yourself inside it.`, pause: 2.2 });
      s.push({ text: `Not looking at it from here. Standing in it.`, pause: 2.6, bird: true });
      s.push({ text: `${capital(phrase)}.`, pause: 2.6 });
      if (who) s.push({ text: `${who.name} is somewhere in it. You can hear them.`, pause: 2.4 });
      s.push({ text: `It's an ordinary Tuesday there. That's how you know it's real — nobody's celebrating.`, pause: 3.2 });
    } else if (mode === 'state') {
      s.push({ text: `Now picture the most ordinary hour of today. The middle of the afternoon. Nothing happening.`, pause: 2.6 });
      s.push({ text: `You're ${intent} in it. Not performing it. Just carrying it, the way you carry your own name.`, pause: 3.0, bird: true });
      s.push({ text: `Nobody notices. That's the point. It isn't for anybody.`, pause: 3.0 });
    } else {
      s.push({ text: `Now go there.`, pause: 2.0 });
      s.push({ text: `${capital(phrase)}.`, pause: 2.4 });
      if (who) s.push({ text: `${who.name} is there. ${who.note || ''}`.trim(), pause: 2.6 });
      s.push({ text: `And you're already in it. Not walking toward it — in it.`, pause: 2.8, bird: true });
      s.push({ text: `It's going the way you'd want it to go. Notice you're not surprised.`, pause: 3.2 });
    }

    /* Feel — 回到身体，标记这个状态 */
    s.push({ text: `Come back to your ${anchor}.`, pause: 2.4 });
    s.push({ text: `This is what it feels like when it's already true.`, pause: 3.0 });
    s.push({ text: `Mark it. Your body will find it again this afternoon faster than your mind will.`, pause: 3.4 });

    /* Carry — 带走的一句 + 一个微行动。这里前后必须干净 */
    const carry = carryLine(profile, intent, mode);
    s.push({ text: `One line to take with you.`, pause: 2.0 });
    s.push({ text: carry, pause: 3.6 });
    s.push({ text: carry, pause: 4.0 });
    s.push({ text: `That's it. Wren's already up there with the rest.`, pause: 1.6 });

    return { segments: s, carry, seconds: Speech.estimate(s) };
  }

  function carryLine(p, intent, mode) {
    if (mode === 'state') return `I can be ${intent} without anyone noticing.`;
    if (mode === 'dream') {
      const t = (intent || '').toLowerCase();
      if (/house|home|apartment|kitchen/.test(t)) return `I am allowed to want the whole house.`;
      if (/money|rich|\$|salary|income/.test(t))  return `I am allowed to want the whole amount.`;
      if (/quiet|slow|calm|peace/.test(t))        return `The quiet version counts as ambition too.`;
      return `I am allowed to want it exactly like that.`;
    }
    const t = (intent || '').toLowerCase();
    if (/fast|quick|rush/.test(t)) return `I can take the long way through a sentence.`;
    if (/apolog/.test(t))          return `I can start without saying sorry.`;
    if (/money|rent|house/.test(t))return `I am allowed to want the whole amount.`;
    if (/no\b|boundar/.test(t))    return `No is a complete sentence.`;
    if (/nervous|scared|afraid/.test(t)) return `Nervous and ready are the same feeling.`;
    return `I walk in already steady.`;
  }

  const capital = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  /* 三个 vision 卡：同一件事的三种进法 */
  function visions(profile, intent, mode) {
    const base = script(profile, intent, mode);
    const D = mode === 'dream';
    const alt = [
      { title: base.carry, tone: 'steady', mins: '3 min' },
      { title: D ? `A Tuesday morning, already there.`
          : mode === 'state' ? `Nobody needs anything from me right now.`
          : `I say the hard thing in one clean sentence.`, tone: 'plain', mins: '2 min' },
      { title: D ? `The first hour, before anyone's up.`
          : mode === 'state' ? `The afternoon can be slow and still count.`
          : `I let the pause sit there without filling it.`, tone: 'quiet', mins: '90 sec' }
    ];
    return { base, alt };
  }

  return { clarity, script, visions, keyPhrase, firstClause };
})();
