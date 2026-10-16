from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import build_burger_sheet_from_scratch as ui


ORIGINALS = {
    'classic': 'SAFE_LOUNGE_CLASSIC_SMASH_200G_FRITES_A4.pdf',
    'original': 'SAFE_LOUNGE_ORIGINAL_SMASH_200G_FRITES_A4.pdf',
    'biggie': 'SAFE_LOUNGE_BIGGIE_SMASH_200G_FRITES_A4.pdf',
    'creamy': 'SAFE_LOUNGE_CREAMY_200G_FRITES_A4.pdf',
    'tasty-bacon': 'SAFE_LOUNGE_SMOKEY_BEEF_BACON_200G_FRITES_A4.pdf',
    'frenchy': 'SAFE_LOUNGE_BBQ_RACLETTE_200G_FRITES_A4.pdf',
}

RECIPES = {
    'classic': {
        'name': 'CLASSIC', 'tag': 'SIMPLE. EFFICACE. INTEMPOREL.',
        'ingredients': ['bun', 'protein', 'cheddar', 'salad', 'pickle', 'sauces'],
        'steps': [
            'BEURRER ET TOASTER LE PAIN.',
            'KETCHUP EN BAS, MOUTARDE EN HAUT.',
            'AJOUTER LA SALADE ICEBERG.',
            'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.',
            'FAIRE FONDRE 2 TRANCHES DE CHEDDAR SUR LA VIANDE.',
            'AJOUTER 1 TRANCHE DE CORNICHON PUIS REFERMER.',
        ],
    },
    'original': {
        'name': 'ORIGINAL', 'tag': 'AUTHENTIQUE. GOURMAND. INIMITABLE.',
        'ingredients': ['bun', 'protein', 'cheddar', 'salad', 'recipe-sauce'],
        'steps': [
            'BEURRER ET TOASTER LE PAIN.',
            'METTRE LA SAUCE ORIGINAL SUR LES DEUX PAINS.',
            'AJOUTER LA SALADE ICEBERG.',
            'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.',
            'FAIRE FONDRE 2 TRANCHES DE CHEDDAR SUR LA VIANDE.',
            'REFERMER LE BURGER.',
        ],
    },
    'biggie': {
        'name': 'BIGGIE', 'tag': 'PLUS GROS. PLUS GOURMAND.',
        'ingredients': ['bun', 'protein', 'cheddar', 'salad', 'pickle', 'recipe-sauce'],
        'steps': [
            'BEURRER ET TOASTER LE PAIN.',
            'METTRE LA SAUCE BIGGIE SUR LES DEUX PAINS.',
            'AJOUTER LA SALADE ICEBERG.',
            'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.',
            'FAIRE FONDRE 2 TRANCHES DE CHEDDAR SUR LA VIANDE.',
            'AJOUTER 1 TRANCHE DE CORNICHON PUIS REFERMER.',
        ],
    },
    'creamy': {
        'name': 'CREAMY', 'tag': 'CROUSTILLANT. FONDANT. IRRÉSISTIBLE.',
        'ingredients': ['bun', 'protein', 'cheddar', 'salad', 'recipe-sauce'],
        'steps': [
            'BEURRER ET TOASTER LE PAIN.',
            'METTRE LA MAYONNAISE SUR LES DEUX PAINS.',
            'AJOUTER LA SALADE ICEBERG.',
            'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.',
            'FAIRE FONDRE 2 TRANCHES DE CHEDDAR SUR LA VIANDE.',
            'REFERMER LE BURGER.',
        ],
    },
    'tasty-bacon': {
        'name': 'TASTY BACON', 'tag': 'PUISSANT. FONDANT. IRRÉSISTIBLE.',
        'ingredients': ['bun', 'protein', 'cheddar', 'bacon-onions', 'salad', 'recipe-sauce'],
        'steps': [
            'BEURRER ET TOASTER LE PAIN.',
            'METTRE LA SAUCE SMOKED BEEF SUR LES DEUX PAINS.',
            'AJOUTER LA SALADE ICEBERG.',
            'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.',
            'FAIRE FONDRE 2 TRANCHES DE CHEDDAR SUR LA VIANDE.',
            'SNACKER 1 TRANCHE DE BACON DE BŒUF.',
            'AJOUTER LES OIGNONS CARAMÉLISÉS PUIS REFERMER.',
        ],
    },
    'frenchy': {
        'name': 'FRENCHY', 'tag': 'GOURMAND. FONDANT. IRRÉSISTIBLE.',
        'ingredients': ['bun', 'protein', 'raclette', 'bacon-onions', 'salad', 'recipe-sauce'],
        'steps': [
            'BEURRER ET TOASTER LE PAIN.',
            'METTRE LA SAUCE BARBECUE SUR LES DEUX PAINS.',
            'AJOUTER LA SALADE ICEBERG.',
            'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.',
            'FAIRE FONDRE 1 TRANCHE DE RACLETTE SUR LA VIANDE.',
            'AJOUTER LE BACON, LES OIGNONS CARAMÉLISÉS PUIS REFERMER.',
        ],
    },
}


