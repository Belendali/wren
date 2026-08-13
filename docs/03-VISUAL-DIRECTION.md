# Wren 视觉方向

> **2026-08-11 更新 · Quiet Signal**
> 品牌视觉已定稿,方向从"暖色渐变 + 抽象光球"改为**石拓质感的复古印刷感**。下面第 0 节是现行系统,第 1 节起的 Tolan 参照保留作为**布局**依据(一屏一事、大衬线、零 chrome 仍然有效),但**配色和材质以第 0 节为准**。

---

## 0. Quiet Signal —— 现行视觉系统

### 为什么换

原来那套暖渐变干净得像 SaaS。石拓的颗粒感有手工感和时间感 —— 对一个讲"与天地共鸣"的正念产品,**材质本身就在说话**,这是纯渐变给不了的。

### 色板(六色)

| | hex | 用途 |
|---|---|---|
| Ink | `#35251F` | 墨。文字、logo 底、深色面 |
| Signal | `#E96F51` | **唯一的响色**。太阳、主按钮、强调 |
| Clay | `#E7A47E` | 渐变中段、次级强调 |
| Peach | `#F6D2BE` | 渐变浅段、卡片底 |
| Paper | `#FFF8F1` | 暖白。主底、反白文字 |
| Bone | `#F4F0E8` | 纸。中性面、Library 底 |

21 个 primitive 变量已重新指向这套值 —— **所有绑定同步更新,不需要逐屏改**。

### 颗粒(拓印质感)

`~/wren/covers/make_grain.py` 生成三层叠加的无缝纹理:细噪点(纸纤维)+ 中频斑驳(墨没吃匀)+ 低频起伏(石面高低)。

三张图都以**中灰 128 为基准**,在 Figma 里用 **OVERLAY 混合**叠加 —— 亮处压暗、暗处提亮,所以同一张纹理在四个时段渐变上都成立,不用为每个色调单独出图。

| 样式 | 用在哪 | 强度 |
|---|---|---|
| 已并入 `Surface/*` | 四档时段渐变,全屏 | 0.72(night 0.6) |
| `Texture/Card grain` | 卡片、chip、按钮 | 0.75 |
| `Texture/Ink grain` | logo、app icon、太阳、深色墨块 | 0.9 |

**关键参数:`scalingFactor` 必须是 1。** 设成 0.5 时每个噪点只占半个点,平均成一片灰,颗粒完全消失 —— 这个坑踩过一次。

### 主视觉:太阳 → 信号点 → 鸟

组件 `Hero / Sun & Bird`。三个元素落在一条带信号波形的横线上:

- **太阳**(Signal 色 + ink 颗粒)= 早晨
- **六个信号点**(依次变小变淡)= 那三分钟
- **鸟**(Paper 色,站在线上)= 用户自己

这个图形取代了原来的 BreathOrb。它比光球好在**它有叙事** —— 光球只是个漂亮的形,这个是一句话。

**动效接口:** 太阳承担呼吸(4 秒吸 / 6 秒呼的缩放),六个点承担进度 —— 三分钟里依次点亮,每个约 30 秒。进度条和品牌图形合二为一。

### 待办

- `bird` 目前是占位几何,等品牌方矢量导出后替换同名节点
- Wordmark 用的是几何无衬线(品牌稿),正文提问仍是 Fraunces —— **字体名待确认**
- App icon 待换成品牌 logo

---

## 1. Tolan 的做法拆解(布局参照,配色已作废)

