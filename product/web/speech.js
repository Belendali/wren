/* ══════════════════════════════════════════════════════
   麦克风、音量表、鸟叫，以及没有 TTS key 时的兜底人声。

   听是真的（Web Speech API），波形跟真实音量，鸟叫是 Web Audio 合成的。
   鸟叫按 06-BRAND-STORY 的规则：起飞近、途中远、归来近，压在人声下面。
   ══════════════════════════════════════════════════════ */

const Speech = (() => {

  /* ── 听 ──────────────────────────────────────── */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;

  const canListen = () => !!SR;

  function listen({ onPartial, onFinal, onError }) {
    if (!SR) { onError && onError('unsupported'); return null; }
    rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    let settled = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) settled += r[0].transcript;
        else interim += r[0].transcript;
      }
      onPartial && onPartial((settled + interim).trim());
    };
    rec.onerror = (e) => onError && onError(e.error);
    rec.onend = () => { rec = null; onFinal && onFinal(settled.trim()); };
    try { rec.start(); } catch (_) {}
    return rec;
  }

  function stopListening() { if (rec) { try { rec.stop(); } catch (_) {} } }

  /* ── 音量表 ─────────────────────────────────── */
  let audioCtx = null, micStream = null, raf = null;

  function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  async function meter(onLevel) {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const src = ctx().createMediaStreamSource(micStream);
      const analyser = ctx().createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128));
        onLevel(Math.min(1, peak / 60));
        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch (_) {
      // 没给权限也要有动静，不然界面看着像死了
      const tick = () => { onLevel(.22 + Math.random() * .4); raf = setTimeout(tick, 90); };
      tick();
    }
  }

  function stopMeter() {
    if (raf) { cancelAnimationFrame(raf); clearTimeout(raf); raf = null; }
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
  }

  /* ── 鸟叫 ────────────────────────────────────
     鹪鹩的短促 chit：极快的频率上滑 + 陡峭包络。
     音量压在人声下面 —— 应该「注意到有鸟」，不是「在听鸟」。 */
  let birdOn = true;
  const setBird = (on) => { birdOn = on; };

  function chirp({ near = true, at = 0 } = {}) {
    if (!birdOn) return;
    let c;
    try { c = ctx(); } catch (_) { return; }
    const t0 = c.currentTime + at;
    const n = near ? 3 : 2;
    for (let i = 0; i < n; i++) {
      // 间隔随机 ±20% —— 规则重复的鸟叫在第 30 天会让人发疯
      const t = t0 + i * (.085 * (.8 + Math.random() * .4));
      const osc = c.createOscillator();
      const gain = c.createGain();
      const base = (near ? 2600 : 3100) * (.94 + Math.random() * .12);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.55, t + .035);
      osc.frequency.exponentialRampToValueAtTime(base * .85, t + .07);
      const peak = near ? .07 : .024;
      gain.gain.setValueAtTime(.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, t + .075);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t); osc.stop(t + .09);
    }
  }

  /* ── 兜底人声 ────────────────────────────────
     没填 TTS key 的时候用它。能听完整，但这不是产品最终的声音。 */
  const synth = window.speechSynthesis;
  let voices = [];

  function loadVoices() { voices = synth ? synth.getVoices() : []; return voices; }
  if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }

  function pickVoice() {
    const v = loadVoices();
    for (const name of ['Samantha', 'Serena', 'Karen', 'Moira', 'Google UK English Female']) {
      const hit = v.find(x => x.name === name);
      if (hit) return hit;
    }
    return v.find(x => /en[-_]/i.test(x.lang)) || v[0] || null;
  }

  function say(text, done) {
    if (!synth) { setTimeout(done, 1200); return; }
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.rate = .74; u.pitch = .95; u.volume = 1;
    u.onend = () => done && done();
    u.onerror = () => done && done();
    synth.speak(u);
  }

  function hush() { if (synth) synth.cancel(); }

  return { canListen, listen, stopListening, meter, stopMeter, chirp, setBird, say, hush };
})();
