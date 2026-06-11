# Generates the placeholder seed imagery: original abstract compositions,
# one hue family per work so the artwork carries the color against the
# site's neutral field. Outputs JPEGs into seed/images/ (for `sanity dataset
# import`), mirrors them into static/seed/ (for fixture mode), and writes
# src/lib/sanity/seed-manifest.json with dimensions + LQIP per file.
import base64
import io
import json
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'seed' / 'images'
STATIC = ROOT / 'static' / 'seed'
MANIFEST = ROOT / 'src' / 'lib' / 'sanity' / 'seed-manifest.json'

GROUND = (250, 250, 247)
INK = (20, 20, 20)

# hue families, one per work + extras for scraps
PALETTES = {
    'brick': [(166, 60, 38), (208, 116, 60), (242, 200, 160)],
    'teal': [(16, 94, 99), (58, 142, 140), (178, 212, 204)],
    'marigold': [(214, 151, 26), (240, 196, 92), (104, 84, 30)],
    'indigo': [(46, 48, 110), (96, 100, 168), (196, 198, 226)],
    'moss': [(74, 92, 50), (128, 144, 92), (210, 216, 186)],
    'magenta': [(150, 38, 84), (204, 96, 136), (240, 198, 214)],
    'slate': [(70, 78, 88), (130, 140, 150), (208, 214, 218)],
    'ochre': [(150, 110, 54), (196, 160, 104), (236, 222, 198)],
}


