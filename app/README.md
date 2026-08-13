# Wren · 可跑的原型

```bash
python3 -m http.server 8470 --directory ~/wren/app
```

然后 `http://localhost:8470`。手机上打开同一个局域网地址效果最好 —— 它是按 390×844 做的，窄屏会自动铺满。

**用 Chrome 或 Safari。** 语音识别只有这两家支持。

---

## 没有后端，但循环是真的

| 环节 | 真实现 | 说明 |
|---|---|---|
| 听 | ✅ Web Speech API | 真的在听，实时转写逐字出现 |
| 波形 | ✅ Web Audio 音量表 | 跟着你的音量动，不是假动画 |
| 生成 | ⚠️ 本地模板 | 五段式脚本，**用户原话原样嵌进去** |
| 念 | ✅ speechSynthesis | 语速 0.74，段间显式停顿，真的能听完三分钟 |
| 鸟叫 | ✅ Web Audio 合成 | 起飞一声、途中远处几声、归来一声 |
| 存储 | ✅ localStorage | 画像和历史会留着 |

**唯一是假的只有"生成"那一步** —— 换成真模型的话只要替换 `generate.js` 里的 `script()`，输入输出结构不用动。

---

## 文件

```
index.html      外壳
app.css         设计系统直译自 Figma 变量
app.js          状态 · 路由 · 全部屏幕
speech.js       听 / 念 / 鸟叫
generate.js     稿子模板 + 「够不够具体」判定
assets/         三张颗粒纹理
```

## 全流程

```
Welcome
  → Onboarding 14 步（城市 · 名字 · 孩子 · 想改变什么 · 为什么 ·〔回应〕·
     什么挡着你 · 重要的人 · 工作 · 对工作的感觉 · 关于你 · 过去 ·〔回应〕·〔换挡〕）
  → 说给小鸟听（待机 → 在听 → 转写确认）
  → Wren caught（提取的细节，可删）
  → Wren's promise
  → Home
       ├ 说一件事 → 转写 →〔够不够具体·提议〕→ 生成 → 三选一 → 进入 → 播放
       └ 平常的一天 → 选一个状态 → 同上
  → Library（回来过的都在这儿）
  → Me（What Wren remembers，每条可删）
```

## 想重头再来

控制台里 `wrenReset()`，或者 Me → Start over。

---

## 两处值得单独看的实现

**「够不够具体」** —— `generate.js` 的 `clarity()`。判定是 **时间 / 人地 / 可观察行为 / 感官细节，有任意一项就放行**。

试 `I want to have money` 会被指出来，试 `not apologising before I speak` 会直接放行 —— 后者没有日期但极其具体，这是这个判定最容易做错的地方。

提议出来的选项是从用户自己的画像里检索的（会用到她填的职业）。**永远不拦，「就按我说的带上去」的出口一直在。**

**稿子里的原话** —— `keyPhrase()` 在从句边界切，不在第 N 个词切。「with Daniel, I always」这种断口一旦被念出来，整段就露馅了。

---

## 已知的边界

- 语音识别在 Firefox 里没有，会自动退回打字
- `speechSynthesis` 的音色取决于系统。macOS 上会挑 Samantha，iOS 上挑系统女声
- 鸟叫是合成的正弦扫频，不是真录音 —— 位置和节奏是对的，音色不是
- 内嵌浏览器面板里可能没有麦克风权限和语音库，用真浏览器打开
