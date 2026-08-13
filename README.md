# 🐦 Wren

> Small bird. The whole sky hears it.

远古时候鹪鹩是一只神鸟。小得能捧在手里，声音却大到宇宙都听得见。人们把心里的话说给它，它带上去。

**Wren 是那只鸟。** 你说出你想要的 —— 明天早上那场会，或者这辈子那间房子 —— 它带上去，回来的是一段用你自己的话写的三分钟正念音频。

---

## ▶ 试一下

**[打开 demo](https://belendali.github.io/wren/app/)**

用 **Chrome 或 Safari**，手机上效果最好。语音识别只有这两家支持。

真正要试的是这一段：

```
Home 点麦克风 → 说一句你明天真的要面对的事 → 看转写 → That's it
   → 生成 → 三选一 → 播放
```

**戴耳机。** 生成的稿子里会出现你刚才说过的原话。那一下就是这个产品成不成立的判断点。

---

## 四步

```
1  你说给小鸟听        语音输入
2  小鸟带上宇宙        生成
3  你进行显化          三分钟音频
4  宇宙回馈给你        在生活里，慢慢地
```

前三步在 app 里，第四步在生活里。故事不是包装 —— 别的产品贴不了它，因为机制对不上。

---

## 没有后端，但循环是真的

| 环节 | 实现 |
|---|---|
| 听 | ✅ Web Speech API，实时转写 |
| 波形 | ✅ Web Audio 音量表，跟真实音量 |
| 生成 | ⚠️ 本地模板，**用户原话原样嵌进去** |
| 念 | ✅ speechSynthesis，语速 0.74 + 段间停顿 |
| 鸟叫 | ✅ Web Audio 合成 —— 起飞 / 途中 / 归来 |
| 存储 | ✅ localStorage |

**只有「生成」是假的。** 换真模型只要替换 `app/generate.js` 里的 `script()`，输入输出结构不用动。

---

## 本地跑

```bash
python3 -m http.server 8470 --directory app
```

`wrenReset()` 在控制台里清空重来。

---

## 目录

```
app/            可跑的原型
  app.js          状态 · 路由 · 全部屏幕
  app.css         设计系统，直译自 Figma 变量
  speech.js       听 / 念 / 鸟叫
  generate.js     稿子模板 + 「够不够具体」判定
  assets/         品牌素材 · 颗粒纹理 · 封面
docs/           产品与品牌文档
covers/         纹理与封面生成脚本（Pillow）
```

## 文档

| | |
|---|---|
| [01-PRD](docs/01-PRD.md) | 产品需求 · 竞品拆解 · 商业模式 |
| [03-VISUAL-DIRECTION](docs/03-VISUAL-DIRECTION.md) | Quiet Signal 视觉系统 |
| [05-ONBOARDING](docs/05-ONBOARDING.md) | 21 屏的顺序，以及为什么这么排 |
| [06-BRAND-STORY](docs/06-BRAND-STORY.md) | 品牌故事 · 文案规则 · 鸟叫声设计 |
| [07-TRANSLATION](docs/07-TRANSLATION.md) | 小鸟怎么帮你把话说具体 |

---

## 两条自己给自己的规矩

**不承诺结果。** 宇宙有它自己的时间。慢，不是因为你不够相信。

**「具体」不等于「近期」。** 「我想成为不会在开口前先道歉的人」—— 具体，而且遥远。鸟带得走。要求的是**清楚**，不是**近**。
