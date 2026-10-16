from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

from build_biggie_sheet_v2 import (
    ROOT, WORK, W, H, WHITE, OFF_WHITE, INK, PURPLE, YELLOW, LINE,
    font, cover, contain, wrap, draw_step, process_panels,
)
from build_biggie_two_sheets import (
    OUT_DIR, GEN, INGREDIENT_BOARD, SMASH_PROCESS_BOARD, SMASH_FINAL,
    CHICKEN_HERO, CHICKEN_FINAL, CHICKEN_STEP_4, CHICKEN_STEP_5,
    LETTUCE, SAUCE, PICKLE, PROTEINS,
)


OUTPUT = OUT_DIR / 'SAFE_LOUNGE_BIGGIE_SMASH_CHICKEN_PROCESS_A4.pdf'
PREVIEW = WORK / 'previews/SAFE_LOUNGE_BIGGIE_SMASH_CHICKEN_PROCESS_A4.png'
ORANGE = '#ef7b18'


def ingredient_items():
    board = Image.open(INGREDIENT_BOARD).convert('RGB')
    proteins = Image.open(PROTEINS).convert('RGBA')
    return [
        (board.crop((0, 110, 428, 590)), 'Pain potato bun'),
        (Image.open(SAUCE).convert('RGBA'), 'Sauce Biggie'),
        (Image.open(LETTUCE).convert('RGBA'), 'Salade iceberg'),
        (Image.open(PICKLE).convert('RGB'), '1 tranche longue de cornichon Colona'),
        (board.crop((865, 110, 1192, 600)), 'Cheddar x2'),
        (proteins.crop((0, 0, 960, 820)), 'SMASH : 2 steaks de 65 g'),
        (proteins.crop((960, 0, 1919, 820)), 'CHICKEN : 1 filet frit'),
    ]


