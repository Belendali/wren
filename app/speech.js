/* ═══════════════════════════════════════════════════
   speech.js — 让麦克风真的能听，让稿子真的能念
   没有后端。听用 SpeechRecognition，念用 speechSynthesis，
   鸟叫用 Web Audio 合成。
   ═══════════════════════════════════════════════════ */

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
    rec.onend = () => onFinal && onFinal(settled.trim());
    try { rec.start(); } catch (_) {}
    return rec;
  }

  function stopListening() { if (rec) { try { rec.stop(); } catch (_) {} } }

  /* ── 音量表（给波形用）─────────────────────── */
  let audioCtx = null, analyser = null, micStream = null, levelRAF = null;

  function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  async function meter(onLevel) {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const src = ctx().createMediaStreamSource(micStream);
      analyser = ctx().createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128));
        onLevel(Math.min(1, peak / 60));
        levelRAF = requestAnimationFrame(tick);
      };
      tick();
    } catch (_) {
      // 没给麦克风权限也要有动静，不然界面像死了
      const tick = () => { onLevel(0.25 + Math.random() * 0.4); levelRAF = setTimeout(tick, 90); };
      tick();
    }
  }

  function stopMeter() {
    if (levelRAF) { cancelAnimationFrame(levelRAF); clearTimeout(levelRAF); levelRAF = null; }
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
  }

  /* ── 鸟叫 ────────────────────────────────────
     不是采样，是合成。鹪鹩的短促 chit 音：
     一段极快的频率上滑 + 陡峭包络。 */
  function chirp({ near = true, at = 0 } = {}) {
    const c = ctx();
    const t0 = c.currentTime + at;
    const n = near ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const t = t0 + i * 0.085;
      const osc = c.createOscillator();
      const gain = c.createGain();
      const base = near ? 2600 : 3100;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.55, t + 0.035);
      osc.frequency.exponentialRampToValueAtTime(base * 0.85, t + 0.07);
      const peak = near ? 0.075 : 0.026;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t); osc.stop(t + 0.09);
    }
  }

  /* ── 念 ──────────────────────────────────────
     script = [{ text, pause }]  pause 单位秒，念完这句之后的静默 */
  let synth = window.speechSynthesis;
  let voices = [];
  let session = null;

  function loadVoices() {
    voices = synth.getVoices();
    return voices;
  }
  if (synth) {
    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }

  function pickVoice() {
    const v = loadVoices();
    const prefer = ['Samantha', 'Serena', 'Karen', 'Moira', 'Google UK English Female', 'Google US English'];
    for (const name of prefer) {
      const hit = v.find(x => x.name === name);
      if (hit) return hit;
    }
    return v.find(x => /en[-_]/i.test(x.lang) && /female/i.test(x.name))
        || v.find(x => /en[-_]/i.test(x.lang))
        || v[0] || null;
  }

  function estimate(script) {
    // 110 wpm 的正念语速 + 显式停顿
    const words = script.reduce((n, s) => n + s.text.split(/\s+/).length, 0);
    const pauses = script.reduce((n, s) => n + (s.pause || 0), 0);
    return Math.round(words / 110 * 60 + pauses);
  }

  function play(script, { onProgress, onLine, onDone } = {}) {
    stop();
    const total = estimate(script);
    const voice = pickVoice();
    let i = 0, elapsed = 0, timer = null, startedAt = 0, paused = false;

    session = {
      total,
      get elapsed() { return elapsed + (paused || !startedAt ? 0 : (Date.now() - startedAt) / 1000); },
      pause() {
        if (paused) return;
        paused = true;
        elapsed += (Date.now() - startedAt) / 1000;
        synth.pause(); clearTimeout(timer);
      },
      resume() {
        if (!paused) return;
        paused = false; startedAt = Date.now();
        synth.resume();
        if (!synth.speaking) next();
      },
      get paused() { return paused; }
    };

    chirp({ near: true });               // 起飞

    const tickUI = setInterval(() => {
      if (!session) return clearInterval(tickUI);
      onProgress && onProgress(Math.min(1, session.elapsed / total), session.elapsed, total);
    }, 200);

    function next() {
      if (!session) return;
      if (i >= script.length) {
        clearInterval(tickUI);
        chirp({ near: true, at: 0.4 });  // 归来
        onDone && onDone();
        session = null;
        return;
      }
      const seg = script[i++];
      onLine && onLine(seg.text, i - 1);

      // 途中：很远的一两声，落在段与段之间，不压人声
      if (seg.bird) chirp({ near: false });

      const u = new SpeechSynthesisUtterance(seg.text);
      if (voice) u.voice = voice;
      u.rate = 0.74; u.pitch = 0.95; u.volume = 1;
      u.onend = () => { timer = setTimeout(next, (seg.pause || 0.6) * 1000); };
      u.onerror = () => { timer = setTimeout(next, 400); };
      synth.speak(u);
    }

    startedAt = Date.now();
    next();
    return session;
  }

  function stop() {
    if (synth) synth.cancel();
    session = null;
  }

  return { canListen, listen, stopListening, meter, stopMeter, play, stop, chirp, estimate,
           get session() { return session; } };
})();
