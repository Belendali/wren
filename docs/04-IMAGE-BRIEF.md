# Wren 封面摄影脚本

用于 Weave / 任意图像生成，或指导实拍与选图。

---

## art direction

Stella 拍的是**梦想人生**：游艇、Euro summer、金色海边回眸、露台上的白裙。看着很美，但它跟用户今天下午三点那场汇报没有关系 —— 那是"有一天"的画面。

Wren 拍**上场前的那一刻**。楼梯间、车里、走廊尽头、洗手间镜子前、还没推开的那扇门。用户能立刻认出这是自己的生活，而不是别人的假期。

这也是"好想象"的关键：想象一个你从没去过的海边很难，想象你自己站在会议室门口很容易 —— 因为你今天下午就要站在那儿。

### 通用参数

所有图共用：

```
35mm film photograph, natural available light, soft grain,
muted warm palette — bone, clay, terracotta, faded olive,
shallow depth of field, candid unposed moment,
face turned away or partially out of frame,
North American interior, no logos, no text,
editorial not advertising
```

**关键约束：脸不要正对镜头，或者只出现局部。** 一张清晰的正脸会变成"她"，用户就没法把自己放进去了。侧脸、背影、只有手、镜子里的模糊倒影 —— 留出空位，用户才能站进去。这条比任何构图技巧都重要。

避开：豪车、游艇、名牌、香槟、无边泳池、"抓拍式"大笑、任何看起来像广告的东西。

---

## 十张

| # | 用途 | 画面 | 主色 |
|---|---|---|---|
| 01 | Hero · Pick up again | 一个女人站在写字楼楼梯间，一只手扶着栏杆，低头看地面，窗光从侧面打过来。等待的姿态 | 暖赭 |
| 02 | Hero · Weekly recap | 傍晚的窗边书桌，一杯凉掉的茶，笔记本合着。人不在画面里 | 暮橙 |
| 03 | Saved · a hard conversation | 洗手间镜子前，手正在整理衣领，脸在镜中虚焦 | 玫瑰灰 |
| 04 | Saved · the long way through a sentence | 会议室外的走廊，一个人的背影正在往门口走，画面留大量空白 | 苔绿 |
| 05 | Saved · before you open the message | 手机屏幕朝下扣在餐桌上，一只手搭在旁边 | 雾蓝 |
| 06 | Saved · first day nerves | 停在路边的车里，从副驾拍向方向盘，晨光，人只有肩膀入镜 | 深李 |
| 07 | Row · morning | 床边地板上的一双脚，晨光斜切 | 暖赭 |
| 08 | Row · midday | 便利店门口的台阶，坐着的人的下半身 | 雾蓝 |
| 09 | Row · evening | 公寓阳台栏杆，远处城市灯亮起来 | 苔绿 |
| 10 | Row · night | 关了灯的房间，只有窗外路灯，床单一角 | 暮橙 |

### 尺寸

| 用途 | 输出 | 落地 |
|---|---|---|
| Hero | 1200 × 760 | Library 主卡 330 × 300 |
| Saved | 700 × 980 | 竖卡 208 × 250 |
| Row | 400 × 400 | 列表缩略 |

生成时按 3:2 / 5:7 / 1:1 出图，进 Figma 用 `scaleMode: FILL` 裁切。

---

## 文字可读性

每张图底部都要压 carry phrase。生成时**下三分之一留出暗部或低对比区域** —— 否则 scrim 得压得很重，图就废了。

提示词里加一句：`lower third naturally darker, uncluttered`。

现有的 scrim 参数（Library 里已经在用）：从 0% 透明到底部 74% 的 `#140D0A`。图片本身够暗的话可以降到 60%。

---

## 落地流程

1. Weave 出图 → 拿到 URL
2. `curl` 下载到 `~/wren/covers/`
3. Figma MCP `upload_assets` 要 N 个 submitUrl
4. `curl -F "file=@x.jpg;type=image/jpeg"` POST，拿 `imageHash`
5. `use_figma` 里用 `{ type: "IMAGE", imageHash, scaleMode: "FILL" }` 换掉现有填充
6. 删掉上传时留在画布上的临时 frame

现有的十张抽象封面（`~/wren/covers/make_covers.py` 生成）保留 —— 它们可以做**没有配图时的兜底**，也可以在 A/B 里当对照组。
