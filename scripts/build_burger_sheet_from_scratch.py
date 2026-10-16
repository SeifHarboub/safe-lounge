from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/Users/seifharboub/Desktop/Divers/Safe/Burger')
OUTPUT = SOURCE / 'NOUVELLE_CARTE_6_BURGERS'
WORK = ROOT / 'research/burger-template-rebuild'
W, H = 2480, 3508

WHITE = '#ffffff'
OFF_WHITE = '#f5f3ef'
INK = '#101019'
GREEN = '#003d2f'
PURPLE = '#7800c8'
YELLOW = '#ffd400'
LINE = '#ded9e2'
FONT = '/System/Library/Fonts/Avenir Next Condensed.ttc'


def font(size, heavy=False):
    return ImageFont.truetype(FONT, size, index=8 if heavy else 0)


def render_pdf(path):
    doc = pdfium.PdfDocument(str(path))
    return doc[0].render(scale=300 / 72).to_pil().convert('RGB').resize((W, H))


def cover(image, size, focus=(0.5, 0.5)):
    tw, th = size
    scale = max(tw / image.width, th / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    x = round((resized.width - tw) * focus[0])
    y = round((resized.height - th) * focus[1])
    return resized.crop((x, y, x + tw, y + th))


def contain_rgba(image, size):
    fitted = image.copy().convert('RGBA')
    fitted.thumbnail(size, Image.Resampling.LANCZOS)
    return fitted


def rounded_image(image, size, radius=24, focus=(0.5, 0.5)):
    fitted = cover(image, size, focus)
    mask = Image.new('L', size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    fitted.putalpha(mask)
    return fitted


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


def draw_leaf(draw, x, y, scale=1, mirror=False):
    direction = -1 if mirror else 1
    stems = [
        ((0, 0), (140, -235), 72),
        ((30, -30), (235, -145), 66),
        ((10, -70), (105, -300), 62),
        ((80, -65), (290, -60), 68),
    ]
    for (sx, sy), (ex, ey), width in stems:
        sx, ex = x + direction * sx * scale, x + direction * ex * scale
        sy, ey = y + sy * scale, y + ey * scale
        draw.line((sx, sy, ex, ey), fill=PURPLE, width=max(8, round(22 * scale)))
        dx, dy = ex - sx, ey - sy
        length = max(1, (dx * dx + dy * dy) ** .5)
        nx, ny = -dy / length, dx / length
        w = width * scale
        points = [(ex, ey), (ex - dx * .46 + nx * w, ey - dy * .46 + ny * w),
                  (ex - dx * .58, ey - dy * .58),
                  (ex - dx * .46 - nx * w, ey - dy * .46 - ny * w)]
        draw.polygon(points, fill=PURPLE)


def brand(draw, x, y, dark=False):
    color = INK if dark else WHITE
    draw.text((x, y), '✦', font=font(92, True), fill=color, anchor='ma')
    draw.text((x, y + 82), 'SAFE', font=font(76, True), fill=color, anchor='ma')
    draw.text((x, y + 148), 'LOUNGE', font=font(76, True), fill=color, anchor='ma')
    draw.text((x, y + 212), 'GOOD FOOD  GOOD MOOD', font=font(30), fill=color, anchor='ma')


def place_logo(page, path, box):
    logo = Image.open(path).convert('RGBA')
    logo.thumbnail((box[2] - box[0], box[3] - box[1]), Image.Resampling.LANCZOS)
    x = box[0] + (box[2] - box[0] - logo.width) // 2
    y = box[1] + (box[3] - box[1] - logo.height) // 2
    page.paste(logo, (x, y), logo)


def side_by_side(left, right, size=(520, 220)):
    canvas = Image.new('RGB', size, WHITE)
    for i, source in enumerate((left, right)):
        visual = source.convert('RGBA')
        visual.thumbnail((size[0] // 2 - 20, size[1] - 20), Image.Resampling.LANCZOS)
        x = i * size[0] // 2 + (size[0] // 2 - visual.width) // 2
        canvas.paste(visual, (x, (size[1] - visual.height) // 2), visual if visual.mode == 'RGBA' else None)
    ImageDraw.Draw(canvas).line((size[0] // 2, 25, size[0] // 2, size[1] - 25), fill=LINE, width=2)
    return canvas


def on_white(image, size):
    canvas = Image.new('RGB', size, WHITE)
    visual = image.convert('RGBA')
    visual.thumbnail((size[0] - 30, size[1] - 30), Image.Resampling.LANCZOS)
    canvas.paste(visual, ((size[0] - visual.width) // 2, (size[1] - visual.height) // 2), visual)
    return canvas


def ingredient_visual(source, box):
    return source.crop(box)


def draw_ingredient(page, box, image, label):
    x0, y0, x1, y1 = box
    draw = ImageDraw.Draw(page)
    visual = contain_rgba(image, (x1 - x0 - 30, 185))
    page.paste(visual, (x0 + (x1 - x0 - visual.width) // 2, y0 + 18), visual if visual.mode == 'RGBA' else None)
    used = font(28, True)
    lines = wrap(draw, label, used, x1 - x0 - 30, 2)
    y = y1 - 73 - (len(lines) - 1) * 17
    for line in lines:
        draw.text(((x0 + x1) / 2, y), line, font=used, fill=INK, anchor='ma')
        y += 34


def draw_step(page, box, number, text, image, focus=(0.5, 0.55)):
    x0, y0, x1, y1 = box
    draw = ImageDraw.Draw(page)
    width, height = x1 - x0, y1 - y0
    title_h = 158
    draw.rounded_rectangle(box, radius=28, fill=WHITE, outline='#e9e5e0', width=3)
    image_size = (width - 8, height - title_h - 8)
    # Keep the complete process image visible; the clean background prevents
    # duplicated or cropped ingredients around the edges.
    image_panel = Image.new('RGB', image_size, WHITE)
    panel_mask = Image.new('L', image_size, 0)
    ImageDraw.Draw(panel_mask).rounded_rectangle((0, 0, image_size[0] - 1, image_size[1] - 1), radius=22, fill=255)
    image_panel.putalpha(panel_mask)
    page.paste(image_panel, (x0 + 4, y0 + title_h), image_panel)
    visual = image.convert('RGBA')
    visual.thumbnail((image_size[0] - 18, image_size[1] - 18), Image.Resampling.LANCZOS)
    vx = x0 + 4 + (image_size[0] - visual.width) // 2
    vy = y0 + title_h + (image_size[1] - visual.height) // 2
    page.paste(visual, (vx, vy), visual)
    draw = ImageDraw.Draw(page)
    circle = (x0 + 75, y0 + 75)
    draw.ellipse((circle[0] - 58, circle[1] - 58, circle[0] + 58, circle[1] + 58), fill=PURPLE)
    draw.text(circle, str(number), font=font(68, True), fill=WHITE, anchor='mm')
    used = font(34 if len(text) < 48 else 30, True)
    lines = wrap(draw, text, used, x1 - x0 - 170, 3)
    ty = y0 + 24
    for line in lines:
        draw.text((x0 + 150, ty), line, font=used, fill=INK)
        ty += used.size + 1


def build_classic():
    original = render_pdf(SOURCE / 'SAFE_LOUNGE_CLASSIC_SMASH_200G_FRITES_A4.pdf')
    creamy_original = render_pdf(SOURCE / 'SAFE_LOUNGE_CREAMY_200G_FRITES_A4.pdf')
    header_bg = Image.open(WORK / 'title-background-clean.png').convert('RGB')
    burger = Image.open(WORK / 'cutouts/classic.png').convert('RGBA')

    page = Image.new('RGB', (W, H), OFF_WHITE)
    draw = ImageDraw.Draw(page)

    # Header rebuilt on a blank page.
    page.paste(cover(header_bg, (W, 930), (0.52, 0.5)), (0, 0))
    overlay = Image.new('RGBA', (W, 930), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, 530, 930), fill=(0, 20, 12, 105))
    od.rectangle((1660, 0, W, 930), fill=(0, 16, 10, 115))
    overlay = overlay.filter(ImageFilter.GaussianBlur(18))
    page.paste(overlay, (0, 0), overlay)
    draw = ImageDraw.Draw(page)
    draw.rounded_rectangle((-45, 95, 18, 650), radius=25, fill=PURPLE)
    draw.rounded_rectangle((W - 18, 30, W + 45, 470), radius=25, fill=PURPLE)
    place_logo(page, WORK / 'assets/logo-cream.png', (80, 55, 470, 310))
    draw.text((275, 520), 'Good\nFood\nGood\nMood', font=font(54), fill='#bc00ff', anchor='ma', spacing=-6)

    hero = contain_rgba(burger, (1180, 850))
    page.paste(hero, (440 + (1180 - hero.width) // 2, 35 + (840 - hero.height) // 2), hero)
    draw.rounded_rectangle((1790, 100, 2260, 184), radius=18, fill=PURPLE)
    draw.text((2025, 142), 'FICHE RECETTE', font=font(43, True), fill=WHITE, anchor='mm')
    draw.text((2025, 275), 'BURGER AU CHOIX', font=font(38), fill=WHITE, anchor='mm')
    draw.text((2025, 410), 'CLASSIC', font=font(105, True), fill=WHITE, anchor='mm')
    draw.rounded_rectangle((1835, 520, 2215, 542), radius=11, fill=YELLOW)
    draw.text((2025, 625), 'SIMPLE. EFFICACE. INTEMPOREL.', font=font(28), fill=WHITE, anchor='mm')

    # Ingredients, fully redrawn.
    draw.rounded_rectangle((35, 855, 455, 1008), radius=30, fill=WHITE)
    draw.text((245, 902), 'INGRÉDIENTS', font=font(49, True), fill=PURPLE, anchor='mm')
    draw.text((245, 962), '(pour 1 burger)', font=font(37, True), fill=INK, anchor='mm')
    ingredient_panel = (30, 1000, 2450, 1370)
    draw.rounded_rectangle(ingredient_panel, radius=24, fill=WHITE)
    protein = side_by_side(
        ingredient_visual(original, (465, 1000, 915, 1210)),
        ingredient_visual(creamy_original, (505, 1025, 990, 1190)),
    )
    ingredients = [
        (ingredient_visual(original, (35, 1000, 455, 1210)), 'Pain potato bun moelleux'),
        (protein, 'Smash x2 ou poulet frit'),
        (ingredient_visual(original, (920, 1000, 1285, 1210)), 'Cheddar (2 tranches)'),
        (ingredient_visual(original, (1290, 1000, 1695, 1210)), 'Salade iceberg croquante'),
        (Image.open(ROOT / 'research/menu-v3-candidates/ingredient-cornichon-colona.png').convert('RGBA'), 'Cornichon Colona (1 tranche)'),
        (ingredient_visual(original, (1705, 1000, 2440, 1210)), 'Ketchup bas + moutarde haut'),
    ]
    slot = (ingredient_panel[2] - ingredient_panel[0]) / len(ingredients)
    for i, (visual, label) in enumerate(ingredients):
        x0 = round(ingredient_panel[0] + i * slot)
        x1 = round(ingredient_panel[0] + (i + 1) * slot)
        if i:
            draw.line((x0, 1020, x0, 1350), fill=LINE, width=3)
        draw_ingredient(page, (x0, 1010, x1, 1360), visual, label)

    # Process photos are extracted once, then placed in newly drawn cards.
    photos = {
        1: original.crop((50, 1570, 820, 1925)),
        2: original.crop((855, 1570, 1635, 1925)),
        3: original.crop((1675, 1570, 2435, 1925)),
        4: original.crop((50, 2270, 820, 2600)),
        5: original.crop((855, 2270, 1635, 2600)),
        6: on_white(burger, (900, 620)),
        7: original.crop((350, 2980, 1485, 3250)),
    }
    top_y, card_h, gap = 1410, 650, 28
    card_w = (W - 2 * 45 - 2 * gap) // 3
    steps = [
        (1, 'BEURRER ET TOASTER LE PAIN.', (0.5, 0.65)),
        (2, 'KETCHUP EN BAS, MOUTARDE EN HAUT.', (0.5, 0.62)),
        (3, 'AJOUTER LA SALADE ICEBERG.', (0.5, 0.65)),
        (4, 'DÉPOSER 2 SMASH DE 65 G OU 1 FILET DE POULET FRIT.', (0.5, 0.65)),
        (5, 'AJOUTER LES 2 TRANCHES DE CHEDDAR.', (0.5, 0.65)),
        (6, 'AJOUTER 1 TRANCHE DE CORNICHON PUIS REFERMER.', (0.5, 0.52)),
    ]
    for idx, (number, text, focus) in enumerate(steps):
        row, col = divmod(idx, 3)
        x0 = 45 + col * (card_w + gap)
        y0 = top_y + row * (card_h + gap)
        draw_step(page, (x0, y0, x0 + card_w, y0 + card_h), number, text, photos[number], focus)

    # Final serving band and footer.
    y0 = top_y + 2 * (card_h + gap)
    draw_step(page, (45, y0, 1595, 3220), 7, 'SERVIR AVEC 200 G DE FRITES.', photos[7], (0.5, 0.48))
    draw.rounded_rectangle((1623, y0, 2435, 3220), radius=28, fill=WHITE, outline='#e9e5e0', width=3)
    final = contain_rgba(burger, (620, 300))
    page.paste(final, (1718 + (620 - final.width) // 2, y0 + 18), final)
    draw.text((2030, y0 + 365), 'READY !', font=font(64, True), fill=GREEN, anchor='mm')

    draw.rectangle((0, 3250, W, H), fill=GREEN)
    labels = ['QUALITÉ', 'RAPIDITÉ', 'PLAISIR', 'TOUJOURS']
    for i, label in enumerate(labels):
        x = 430 + i * 540
        draw.ellipse((x - 34, 3338, x + 34, 3406), outline=WHITE, width=4)
        draw.text((x + 140, 3372), label, font=font(33), fill=WHITE, anchor='mm')
        if i < 3:
            draw.line((x + 325, 3318, x + 325, 3428), fill='#5c8278', width=2)

    out_png = WORK / 'previews/CLASSIC_FROM_SCRATCH.png'
    out_pdf = OUTPUT / 'SAFE_LOUNGE_CLASSIC_PROCESS_A4.pdf'
    page.save(out_png, optimize=True)
    page.save(out_pdf, 'PDF', resolution=300, quality=95)
    print(out_png)
    print(out_pdf)


if __name__ == '__main__':
    OUTPUT.mkdir(parents=True, exist_ok=True)
    build_classic()
