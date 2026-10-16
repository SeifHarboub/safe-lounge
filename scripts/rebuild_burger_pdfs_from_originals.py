from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/Users/seifharboub/Desktop/Divers/Safe/Burger')
OUTPUT = SOURCE / 'NOUVELLE_CARTE_6_BURGERS'
PREVIEW = ROOT / 'research/burger-template-rebuild/previews'
SITE = ROOT / 'public/assets/menu-v3'
CANDIDATES = ROOT / 'research/menu-v3-candidates'
CUTOUTS = ROOT / 'research/burger-template-rebuild/cutouts'
TITLE_BG = Image.open(ROOT / 'research/burger-template-rebuild/title-background-clean.png').convert('RGB')
OUTPUT.mkdir(parents=True, exist_ok=True)
PREVIEW.mkdir(parents=True, exist_ok=True)

W, H = 2480, 3508
WHITE = '#ffffff'
INK = '#111018'
PURPLE = '#7200b7'
YELLOW = '#ffd400'
FONT = '/System/Library/Fonts/Avenir Next Condensed.ttc'


def font(size, heavy=False):
    return ImageFont.truetype(FONT, size, index=8 if heavy else 0)


def render(path):
    doc = pdfium.PdfDocument(str(path))
    return doc[0].render(scale=300 / 72).to_pil().convert('RGB').resize((W, H), Image.Resampling.LANCZOS)


def contain(image, size, background=WHITE):
    canvas = Image.new('RGB', size, background)
    fitted = image.copy()
    fitted.thumbnail((size[0] - 10, size[1] - 10), Image.Resampling.LANCZOS)
    canvas.paste(fitted, ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2))
    return canvas


