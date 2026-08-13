#!/usr/bin/env python3
"""Quiet Signal 拓印纹理生成器。

石拓的质感不是单一的细颗粒 —— 它是三层叠出来的:
  1. 细噪点     纸纤维
  2. 中频斑驳   墨没吃匀的地方
  3. 低频起伏   石面本身的高低

三层都以中灰 128 为基准输出,在 Figma 里用 OVERLAY 混合叠加 ——
这样亮处压暗、暗处提亮,颗粒在任何底色上都成立,不用为每个色调单独出图。

低频层用四象限镜像做无缝,细噪点本身高频所以天然无缝。
"""

import os, random
from PIL import Image, ImageFilter, ImageChops

OUT = os.path.dirname(os.path.abspath(__file__))
SIZE = 512


def mirrored(small, size):
    """把一张小图做成四象限镜像 —— 平铺时不会有接缝。"""
    h = size // 2
    q = small.resize((h, h), Image.BICUBIC)
    out = Image.new("L", (size, size))
    out.paste(q, (0, 0))
    out.paste(q.transpose(Image.FLIP_LEFT_RIGHT), (h, 0))
    out.paste(q.transpose(Image.FLIP_TOP_BOTTOM), (0, h))
    out.paste(q.transpose(Image.ROTATE_180), (h, h))
    return out


def lowfreq(cells, size, seed, spread):
    random.seed(seed)
    src = Image.new("L", (cells, cells))
    p = src.load()
    for y in range(cells):
        for x in range(cells):
            p[x, y] = max(0, min(255, int(128 + random.gauss(0, spread))))
    return mirrored(src, size).filter(ImageFilter.GaussianBlur(size / 26))


def build(name, fine_sigma, mottle_spread, swell_spread, contrast):
    # 1 · 细噪点 —— effect_noise 已是以 128 为中心的高斯
    grain = Image.effect_noise((SIZE, SIZE), fine_sigma).convert("L")

    # 2 · 中频斑驳
    mottle = lowfreq(26, SIZE, 11, mottle_spread)

    # 3 · 低频起伏
    swell = lowfreq(7, SIZE, 29, swell_spread)

    # 叠加:三层都围绕 128,用 overlay 合成后再往中灰收
    out = ImageChops.overlay(grain, mottle)
    out = ImageChops.overlay(out, swell)
    out = Image.blend(Image.new("L", (SIZE, SIZE), 128), out, contrast)

    out.convert("RGB").save(os.path.join(OUT, name), "PNG", optimize=True)
    return name


if __name__ == "__main__":
    # 界面用 —— 克制,只在大面积渐变上留一层纸感
    build("grain-surface.png", fine_sigma=16, mottle_spread=26, swell_spread=22, contrast=0.55)
    # 卡片 / 小面积用 —— 稍重
    build("grain-card.png",    fine_sigma=22, mottle_spread=34, swell_spread=26, contrast=0.72)
    # logo / app icon 用 —— 明显的墨不吃匀
    build("grain-ink.png",     fine_sigma=30, mottle_spread=48, swell_spread=38, contrast=1.0)
    for n in ("grain-surface.png", "grain-card.png", "grain-ink.png"):
        print(n, os.path.getsize(os.path.join(OUT, n)), "bytes")