def assets(original, classic_original, creamy_original, slug):
    protein = ui.side_by_side(
        ui.ingredient_visual(classic_original, (465, 1000, 915, 1210)),
        ui.ingredient_visual(creamy_original, (505, 1025, 990, 1190)),
    )
    raclette_visual = ui.ingredient_visual(original, (1040, 900, 1450, 1120)) if slug == 'frenchy' else ui.ingredient_visual(original, (850, 1000, 1240, 1200))
    sauce_visual = ui.ingredient_visual(original, (2040, 900, 2400, 1135)) if slug == 'frenchy' else ui.ingredient_visual(original, (2070, 1000, 2440, 1200))
    labels = {
        'bun': ('Pain potato bun moelleux', ui.ingredient_visual(classic_original, (35, 1000, 455, 1210))),
        'protein': ('Smash x2 ou poulet frit', protein),
        'cheddar': ('Cheddar (2 tranches)', ui.ingredient_visual(classic_original, (920, 1000, 1285, 1210))),
        'salad': ('Salade iceberg croquante', ui.ingredient_visual(classic_original, (1290, 1000, 1695, 1210))),
        'pickle': ('Cornichon Colona (1 tranche)', Image.open(ui.ROOT / 'research/menu-v3-candidates/ingredient-cornichon-colona.png').convert('RGBA')),
        'sauces': ('Ketchup bas + moutarde haut', ui.ingredient_visual(original, (1705, 1000, 2440, 1210))),
        'bacon-onions': ('Bacon bœuf + oignons caramélisés', Image.open(ui.ROOT / 'research/menu-v3-candidates/ingredient-bacon-boeuf-oignons.png').convert('RGBA')),
        'raclette': ('Raclette (1 tranche)', raclette_visual),
        'recipe-sauce': ({
            'original': 'Sauce Original', 'biggie': 'Sauce Biggie', 'creamy': 'Sauce mayonnaise',
            'tasty-bacon': 'Sauce smoked beef', 'frenchy': 'Sauce barbecue',
        }.get(slug, 'Sauce'), sauce_visual),
    }
    return labels


def template_header_overlay(classic_original):
    source = classic_original.crop((0, 0, ui.W, 1000)).convert('RGB')
    pixels = np.asarray(source)
    red, green, blue = pixels[..., 0], pixels[..., 1], pixels[..., 2]
    purple = (blue > 75) & (red > 65) & (blue > green * 1.25) & (red > green * 1.15)
    yy, xx = np.indices(purple.shape)
    logo_white = (xx < 520) & (yy < 500) & (red > 145) & (green > 145) & (blue > 135) & (
        np.maximum.reduce([red, green, blue]) - np.minimum.reduce([red, green, blue]) < 55
    )
    alpha = np.where(purple | logo_white, 255, 0).astype('uint8')
    result = source.convert('RGBA')
    result.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(.45)))
    return result


