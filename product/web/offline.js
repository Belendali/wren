/* ══════════════════════════════════════════════════════
   没有后端的时候用这套（比如 GitHub Pages 上的静态部署）。

   是 wren/generate.py 里那套模板的 JS 版本，输出结构完全一致 ——
   所以流程能从头走到尾，稿子是拼的、声音是浏览器合成的。
   真东西要 `python3 serve.py` + .env 里的 key。
   ══════════════════════════════════════════════════════ */

const Offline = (() => {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const ARTS = ['coral', 'sage', 'blue'];
  const WPM = 110;

  const seconds = (segs) =>
    Math.round(segs.reduce((n, s) => n + s.text.trim().split(/\s+/).length, 0) / WPM * 60
             + segs.reduce((n, s) => n + (s.pause || 0), 0));

  const label = (s) => (s < 105 ? '90 sec' : Math.max(1, Math.round(s / 60)) + ' min');

  /* 在从句边界切，不在第 9 个词切 —— 断口一旦被念出来，整段就露馅了 */
  function keyPhrase(s) {
    const clean = (s || '').trim()
      .replace(/^(i\s+(want|need|hope|wish)\s+(to\s+)?)/i, '')
      .replace(/[.。!?]+$/, '').trim();
    const clause = clean.split(/[,;—]|\s+(?:and|but|because|so)\s+/i)[0].trim();
    const w = clause.split(/\s+/);
    if (w.length >= 3 && w.length <= 14) return clause;
    if (w.length > 14) return w.slice(0, 12).join(' ');
    const all = clean.split(/\s+/);
    return all.length <= 16 ? clean : all.slice(0, 14).join(' ');
  }

  function carryLine(intent) {
    const t = (intent || '').toLowerCase();
    if (/apolog/.test(t)) return 'I can start without saying sorry.';
    if (/present|stage|speech|talk|pitch/.test(t)) return 'I walk in already steady.';
    if (/fast|quick|rush/.test(t)) return 'I can take the long way through a sentence.';
    if (/money|rent|house/.test(t)) return 'I am allowed to want the whole amount.';
    if (/\bno\b|boundar/.test(t)) return 'No is a complete sentence.';
    if (/nervous|scared|afraid/.test(t)) return 'Nervous and ready are the same feeling.';
    return 'I am already the person who does this.';
  }

  function script(intent, profile) {
    const you = (profile.name || '').trim() || 'You';
    const now = new Date();
    const day = DAYS[now.getDay()];
    const part = now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening';
    const phrase = keyPhrase(intent);
    const anchor = (profile.bodyAnchor || 'chest').toLowerCase();
    const who = (profile.people || []).filter(p => p.name)[0];
    const carry = carryLine(intent);
    const cap = phrase ? phrase[0].toUpperCase() + phrase.slice(1) : phrase;
    const seg = (text, pause, bird = false) => ({ text, pause, bird });

    const land = () => [
      seg(`${you}.`, 1.4),
      seg(`It's ${day} ${part}.`, 1.2),
      seg(`You said: ${phrase}.`, 2.0),
      seg(`Wren has that. It's already gone up with it.`, 1.8, true),
      seg(`Let the next breath out slowly. All of it.`, 3.4)
    ];
    const breathe = () => [
      seg('Breathe in through your nose.', 3.0),
      seg('And out. Longer than you took it in.', 4.0),
      seg('Again. In.', 3.0),
      seg('And out.', 4.0),
      seg(`Find your ${anchor}. Notice what it's holding without being asked.`, 3.2),
      seg('Let it come down half a centimetre. Not all the way. Just half.', 3.6)
    ];
    const feel = () => [
      seg(`Come back to your ${anchor}.`, 2.4),
      seg(`This is what it feels like when it's already true.`, 3.0),
      seg('Mark it. Your body will find it again this afternoon faster than your mind will.', 3.4)
    ];
    // Carry 那句前后必须干净 —— 不放鸟叫
    const close = (line) => [
      seg('One line to take with you.', 2.0),
      seg(line, 3.6),
      seg(line, 4.0),
      seg(`That's it. Wren's already up there with the rest.`, 1.6, true)
    ];

    const one = [
      ...land(), ...breathe(),
      seg('Now go there.', 2.0),
      seg(`${cap}.`, 2.4),
      seg(`You're already in it. Not walking toward it — in it.`, 2.8, true),
      seg(`It's going the way you'd want it to go. Notice you're not surprised.`, 3.2),
      ...(who ? [seg(`${who.name} is there. ${who.note || ''}`.trim(), 2.6)] : []),
      ...feel(), ...close(carry)
    ];

    const two = [
      ...land(), ...breathe(),
      seg('Now go back one hour.', 2.2),
      seg('Before any of it starts. The corridor. The car. The last quiet minute.', 3.0, true),
      seg(`Nothing has happened yet, and you're already steady.`, 2.8),
      seg(`That's the part nobody sees. It's the part that does the work.`, 3.2),
      ...feel(), ...close('I get to arrive before it starts.')
    ];

    const three = [
      seg(`${you}.`, 1.4),
      seg(`Ninety seconds. That's all this is.`, 1.6, true),
      seg('Breathe out first. Longer than feels necessary.', 4.0),
      seg('Now the smallest version of it.', 2.2),
      seg('Not the whole thing. One sentence you finish without speeding up.', 3.0),
      seg('One pause you let sit there without filling it.', 3.4),
      seg(`You can do that this afternoon. It doesn't need an occasion.`, 2.8),
      ...close('I can do the small version today.')
    ];

    const raw = [
      { title: carry.replace(/\.$/, ''), openingLine: cap || carry, carry, segments: one },
      { title: 'I arrive before it starts', openingLine: `The hour before it, and I'm already steady`,
        carry: 'I get to arrive before it starts.', segments: two },
      { title: 'I let the pause sit there', openingLine: 'One sentence I finish without speeding up',
        carry: 'I can do the small version today.', segments: three }
    ];

    return {
      source: 'template',
      tts: 'browser',
      sessions: raw.map((s, i) => {
        const secs = seconds(s.segments);
        return Object.assign({}, s, {
          id: 's' + (i + 1), index: i, art: ARTS[i % ARTS.length],
          seconds: secs, label: label(secs)
        });
      })
    };
  }

  return { script };
})();
