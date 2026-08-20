/* ══════════════════════════════════════════════════════
   登录。

   ⚠ 现在没有真的鉴权 —— 三个入口都只是在本地记下「她选了哪种方式」，
   然后放行。真接入的时候只需要重写下面三个 signIn* 函数，
   它们的约定是：成功就 resolve 一个 { method, id, email? }，
   取消/失败就 reject，上层不用改。

   要接真的需要什么（都还没有）：
     Apple   Services ID + 回调域名 + 私钥（Sign in with Apple JS）
     Google  OAuth client ID（Google Identity Services）
     email   一个能发信的后端，走 magic link，不做密码
   ══════════════════════════════════════════════════════ */

const Auth = (() => {

  const KEY = 'wren.account.v1';

  function current() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; }
  }

  function remember(account) {
    const full = Object.assign({ at: Date.now() }, account);
    try { localStorage.setItem(KEY, JSON.stringify(full)); } catch (_) {}
    return full;
  }

  function forget() { try { localStorage.removeItem(KEY); } catch (_) {} }

  /* 本地占位 id。换成真 provider 时会被真实的 sub / user id 顶掉。 */
  function localId(prefix) {
    const rand = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random();
    return prefix + ':' + rand;
  }

  // ── 三个入口 ────────────────────────────────────
  // 每一个都是「等着被替换」的形状：返回 Promise<account>

  async function signInWithApple() {
    // TODO 真接入：AppleID.auth.init({ clientId, scope, redirectURI }) → signIn()
    return remember({ method: 'apple', id: localId('apple'), stub: true });
  }

  async function signInWithGoogle() {
    // TODO 真接入：google.accounts.id.initialize({ client_id }) → 拿 credential 解出 sub
    return remember({ method: 'google', id: localId('google'), stub: true });
  }

  async function signInWithEmail(email) {
    const clean = (email || '').trim();
    // 只做形状检查。真接入时这里改成请求 magic link，然后等她点邮件里的链接。
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) throw new Error('bad-email');
    return remember({ method: 'email', id: localId('email'), email: clean, stub: true });
  }

  return { current, remember, forget, signInWithApple, signInWithGoogle, signInWithEmail };
})();
