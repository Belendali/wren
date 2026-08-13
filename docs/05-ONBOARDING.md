# Onboarding · Stella 的弧线 + Wren 的落点

Figma:[Onboarding · Stella 弧线 + Wren 落点](https://www.figma.com/design/PPZcQQzUXijyD4ZxcSaJ93/?node-id=57-31) · 24 屏

---

## 一、先拆 Stella:它的顺序不是随便排的

按进度条把 Stella 的实拍图排出来之后,节奏就暴露了:

| % | 屏 | 意图 |
|---|---|---|
| 1 | Where do you live? | **最不费力的先问**,建立答题惯性 |
| 8 | What is your sexuality? | 仍是事实题 |
| 19 | Do you have kids? | 仍是事实题 |
| 23 | **What are you hoping changes?** | **趁人还没累就问核心欲望** |
| 28 | Why does this matter so much? | 追问动机 —— 情绪成本最高的一题 |
| 31 | 〔回应〕I can feel how important confidence is for you | **奖励卡在情绪成本最高的那题之后** |
| 31 | What's standing in your way? | |
| 35–43 | 感情状态 → 伴侣名字 → 伴侣是什么样的人 | **回落到事实题,让人喘口气** |
| 48 | **Who are the people Stella should know?** + Add Person 弹窗 | 收专有名词 |
| 52–57 | 做什么工作 → 对工作什么感觉 | 继续低成本 |
| 60 | Since we've never met, what should I know about you? | 开放题 |
| 65 | **Is there anything from your past that still shapes what you want?** | **最深的一题放在沉没成本最高处** |
| 68 | 〔回应〕I can feel your determination | 再奖励一次 |
| 68 | 〔换挡〕**Now dream a little bigger. Don't be realistic.** | 换语域 |
| 69–72 | 梦想住哪 → 什么样的房子 | 放飞收尾 |

**Add Person 弹窗是整套里最值钱的设计** —— 名字 + 一句"他是谁"。这就是为什么 Stella 生成的故事里会出现 "while Chen cheers"。专有名词是"这段是为我写的"感觉的唯一来源。

---

## 二、Wren 照搬弧线,换掉终点

Stella 在 68% 说 *"Now dream a little bigger. Don't be realistic. Pretend anything is possible."*

Wren 在同一个位置说:

> **Now let's get small, Maya.**
> *Not someday. Tomorrow morning.*
> The next three minutes are about one real thing.

同一个心理位置 —— 用户投入最深、情绪最开放的那一刻 —— **一个往大里推,一个往近里收**。这一句就是两个产品的分水岭。

---

## 三、24 屏 · 问题 → 生成槽位

| # | % | 屏 | 槽位 | 生成时用在哪 |
|---|---|---|---|---|
| 00 | — | Welcome + 8 秒试听 | — | 先给样品再要东西 |
| 01 | 3 | Where do you live? | `city` | 通勤、天气、场景细节 |
| 02 | 9 | What should Wren call you? | `name` | **Land 段第一句** |
| 03 | 14 | Do you have kids? | `has_kids` | 早晨的时间结构 |
| 04 | 20 | What are you hoping changes? | `desire` | 长期主题 |
| 05 | 26 | Why does this matter so much? | `motivation` | Land 段的份量 |
| 06 | 30 | 〔回应 I〕 | — | 奖励 |
| 07 | 33 | What's standing in your way? | `obstacle` | **See 段要预演克服的东西** |
| 08 | 39 | Who are the people Wren should know? | `people[]` | **专有名词** |
| 08b | — | 〔弹窗〕Add Person | `{name, relation}` | 同上 |
| 09 | 44 | What do you do for work? | `work` | 场景词汇 |
| 10 | 47 | How do you feel about your work? | `work_stance` | tone |
| 11 | 53 | What should Wren know about you? | `self_desc` | 自由文本 |
| 12 | 58 | Anything from your past? | `history` | 深层动机 |
| 13 | 61 | 〔回应 II〕 | — | 奖励 |
| 14 | 66 | 〔换挡〕**Now let's get small** | — | **语域切换** |
| 15 | 70 | **What are you walking into tomorrow?**(语音) | `intent_verbatim` | **原话短语原样念出来** |
| 16 | 76 | Here's what I caught(可删) | `context_details[]` | 长期画像的起点 |
| 17 | 82 | Where do you feel it first? | `body_anchor` | Breathe 段扫描 + Feel 段锚定 |
| 18 | 88 | Which of these would make you cringe? | `banned_register[]` | **生成的否定约束** |
| 19 | 94 | Pick a voice | `voice_id` | TTS |
| 20 | 100 | When do you want it? | `reminder_time` | 推送 + 时段渐变 |
| 21 | — | Generating | — | "Take three breaths while it works." |
| 22 | — | **First play** | — | **付费墙在这之后** |

---

## 四、我唯一主动砍掉的一题

**性取向。** 对 Wren 的生成没有任何用处 —— 我们不写浪漫幻想。留着只增加放弃率和合规负担。

Stella 需要它是因为它要写"梦想人生"的故事,里面有伴侣。我们写的是明天早上那场会。

---

## 五、Wren 保留的四个自己的东西

1. **第 02 步单独问名字。** Stella 从系统拿。我们要念出来,所以要问,而且当场说清楚"It gets said out loud, every morning."
2. **第 15 步默认语音。** 说比打字快,更重要的是**犹豫、断句、用词都是生成素材**。用户说"我怕我讲太快讲成一团",音频里就要出现"讲成一团"。
3. **第 16 步 Here's what I caught。** 提取的专有名词摊开可删。它和 Me 里的「What Wren remembers」是同一个形态 —— onboarding 就把"你看得见我记了什么"说清楚。
4. **第 18 步问不要什么。** 这个品类最大的流失原因是**说出让用户反感的话**。问一次,写进否定约束,后面几十天不踩雷。它同时是一次表态。

---

## 六、关于长度的判断

这套 24 屏跟早期 PRD 里"8 步、2 分钟"的承诺是冲突的。我的判断是:

**Stella 的问题不在于问得多,在于问完 28 题直接甩付费墙,一秒钟音频都没给。**

只要保持「第一段音频播完再谈钱」,长问卷反而是资产 —— 沉没成本越高越舍不得走,而且生成质量确实随输入量上升。

要盯的两个数:

| 指标 | 目标 | 说明 |
|---|---|---|
| 全流程完成率 | > 45% | 比 8 步版低是预期内的,拿质量换 |
| 第 15 步语音占比 | > 50% | 低于这个说明麦克风的引导不够 |
| 首段完播率 | > 80% | 这个不能降,降了说明前面白问 |
| 20 屏后的付费转化 | > 8% | 应当**高于**短问卷版 |

如果完成率跌破 40%,第一件事是把 Block C(人和工作)做成可跳过,而不是砍问题 —— 那一块是低成本高价值的,但不是第一段音频必需的。