def header(page, slug, recipe, burger, header_bg, ornaments, fiche_banner):
    page.paste(ui.cover(header_bg, (ui.W, 1000), (0.52, 0.5)), (0, 0))
    overlay = Image.new('RGBA', (ui.W, 1000), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, 530, 1000), fill=(0, 20, 12, 105))
    od.rectangle((1660, 0, ui.W, 1000), fill=(0, 16, 10, 115))
    overlay = overlay.filter(ImageFilter.GaussianBlur(18))
    page.paste(overlay, (0, 0), overlay)
    page.paste(ornaments, (0, 0), ornaments)
    draw = ImageDraw.Draw(page)
    hero = ui.contain_rgba(burger, (1180, 850))
    page.paste(hero, (440 + (1180 - hero.width) // 2, 35 + (840 - hero.height) // 2), hero)
    page.paste(fiche_banner, (1660, 160))
    draw = ImageDraw.Draw(page)
    draw.text((2025, 320), 'BURGER AU CHOIX', font=ui.font(38), fill=ui.WHITE, anchor='mm')
    name_size = 105 if len(recipe['name']) <= 8 else 82
    draw.text((2025, 465), recipe['name'], font=ui.font(name_size, True), fill=ui.WHITE, anchor='mm')
    draw.rounded_rectangle((1835, 580, 2215, 602), radius=11, fill=ui.YELLOW)
    draw.text((2025, 695), recipe['tag'], font=ui.font(28), fill=ui.WHITE, anchor='mm')


def ingredients_panel(page, recipe, visual_assets):
    draw = ImageDraw.Draw(page)
    draw.rounded_rectangle((35, 855, 455, 1008), radius=30, fill=ui.WHITE)
    draw.text((245, 902), 'INGRÉDIENTS', font=ui.font(49, True), fill=ui.PURPLE, anchor='mm')
    draw.text((245, 962), '(pour 1 burger)', font=ui.font(37, True), fill=ui.INK, anchor='mm')
    panel = (30, 1000, 2450, 1370)
    draw.rounded_rectangle(panel, radius=24, fill=ui.WHITE)
    items = [visual_assets[key] for key in recipe['ingredients']]
    slot = (panel[2] - panel[0]) / len(items)
    for i, (label, visual) in enumerate(items):
        x0 = round(panel[0] + i * slot)
        x1 = round(panel[0] + (i + 1) * slot)
        if i:
            draw.line((x0, 1020, x0, 1350), fill=ui.LINE, width=3)
        ui.draw_ingredient(page, (x0, 1010, x1, 1360), visual, label)


def serving_card(page, box, number, text, image):
    x0, y0, x1, y1 = box
    width, height = x1 - x0, y1 - y0
    title_h = 158
    draw = ImageDraw.Draw(page)
    draw.rounded_rectangle(box, radius=28, fill=ui.WHITE, outline='#e9e5e0', width=3)
    photo_size = (width - 8, height - title_h - 8)
    # Wide crop focused on the upper half of the bowl, where the fries are.
    photo = ui.cover(image.convert('RGB'), photo_size, (0.5, 0.05)).convert('RGBA')
    photo_mask = Image.new('L', photo_size, 0)
    ImageDraw.Draw(photo_mask).rounded_rectangle((0, 0, photo_size[0] - 1, photo_size[1] - 1), radius=22, fill=255)
    photo.putalpha(photo_mask)
    page.paste(photo, (x0 + 4, y0 + title_h), photo)
    circle = (x0 + 75, y0 + 75)
    draw.ellipse((circle[0] - 58, circle[1] - 58, circle[0] + 58, circle[1] + 58), fill=ui.PURPLE)
    draw.text(circle, str(number), font=ui.font(68, True), fill=ui.WHITE, anchor='mm')
    draw.text((x0 + 150, y0 + 30), text, font=ui.font(34, True), fill=ui.INK)


def process_panel(page, original, classic_original, burger, slug, steps, fries_photo, ready_panel):
    if slug == 'tasty-bacon':
        assembly_4 = original.crop((50, 2240, 680, 2600))
        assembly_5 = original.crop((700, 2240, 1240, 2600))
    else:
        assembly_4 = original.crop((50, 2240, 820, 2600))
        assembly_5 = original.crop((855, 2240, 1635, 2600))
    photos = [
        original.crop((50, 1580, 820, 1910)),
        original.crop((855, 1580, 1635, 1910)),
        original.crop((1675, 1580, 2435, 1910)),
        assembly_4,
        assembly_5,
        ui.on_white(burger, (900, 620)),
    ]
    if len(steps) == 7:
        bacon = ui.on_white(original.crop((1295, 1000, 1700, 1200)), (800, 540))
        photos[5] = bacon
        photos.append(ui.on_white(burger, (900, 620)))
    top_y, card_h, gap = 1410, 650, 28
    first_w = (ui.W - 2 * 45 - 2 * gap) // 3
    for idx in range(3):
        x0 = 45 + idx * (first_w + gap)
        ui.draw_step(page, (x0, top_y, x0 + first_w, top_y + card_h), idx + 1, steps[idx], photos[idx])
    second = steps[3:]
    second_w = (ui.W - 2 * 45 - (len(second) - 1) * gap) // len(second)
    second_y = top_y + card_h + gap
    for idx, text in enumerate(second):
        x0 = 45 + idx * (second_w + gap)
        ui.draw_step(page, (x0, second_y, x0 + second_w, second_y + card_h), idx + 4, text, photos[idx + 3])

    draw = ImageDraw.Draw(page)
    y0 = top_y + 2 * (card_h + gap)
    serving_number = len(steps) + 1
    serving_card(page, (45, y0, 1595, 3220), serving_number, 'SERVIR AVEC 200 G DE FRITES.', fries_photo)
    ready_canvas = Image.new('RGB', (812, 454), ui.WHITE)
    ready = ready_panel.copy().convert('RGBA')
    ready.thumbnail((792, 434), Image.Resampling.LANCZOS)
    ready_canvas.paste(ready, ((812 - ready.width) // 2, (454 - ready.height) // 2), ready)
    ready_canvas = ready_canvas.convert('RGBA')
    ready_mask = Image.new('L', ready_canvas.size, 0)
    ImageDraw.Draw(ready_mask).rounded_rectangle((0, 0, 811, 453), radius=28, fill=255)
    ready_canvas.putalpha(ready_mask)
    page.paste(ready_canvas, (1623, y0), ready_canvas)


def footer(page, classic_original):
    # This is a fixed template element with no product photography.
    page.paste(classic_original.crop((0, 3250, ui.W, ui.H)), (0, 3250))


def build(slug, recipe, classic_original, creamy_original, fries_photo, header_bg, ornaments, fiche_banner, ready_panel):
    original = ui.render_pdf(ui.SOURCE / ORIGINALS[slug])
    burger = Image.open(ui.WORK / f'cutouts/{slug}.png').convert('RGBA')
    page = Image.new('RGB', (ui.W, ui.H), ui.OFF_WHITE)
    header(page, slug, recipe, burger, header_bg, ornaments, fiche_banner)
    ingredients_panel(page, recipe, assets(original, classic_original, creamy_original, slug))
    process_panel(page, original, classic_original, burger, slug, recipe['steps'], fries_photo, ready_panel)
    footer(page, classic_original)
    stem = f"SAFE_LOUNGE_{slug.upper().replace('-', '_')}_PROCESS_A4"
    preview = ui.WORK / 'previews' / f'{stem}_FROM_SCRATCH.png'
    output = ui.OUTPUT / f'{stem}.pdf'
    page.save(preview, optimize=True)
    page.save(output, 'PDF', resolution=300, quality=95)
    print(output)


if __name__ == '__main__':
    ui.OUTPUT.mkdir(parents=True, exist_ok=True)
    creamy_original = ui.render_pdf(ui.SOURCE / ORIGINALS['creamy'])
    classic_original = ui.render_pdf(ui.SOURCE / ORIGINALS['classic'])
    fries_photo = classic_original.crop((350, 2820, 1500, 3230))
    header_bg = Image.open(ui.WORK / 'title-background-clean.png').convert('RGB')
    ornaments = template_header_overlay(classic_original)
    fiche_banner = classic_original.crop((1660, 160, 2260, 250))
    ready_panel = classic_original.crop((1490, 2820, 2480, 3250))
    for slug, recipe in RECIPES.items():
        build(slug, recipe, classic_original, creamy_original, fries_photo, header_bg, ornaments, fiche_banner, ready_panel)
