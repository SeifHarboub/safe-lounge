from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/Users/seifharboub/Desktop/Divers/Safe/Burger')
OUTPUT = SOURCE / 'NOUVELLE_CARTE_6_BURGERS'
PREVIEW = ROOT / 'research/burger-process-previews'
PHOTOS = ROOT / 'research/menu-v3-candidates'
OUTPUT.mkdir(parents=True, exist_ok=True)
PREVIEW.mkdir(parents=True, exist_ok=True)

W, H = 2480, 3508
WHITE = '#ffffff'
INK = '#171019'
PURPLE = '#7200b7'
YELLOW = '#ffd300'
GREEN = '#002b20'
FONT = '/System/Library/Fonts/Avenir Next Condensed.ttc'


def font(size, heavy=False):
    return ImageFont.truetype(FONT, size, index=8 if heavy else 0)


def render(pdf_path):
    doc = pdfium.PdfDocument(str(pdf_path))
    return doc[0].render(scale=300 / 72).to_pil().convert('RGB').resize((W, H), Image.Resampling.LANCZOS)


def cover(image, size, focus=(0.5, 0.5)):
    tw, th = size
    iw, ih = image.size
    scale = max(tw / iw, th / ih)
    image = image.resize((round(iw * scale), round(ih * scale)), Image.Resampling.LANCZOS)
    x = max(0, min(image.width - tw, round((image.width - tw) * focus[0])))
    y = max(0, min(image.height - th, round((image.height - th) * focus[1])))
    return image.crop((x, y, x + tw, y + th))


