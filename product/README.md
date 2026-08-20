# Wren · 核心链路

> 你说出一件事 → 小鸟带上去 → 回来的是一段用你自己的话写的正念音频。

这不是 demo。生成、合成、播放三段都是真的后端在做事，**除了 key 还没填**——
key 一填，同一套代码就从「本地模板」切到「真为她写的」，前端一行不用改。

对应 Figma `🐦 Wren` → 📱 Product：**Onboarding**（10 屏）+ **Home**（`4:8`）+ **主流程 · Home → Player**（9 屏），全部 1:1 还原。

---

## 先看一眼

**[belendali.github.io/wren/product/web/](https://belendali.github.io/wren/product/web/)**

这条链接是**静态预览**：九屏、交互、播放全是真的，但 GitHub Pages 上没有后端，
所以稿子走本地模板、声音是浏览器合成的。**用 Chrome 或 Safari**，手机上效果最好。

第一次进来是 onboarding。要试的是最后那一问 —— **「What does your dream life look like?」**：
那段话是整个产品后面所有内容的料，Home 上的每日三段和输入框下面的快捷入口都从它派生。

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

## 第一次进来

```
Welcome(3 秒) → 登录 → 名字 → 想改变什么(语音) →〔回应〕→ 重要的人 → 工作
             →〔换挡〕→ 梦想的生活(语音) → 转写确认 → 承诺 → 生成 → 三选一 → 播放 → Home
```

Welcome 停三秒自己走，点哪儿都能提前走 —— 这一屏没有任何东西可以卡住人。
重进来时按状态接续：没登录 → 从头；登了没答完 → 接着答；答完 → Home。

六步问题 + 一个梦想提问，进度条九格。顺序照搬 Stella 的弧线（最不费力的先问、
回应屏卡在情绪成本最高那题之后当奖励），终点换成 Wren 自己的。
依据写在 `../docs/05-ONBOARDING.md`。

### ⚠ 登录现在是假的

`web/auth.js` 里三个入口只是在本地记下「她选了哪种方式」然后放行，**没有真鉴权**。
换真的只改那一个文件，返回 `{ method, id, email? }` 的约定不变，上层一行不用动。

要接真的还缺（都还没有）：

| | 需要什么 |
|---|---|
| Apple | Services ID + 回调域名 + 私钥（Sign in with Apple JS） |
| Google | OAuth client ID（Google Identity Services） |
| email | 一个能发信的后端，走 magic link —— **不做密码** |

按钮上没放 Apple / Google 的品牌图标，因为手上没有官方素材，不能自己画。真接入时要按各家的品牌规范补。

**「重要的人」那一屏是整套里最值钱的设计** —— 名字 + 一句「他是谁」。
专有名词是「这段是为我写的」那种感觉的唯一来源，生成时会直接用上。

---

## 之后每天

Home 一进来就有三张卡（`For you today`）和两个快捷入口，都来自 `POST /api/daily`：
拿她的画像和那段梦想，选出今天的三个「已经是日常」的片段。
当天拿过就存下来，隔天才重新要；最近听过的标题会一起传上去，避免每天推一样的。

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
  app.js            Home + 主流程九屏 + 路由 + 状态
  onboarding.js     onboarding 十一屏（含登录）
  auth.js           ★ 登录 —— 现在是本地占位，换真 provider 只改这里
  audio.js          播放引擎（真音频 / 浏览器合成，同一条时间线）
  speech.js         麦克风、音量表、鸟叫合成
  api.js            后端客户端（后端不在时转本地）
  offline.js        没有后端时的模板，输出与 generate.py 同构
  assets/           从 Figma 拉下来的图片与图标
cache/audio/        合成好的 mp3，按「句子 + 嗓子」哈希，不进 git
```

**改了 `web/` 下的 js 或 css，记得把 `index.html` 里的 `?v=` 抬一位。**
静态托管（GitHub Pages）会缓存这些文件，不换版本号的话回访的人看到的还是旧代码。

**录音这几屏最容易出事，改之前先看这三条：**
1. **实时转写的文字必须封高度**（`max-height` + `overflow:hidden` + 滚到底），
   否则说得长一点它就往下长，把停止键盖住 —— 看着还在，按不动。
2. **纯展示的文字加 `pointer-events: none`**，绝对定位的文字块会压在按钮上面。
3. **口述浮层上必须有一个看得见的停止键。** 只做「点遮罩结束」的话，
   她录完会发现屏幕上没有任何可按的东西。
另外 `Speech.stopListening()` 里有一道 1.5 秒的保险 —— `onend` 万一不回来，
也要把 `onFinal` 补上，不能把人晾在录音态。

**看不见的遮罩要写 `pointer-events: none`。**
「读全文」那层 `.scrim` 平时 `opacity:0` 铺满全屏，忘了这一条的话
**整个播放器一个按钮都按不动** —— 而且用 `.click()` 测是发现不了的（那绕过命中检测），
必须用 `document.elementFromPoint` 确认点得到的是谁。

**别再给按钮写死 `top`。** 设计稿是 844 高的画布，但手机浏览器带地址栏时可视区
常常只有 640–670 —— 写死 `top: 700px` 的按钮会整个沉到屏幕外，而且屏幕不滚，
用户直接卡死（这个坑踩过一次，整个 onboarding 都中招）。
现在的做法：
- onboarding —— 内容顺排、主按钮 `margin-top: auto` 贴底、`.ob` 可滚
- 主流程 —— 下半部分整组换成 `bottom:` 定位（相对间距不变），上面的文字块按剩余空间收
- 固定值一律写成 `min(182px, 22vh)` / `max(140px, calc(100% - 576px))` 这种形式：
  **844 时取到设计稿的数，矮屏时自动让路**

560 / 640 / 844 三档都验过，每一屏的主操作都在可视区内、而且点得到。

---

## 接口

| | |
|---|---|
| `GET /api/config` | 当前哪些 provider 是活的 |
| `POST /api/clarify` | `{intent, profile}` → `{ok, reflection, options}` |
| `POST /api/generate` | `{intent, profile}` → `{sessions:[×3], source}`，同时后台开始合成音频 |
| `POST /api/daily` | `{profile}` → `{sessions:[×3], suggestions:[×2]}`，Home 一进来就要的东西 |
| `POST /api/tts/status` | `{texts}` → `{ready, total}`，Story Intro 的进度条读这个 |
| `GET /api/audio/<sha1>.mp3` | 一句话的音频 |

为什么按句子合成而不是整稿一次：段间静默要精确到 0.5 秒，交给客户端排程比塞 SSML 可靠，
也不挑 provider；而且第一句合成完就能开播，进度条是真的。

---

## 还没做的

- **封面不生成**：用 Figma 里那 8 张实拍图，按句子哈希选一张（同一句话永远同一张，
  同一排里去重）。**承诺屏那个圆角方框在设计稿里是她自己的脸** —— 现在放的是实拍图占位，
  「带她自己的脸」那版留到下一期。
- **onboarding 里砍掉的题**：城市、有没有小孩、对工作什么感觉、过去的事、身体锚点、
  选声音、提醒时间。Figma 里那几帧还在，`profile` 的字段也留着，要加回来直接往
  `onboarding.js` 的 `FLOW` 里插一步。
- **Library / Me / 付费墙**：不在这条链路里。
- **文案有一处待定**：Home 问的是 `what do you want to manifest today?`，1:1 照搬了设计稿。
  但 `docs/06-BRAND-STORY.md` 已经把 `manifest` 划进「讲兑现」的词，要换成「带」的语系。
  这是文案决定，没替你改。