- 参考：[Tolan iOS on Mobbin](https://mobbin.com/apps/tolan-ios-ca36ae86-7d58-43b4-a689-25f959071667/a8e42e87-74f7-421f-9e41-1fc57da9c840/screens)（186 屏，已通读）
- Figma：[🐦 Wren](https://www.figma.com/design/PPZcQQzUXijyD4ZxcSaJ93/%F0%9F%90%A6-Wren?node-id=3-2)

---

## 1. Tolan 的做法拆解

### Splash
暖白满屏（近 `#FDFBF4`），一个深色 wordmark 居中，粗衬线。没有 tagline，没有 loading。安静。

### Onboarding
深藏蓝星空底（近 `#1B2033`），**一屏一个问题**。大号衬线居中提问，下面一个浅色胶囊输入框（约 56pt 高，full radius），再下面 11pt 的小字免责说明。主按钮是一个**磨砂玻璃圆形 chevron**，直径约 64pt，浮在下方居中。

没有进度条，没有"第 3 步 / 共 8 步"，没有返回按钮以外的任何 chrome。

年龄用滚轮选择器，相邻项渐隐。

### 语音模式
深蓝紫径向渐变，中央一颗发光的多面晶体，屏幕最底边一条实时波形，两个圆按钮（红色关闭、麦克风）。

### 主界面
满屏黄昏渐变天空（桃色 → 薰衣草 → 苔绿地面），角色居中站着。所有控件都是浮在场景上的小圆图标，没有任何导航栏或卡片容器。

### Daily Affirmation ← **这一屏是 Wren 的直接先例**
满屏暖色纵向渐变（绯红 → 橙 → 桃 → 奶白）。顶部一行极小的全大写 eyebrow 标签 `DAILY AFFIRMATION` 带下划线，一个小太阳字符，然后是巨大的衬线肯定语居中，行距很松。底部一行小字 `Breathe` 加磨砂圆形 chevron。右上角一个分享图标。

Tolan 自己的系统里已经有暖色这一支，说明这套骨架不依赖星空底也成立。

### 提炼出的系统规则

| 维度 | Tolan 的做法 |
|---|---|
| 版式 | 一屏一件事，永远居中，大量留白 |
| 字体 | 表达性文字全部用一款暖衬线；微标签用全大写加宽字距的无衬线 |
| 主操作 | 磨砂玻璃圆形 chevron，取代所有矩形 CTA |
| 圆角 | 输入框和按钮 full；卡片 28–32 |
| 背景 | 满屏渐变，从不是平色块 + 卡片 |
| 焦点物 | 每屏一个柔性 3D 发光物体，居中 |
| Chrome | 近乎为零。没有 nav bar、没有标题栏、没有进度指示 |

---

## 2. Wren 拿走什么

**1 · 一屏一问 + 磨砂圆形 chevron。**
直接套用到我们的 8 步 onboarding。这个模式让"问私密问题"这件事变得不像填表，而像一次一次的轻声对话。

**2 · 满屏渐变作为内容表面本身。**
不用卡片，不用面板。Wren 一次只播一段音频，屏幕就应该只有一件事。

**3 · 大衬线承载真正重要的那句话。**
今天的意图、带走的那句话、onboarding 的提问——都用 display serif。其余全部退到微标签。

**4 · 单一柔性 3D 焦点物。**
Tolan 是外星人，Wren 是 **Breath Orb**——一个会呼吸的柔软有机体。它随呼吸节奏缩放，同时**就是播放/暂停控件**。整个 app 只有它在动。

**5 · 近乎零 chrome。**

---

## 3. Wren 改掉什么

**1 · 底色从宇宙换成一天。**

Tolan 默认是深藏蓝星空。那正好是 Stella 的地盘（cosmic / universe / starfield），我们要绕开。

Wren 的渐变是一套**时段系统**——背景颜色跟着真实时间走：

| 时段 | 名称 | 渐变 |
|---|---|---|
| 5:00–10:00 | `morning` | `#FBF4EA` → `#F6DAC0` → `#E0A183` |
| 10:00–17:00 | `day` | `#FAF6EF` → `#E8EEF0` → `#C3D4DC` |
| 17:00–20:00 | `dusk` | `#F3E3D8` → `#D99A73` → `#A45C46` |
| 20:00–5:00 | `night` | `#241E22` → `#3A2B33` → `#5A3A38` |

早上七点和晚上九点打开 Wren 是两个不同的地方。这件事 Tolan 没做，而它恰好加强我们"今天"的定位——app 和你共享同一个白天。深色模式因此不是反色，是 `night` 这一档。

**2 · 不要角色。**

Tolan 的资产是一个陪伴型生物。Wren 的资产是用户自己的声音和身体。焦点物保持抽象，永远不给它脸——这既避开了 companion 品类，也避免用户把成果归因给一个虚构角色。

**3 · 不要游戏化。**

星球成长、契合度 92%、等级、解锁——一个都不要。这和 PRD 第 4.6 条反焦虑原则是同一件事。

**4 · 认证往后放。**

Tolan 第 2 步就要手机号加短信验证。Wren 在第一段音频播完之前不问任何账号信息。

---

## 4. Tokens

### Color

```
Primitive/
  bone/50   #FDFBF7      ink/900   #14100E
  bone/100  #FBF4EA      ink/700   #33291F
  bone/200  #F3E9DA      ink/500   #6B5B4C
  clay/300  #E8B79C      ink/300   #A6968A
  clay/500  #C0674A      ink/100   #E4DBD0
  clay/700  #8E4530
  moss/500  #6E7A5F      sky/400   #A6C0CE
  plum/700  #3A2B33      plum/900  #241E22

Gradient/                （四档，随系统时间切换）
  surface/morning   bone/100 → #F6DAC0 → clay/300
  surface/day       #FAF6EF → #E8EEF0 → sky/400
  surface/dusk      #F3E3D8 → #D99A73 → clay/700
  surface/night     plum/900 → plum/700 → #5A3A38

Semantic/            Light（morning·day·dusk）      Dark（night）
  fg/primary         ink/900                        bone/50
  fg/secondary       ink/500                        bone/200 @70%
  fg/muted           ink/300                        bone/200 @45%
  surface/frost      #FFFFFF @28% + blur 24         #FFFFFF @14% + blur 24
  surface/input      #FFFFFF @72%                   #FFFFFF @10%
  border/hairline    ink/900 @8%                    bone/50 @14%
  accent             clay/500                       clay/300
```

`surface/frost` 是磨砂圆按钮和所有浮层的唯一材质。全 app 就这一种材质语言。

**dusk 需要自己的一套语义色**（原型里发现的）。它的渐变下半段落到 `#A45C46`，`fg/muted` 那一层文字在上面基本消失。时段系统不能只换 `surface`，每一档都要带自己的前景色和 frost 不透明度：

```
Semantic/ 在 dusk 模式下覆盖
  fg/primary       #2B140C
  fg/secondary     rgba(43,20,12,.74)
  fg/muted         rgba(43,20,12,.54)
  surface/frost    #FFFFFF @34%
  surface/input    #FFFFFF @82%
  border/hairline  rgba(43,20,12,.13)
  accent           clay/700
```

更普遍的规律：屏幕底部永远落在渐变最深处，顶部落在最浅处，单一 fg token 服务不了两端。所以底部的文字一律要有自己的 frost 容器托底，不能裸放在渐变上。

### Type

- **Display serif：Fraunces**（可变字体，带 `SOFT` 和 `WONK` 轴——字形柔软度可调，正好对应我们要的"暖而不甜"）。Figma 里已确认可用，但走的是 Google Fonts 静态实例集（Thin…Black），`SOFT`/`WONK` 轴在 Figma 里调不了，只能在代码侧用 `font-variation-settings`。设计稿里用 Regular / SemiBold 两档即可。备选 Instrument Serif / Editorial New。
- **Sans：Inter**，只用于微标签、按钮文字、系统信息。

```
display/xl   40 / 46   Fraunces 400  SOFT 60   -0.01em
display/lg   32 / 40   Fraunces 400  SOFT 60   -0.01em
display/md   26 / 34   Fraunces 400  SOFT 40
title        20 / 28   Fraunces 500
body         17 / 26   Inter 400
label        13 / 18   Inter 500
caption      11 / 16   Inter 500  ALL CAPS  +0.14em
```

`caption` 是 eyebrow 标签的专用样式：`TODAY'S INTENTION` / `MORNING PRIME` / `CARRY THIS`。

### Space / Radius / Motion

```
space     4 8 12 16 20 24 32 40 56 72          （4pt 基数）
radius    xs 8 · sm 12 · md 20 · lg 28 · full 999
blur      frost 24 · scrim 40

duration  breath 4000 · slow 600 · base 320 · fast 180
easing    breath  cubic-bezier(.37,0,.63,1)     （正弦，用于 orb 呼吸）
          enter   cubic-bezier(.16,1,.3,1)      （spring-ish 入场）
          exit    cubic-bezier(.4,0,1,1)
```

**呼吸节奏是 4 秒吸 / 6 秒呼**（延长呼气激活副交感神经）。Orb 的缩放曲线严格按这个走，不是装饰性的 loop。这是产品逻辑，不是动效参数。

---

## 5. 核心组件

| 组件 | 说明 |
|---|---|
| `BreathOrb` | 唯一的动态元素。三个状态：`idle`（缓慢呼吸）· `listening`（边缘随音量波动）· `playing`（跟随音频包络）。同时是播放/暂停热区。尺寸 200–280 |
| `FrostButton` | 磨砂圆形，64pt，内含 chevron / play / pause / mic。这是全 app 唯一的主操作形态 |
| `PillInput` | full radius，56pt 高，`surface/input`。文字输入与语音输入共用外形，右侧图标切换 |
| `Eyebrow` | `caption` 样式的全大写小标签，下方 1pt hairline 短线（宽度 24） |
| `CarryCard` | 结束页的那句话。满屏渐变 + display/lg 居中 + 底部微行动勾选 |
| `DayRow` | Library 里的一行：日期 + 意图原文一行截断 + 时长 + 小型波形缩略 |
| `WaveStrip` | 屏幕底边的实时波形，语音输入和播放共用 |

---

## 6. 六个 frame 的落法

你已经建好的 frame，对应关系：

| 你的 frame | 内容 |
|---|---|
| **Welcome** | 满屏 `morning` 渐变 + Wren wordmark 居中 + 底部一行 caption。8 秒后自动进 Onboarding，或点任意处进入。不放 CTA 按钮 |
| **Onboarding** | 做成 8 个 variant（`step=1…8`）。共用骨架：eyebrow + display/lg 提问 + 输入区 + FrostButton。第 8 步是生成中，BreathOrb 首次出现并开始呼吸 |
| **Home** | 满屏时段渐变。上：eyebrow `TODAY` + 日期。中：BreathOrb。下：意图卡（未录入时是 PillInput，已生成时是播放条）。三个状态做成 variant |
| **Library** | 唯一有列表的页面。DayRow 按周分组，组头是 caption。背景用 `bone/50` 平色，让它和其他页拉开——这里是档案室 |
| **Widget** | 锁屏 + 主屏两档。内容只有今天的 carry phrase，Fraunces，无图标 |
| **Me** | 「你的画像」放最上面且最大——app 记住的关于你的事，明文可编辑。这是信任装置，不是设置页 |

### 还缺三个 frame

建议加上：

- **Intent** — 意图录入（语音 / 文字 / 昨日延续 / 危机命中四态）。这是每天使用的入口，值得独立一屏
- **Player** — 全屏播放（播放 / 暂停 / 结束页 / 微行动）
- **Paywall** — 第一段音频播完后出现

Widget 可以放到 P1，先把 Intent 和 Player 做出来更要紧——那是每天真正被用到的两屏。

---

## 7. Widget

Stella 把 affirmation 做成第三个 tab —— 用户得主动打开 app、点进去才能看到。我们把它放进 widget：**拿起手机就在那儿**。

### 内容就是当天的 carry phrase

不是通用的每日肯定语，是**今天早上那三分钟里你自己带走的那一句**。这条线把整个产品串起来了：早上录意图 → 三分钟音频 → 带走一句 → 这句话在你手机上待一整天 → 需要时点一下重听 60 秒。

Stella 的 affirmation 是从池子里发给你的，我们的是你自己今天生产的。同一个交互形态，可信度完全不同。

### 尺寸（iOS 真实点数，390pt 屏）

| 类型 | 尺寸 | 内容 |
|---|---|---|
| `systemSmall` | 158 × 158 | orb 标记 + 短句 |
| `systemMedium` | 338 × 158 | orb 84 + eyebrow + 短句 |
| `systemLarge` | 338 × 354 | orb 62 居中 + eyebrow + 大字短句 + "点一下重听 · 60 秒" |
| `accessoryCircular` | 76 × 76 | 呼吸圆环（弧长 = 今天这段的完成度）+ orb |
| `accessoryRectangular` | 160 × 72 | WREN 标签 + 一行短句 |
| `accessoryInline` | 高 22 | 圆点 + 极短句 |

主屏 widget 圆角 24。背景走**时段渐变**——widget 会跟着一天自己变色，这是 Stella 没有的。

### 四条 iOS 约束（设计前必须知道）

1. **锁屏 widget 强制单色。** 系统会把它渲染成白色 vibrant，加任何彩色都不显示。所以锁屏那三个只能用白色的不同透明度做层次
2. **Widget 不能动。** BreathOrb 在 widget 里是静止的一帧，呼吸只发生在 app 内。widget 上的 orb 要选一个"呼气末"的状态——最舒展的那一帧
3. **刷新有配额。** WidgetKit 一天大约给 40–70 次 timeline 刷新。carry phrase 一天换一次绰绰有余；时段渐变用 timeline 预排 4 个条目（morning/day/dusk/night）即可，不要试图做连续渐变
4. **点按不能直接放音。** iOS 17+ 的交互式 widget 支持 Button + AppIntent，但音频播放要拉起 app。所以 Large 上写的是"Tap to hear it again"，用户预期是跳进 app —— 不要承诺 widget 内播放

---

## 8. 一句话总结

拿 Tolan 的骨架（一屏一问、磨砂圆按钮、大衬线、满屏渐变、零 chrome），把它的宇宙换成一天，把它的外星人换成一次呼吸。