def draw_header(page):
    draw = ImageDraw.Draw(page)
    bg = Image.open(WORK / 'title-background-clean.png').convert('RGB')
    page.paste(cover(bg, (W, 620), (0.52, 0.45)), (0, 0))
    shade = Image.new('RGBA', (W, 620), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    sd.rectangle((0, 0, 430, 620), fill=(0, 18, 11, 112))
    sd.rectangle((1770, 0, W, 620), fill=(0, 14, 8, 135))
    shade = shade.filter(ImageFilter.GaussianBlur(20))
    page.paste(shade, (0, 0), shade)

    logo = Image.open(WORK / 'assets/logo-cream.png').convert('RGBA')
    logo.thumbnail((350, 245), Image.Resampling.LANCZOS)
    page.paste(logo, (55, 45), logo)

    smash = Image.open(WORK / 'cutouts/biggie.png').convert('RGBA')
    smash.thumbnail((650, 485), Image.Resampling.LANCZOS)
    chicken = Image.open(CHICKEN_HERO).convert('RGBA')
    chicken.thumbnail((650, 485), Image.Resampling.LANCZOS)
    page.paste(smash, (400 + (650 - smash.width) // 2, 25 + (485 - smash.height) // 2), smash)
    page.paste(chicken, (1040 + (650 - chicken.width) // 2, 25 + (485 - chicken.height) // 2), chicken)

    draw.rounded_rectangle((540, 520, 900, 585), radius=18, fill=PURPLE)
    draw.text((720, 553), 'SMASH', font=font(34, True), fill=WHITE, anchor='mm')
    draw.rounded_rectangle((1185, 520, 1545, 585), radius=18, fill=ORANGE)
    draw.text((1365, 553), 'CHICKEN', font=font(34, True), fill=WHITE, anchor='mm')

    draw.rounded_rectangle((1810, 65, 2290, 145), radius=18, fill=PURPLE)
    draw.text((2050, 105), 'FICHE RECETTE', font=font(39, True), fill=WHITE, anchor='mm')
    draw.text((2050, 250), 'BIGGIE', font=font(102, True), fill=WHITE, anchor='mm')
    draw.rounded_rectangle((1880, 335, 2220, 355), radius=10, fill=YELLOW)
    draw.text((2050, 445), 'SMASH  OU  CHICKEN', font=font(32, True), fill=WHITE, anchor='mm')
    return bg


def draw_ingredients(page):
    draw = ImageDraw.Draw(page)
    draw.rounded_rectangle((35, 575, 470, 710), radius=26, fill=WHITE)
    draw.text((252, 615), 'INGRÉDIENTS', font=font(45, True), fill=PURPLE, anchor='mm')
    draw.text((252, 667), '(pour 1 burger)', font=font(33, True), fill=INK, anchor='mm')
    draw.rounded_rectangle((35, 705, 2445, 1010), radius=24, fill=WHITE)
    items = ingredient_items()
    slot_w = 2410 / len(items)
    for i, (source, label) in enumerate(items):
        x0 = round(35 + i * slot_w)
        x1 = round(35 + (i + 1) * slot_w)
        visual = contain(source, (x1 - x0 - 18, 210), WHITE, pad=7)
        page.paste(visual, (x0 + 9, 716))
        color = PURPLE if label.startswith('SMASH') else ORANGE if label.startswith('CHICKEN') else INK
        used = font(27, True)
        lines = wrap(draw, label, used, x1 - x0 - 20, 2)
        ly = 965 - (len(lines) - 1) * 15
        for line in lines:
            draw.text(((x0 + x1) / 2, ly), line, font=used, fill=color, anchor='mm')
            ly += 32


def draw_lane_header(page, y, title, color, description):
    draw = ImageDraw.Draw(page)
    draw.rounded_rectangle((45, y, 350, y + 62), radius=18, fill=color)
    draw.text((198, y + 31), title, font=font(36, True), fill=WHITE, anchor='mm')
    draw.text((385, y + 31), description, font=font(29, True), fill=INK, anchor='lm')
    draw.line((980, y + 31, 2435, y + 31), fill='#d8d0dd', width=4)


def build():
    page = Image.new('RGB', (W, H), OFF_WHITE)
    bg = draw_header(page)
    draw_ingredients(page)
    draw = ImageDraw.Draw(page)

    draw.text((55, 1055), 'ÉTAPES COMMUNES', font=font(46, True), fill=PURPLE)
    draw.line((470, 1080, 2430, 1080), fill='#d8d0dd', width=4)

    common = process_panels(Image.open(SMASH_PROCESS_BOARD).convert('RGB'))[:3]
    common_steps = [
        'Beurrer puis toaster les deux pains.',
        'Étaler la sauce Biggie sur les deux pains.',
        'Ajouter une couche légère de salade iceberg.',
    ]
    margin, gap = 45, 28
    card_w = (W - 2 * margin - 2 * gap) // 3
    common_top, common_h = 1105, 535
    for i, (text, photo) in enumerate(zip(common_steps, common)):
        x0 = margin + i * (card_w + gap)
        draw_step(page, (x0, common_top, x0 + card_w, common_top + common_h), i + 1, text, photo, (0.5, 0.67))

    smash = process_panels(Image.open(SMASH_PROCESS_BOARD).convert('RGB'))
    smash_photos = [smash[3], smash[4], Image.open(SMASH_FINAL).convert('RGB')]
    smash_steps = [
        'Cuire 2 smash de 65 g. Poser 1 cheddar sur chaque steak.',
        'Empiler les 2 smash au cheddar sur la salade.',
        'Ajouter 1 cornichon, refermer et servir avec 200 g de frites.',
    ]
    draw_lane_header(page, 1665, 'SMASH', PURPLE, 'Suivre uniquement cette ligne pour la version steak.')
    lane_top, lane_h = 1740, 515
    for i, (text, photo) in enumerate(zip(smash_steps, smash_photos)):
        x0 = margin + i * (card_w + gap)
        draw_step(page, (x0, lane_top, x0 + card_w, lane_top + lane_h), i + 4, text, photo, (0.5, 0.62))

    chicken_photos = [
        Image.open(CHICKEN_STEP_4).convert('RGB'),
        Image.open(CHICKEN_STEP_5).convert('RGB'),
        Image.open(CHICKEN_FINAL).convert('RGB'),
    ]
    chicken_steps = [
        'Déposer 1 filet de poulet frit sur la salade.',
        'Poser 2 cheddars sur le poulet et laisser fondre.',
        'Ajouter 1 cornichon, refermer et servir avec 200 g de frites.',
    ]
    draw_lane_header(page, 2285, 'CHICKEN', ORANGE, 'Suivre uniquement cette ligne pour la version poulet.')
    chicken_top = 2360
    for i, (text, photo) in enumerate(zip(chicken_steps, chicken_photos)):
        x0 = margin + i * (card_w + gap)
        draw_step(page, (x0, chicken_top, x0 + card_w, chicken_top + lane_h), i + 4, text, photo, (0.5, 0.60))

    footer_y = 2915
    page.paste(cover(bg, (W, H - footer_y), (0.5, 0.85)), (0, footer_y))
    draw = ImageDraw.Draw(page)
    draw.text((W / 2, footer_y + 95), 'QUALITÉ   •   RAPIDITÉ   •   PLAISIR   •   TOUJOURS',
              font=font(43, True), fill=WHITE, anchor='mm')
    logo = Image.open(WORK / 'assets/logo-cream.png').convert('RGBA')
    logo.thumbnail((280, 185), Image.Resampling.LANCZOS)
    page.paste(logo, ((W - logo.width) // 2, footer_y + 155), logo)

    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    page.save(PREVIEW, quality=96)
    page.save(OUTPUT, 'PDF', resolution=300.0, quality=95)
    print(PREVIEW)
    print(OUTPUT)


if __name__ == '__main__':
    build()
