# 品牌故事 · 传信的鸟

## 设定

远古时候鹪鹩是一只神鸟。小得能捧在手里,声音却大到宇宙都听得见。

人们把心里的话说给它,它带上去。

---

## 一句必须守住的分寸

这个故事有两半:**鸟把话带上去** / **宇宙帮你实现**。

第二半正好是 Stella 的地盘 —— 许愿、兑现、"你没实现是因为你不够相信"。踩进去我们就要背同样的锅,而且失去了全部差异化。

所以:

> **Wren 承诺的是传递,不是兑现。**

鹪鹩的神性在于**它被听见了**,不在于它讨来了东西。这不是回避,这是这个神话里更古老也更准的那一层 —— 小东西发出的声音能传到很远,这件事本身就值得写成传说。

而且它跟产品实际做的事严丝合缝:

```
你说出来  →  鸟带走  →  回来的是你自己的话
   ↓            ↓              ↓
语音输入   →  生成    →  用你的原话写的三分钟音频
```

**故事不是包装,它就是那条技术链路的比喻。** 这是最结实的一种品牌 —— 你没法在别的产品上原样贴这个故事,因为别的产品的机制对不上。

---

## 由此推出的三条文案规则

**一、语音输入从"体验偏好"变成"设定的一部分"。**

以前的说法是"说比打字快"。现在是:

> **Out loud. Wren can't carry what it hasn't heard.**

同一个交互,理由完全不同。前者是功能解释,后者是世界观 —— 后者不会有人想跳过。

**二、动词换成"带"。**

`carry` / `take` / `goes` / `came back` / `heard` / `reaches`。

不要用 `manifest` / `attract` / `receive` / `the universe will give you`。前者讲传递,后者讲兑现。

**三、"具体"是设定内的要求,不是产品的挑剔。**

> **Wren carries the specific ones furthest.**
> Not someday. Tomorrow morning. The room. The person. The hour.

原来"往近里收"是我们的产品主张,读起来像在给用户设限。放进这个故事里,它变成了鸟的习性 —— **清楚的话传得远,含糊的话传不动**。同一个约束,从限制变成了世界观。

---

## Onboarding 文案(改后)

| 屏 | 文案 |
|---|---|
| 00 Welcome | **Wren**<br>*Small bird. The whole sky hears it.*<br>Say it out loud — Wren carries the rest.<br>`Hear it first · 8 sec` `Begin` |
| 02 Name | What should Wren call you?<br>*Wren says it out loud before it goes.* |
| 06 Mirror I | I can hear how much this one matters, Maya.<br><br>You said it twice without noticing. |
| 08 People | Who are the people Wren should know matter most to you?<br>*Wren carries their names too.* |
| 13 Mirror II | I've got all of that now, Maya.<br><br>One more thing — and it's the only one that has to be out loud. |
| 14 换挡 | **Wren carries the specific ones furthest.**<br><br>*Not someday. Tomorrow morning.*<br>The room. The person. The hour. |
| 15 Say it | What are you walking into tomorrow?<br>*Out loud. Wren can't carry what it hasn't heard.*<br>`or type it — but out loud travels further` |
| 16 What I caught | Here's what **Wren caught**.<br>*Tap to remove anything it misheard.* |
| 21 Generating | **Wren's gone with it.**<br>Take three breaths. It won't be long.<br>`IT COMES BACK IN YOUR OWN WORDS` |
| 22 First play | `IT CAME BACK` |

13 → 14 → 15 是整套里最要紧的三屏:**交代还有最后一件事 → 说明鸟的习性 → 让她开口。** 前两屏都在为第三屏的麦克风做铺垫,所以第 15 屏不需要再解释为什么要说话。

---

## 鸟叫声 · 声音设计

用户明确要求音频里带鸟叫。**它必须是功能性的,不是装饰。**

### 三个位置

| 位置 | 内容 | 意思 |
|---|---|---|
| **起飞** | 开头一声清亮的短鸣,在人声进入之前 | 话被带走了 |
| **途中** | 中段 2–3 声很远的鸣叫,不规则间隔 | 它还在飞 |
| **归来** | 结尾一声,更近、更暖 | 它回来了 |

### 硬规则

- **Carry 那句话前后各留 3 秒绝对干净。** 最后一句是用户要带走一整天的东西,不能有任何东西压在上面
- **不要循环。** 规则重复的鸟叫在第 30 天会让人发疯。间隔随机 ±20%,同一条采样不连续出现两次
- **备 8–12 条采样轮换**,和脚本防重复是同一个道理
- **音量压在人声下面**,峰值约 −24 到 −30 dBFS。用户应该"注意到有鸟",而不是"在听鸟"
- **用真实录音,不要合成。** 鹪鹩的鸣唱本身很长很密,整段用会太吵 —— 起飞和归来用短促的 `chit` 单音,完整的颤鸣只在中段远处出现一次
- **可关闭。** 环境音开关里已经有这一层。有人窗外就有真鸟,有人单纯不喜欢

### 一个附带的机会

**把同一声鹪鹩鸣叫做成推送提示音。**

那是用户每天早上听到的第一个声音,而且它一秒钟就说完了整个品牌。市面上没有一个冥想 app 拥有一个属于自己的声音标识 —— 这个位置是空的。

---

## 还没跟上的地方

- **Home 的提问**仍是 "what do you want to rehearse?" —— `rehearse` 是旧主张的动词,该换成"带"的语系
- **平常日子那扇门**(PRD §5.1b)的措辞要重写:平常的一天,鸟带走的是一个状态而不是一件事
- **Player / Library** 的文案还没过这一遍
- **声音、时间**这两项已从 onboarding 移除,现在只在 Me 里。建议声音改到首播之后问:"That was Sage. Want a different one?"