def contain(image, size):
    canvas = Image.new('RGB', size, WHITE)
    image = image.copy()
    image.thumbnail(size, Image.Resampling.LANCZOS)
    canvas.paste(image, ((size[0] - image.width) // 2, (size[1] - image.height) // 2))
    return canvas


def contain_over_soft_background(image, size):
    """Keep the whole useful image visible while filling the process-card frame."""
    background = cover(image, size).filter(ImageFilter.GaussianBlur(24))
    background = ImageEnhance.Brightness(background).enhance(0.70)
    foreground = image.copy()
    foreground.thumbnail((size[0] - 12, size[1] - 12), Image.Resampling.LANCZOS)
    x = (size[0] - foreground.width) // 2
    y = (size[1] - foreground.height) // 2
    background.paste(foreground, (x, y))
    return background


def rounded_mask(size, radius=22):
    mask = Image.new('L', size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def text_lines(draw, text, used_font, width):
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
    return lines


def draw_centered_lines(draw, box, text, used_font, fill=INK, spacing=2, max_lines=3):
    x0, y0, x1, y1 = box
    lines = text_lines(draw, text, used_font, x1 - x0)[:max_lines]
    total = len(lines) * used_font.size + max(0, len(lines) - 1) * spacing
    y = y0 + max(0, (y1 - y0 - total) / 2)
    for line in lines:
        draw.text(((x0 + x1) / 2, y), line, font=used_font, fill=fill, anchor='ma')
        y += used_font.size + spacing


BASE_FILES = {
    'classic': 'SAFE_LOUNGE_CLASSIC_SMASH_200G_FRITES_A4.pdf',
    'original': 'SAFE_LOUNGE_ORIGINAL_SMASH_200G_FRITES_A4.pdf',
    'biggie': 'SAFE_LOUNGE_BIGGIE_SMASH_200G_FRITES_A4.pdf',
    'creamy': 'SAFE_LOUNGE_CREAMY_200G_FRITES_A4.pdf',
    'tasty-bacon': 'SAFE_LOUNGE_SMOKEY_BEEF_BACON_200G_FRITES_A4.pdf',
    'frenchy': 'SAFE_LOUNGE_BBQ_RACLETTE_200G_FRITES_A4.pdf',
}
BASES = {key: render(SOURCE / filename) for key, filename in BASE_FILES.items()}

pickle_asset = Image.open(PHOTOS / 'ingredient-cornichon-colona.png').convert('RGB')
bacon_onion_asset = Image.open(PHOTOS / 'ingredient-bacon-boeuf-oignons.png').convert('RGB')


def ingredient_crop(base_key, index, count):
    bounds = (
        [(35, 460), (465, 915), (920, 1290), (1295, 1700), (1705, 2070), (2075, 2445)]
        if count == 6
        else [(35, 500), (505, 990), (995, 1480), (1485, 1970), (1975, 2445)]
    )
    x0, x1 = bounds[index]
    y0, y1 = (990, 1205) if count == 6 else (900, 1110)
    return BASES[base_key].crop((x0, y0, x1, y1))


def split_visual(left, right, size=(390, 165)):
    half = size[0] // 2
    result = Image.new('RGB', size, WHITE)
    result.paste(contain(left, (half, size[1])), (0, 0))
    result.paste(contain(right, (size[0] - half, size[1])), (half, 0))
    ImageDraw.Draw(result).line((half, 15, half, size[1] - 15), fill='#ddd6e0', width=2)
    return result


def split_step_visual(left, right, size=(760, 500)):
    half = size[0] // 2
    result = Image.new('RGB', size, WHITE)
    result.paste(contain_over_soft_background(left, (half, size[1])), (0, 0))
    result.paste(contain_over_soft_background(right, (size[0] - half, size[1])), (half, 0))
    ImageDraw.Draw(result).line((half, 0, half, size[1]), fill=WHITE, width=8)
    return result


BUN = ingredient_crop('classic', 0, 6)
SMASH = ingredient_crop('classic', 1, 6)
CHICKEN = BASES['creamy'].crop((505, 1030, 990, 1165))
PROTEIN = split_visual(SMASH, CHICKEN)
CHEDDAR = ingredient_crop('classic', 2, 6)
SALAD = ingredient_crop('classic', 3, 6)
KETCHUP_MUSTARD = split_visual(ingredient_crop('classic', 4, 6), ingredient_crop('classic', 5, 6))


RECIPES = [
    {
        'slug': 'classic', 'name': 'CLASSIC', 'tag': 'SIMPLE. EFFICACE. INTEMPOREL.',
        'photo': 'burger-classic-v3-final.png',
        'ingredients': [
            ('Pain potato bun moelleux', BUN), ('Smash x2 OU poulet frit', PROTEIN),
            ('Cheddar (2 tranches)', CHEDDAR), ('Salade iceberg croquante', SALAD),
            ('Cornichon Colona (1 tranche)', pickle_asset), ('Ketchup bas + moutarde haut', KETCHUP_MUSTARD),
        ],
        'steps': [
            'BEURRER ET TOASTER LE PAIN.', 'KETCHUP EN BAS. MOUTARDE EN HAUT.',
            'AJOUTER LA SALADE ICEBERG EN BAS.', '2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.',
            'AJOUTER LES 2 TRANCHES DE CHEDDAR.', 'AJOUTER 1 TRANCHE DE CORNICHON PUIS REFERMER.',
        ],
    },
    {
        'slug': 'original', 'name': 'ORIGINAL', 'tag': 'AUTHENTIQUE. GOURMAND. INIMITABLE.',
        'photo': 'burger-original-v6-final.png',
        'ingredients': [
            ('Pain potato bun moelleux', BUN), ('Smash x2 OU poulet frit', PROTEIN),
            ('Cheddar (2 tranches)', CHEDDAR), ('Salade iceberg croquante', SALAD),
            ('Sauce Original orange', ingredient_crop('original', 4, 5)),
            ('Frites (200 g)', BASES['classic'].crop((450, 2700, 1450, 3180))),
        ],
        'steps': [
            'BEURRER ET TOASTER LE PAIN.', 'SAUCE ORIGINAL ORANGE SUR LES DEUX PAINS.',
            'AJOUTER LA SALADE ICEBERG EN BAS.', '2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.',
            'AJOUTER LES 2 TRANCHES DE CHEDDAR.', 'REFERMER LE BURGER.',
        ],
    },
    {
        'slug': 'biggie', 'name': 'BIGGIE', 'tag': 'PLUS GROS. PLUS GOURMAND.',
        'photo': 'burger-biggie-v4-final.png',
        'ingredients': [
            ('Pain potato bun moelleux', BUN), ('Smash x2 OU poulet frit', PROTEIN),
            ('Cheddar (2 tranches)', CHEDDAR), ('Salade iceberg croquante', SALAD),
            ('Cornichon Colona (1 tranche)', pickle_asset),
            ('Sauce Biggie jaune orangé', ingredient_crop('biggie', 4, 5)),
        ],
        'steps': [
            'BEURRER ET TOASTER LE PAIN.', 'SAUCE BIGGIE SUR LES DEUX PAINS.',
            'AJOUTER LA SALADE ICEBERG EN BAS.', '2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.',
            'AJOUTER LES 2 TRANCHES DE CHEDDAR.', 'AJOUTER 1 TRANCHE DE CORNICHON PUIS REFERMER.',
        ],
    },
    {
        'slug': 'creamy', 'name': 'CREAMY', 'tag': 'CROUSTILLANT. FONDANT. IRRÉSISTIBLE.',
        'photo': 'burger-creamy-v1.png',
        'ingredients': [
            ('Pain potato bun moelleux', BUN), ('Smash x2 OU poulet frit', PROTEIN),
            ('Cheddar (2 tranches)', CHEDDAR), ('Salade iceberg croquante', SALAD),
            ('Mayonnaise blanche', ingredient_crop('creamy', 4, 5)),
            ('Frites (200 g)', BASES['classic'].crop((450, 2700, 1450, 3180))),
        ],
        'steps': [
            'BEURRER ET TOASTER LE PAIN.', 'MAYONNAISE BLANCHE SUR LES DEUX PAINS.',
            'AJOUTER LA SALADE ICEBERG EN BAS.', '2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.',
            'AJOUTER LES 2 TRANCHES DE CHEDDAR.', 'REFERMER LE BURGER.',
        ],
    },
    {
        'slug': 'tasty-bacon', 'name': 'TASTY BACON', 'tag': 'PUISSANT. FONDANT. IRRÉSISTIBLE.',
        'photo': 'burger-tasty-bacon-v2-final.png',
        'ingredients': [
            ('Pain potato bun moelleux', BUN), ('Smash x2 OU poulet frit', PROTEIN),
            ('Cheddar (2 tranches)', CHEDDAR), ('Bacon bœuf + oignons caramélisés', bacon_onion_asset),
            ('Salade iceberg croquante', SALAD),
            ('Sauce smoked beef brune', ingredient_crop('tasty-bacon', 5, 6)),
        ],
        'steps': [
            'BEURRER ET TOASTER LE PAIN.', 'SAUCE SMOKED BEEF BRUNE SUR LES DEUX PAINS.',
            'AJOUTER LA SALADE ICEBERG EN BAS.', '2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.',
            'AJOUTER LES 2 TRANCHES DE CHEDDAR.',
            'AJOUTER 1 TRANCHE DE BACON, LES OIGNONS CARAMÉLISÉS PUIS REFERMER.',
        ],
    },
    {
        'slug': 'frenchy', 'name': 'FRENCHY', 'tag': 'GOURMAND. FONDANT. IRRÉSISTIBLE.',
        'photo': 'burger-frenchy-v1.png',
        'ingredients': [
            ('Pain potato bun moelleux', BUN), ('Smash x2 OU poulet frit', PROTEIN),
            ('Raclette (1 tranche)', ingredient_crop('frenchy', 2, 5)),
            ('Bacon bœuf + oignons caramélisés', bacon_onion_asset),
            ('Salade iceberg croquante', SALAD), ('Sauce BBQ acajou', ingredient_crop('frenchy', 4, 5)),
        ],
        'steps': [
            'BEURRER ET TOASTER LE PAIN.', 'SAUCE BBQ ACAJOU SUR LES DEUX PAINS.',
            'AJOUTER LA SALADE ICEBERG EN BAS.', '2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.',
            'FAIRE FONDRE 1 TRANCHE DE RACLETTE.',
            'AJOUTER 1 TRANCHE DE BACON, LES OIGNONS CARAMÉLISÉS PUIS REFERMER.',
        ],
    },
]


def original_step_visual(base_key, number):
    boxes = {
        1: (50, 1580, 820, 1900), 2: (855, 1580, 1640, 1900), 3: (1670, 1580, 2430, 1900),
        4: (50, 2080, 820, 2660), 5: (855, 2080, 1640, 2660), 6: (1670, 2080, 2430, 2660),
    }
    return BASES[base_key].crop(boxes[number])


MENU_SMASH = Image.open(PHOTOS / 'burger-classic-v3-final.png').convert('RGB')
MENU_CHICKEN = Image.open(PHOTOS / 'burger-classic-chicken-v6-final.png').convert('RGB')
PROTEIN_STEP = split_step_visual(MENU_SMASH, MENU_CHICKEN)
CHEDDAR_STEP = split_step_visual(MENU_SMASH, MENU_CHICKEN)
TASTY_BACON_STEP = BASES['tasty-bacon'].crop((1252, 2120, 1839, 2600))
CHICKEN_FILES = {
    'classic': 'burger-classic-chicken-v6-final.png',
    'original': 'burger-original-chicken-v2-final.png',
    'biggie': 'burger-biggie-chicken-v2-final.png',
    'creamy': 'burger-creamy-chicken-v1.png',
    'tasty-bacon': 'burger-tasty-bacon-chicken-v2-final.png',
    'frenchy': 'burger-frenchy-chicken-v1.png',
}


def ingredient_step_visual(image):
    return contain(image, (760, 580))


def draw_title(page, recipe):
    draw = ImageDraw.Draw(page)
    draw.rounded_rectangle((1660, 235, 2465, 875), radius=18, fill=GREEN)
    draw.text((2060, 270), 'BURGER AU CHOIX', font=font(39), fill=WHITE, anchor='ma')
    title_font = font(91 if len(recipe['name']) <= 8 else 74, True)
    title_lines = recipe['name'].split(' ')
    y = 350 if len(title_lines) == 1 else 320
    for line in title_lines:
        draw.text((2060, y), line, font=title_font, fill=WHITE, anchor='ma')
        y += title_font.size * 0.88
    draw.rounded_rectangle((1900, 570, 2215, 595), radius=12, fill=YELLOW)
    draw.text((2060, 665), recipe['tag'], font=font(27), fill=WHITE, anchor='ma')
    draw.text((2060, 735), 'SMASH 130 G  OU  CHICKEN', font=font(25, True), fill=YELLOW, anchor='ma')


def draw_ingredients(page, recipe):
    draw = ImageDraw.Draw(page)
    draw.rounded_rectangle((35, 770, 480, 955), radius=38, fill=WHITE)
    draw.text((72, 792), 'INGRÉDIENTS', font=font(47, True), fill=PURPLE)
    draw.text((74, 852), '(pour 1 burger)', font=font(34, True), fill=INK)
    # Erase the complete former ingredient strip, including its old captions.
    draw.rectangle((25, 900, 2455, 1358), fill=WHITE)
    slot_w, start_x, gap = 400, 35, 6
    for index, (label, visual) in enumerate(recipe['ingredients']):
        x = start_x + index * (slot_w + gap)
        image = contain(visual, (slot_w - 14, 205))
        page.paste(image, (x + 7, 910))
        if index:
            draw.line((x - 3, 920, x - 3, 1340), fill='#ddd6e0', width=3)
        draw_centered_lines(draw, (x + 8, 1122, x + slot_w - 8, 1348), label, font(29, True), max_lines=3)


def draw_step_card(page, box, number, title, visual):
    x0, y0, x1, y1 = box
    width, height = x1 - x0, y1 - y0
    layer = Image.new('RGB', (width, height), WHITE)
    draw = ImageDraw.Draw(layer)
    header_h = 150
    photo = contain_over_soft_background(visual, (width - 8, height - header_h - 4))
    layer.paste(photo, (4, header_h), rounded_mask(photo.size, 16))
    draw.ellipse((10, 8, 116, 114), fill=PURPLE)
    draw.text((63, 61), str(number), font=font(68, True), fill=WHITE, anchor='mm')
    used_font = font(31, True)
    y = 18
    for line in text_lines(draw, title, used_font, width - 150)[:3]:
        draw.text((135, y), line, font=used_font, fill=INK)
        y += 34
    page.paste(layer, (x0, y0), rounded_mask(layer.size, 18))


def draw_steps(page, recipe):
    # The original template reserves this exact area for two rows of three cards.
    # Step 7 (fries), the Ready block and the footer stay untouched below it.
    ImageDraw.Draw(page).rectangle((0, 1360, W, 2672), fill='#f7f5f4')
    standard = [
        (48, 1368, 820, 1908), (850, 1368, 1640, 1908), (1670, 1368, 2435, 1908),
        (48, 1918, 820, 2665), (850, 1918, 1640, 2665), (1670, 1918, 2435, 2665),
    ]
    boxes = standard
    final = Image.open(PHOTOS / recipe['photo']).convert('RGB')
    chicken = Image.open(PHOTOS / CHICKEN_FILES[recipe['slug']]).convert('RGB')
    protein_step = split_step_visual(final, chicken)
    visuals = [
        original_step_visual(recipe['slug'], 1), original_step_visual(recipe['slug'], 2),
        original_step_visual(recipe['slug'], 3), protein_step,
        ingredient_step_visual(ingredient_crop('frenchy', 2, 5) if recipe['slug'] == 'frenchy' else CHEDDAR),
    ]
    visuals.append(final)
    for index, title in enumerate(recipe['steps']):
        draw_step_card(page, boxes[index], index + 1, title, visuals[index])

    # Reuse one clean, identical fries/Ready block: former recipes had either
    # seven or eight steps, which otherwise shifted this last part of the sheet.
    page.paste(BASES['classic'].crop((0, 2672, W, 3208)), (0, 2672))


for recipe in RECIPES:
    page = BASES[recipe['slug']].copy()
    if recipe['slug'] == 'frenchy':
        page.paste(BASES['tasty-bacon'].crop((0, 1218, W, 2870)), (0, 1218))
    draw_title(page, recipe)
    draw_ingredients(page, recipe)
    draw_steps(page, recipe)
    stem = f"SAFE_LOUNGE_{recipe['slug'].upper().replace('-', '_')}_PROCESS_A4"
    png = PREVIEW / f'{stem}.png'
    pdf = OUTPUT / f'{stem}.pdf'
    page.save(png, optimize=True)
    page.save(pdf, 'PDF', resolution=300, quality=95)
    print(pdf)
