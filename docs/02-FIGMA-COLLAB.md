# Wren × Figma 协作方案

## 0. 先解决一件事：Figma 连接未授权

这个会话里 Figma MCP server 显示**需要授权**，而当前会话是非交互的，我没法在这里跑 OAuth 流程。

你需要在一个交互式 terminal 里跑 `/mcp` 完成授权，或者到 claude.ai 的 connector 设置里连一下。授权之前我能做的是：写文档、写代码、写 HTML demo。授权之后我才能读你的 Figma 文件、往里写内容、导出切图。

授权完成后，把 Figma 文件链接发我，后面的流程就能跑起来。

---

## 1. 我们各自做什么

Figma 里有三类工作，分工不一样：

| 工作 | 谁主导 | 说明 |
|---|---|---|
| 视觉方向、气质、审美判断 | **你** | 这是不能外包的部分。品牌长什么样、克制到什么程度、什么算"太甜"，只有你有判断 |
| 流程图、信息架构、状态清单 | **我** | FigJam 里的 flow 和状态穷举，我生成得又快又全 |
| Design tokens、变量体系、组件骨架 | **我先铺，你调** | 我把 Variables 和基础组件按规范建好，你改数值和细节 |
| 高保真界面 | **你为主，我补** | 关键屏你定调，重复屏和边界状态我按你定的规则批量补 |
| 设计 → 代码 | **我** | 通过 MCP 读设计，直接产出 SwiftUI / HTML 原型 |
| 代码 → 设计 | **我** | 已经写好的原型可以反向推回 Figma，保持设计稿和实现同步 |

核心原则：**你做判断，我做产出**。你不需要画重复的东西。

---

## 2. Figma 文件结构

建一个 Team，里面三个文件：

```
Wren (Team)
├── 🧭 Wren — Flows            [FigJam]
├── 🎨 Wren — Design System    [Figma · 发布为 Library]
└── 📱 Wren — Product          [Figma · 消费 Library]
```

### 🧭 Wren — Flows（FigJam）

| 区域 | 内容 |
|---|---|
| Research | Stella 截图拆解、竞品墙、用户访谈原话贴纸 |
| User Flows | Onboarding 8 步 / 每日循环 / 生成失败与降级 / 付费墙分支 |
| State Map | 每个页面的全部状态穷举（空 / 加载 / 生成中 / 失败 / 离线 / 免费限额 / 危机命中） |
| Content Map | 音频五段式脚本结构、槽位表、文案 tone 规则 |
| Open Questions | PRD 第 13 节那六个问题，边做边收敛 |

这个文件我可以用 `generate_diagram` 直接生成初版，你在上面批注和改。

### 🎨 Wren — Design System

页面：

```
Cover
Foundations   → Color / Type / Spacing / Radius / Elevation / Motion
Primitives    → Button / Input / Chip / Card / Sheet / Toast / Avatar
Composites    → IntentCard / PlayerBar / AudioCard / DayRow / PaywallBlock / BreathOrb
Patterns      → Nav / Empty States / Loading / Error
Iconography
Brand         → Logo / App Icon / Waveform 语言 / 分享卡模板
Motion        → 呼吸动效规格、转场规格
Changelog
```

### 📱 Wren — Product

按 flow 分页，不按"页面类型"分页：

```
Cover
00 · Onboarding      （8 步 + 生成中 + 首播 + 付费墙）
01 · Today           （空 / 已录意图 / 生成中 / 已生成 / 入夜）
02 · Intent Capture  （语音 / 文字 / 昨日延续 / 危机命中）
03 · Player          （播放 / 暂停 / 结束页 / 微行动）
04 · Library         （列表 / 详情 / 周回顾 / 空态）
05 · You             （画像 / 声音 / 提醒 / 订阅 / 隐私）
06 · Paywall & Billing
07 · System          （通知 / 权限 / 离线 / 错误）
99 · Archive
```

---

## 3. Design Tokens

在 Design System 文件里建 Variables，四个 Collection：

```
Primitive/     纯数值，不带语义
  color/bone/50…900, clay/50…900, moss/…, ink/…
  space/1…12   (4pt 基数)
  radius/xs…full
  duration/instant…slow

Semantic/      指向 Primitive，带语义，含 Light + Dark 两个 Mode
  bg/canvas, bg/raised, bg/sunken
  fg/primary, fg/secondary, fg/muted, fg/inverse
  accent/default, accent/hover, accent/subtle
  border/subtle, border/strong
  state/success, state/warning, state/danger

Component/     指向 Semantic
  button/primary/bg, button/primary/fg, …
  player/track, player/progress, …

Type/
  display/lg…sm, title/lg…sm, body/lg…sm, label, caption, quote
```