def cover(image, size):
    tw, th = size
    scale = max(tw / image.width, th / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    x = (resized.width - tw) // 2
    y = (resized.height - th) // 2
    return resized.crop((x, y, x + tw, y + th))


def wrap(draw, text, used_font, width, max_lines=3):
    lines, current = [], ''
    for word in text.split():
        trial = f'{current} {word}'.strip()
        if draw.textlength(trial, font=used_font) <= width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines[:max_lines]


FILES = {
    'classic': 'SAFE_LOUNGE_CLASSIC_SMASH_200G_FRITES_A4.pdf',
    'original': 'SAFE_LOUNGE_ORIGINAL_SMASH_200G_FRITES_A4.pdf',
    'biggie': 'SAFE_LOUNGE_BIGGIE_SMASH_200G_FRITES_A4.pdf',
    'creamy': 'SAFE_LOUNGE_CREAMY_200G_FRITES_A4.pdf',
    'tasty-bacon': 'SAFE_LOUNGE_SMOKEY_BEEF_BACON_200G_FRITES_A4.pdf',
    'frenchy': 'SAFE_LOUNGE_BBQ_RACLETTE_200G_FRITES_A4.pdf',
}
BASE = {slug: render(SOURCE / filename) for slug, filename in FILES.items()}


def crop(base, box):
    return BASE[base].crop(box)


BUN = crop('classic', (35, 990, 460, 1205))
SMASH = crop('classic', (465, 990, 915, 1205))
CHICKEN = crop('creamy', (505, 1030, 990, 1165))
CHEDDAR = crop('classic', (920, 990, 1290, 1205))
SALAD = crop('classic', (1295, 990, 1700, 1205))
KETCHUP = crop('classic', (1705, 990, 2070, 1205))
MUSTARD = crop('classic', (2075, 990, 2445, 1205))
ORIGINAL_SAUCE = crop('original', (1975, 900, 2445, 1110))
BIGGIE_SAUCE = crop('biggie', (1975, 900, 2445, 1110))
MAYO = crop('creamy', (1975, 900, 2445, 1110))
BACON = crop('tasty-bacon', (1295, 990, 1700, 1205))
SMOKED = crop('tasty-bacon', (2075, 990, 2445, 1205))
RACLETTE = crop('frenchy', (995, 900, 1480, 1110))
BBQ = crop('frenchy', (1975, 900, 2445, 1110))
PICKLE = Image.open(CANDIDATES / 'ingredient-cornichon-colona.png').convert('RGB')
BACON_ONIONS = Image.open(CANDIDATES / 'ingredient-bacon-boeuf-oignons.png').convert('RGB')


def side_by_side(left, right, size=(420, 210)):
    half = size[0] // 2
    canvas = Image.new('RGB', size, WHITE)
    canvas.paste(contain(left, (half, size[1])), (0, 0))
    canvas.paste(contain(right, (size[0] - half, size[1])), (half, 0))
    ImageDraw.Draw(canvas).line((half, 18, half, size[1] - 18), fill='#ded9e2', width=2)
    return canvas


PROTEIN = side_by_side(SMASH, CHICKEN)
SAUCES = side_by_side(KETCHUP, MUSTARD)

RECIPES = {
    'classic': {
        'name': 'CLASSIC', 'tag': 'SIMPLE. EFFICACE. INTEMPOREL.',
        'photo': 'burger-classic-smash.webp',
        'ingredients': [('Pain potato bun moelleux', BUN), ('Smash x2 ou poulet frit', PROTEIN), ('Cheddar (2 tranches)', CHEDDAR), ('Salade iceberg croquante', SALAD), ('Cornichon Colona (1 tranche)', PICKLE), ('Ketchup bas + moutarde haut', SAUCES)],
        'steps': {4: 'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.', 5: 'AJOUTER LES 2 TRANCHES DE CHEDDAR.', 6: 'AJOUTER 1 TRANCHE DE CORNICHON PUIS REFERMER.'},
    },
    'original': {
        'name': 'ORIGINAL', 'tag': 'AUTHENTIQUE. GOURMAND. INIMITABLE.',
        'photo': 'burger-original-smash.webp',
        'ingredients': [('Pain potato bun moelleux', BUN), ('Smash x2 ou poulet frit', PROTEIN), ('Cheddar (2 tranches)', CHEDDAR), ('Salade iceberg croquante', SALAD), ('Sauce Original', ORIGINAL_SAUCE)],
        'steps': {4: 'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.', 5: 'AJOUTER LES 2 TRANCHES DE CHEDDAR.', 6: 'REFERMER LE BURGER.'},
    },
    'biggie': {
        'name': 'BIGGIE', 'tag': 'PLUS GROS. PLUS GOURMAND.',
        'photo': 'burger-biggie-smash.webp',
        'ingredients': [('Pain potato bun moelleux', BUN), ('Smash x2 ou poulet frit', PROTEIN), ('Cheddar (2 tranches)', CHEDDAR), ('Salade iceberg croquante', SALAD), ('Cornichon Colona (1 tranche)', PICKLE), ('Sauce Biggie', BIGGIE_SAUCE)],
        'steps': {4: 'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.', 5: 'AJOUTER LES 2 TRANCHES DE CHEDDAR.', 6: 'AJOUTER 1 TRANCHE DE CORNICHON PUIS REFERMER.'},
    },
    'creamy': {
        'name': 'CREAMY', 'tag': 'CROUSTILLANT. FONDANT. IRRÉSISTIBLE.',
        'photo': 'burger-creamy-smash.webp',
        'ingredients': [('Pain potato bun moelleux', BUN), ('Smash x2 ou poulet frit', PROTEIN), ('Cheddar (2 tranches)', CHEDDAR), ('Salade iceberg croquante', SALAD), ('Sauce mayonnaise', MAYO)],
        'steps': {4: 'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.', 5: 'AJOUTER LES 2 TRANCHES DE CHEDDAR.', 6: 'REFERMER LE BURGER.'},
    },
    'tasty-bacon': {
        'name': 'TASTY BACON', 'tag': 'PUISSANT. FONDANT. IRRÉSISTIBLE.',
        'photo': 'burger-tasty-bacon-smash.webp',
        'ingredients': [('Pain potato bun moelleux', BUN), ('Smash x2 ou poulet frit', PROTEIN), ('Cheddar (2 tranches)', CHEDDAR), ('Bacon bœuf + oignons caramélisés', BACON_ONIONS), ('Salade iceberg croquante', SALAD), ('Sauce smoked beef', SMOKED)],
        'steps': {4: 'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.', 5: 'AJOUTER LES 2 TRANCHES DE CHEDDAR.', 6: 'SNACKER 1 TRANCHE DE BACON DE BŒUF.', 7: 'AJOUTER LES OIGNONS CARAMÉLISÉS PUIS REFERMER.'},
    },
    'frenchy': {
        'name': 'FRENCHY', 'tag': 'GOURMAND. FONDANT. IRRÉSISTIBLE.',
        'photo': 'burger-frenchy-smash.webp',
        'ingredients': [('Pain potato bun moelleux', BUN), ('Smash x2 ou poulet frit', PROTEIN), ('Raclette (1 tranche)', RACLETTE), ('Bacon bœuf + oignons caramélisés', BACON_ONIONS), ('Salade iceberg croquante', SALAD), ('Sauce BBQ', BBQ)],
        'steps': {4: 'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.', 5: 'FAIRE FONDRE 1 TRANCHE DE RACLETTE.', 6: 'AJOUTER LE BACON, LES OIGNONS CARAMÉLISÉS PUIS REFERMER.'},
    },
}


def feathered_rect(size, box, radius=28):
    mask = Image.new('L', size, 0)
    ImageDraw.Draw(mask).rectangle(box, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(radius))


def placed_cutout(slug, size):
    cutout = Image.open(CUTOUTS / f'{slug}.png').convert('RGBA')
    cutout.thumbnail(size, Image.Resampling.LANCZOS)
    return cutout


def rebuild_header(page, slug, recipe):
    # Clear the former burger and former title together. This creates one
    # continuous photographic background instead of placing a photo over a photo.
    clean_box = (500, 0, W, 980)
    clean = cover(TITLE_BG, (clean_box[2] - clean_box[0], clean_box[3] - clean_box[1]))
    clean_mask = Image.new('L', clean.size, 255)
    # Blend only the left boundary into the untouched logo/handwriting area.
    mask_pixels = clean_mask.load()
    for x in range(90):
        value = round(255 * x / 89)
        for y in range(clean.height):
            mask_pixels[x, y] = value
    page.paste(clean, clean_box[:2], clean_mask)

    # Restore the exact original top-right decoration and FICHE RECETTE label.
    top_right = BASE[slug].crop((1640, 0, W, 270))
    top_mask = Image.new('L', top_right.size, 255)
    top_pixels = top_mask.load()
    for y in range(45):
        value = round(255 * (44 - y) / 44)
        yy = top_right.height - 45 + y
        for x in range(top_right.width):
            top_pixels[x, yy] = value
    page.paste(top_right, (1640, 0), top_mask)

    # Insert a single burger: the same approved burger as on the website.
    burger = placed_cutout(slug, (1180, 1040))
    x = 440 + (1180 - burger.width) // 2
    y = -35 + (1040 - burger.height) // 2
    page.paste(burger, (x, y), burger.getchannel('A'))

    draw = ImageDraw.Draw(page)
    cx = 2060
    draw.text((cx, 285), 'BURGER AU CHOIX', font=font(39), fill=WHITE, anchor='ma')
    used = font(96 if len(recipe['name']) < 10 else 76, True)
    lines = recipe['name'].split()
    y = 390 if len(lines) == 1 else 350
    for line in lines:
        draw.text((cx, y), line, font=used, fill=WHITE, anchor='ma')
        y += used.size * .88
    draw.rounded_rectangle((1890, 640, 2230, 665), radius=12, fill=YELLOW)
    draw.text((cx, 730), recipe['tag'], font=font(27), fill=WHITE, anchor='ma')


def replace_final_photo(page, slug):
    burger = placed_cutout(slug, (735, 590))
    if slug == 'tasty-bacon':
        box = (1840, 2130, 2440, 2690)
    else:
        box = (1670, 2130, 2435, 2690)
    canvas = Image.new('RGB', (box[2] - box[0], box[3] - box[1]), WHITE)
    x = (canvas.width - burger.width) // 2
    y = (canvas.height - burger.height) // 2
    canvas.paste(burger, (x, y), burger.getchannel('A'))
    page.paste(canvas, box[:2])


def replace_ingredients(page, recipe):
    draw = ImageDraw.Draw(page)
    draw.rectangle((25, 980, 2455, 1360), fill=WHITE)
    items = recipe['ingredients']
    slot = 2420 / len(items)
    for index, (label, visual) in enumerate(items):
        x0 = round(30 + index * slot)
        x1 = round(30 + (index + 1) * slot)
        if index:
            draw.line((x0, 1000, x0, 1340), fill='#ded9e2', width=3)
        fitted = contain(visual, (x1 - x0 - 18, 205))
        page.paste(fitted, (x0 + 9, 990))
        used = font(29, True)
        lines = wrap(draw, label, used, x1 - x0 - 24)
        total = len(lines) * 31
        y = 1268 - total / 2
        for line in lines:
            draw.text(((x0 + x1) / 2, y), line, font=used, fill=INK, anchor='ma')
            y += 31


STEP_TEXT_BOXES = {
    4: (185, 1918, 812, 2130),
    5: (990, 1918, 1632, 2130),
    6: (1810, 1918, 2425, 2130),
}

TASTY_STEP_TEXT_BOXES = {
    4: (180, 1918, 620, 2130),
    5: (775, 1918, 1225, 2130),
    6: (1370, 1918, 1830, 2130),
    7: (1975, 1918, 2435, 2130),
}


def replace_steps(page, slug, recipe):
    draw = ImageDraw.Draw(page)
    for number, text in recipe['steps'].items():
        box = TASTY_STEP_TEXT_BOXES[number] if slug == 'tasty-bacon' else STEP_TEXT_BOXES[number]
        draw.rectangle(box, fill=WHITE)
        used = font(31 if len(text) < 58 else 27, True)
        y = box[1] + 8
        for line in wrap(draw, text, used, box[2] - box[0] - 10, 3):
            draw.text((box[0] + 4, y), line, font=used, fill=INK)
            y += used.size + 2


for slug, recipe in RECIPES.items():
    page = BASE[slug].copy()
    rebuild_header(page, slug, recipe)
    replace_ingredients(page, recipe)
    replace_steps(page, slug, recipe)
    replace_final_photo(page, slug)
    stem = f"SAFE_LOUNGE_{slug.upper().replace('-', '_')}_PROCESS_A4"
    page.save(PREVIEW / f'{stem}.png', optimize=True)
    page.save(OUTPUT / f'{stem}.pdf', 'PDF', resolution=300, quality=95)
    print(OUTPUT / f'{stem}.pdf')