def compose(w, h, palette, seed):
    """Graded to the house grammar (UNVEIL-GRAMMAR §9, ledger item 2): the
    paper field dominates, marks are B/W-leaning with only a whisper of the
    work's hue family — never a saturated poster."""
    rng = random.Random(seed)
    img = Image.new('RGB', (w, h), GROUND)
    d = ImageDraw.Draw(img, 'RGBA')
    # restrained translucent fields off one edge — most of the paper stays bare
    for i, col in enumerate(palette):
        alpha = rng.randint(50, 110)
        x0 = rng.randint(-w // 4, int(w * 0.65))
        y0 = rng.randint(-h // 4, int(h * 0.65))
        x1 = x0 + rng.randint(w // 4, int(w * 0.55))
        y1 = y0 + rng.randint(h // 4, int(h * 0.55))
        if rng.random() < 0.4:
            d.ellipse([x0, y0, x1, y1], fill=col + (alpha,))
        else:
            d.rectangle([x0, y0, x1, y1], fill=col + (alpha,))
    # a diagonal band
    band = rng.choice(palette)
    off = rng.randint(-h // 2, h // 2)
    d.polygon(
        [(0, h // 2 + off), (w, off), (w, off + h // 8), (0, h // 2 + off + h // 8)],
        fill=band + (110,),
    )
    # thin ink strokes
    for _ in range(rng.randint(2, 4)):
        y = rng.randint(h // 8, h - h // 8)
        d.line([(rng.randint(0, w // 4), y), (w - rng.randint(0, w // 4), y + rng.randint(-h // 6, h // 6))],
               fill=INK + (rng.randint(170, 255),), width=max(3, w // 400))
    img = img.filter(ImageFilter.GaussianBlur(radius=w / 800))
    # B/W-leaning grade: collapse most of the hue, keep a breath of it
    img = Image.blend(img, img.convert('L').convert('RGB'), 0.72)
    # paper-preserving grain — gentle multiply that never drags the bare
    # field out of the ground tone (the old ink composite muddied it)
    noise = Image.effect_noise((w // 4, h // 4), 18).resize((w, h)).convert('L')
    img = Image.composite(img, Image.new('RGB', (w, h), INK), noise.point(lambda v: 255 - (255 - v) // 24))
    return img


def lqip(img):
    tiny = img.copy()
    tiny.thumbnail((20, 20))
    buf = io.BytesIO()
    tiny.save(buf, 'JPEG', quality=50)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()


SPECS = [
    # (filename, w, h, palette, seed)
    ('cover-rickshaw-alphabet.jpg', 1600, 2000, 'brick', 11),
    ('cover-monsoon-ledger.jpg', 1600, 2000, 'teal', 22),
    ('cover-buriganga-night-crossing.jpg', 1600, 2000, 'indigo', 33),
    ('cover-city-memory-map.jpg', 1600, 2000, 'marigold', 44),
    ('cover-forty-mosques-one-azan.jpg', 1600, 2000, 'moss', 55),
    ('cover-tin-roof-frequencies.jpg', 1600, 2000, 'magenta', 66),
    ('poster-buriganga-night-crossing.jpg', 1600, 900, 'indigo', 34),
    ('gallery-monsoon-1.jpg', 1600, 1200, 'teal', 23),
    ('gallery-monsoon-2.jpg', 1600, 1200, 'teal', 24),
    ('gallery-monsoon-3.jpg', 1600, 1200, 'teal', 25),
    ('gallery-tinroof-1.jpg', 1600, 1200, 'magenta', 67),
    ('gallery-tinroof-2.jpg', 1600, 1200, 'magenta', 68),
    ('scrap-1.jpg', 800, 1000, 'brick', 101),
    ('scrap-2.jpg', 800, 600, 'slate', 102),
    ('scrap-3.jpg', 800, 800, 'ochre', 103),
    ('scrap-4.jpg', 800, 1100, 'teal', 104),
    ('scrap-5.jpg', 800, 640, 'indigo', 105),
    ('scrap-6.jpg', 800, 900, 'moss', 106),
    ('scrap-7.jpg', 800, 760, 'marigold', 107),
    ('scrap-8.jpg', 800, 1000, 'magenta', 108),
]

# Variant widths mirror the CDN's DPR-ladder output (src/lib/sanity/image.ts,
# grammar §7.2): per role box (grid 256 / card 720 / hero+lightbox 2048),
# width = fit-max base × dpr step, dropping sub-50px and beyond-intrinsic
# candidates — so fixture srcsets match live descriptor math exactly.
BOXES = (256, 720, 2048)
DPR_STEPS = (0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4)
MIN_CANDIDATE = 50


def jround(x):
    return int(x + 0.5)  # JS Math.round — Python round() is banker's


def ladder_widths(w, h):
    widths = set()
    for box in BOXES:
        base = jround(w * min(box / w, box / h, 1.0))
        for d in DPR_STEPS:
            cand = jround(base * d)
            if cand == base or MIN_CANDIDATE <= cand <= w:
                widths.add(cand)
    return sorted(widths)


OUT.mkdir(parents=True, exist_ok=True)
STATIC.mkdir(parents=True, exist_ok=True)
for stale in STATIC.glob('*-*w.webp'):  # ladder changes orphan old variants
    stale.unlink()
manifest = {}
for name, w, h, pal, seed in SPECS:
    img = compose(w, h, PALETTES[pal], seed)
    img.save(OUT / name, 'JPEG', quality=80, optimize=True)
    img.save(STATIC / name, 'JPEG', quality=80, optimize=True)
    # variants ship as WebP to mirror the CDN's webp <source> delivery
    variants = []
    stem = name.rsplit('.', 1)[0]
    for vw in ladder_widths(w, h):
        vimg = img if vw == w else img.resize((vw, jround(h * vw / w)), Image.LANCZOS)
        vname = f'{stem}-{vw}w.webp'
        vimg.save(STATIC / vname, 'WEBP', quality=72, method=6)
        variants.append({'file': vname, 'width': vw})
    manifest[name] = {'width': w, 'height': h, 'lqip': lqip(img), 'variants': variants}
    print(f'{name}  {(OUT / name).stat().st_size // 1024}KB (+{len(variants)} variants)')

MANIFEST.write_text(json.dumps(manifest, indent='\t') + '\n')
print(f'manifest → {MANIFEST}')
