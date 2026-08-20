/* 后端客户端。后端不在（纯静态托管）也要能跑 —— 那时全部走本地兜底。 */

const API = (() => {
  let caps = { script: 'template', tts: 'browser', model: null, voice: null, offline: true };

  async function post(path, body, ms = 180000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function boot() {
    try {
      const res = await fetch('api/config');
      if (!res.ok) throw new Error('no api');
      caps = Object.assign(await res.json(), { offline: false });
    } catch (_) {
      caps.offline = true;
    }
    return caps;
  }

  /* 够不够具体。后端不在就用本地那套正则判定 —— 判不出来一律放行，
     宁可少提议一次，也不能拦住她。 */
  async function clarify(intent, profile) {
    if (caps.offline) return Offline.clarify(intent, profile);
    try {
      return await post('api/clarify', { intent, profile }, 30000);
    } catch (_) {
      return Offline.clarify(intent, profile);
    }
  }

  async function generate(intent, profile) {
    // 后端不在（比如 GitHub Pages 上的静态部署）就地拼一份，流程照样走得完
    if (caps.offline) return Offline.script(intent, profile);
    try {
      return await post('api/generate', { intent, profile });
    } catch (err) {
      console.warn('[wren] 后端生成失败，回退到本地模板：', err);
      return Object.assign(Offline.script(intent, profile), { source: 'template-fallback' });
    }
  }

  async function ttsStatus(texts) {
    try {
      return await post('api/tts/status', { texts }, 15000);
    } catch (_) {
      return { provider: 'browser', total: texts.length, ready: 0, keys: [] };
    }
  }

  async function ttsEnsure(text) {
    try {
      return await post('api/tts/ensure', { text }, 120000);
    } catch (_) {
      return { ready: false };
    }
  }

  const audioUrl = (key) => 'api/audio/' + key + '.mp3';

  return {
    boot, clarify, generate, ttsStatus, ttsEnsure, audioUrl,
    get caps() { return caps; },
    get realVoice() { return caps.tts === 'elevenlabs' || caps.tts === 'openai'; }
  };
})();
