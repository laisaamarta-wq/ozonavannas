#!/usr/bin/env python3
"""Build static pages for ozonavannas.lv.

Edit texts in src/content/{lv,ru,en}.json and the layout in src/template.html,
then run:  python3 build.py
Output: index.html (LV), ru/index.html, en/index.html, sitemap.xml
"""
import json
import pathlib
import time
from urllib.parse import quote

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = pathlib.Path(__file__).parent
SITE = "https://www.ozonavannas.lv"
PHONE = "+37129405327"
WA_NUMBER = "37129405327"
EMAIL = "ozonavannas@gmail.com"
LANGS = [
    {"code": "lv", "path": "/", "out": "index.html"},
    {"code": "ru", "path": "/ru/", "out": "ru/index.html"},
    {"code": "en", "path": "/en/", "out": "en/index.html"},
]
VERSION = time.strftime("%Y%m%d%H%M")

ICON_WA = (
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.38c-.3-.15-1.77-.87'
    '-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79'
    '-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15'
    '-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21'
    ' 3.08c.15.2 2.09 3.2 5.07 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25'
    '-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"/><path d="M12.02 3.5A8.45 8.45 0 0 0 4.8 16.28L3.5 20.5l4.34-1.14a8.43'
    ' 8.43 0 0 0 4.17 1.06h.01A8.45 8.45 0 0 0 12.02 3.5Zm0 15.21h-.01a7 7 0 0 1-3.57-.98l-.26-.15-2.65.69.71'
    '-2.58-.17-.27a7.02 7.02 0 1 1 5.95 3.29Z"/></svg>'
)


def wa(text):
    return f"https://wa.me/{WA_NUMBER}?text={quote(text)}"


def jsonld(t):
    page = SITE + t["meta"]["path"]
    business = {
        "@type": ["LocalBusiness", "HealthAndBeautyBusiness"],
        "@id": SITE + "/#business",
        "name": "Ozona vannas",
        "url": page,
        "image": SITE + "/img/og.jpg",
        "logo": SITE + "/favicon.svg",
        "telephone": PHONE,
        "email": EMAIL,
        "description": t["meta"]["description"],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Stirnu iela 8, 203",
            "addressLocality": "Rīga",
            "addressCountry": "LV",
        },
        "openingHoursSpecification": [{
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "10:00",
            "closes": "19:00",
        }],
        "priceRange": "€€",
        "areaServed": {"@type": "City", "name": "Rīga"},
        "sameAs": ["https://www.instagram.com/ozonavannas", "https://t.me/NikolayJa"],
        "makesOffer": [
            {
                "@type": "Offer",
                "name": f'{item["name"]} · {opt["t"]}',
                "price": "".join(ch for ch in opt["p"] if ch.isdigit()),
                "priceCurrency": "EUR",
            }
            for item in t["services"]["items"] for opt in item["opts"]
        ],
    }
    faq = {
        "@type": "FAQPage",
        "@id": page + "#faq",
        "inLanguage": t["meta"]["lang"],
        "mainEntity": [
            {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
            for f in t["faq"]["items"]
        ],
    }
    website = {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/", "name": "Ozona vannas",
               "inLanguage": [l["code"] for l in LANGS]}
    data = {"@context": "https://schema.org", "@graph": [website, business, faq]}
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def main():
    env = Environment(loader=FileSystemLoader(ROOT / "src"), autoescape=select_autoescape(["html"]),
                      trim_blocks=False, lstrip_blocks=False)
    tpl = env.get_template("template.html")
    for lang in LANGS:
        t = json.loads((ROOT / "src" / "content" / f'{lang["code"]}.json').read_text("utf-8"))
        html = tpl.render(t=t, langs=LANGS, site=SITE, wa=wa, icon_wa=ICON_WA,
                          jsonld=jsonld(t), version=VERSION)
        out = ROOT / lang["out"]
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, "utf-8")
        print("built", out.relative_to(ROOT))

    today = time.strftime("%Y-%m-%d")
    alts = "".join(
        f'\n    <xhtml:link rel="alternate" hreflang="{l["code"]}" href="{SITE}{l["path"]}"/>' for l in LANGS
    ) + f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}/"/>'
    urls = "".join(
        f'\n  <url>\n    <loc>{SITE}{l["path"]}</loc>\n    <lastmod>{today}</lastmod>{alts}\n  </url>' for l in LANGS
    )
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
        ' xmlns:xhtml="http://www.w3.org/1999/xhtml">' + urls + "\n</urlset>\n", "utf-8")
    print("built sitemap.xml")


if __name__ == "__main__":
    main()
