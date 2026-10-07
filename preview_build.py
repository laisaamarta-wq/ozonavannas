#!/usr/bin/env python3
"""Preview build on Vercel: fetch fonts + original photos from the live site,
prepare optimized WebP images, render pages, and copy the result into dist/."""
import pathlib
import re
import shutil
import urllib.request

from PIL import Image, ImageEnhance, ImageOps

ROOT = pathlib.Path(__file__).parent
LIVE = "https://www.ozonavannas.lv"


def get(path):
    with urllib.request.urlopen(LIVE + path, timeout=60) as r:
        return r.read()


def main():
    # fonts
    (ROOT / "fonts").mkdir(exist_ok=True)
    css = get("/fonts/fonts.css")
    (ROOT / "fonts/fonts.css").write_bytes(css)
    for name in sorted(set(re.findall(rb"url\(([^)]+\.woff2)\)", css))):
        n = name.decode().strip("'\"")
        (ROOT / "fonts" / n).write_bytes(get("/fonts/" + n))

    # images
    (ROOT / "orig").mkdir(exist_ok=True)
    (ROOT / "img").mkdir(exist_ok=True)

    def grade(im):
        im = ImageEnhance.Color(im).enhance(0.86)
        im = ImageEnhance.Contrast(im).enhance(0.95)
        return ImageEnhance.Brightness(im).enhance(1.03)

    jobs = [("bath-foam.jpg", "hero-water", (1536, 900)),
            ("svc-ozone-bath.jpg", "bath", (1536, 900)),
            ("nikolai.jpg", "nikolajs", (1189, 900))]
    for src, name, widths in jobs:
        p = ROOT / "orig" / src
        p.write_bytes(get("/images/" + src))
        im = grade(Image.open(p).convert("RGB"))
        for w in widths:
            r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            r.save(ROOT / f"img/{name}-{w}.webp", "WEBP", quality=78, method=6)
            if w == 900:
                r.save(ROOT / f"img/{name}-{w}.jpg", "JPEG", quality=80, optimize=True, progressive=True)
    og = ImageOps.fit(grade(Image.open(ROOT / "orig/bath-foam.jpg").convert("RGB")), (1200, 630), centering=(0.5, 0.45))
    og.save(ROOT / "img/og.jpg", "JPEG", quality=82, optimize=True)

    import build
    build.main()

    dist = ROOT / "dist"
    if dist.exists():
        shutil.rmtree(dist)
    dist.mkdir()
    for f in ["index.html", "styles.css", "main.js", "favicon.svg", "robots.txt", "sitemap.xml"]:
        shutil.copy(ROOT / f, dist / f)
    for d in ["ru", "en", "img", "fonts"]:
        shutil.copytree(ROOT / d, dist / d)
    print("preview ready:", sorted(p.name for p in dist.iterdir()))


if __name__ == "__main__":
    main()
