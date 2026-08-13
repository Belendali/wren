#!/usr/bin/env python3
"""Wren 封面生成器 — 网格渐变 + 光斑 + 胶片颗粒。
配色取自 ~/wren/docs/03-VISUAL-DIRECTION.md 的 primitive tokens。"""

import math, os, random
from PIL import Image, ImageFilter, ImageChops

OUT = os.path.dirname(os.path.abspath(__file__))
MESH = 44            # 网格渐变的计算分辨率，之后双三次放大


def hx(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mesh(points, size, seed):
    """反距离加权的网格渐变。points = [(x, y, '#hex', weight)]，x/y 为 0–1。"""
    random.seed(seed)
    img = Image.new("RGB", (MESH, MESH))
    px = img.load()
    pts = [(x, y, hx(c), w) for x, y, c, w in points]
    for j in range(MESH):
        for i in range(MESH):
            u, v = i / (MESH - 1), j / (MESH - 1)
            num = [0.0, 0.0, 0.0]
            den = 0.0
            for x, y, col, w in pts:
                d = (u - x) ** 2 + (v - y) ** 2 + 0.0016
                k = w / (d ** 1.35)
                den += k
                for c in range(3):
                    num[c] += col[c] * k
            px[i, j] = tuple(min(255, max(0, int(n / den))) for n in num)
    return img.resize(size, Image.BICUBIC)


def radial(size, cx, cy, r, inner=255, outer=0):
    """低分辨率算好再放大的径向遮罩。"""
    s = 120
    m = Image.new("L", (s, s))
    p = m.load()
    for j in range(s):
        for i in range(s):
            d = math.hypot(i / (s - 1) - cx, j / (s - 1) - cy) / r
            t = max(0.0, min(1.0, 1.0 - d))
            t = t * t * (3 - 2 * t)                       # smoothstep
            p[i, j] = int(outer + (inner - outer) * t)
    return m.resize(size, Image.BICUBIC)


def build(name, size, palette, orb, grain=13, vignette=0.30, seed=7):
    w, h = size
    img = mesh(palette, size, seed)

    # 光斑 —— Wren 的 orb 落在画面里
    ox, oy, orad, ostr = orb
    glow = Image.new("RGB", size, (255, 252, 246))
    img = Image.composite(glow, img, radial(size, ox, oy, orad, int(255 * ostr), 0))

    # 柔化，去掉网格插值的硬边
    img = img.filter(ImageFilter.GaussianBlur(radius=max(w, h) / 90))

    # 暗角
    if vignette:
        dark = Image.new("RGB", size, (0, 0, 0))
        img = Image.composite(img, dark, radial(size, 0.5, 0.46, 1.02, 255, int(255 * (1 - vignette))))

    # 胶片颗粒
    if grain:
        n = Image.effect_noise(size, grain).convert("RGB")
        img = ImageChops.overlay(img, n)
        img = Image.blend(mesh(palette, size, seed).filter(ImageFilter.GaussianBlur(max(w, h) / 90)), img, 0.82)

    img.save(os.path.join(OUT, name), "JPEG", quality=90, optimize=True)
    return name


P = {
    "amber": [(0.14, 0.10, "#FBF4EA", 1.0), (0.72, 0.06, "#F6DAC0", 1.0),
              (0.92, 0.52, "#E0A183", 1.1), (0.52, 0.88, "#C0674A", 1.2),
              (0.06, 0.72, "#8E4530", 0.9), (0.44, 0.42, "#F3E9DA", 0.8)],
    "rose":  [(0.20, 0.08, "#FDFBF7", 1.0), (0.86, 0.22, "#F3E9DA", 1.0),
              (0.90, 0.80, "#E8B79C", 1.1), (0.30, 0.94, "#C0674A", 1.0),
              (0.04, 0.44, "#F6DAC0", 0.9)],
    "moss":  [(0.16, 0.12, "#F3E9DA", 1.0), (0.82, 0.14, "#D6D3BE", 1.0),
              (0.90, 0.66, "#A9B49B", 1.1), (0.40, 0.92, "#6E7A5F", 1.2),
              (0.04, 0.60, "#3F4838", 0.8)],
    "sky":   [(0.18, 0.06, "#FAF6EF", 1.0), (0.80, 0.18, "#E8EEF0", 1.0),
              (0.94, 0.70, "#A6C0CE", 1.1), (0.36, 0.96, "#6E8A9C", 1.0),
              (0.02, 0.50, "#E4DBD0", 0.9)],
    "plum":  [(0.22, 0.10, "#E8B79C", 0.9), (0.84, 0.24, "#8E4530", 1.0),
              (0.92, 0.78, "#3A2B33", 1.2), (0.28, 0.96, "#241E22", 1.2),
              (0.02, 0.52, "#5A3A38", 1.0)],
    "dusk":  [(0.14, 0.08, "#F3E3D8", 1.0), (0.78, 0.10, "#D99A73", 1.1),
              (0.94, 0.60, "#A45C46", 1.1), (0.44, 0.94, "#5A3A38", 1.1),
              (0.04, 0.66, "#8E4530", 0.9)],
}

JOBS = [
    # 名称                    尺寸          配色     orb (x, y, r, strength)   seed
    ("hero-steady.jpg",     (1200, 760),  "amber", (0.66, 0.34, 0.42, 0.62), 11),
    ("hero-weekly.jpg",     (1200, 620),  "dusk",  (0.30, 0.44, 0.46, 0.52), 23),
    ("card-01.jpg",         (700, 980),   "rose",  (0.50, 0.30, 0.44, 0.60), 3),
    ("card-02.jpg",         (700, 980),   "moss",  (0.42, 0.36, 0.40, 0.52), 41),
    ("card-03.jpg",         (700, 980),   "sky",   (0.58, 0.28, 0.46, 0.58), 17),
    ("card-04.jpg",         (700, 980),   "plum",  (0.48, 0.34, 0.42, 0.46), 29),
    ("row-01.jpg",          (400, 400),   "amber", (0.44, 0.40, 0.52, 0.58), 5),
    ("row-02.jpg",          (400, 400),   "sky",   (0.56, 0.38, 0.50, 0.54), 61),
    ("row-03.jpg",          (400, 400),   "moss",  (0.40, 0.44, 0.50, 0.50), 73),
    ("row-04.jpg",          (400, 400),   "dusk",  (0.52, 0.36, 0.50, 0.54), 89),
]

if __name__ == "__main__":
    for name, size, pal, orb, seed in JOBS:
        build(name, size, P[pal], orb, seed=seed)
        print(f"{name:22} {size[0]}x{size[1]}  {pal}")
