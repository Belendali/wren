# Wren · 核心链路

> 你说出一件事 → 小鸟带上去 → 回来的是一段用你自己的话写的正念音频。

这不是 demo。生成、合成、播放三段都是真的后端在做事，**除了 key 还没填**——
key 一填，同一套代码就从「本地模板」切到「真为她写的」，前端一行不用改。

对应 Figma `🐦 Wren` → 📱 Product → section **主流程 · Home → Player**，9 屏 1:1 还原。

---

## 先看一眼

**[belendali.github.io/wren/product/web/](https://belendali.github.io/wren/product/web/)**

这条链接是**静态预览**：九屏、交互、播放全是真的，但 GitHub Pages 上没有后端，
所以稿子走本地模板、声音是浏览器合成的。**用 Chrome 或 Safari**，手机上效果最好。

要试的是这一段：`说一件明天真的要面对的事 → That's it → 三选一 → 播放`。

---

## 在本地跑真的

```bash
python3 /Users/liyuanyuan/wren/product/serve.py
```

打开 http://localhost:8471 。填了 key 之后，同样的操作走的就是 Claude 写稿 + 真人质感的声音。

启动时会打印当前用的是哪条路：

```
  Wren  ·  http://localhost:8471
  稿子   template
  声音   browser
  ↳ 填 .env 里的 key 就换成真的，前端不用改
```

---

## 填 key（交给同事的部分）

```bash
cd /Users/liyuanyuan/wren/product
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # 只有一个依赖
cp .env.example .env        # 已经有 .env 的话直接编辑
```

`.env` 里三行，**一行都不填也能跑，填哪行哪块就变真的**：

| 变量 | 作用 | 不填会怎样 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 写稿。**最要紧的一把** | 走本地五段式模板：结构对、能播完，但不是为她写的 |
| `ELEVENLABS_API_KEY` | 语音合成，质感最好 | ↓ |
| `OPENAI_API_KEY` | 语音合成，便宜一档（`gpt-4o-mini-tts`） | 两个都不填 → 浏览器内置合成，能听，但像导航播报 |

优先级：`WREN_TTS_PROVIDER` > ElevenLabs > OpenAI > 浏览器。改完 `.env` 重启服务即可。

验证：`curl localhost:8471/api/config` 应该返回 `{"script":"claude", "tts":"elevenlabs", ...}`。

### 三档，同一套前端

| | 稿子 | 声音 | 怎么进这一档 |
|---|---|---|---|
| 静态预览 | 本地模板 `web/offline.js` | 浏览器合成 | 直接开网页，没有后端 |
| 起了服务、没填 key | 本地模板 `wren/generate.py` | 浏览器合成 | `python3 serve.py` |
| 起了服务、填了 key | **Claude** | **ElevenLabs / OpenAI** | 填 `.env` 后重启 |

三档返回的数据结构完全一致，所以升档不需要动前端。

---

## 一次会话经过的九屏

```
Home ──type──────────────────────────┐
  └──mic──▶ Home speak ──▶ Speak clear ─┤
                                        ▼
                          ┌──── 够具体？ ────┐
                     不够 │                  │ 够
                          ▼                  ▼
                   Speak not clear ────▶ Generating
                    （提议，不代写）          │
                                             ▼
                                       Vision Picker（三选一）
                                             ▼
                                        Story Intro（音频在合成）
                                             ▼
                                          Player
                                             ▼
                                      Finish · 1 of 3 ──8 秒后自动续播──┐
                                             ▲                          │
                                             └──────────────────────────┘
```

---

## 三个不能改坏的地方

**一、回来的必须是她自己的话。** prompt 里写死了「原样引用她说的那句，不许改她的语法」。
她说 `everyone like it`，稿子里就得是 `everyone like it`。那一下就是这个产品成不成立的判断点。

**二、「具体」不等于「近期」，而且绝不能要求日期。**
「我想成为不会在开口前先道歉的人」没有时间没有地点，但它极其具体，必须放行。
判定线在 `wren/prompts.py` 的 `CLARIFY_SYSTEM` 和 `wren/generate.py` 的 `clarify_locally()`，两条路都实现了同一条规则。

**三、转译层不否定、不代写、只提议。**
出口「Take it as I said it →」永远在，选项是**加在她那句后面**而不是替换它。
一次会话最多提议一次，被拒两次之后不再提（`draft.offered` / `draft.refusals`）。
理由写在 `../docs/07-TRANSLATION.md`。

---

## 目录

```
serve.py            HTTP 服务：静态站 + 5 个接口
wren/
  config.py         .env、provider 探测
  prompts.py        ★ 给模型的那两段话。稿子好不好几乎全在这里
  generate.py       Claude 调用 + 本地模板兜底（两条路返回同构）
  tts.py            ElevenLabs / OpenAI 合成 + 磁盘缓存
web/
  index.html
  styles.css        设计系统，数值直译自 Figma 变量
  app.js            九屏 + 路由 + 状态
  audio.js          播放引擎（真音频 / 浏览器合成，同一条时间线）
  speech.js         麦克风、音量表、鸟叫合成
  api.js            后端客户端（后端不在时转本地）
  offline.js        没有后端时的模板，输出与 generate.py 同构
  assets/           从 Figma 拉下来的图片与图标
cache/audio/        合成好的 mp3，按「句子 + 嗓子」哈希，不进 git
```

---

## 接口

| | |
|---|---|
| `GET /api/config` | 当前哪些 provider 是活的 |
| `POST /api/clarify` | `{intent, profile}` → `{ok, reflection, options}` |
| `POST /api/generate` | `{intent, profile}` → `{sessions:[×3], source}`，同时后台开始合成音频 |
| `POST /api/tts/status` | `{texts}` → `{ready, total}`，Story Intro 的进度条读这个 |
| `GET /api/audio/<sha1>.mp3` | 一句话的音频 |

为什么按句子合成而不是整稿一次：段间静默要精确到 0.5 秒，交给客户端排程比塞 SSML 可靠，
也不挑 provider；而且第一句合成完就能开播，进度条是真的。

---

## 还没做的

- **Onboarding 没接**：画像现在是 `web/app.js` 里 `fresh()` 的默认值（名字写死 Maya）。
  接真 onboarding 时往同名字段灌数据即可，`profile` 的结构后端已经在用了。
- **封面不生成**：用 Figma 里那 8 张实拍图，按句子哈希选一张（同一句话永远同一张封面）。
  「带她自己的脸」那版留到下一期。
- **Library / Me / 付费墙**：不在这条链路里。
- **文案有一处待定**：Home 问的是 `what do you want to manifest today?`，1:1 照搬了设计稿。
  但 `docs/06-BRAND-STORY.md` 已经把 `manifest` 划进「讲兑现」的词，要换成「带」的语系。
  这是文案决定，没替你改。
