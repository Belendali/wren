/* ══════════════════════════════════════════════════════
   播放引擎。两套发声方式，一套时间线。

   真嗓子（后端合成好的 mp3）：每段一个 <audio>，段间静默由 setTimeout 排，
   时长从 metadata 读，进度条是真的。
   浏览器兜底（speechSynthesis）：时长只能估，进度走墙上时间。

   上层（app.js）不关心用的是哪一套。
   ══════════════════════════════════════════════════════ */

const Player = (() => {
  const WPM = 110;

  let S = null;   // 当前会话
  let hooks = {};

  const estimate = (text) => text.trim().split(/\s+/).length / WPM * 60;

  function reset() {
    stop();
    S = null;
    hooks = {};
  }

  /* ── 准备 ────────────────────────────────────────
     real=true 时把每段音频拉下来拿到真实时长；进度回调喂 Story Intro。 */
  async function prepare(session, { onProgress } = {}) {
    const real = API.realVoice && session.segments.every(s => s.key);
    const tracks = session.segments.map(seg => ({
      text: seg.text,
      pause: seg.pause,
      bird: seg.bird,
      key: seg.key,
      el: null,
      seconds: estimate(seg.text)
    }));

    if (!real) {
      // 浏览器合成：没有东西要等，但也不能瞬间跳走 ——
      // 这一屏是让她读完那句话、把气吐掉的地方。给它两秒。
      const STEPS = 10;
      for (let i = 1; i <= STEPS; i++) {
        await new Promise(r => setTimeout(r, 200));
        onProgress && onProgress(i / STEPS);
      }
      return { tracks, real: false, total: totalOf(tracks) };
    }

    let done = 0;
    const texts = tracks.map(t => t.text);

    // 后端在后台合成。轮询到齐了再逐个 load，避免一次开 20 个请求。
    for (let round = 0; round < 240; round++) {
      const st = await API.ttsStatus(texts);
      if (st.ready >= st.total) break;
      onProgress && onProgress(Math.max(.04, st.ready / Math.max(1, st.total)) * .8);
      await new Promise(r => setTimeout(r, 900));
    }

    await Promise.all(tracks.map(async (t) => {
      t.el = await loadTrack(t);
      done++;
      onProgress && onProgress(.8 + .2 * (done / tracks.length));
    }));

    const ok = tracks.every(t => t.el);
    return { tracks, real: ok, total: totalOf(tracks) };
  }

  function loadTrack(t) {
    return new Promise(async (resolve) => {
      const tryLoad = () => new Promise((res) => {
        const el = new Audio(API.audioUrl(t.key));
        el.preload = 'auto';
        el.addEventListener('loadedmetadata', () => {
          if (isFinite(el.duration) && el.duration > 0) t.seconds = el.duration;
          res(el);
        }, { once: true });
        el.addEventListener('error', () => res(null), { once: true });
        el.load();
      });

      let el = await tryLoad();
      if (!el) {
        // 后台还没轮到这一句 —— 让后端现合成，再试一次
        const r = await API.ttsEnsure(t.text);
        if (r.ready) el = await tryLoad();
      }
      resolve(el);
    });
  }

  const totalOf = (tracks) => tracks.reduce((n, t) => n + t.seconds + t.pause, 0);

  /* ── 开播 ──────────────────────────────────────── */
  function start(prepared, callbacks) {
    stop();
    hooks = callbacks || {};
    S = {
      tracks: prepared.tracks,
      real: prepared.real,
      total: prepared.total,
      i: 0,
      base: 0,          // 已经走完的段落累计秒数
      markAt: 0,        // 本段开始时的墙上时间
      paused: false,
      timer: null,
      tick: null,
      loop: false
    };
    Speech.chirp({ near: true });              // 起飞
    S.tick = setInterval(pump, 200);
    playFrom(0);
    return S;
  }

  function playFrom(index) {
    if (!S) return;
    S.i = index;
    S.base = S.tracks.slice(0, index).reduce((n, t) => n + t.seconds + t.pause, 0);
    speak();
  }

  function speak() {
    if (!S || S.paused) return;
    const t = S.tracks[S.i];
    if (!t) return finish();

    S.markAt = Date.now();
    hooks.onLine && hooks.onLine(S.i, t.text);
    if (t.bird) Speech.chirp({ near: false });

    const advance = () => {
      if (!S) return;
      S.timer = setTimeout(() => {
        if (!S || S.paused) return;
        S.base += t.seconds + t.pause;
        S.i += 1;
        if (S.i >= S.tracks.length) return finish();
        speak();
      }, t.pause * 1000);
    };

    if (S.real && t.el) {
      t.el.currentTime = 0;
      t.el.onended = advance;
      const p = t.el.play();
      if (p && p.catch) p.catch(() => { Speech.say(t.text, advance); });
    } else {
      Speech.say(t.text, advance);
    }
  }

  function pump() {
    if (!S || S.paused) return;
    hooks.onProgress && hooks.onProgress(elapsed(), S.total);
  }

  function elapsed() {
    if (!S) return 0;
    const t = S.tracks[S.i];
    let inside = 0;
    if (t) {
      inside = (S.real && t.el && !t.el.paused)
        ? t.el.currentTime
        : Math.min(t.seconds + t.pause, (Date.now() - S.markAt) / 1000);
    }
    return Math.min(S.total, S.base + inside);
  }

  function finish() {
    if (!S) return;
    if (S.loop) { playFrom(0); return; }
    clearInterval(S.tick);
    Speech.chirp({ near: true, at: .5 });      // 归来
    hooks.onProgress && hooks.onProgress(S.total, S.total);
    const done = hooks.onDone;
    S = null;
    done && done();
  }

  function pause() {
    if (!S || S.paused) return;
    S.paused = true;
    const t = S.tracks[S.i];
    if (S.real && t && t.el) { S.base += t.el.currentTime; t.el.pause(); }
    else { S.base += Math.min(t ? t.seconds : 0, (Date.now() - S.markAt) / 1000); Speech.hush(); }
    clearTimeout(S.timer);
    hooks.onState && hooks.onState(true);
  }

  function resume() {
    if (!S || !S.paused) return;
    S.paused = false;
    S.markAt = Date.now();
    const t = S.tracks[S.i];
    if (S.real && t && t.el) {
      const at = t.el.currentTime;
      S.base -= at;                            // base 在 pause 时加过一次，播回去要减掉
      t.el.play().catch(() => {});
    } else {
      // speechSynthesis 没法从句中恢复，整句重来
      S.base = S.tracks.slice(0, S.i).reduce((n, x) => n + x.seconds + x.pause, 0);
      speak();
    }
    hooks.onState && hooks.onState(false);
  }

  const toggle = () => { if (!S) return; S.paused ? resume() : pause(); };

  function seek(seconds) {
    if (!S) return;
    const target = Math.max(0, Math.min(S.total - .5, seconds));
    let acc = 0, idx = 0, into = 0;
    for (let i = 0; i < S.tracks.length; i++) {
      const span = S.tracks[i].seconds + S.tracks[i].pause;
      if (acc + span > target) { idx = i; into = target - acc; break; }
      acc += span;
      idx = i;
    }
    hush();
    S.paused = false;
    S.i = idx;
    S.base = acc;
    const t = S.tracks[idx];
    S.markAt = Date.now() - into * 1000;
    hooks.onLine && hooks.onLine(idx, t.text);
    hooks.onState && hooks.onState(false);
    if (S.real && t.el) {
      t.el.currentTime = Math.min(into, Math.max(0, t.seconds - .05));
      t.el.onended = () => { S.base += t.seconds + t.pause; S.i += 1; S.i >= S.tracks.length ? finish() : speak(); };
      t.el.play().catch(() => {});
    } else {
      speak();
    }
  }

  const nudge = (delta) => seek(elapsed() + delta);

  function hush() {
    if (!S) return;
    clearTimeout(S.timer);
    S.tracks.forEach(t => { if (t.el) { t.el.pause(); t.el.onended = null; } });
    Speech.hush();
  }

  function stop() {
    if (!S) return;
    hush();
    clearInterval(S.tick);
    S = null;
  }

  function setLoop(on) { if (S) S.loop = on; }

  return {
    prepare, start, pause, resume, toggle, seek, nudge, stop, setLoop, reset,
    get elapsed() { return elapsed(); },
    get total() { return S ? S.total : 0; },
    get index() { return S ? S.i : 0; },
    get paused() { return S ? S.paused : true; },
    get live() { return !!S; }
  };
})();