命名用 `category/role/variant`，全小写，斜杠分层。这套命名让我能直接把 Figma 变量映射成 SwiftUI 的 `Color.bgCanvas` 或 CSS 的 `--bg-canvas`，中间不需要人工翻译。

**视觉方向的起手建议**（你随便推翻，只是给个不至于撞 Stella 的起点）：

反着 Stella 走。它是紫黑星空渐变 + 科技感 AI 味。我们走另一边：

- **底色**：Bone `#F7F3EC` — 纸感暖白，不是纯白
- **墨色**：Ink `#1B1A18` — 暖黑，不是 `#000`
- **主色**：Clay `#C0674A` — 鹪鹩羽色，赭红偏暖
- **辅色**：Moss `#6E7A5F`、Sky `#A6C0CE`
- **字体**：标题用衬线（编辑感、有人味，避开所有冥想 app 的 Inter/SF 同质化），正文用一款干净无衬线。候选：Editorial New / Freight Text / Souvenir × Inter
- **形状**：大留白，一个会呼吸的有机形（不是完美圆）作为唯一的动态元素。整个 app 只有它在动
- **深色模式**：不是简单反色，是"清晨 vs 深夜"两套气质。深色下用 Ink 底 + 更低饱和的 Clay

---

## 4. 我在 Figma 里能做的具体动作

授权后可用：

| 能力 | 我用它做什么 |
|---|---|
| `get_design_context` / `get_metadata` | 读你的设计稿，理解结构和变量，转成代码 |
| `get_screenshot` | 看到设计的实际样子，用于自查和讨论 |
| `get_variable_defs` | 把 Variables 抽成 tokens 文件，代码里直引，不手抄色值 |
| `use_figma` | 往 Figma 里写：建组件、批量补屏、改 tokens |
| `generate_diagram` | FigJam 流程图 |
| `download_assets` | 导出切图（透明 PNG 要走 rawImages，这个坑之前踩过） |
| `get_motion_context` | 读你做的动效规格，转成 SwiftUI animation 参数 |
| Code Connect | 把 Figma 组件和代码组件绑定，之后设计改了代码知道改哪里 |

最有价值的两条链路：

**设计 → 可跑的原型。**你画完关键屏，我读出来，当天就给你一个能在手机上点的 HTML/SwiftUI 原型。三分钟的音频体验，静态稿是看不出好坏的，必须听着、走着看。

**代码 → 设计回写。**我先用代码把交互原型跑通（尤其是呼吸动效和播放器），你觉得对了，我再把它反推回 Figma 成为设计稿。这条路对动效类界面比先画后做快得多。

---

## 5. 三轮迭代节奏

### 第 1 轮 · 骨架（3–4 天）

1. 我在 FigJam 出 flow 和状态图 → 你批注
2. 我按上面的 token 结构建 Variables，用建议色值填一版 → 你调到满意
3. 你定 3 张关键屏的调性：**Today 首页 / Player / Onboarding 第 4 步**

这三张定了，剩下的都是推演。

### 第 2 轮 · 铺开（1 周）

1. 我按你定的调性批量补齐 07 个 flow 页面的全部状态
2. 你逐页过，改的地方我同步回 Design System
3. 我同步产出 HTML 原型，你在手机上真听真点

### 第 3 轮 · 交付（3–4 天）

1. 锁 Design System，发布 Library
2. Code Connect 绑定组件
3. 我出 SwiftUI 组件层 + tokens 文件
4. 动效规格逐条对齐

---

## 6. 命名规范（重要，直接影响我的产出质量）

Frame 名会变成我生成代码的组件名，请按这个来：

```
Frame:      [页码] Flow / State
            例：01 Today / Generating

Component:  Category/Name
            例：Card/AudioCard、Input/VoiceCapture

Variant:    property=value
            例：state=loading, size=lg, mode=dark

Layer:      语义命名，不要 "Rectangle 47"
            例：orb-breathing、carry-phrase、progress-track
```

Auto Layout 尽量用满。我读到固定坐标时只能猜布局意图，读到 Auto Layout 就能直接映射成 VStack / HStack。

> 之前 CLAPS 项目踩过：Main 是 auto-layout 时设 y 无效。同类问题在这里提前规避——需要绝对定位的元素（比如浮在播放器上的呼吸形）明确标注 `absolute`。

---

## 7. 下一步

授权 Figma 之后，按这个顺序开：

1. 你建 Team 和三个空文件，把链接发我
2. 我生成 FigJam 的 flow + state map
3. 我建 Variables 和 Foundations 页
4. 你定三张关键屏
5. 进入第 2 轮

在 Figma 授权之前，我可以先做的事：把 Today 首页 + Player 的可交互 HTML 原型写出来，含真实的三分钟音频节奏和呼吸动效。你先感受节奏，再回头定视觉，可能比反过来更顺。
