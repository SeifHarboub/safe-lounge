from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/Users/seifharboub/Desktop/Divers/Safe/Burger/NOUVELLE_CARTE_6_BURGERS/SAFE_LOUNGE_BIGGIE_PROCESS_A4.pdf')
PREVIEW = ROOT / 'research/burger-template-rebuild/previews/SAFE_LOUNGE_BIGGIE_PROCESS_A4_V2.png'
WORK = ROOT / 'research/burger-template-rebuild'
GEN = Path('/Users/seifharboub/.codex/generated_images/01a0b5aa-71ea-7801-8d97-e06e6bd977f0')
INGREDIENT_BOARD = GEN / 'exec-d62048ca-60c4-4bcc-ad2b-1ce2f4ea391b.png'
PROCESS_BOARD = GEN / 'exec-73806151-8bd6-4cde-a206-71cc1b5643df.png'
FINAL_SCENE = GEN / 'exec-ddff3ebd-2453-4423-b38f-ab8f952fa575.png'
SAUCE_CUTOUT = GEN / 'exec-a95de673-4c2b-48d5-854a-50d19bd58941.png'
CLOSING_STEP = GEN / 'exec-04c19e28-db07-4fbd-84f6-fec71511e058.png'

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


def cover(image, size, focus=(0.5, 0.5)):
    tw, th = size
    scale = max(tw / image.width, th / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    x = round((resized.width - tw) * focus[0])
    y = round((resized.height - th) * focus[1])
    return resized.crop((x, y, x + tw, y + th))


def contain(image, size, background=WHITE, pad=0):
    canvas = Image.new('RGB', size, background)
    visual = image.convert('RGBA')
    visual.thumbnail((size[0] - 2 * pad, size[1] - 2 * pad), Image.Resampling.LANCZOS)
    x = (size[0] - visual.width) // 2
    y = (size[1] - visual.height) // 2
    canvas.paste(visual, (x, y), visual)
    return canvas


def rounded_paste(page, image, box, radius=24):
    x0, y0, x1, y1 = box
    image = image.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS).convert('RGBA')
    mask = Image.new('L', image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, image.width - 1, image.height - 1), radius=radius, fill=255)
    image.putalpha(mask)
    page.paste(image, (x0, y0), image)


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


def draw_step(page, box, number, text, photo, focus=(0.5, 0.66)):
    x0, y0, x1, y1 = box
    draw = ImageDraw.Draw(page)
    draw.rounded_rectangle(box, radius=28, fill=WHITE, outline=LINE, width=3)
    title_h = 150
    circle = (x0 + 76, y0 + 74)
    draw.ellipse((circle[0] - 55, circle[1] - 55, circle[0] + 55, circle[1] + 55), fill=PURPLE)
    draw.text(circle, str(number), font=font(63, True), fill=WHITE, anchor='mm')
    used = font(37 if len(text) < 66 else 33, True)
    lines = wrap(draw, text, used, x1 - x0 - 174, 3)
    ty = y0 + 23
    for line in lines:
        draw.text((x0 + 151, ty), line, font=used, fill=INK)
        ty += used.size + 2

    visual_box = (x0 + 12, y0 + title_h, x1 - 12, y1 - 12)
    vw, vh = visual_box[2] - visual_box[0], visual_box[3] - visual_box[1]
    # Fill the complete photo area. Only unused kitchen background is removed;
    # the food remains entirely within the safe central region.
    panel = cover(photo, (vw, vh), focus)
    rounded_paste(page, panel, visual_box, radius=20)


def process_panels(board):
    # Exact cell bounds from the generated contact sheet. The white gutters are
    # excluded, while every photographed object remains inside its own cell.
    xs = [(0, 506), (516, 1021), (1031, 1536)]
    ys = [(0, 505), (516, 1024)]
    return [board.crop((x0, y0, x1, y1)) for y0, y1 in ys for x0, x1 in xs]


def build():
    page = Image.new('RGB', (W, H), OFF_WHITE)
    draw = ImageDraw.Draw(page)

    bg = Image.open(WORK / 'title-background-clean.png').convert('RGB')
    page.paste(cover(bg, (W, 700), (0.52, 0.45)), (0, 0))
    shade = Image.new('RGBA', (W, 700), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    sd.rectangle((0, 0, 470, 700), fill=(0, 18, 11, 112))
    sd.rectangle((1690, 0, W, 700), fill=(0, 14, 8, 130))
    shade = shade.filter(ImageFilter.GaussianBlur(20))
    page.paste(shade, (0, 0), shade)

    logo = Image.open(WORK / 'assets/logo-cream.png').convert('RGBA')
    logo.thumbnail((365, 255), Image.Resampling.LANCZOS)
    page.paste(logo, (68, 45), logo)
    draw.rounded_rectangle((83, 384, 405, 505), radius=18, outline='#bc00ff', width=4)
    draw.text((244, 420), 'GOOD FOOD', font=font(43, True), fill='#bc00ff', anchor='mm')
    draw.text((244, 468), 'GOOD MOOD', font=font(43, True), fill=WHITE, anchor='mm')

    burger = Image.open(WORK / 'cutouts/biggie.png').convert('RGBA')
    burger.thumbnail((1120, 645), Image.Resampling.LANCZOS)
    page.paste(burger, (420 + (1120 - burger.width) // 2, 20 + (650 - burger.height) // 2), burger)

    draw.rounded_rectangle((1715, 72, 2265, 154), radius=18, fill=PURPLE)
    draw.text((1990, 113), 'FICHE RECETTE', font=font(42, True), fill=WHITE, anchor='mm')
    draw.text((1990, 235), 'BURGER AU CHOIX', font=font(34), fill=WHITE, anchor='mm')
    draw.text((1990, 352), 'BIGGIE', font=font(98, True), fill=WHITE, anchor='mm')
    draw.rounded_rectangle((1815, 435, 2165, 455), radius=10, fill=YELLOW)
    draw.text((1990, 535), 'PLUS GROS. PLUS GOURMAND.', font=font(28, True), fill=WHITE, anchor='mm')

    # One continuous ingredient photograph avoids the pasted-card effect.
    draw.rounded_rectangle((35, 652, 470, 790), radius=26, fill=WHITE)
    draw.text((252, 693), 'INGRÉDIENTS', font=font(47, True), fill=PURPLE, anchor='mm')
    draw.text((252, 746), '(pour 1 burger)', font=font(34, True), fill=INK, anchor='mm')
    ingredient = Image.open(INGREDIENT_BOARD).convert('RGB')
    ingredient_panel = Image.new('RGB', (2410, 260), WHITE)
    # Each object comes from the same seamless studio photograph. Cropping the
    # surrounding white space lets every ingredient fill its column without
    # introducing visible rectangles or mixing different backgrounds.
    ingredient_crops = [
        (0, 110, 428, 590),
        (440, 105, 855, 600),
        (865, 110, 1192, 600),
        (1230, 90, 1538, 610),
        (1548, 142, 1915, 575),
        (1940, 90, 2172, 595),
    ]
    slot_w = 2410 // 6
    for i, crop_box in enumerate(ingredient_crops):
        item = Image.open(SAUCE_CUTOUT).convert('RGBA') if i == 5 else ingredient.crop(crop_box)
        item = contain(item, (slot_w - 22, 205), WHITE, pad=2)
        ingredient_panel.paste(item, (i * slot_w + 11, 2))
    rounded_paste(page, ingredient_panel, (35, 785, 2445, 1045), radius=24)

    labels = [
        'Pain potato bun', '2 smash ou poulet frit', 'Cheddar x2',
        'Salade iceberg', '1 tranche de cornichon Colona', 'Sauce Biggie'
    ]
    for i, label in enumerate(labels):
        cx = 35 + (i + 0.5) * (2410 / 6)
        used = font(30, True)
        lines = wrap(draw, label, used, 360, 2)
        ly = 997 - (len(lines) - 1) * 16
        for line in lines:
            draw.text((cx, ly), line, font=used, fill=INK, anchor='mm')
            ly += 34

    draw.text((55, 1090), 'PROCESS', font=font(48, True), fill=PURPLE)
    draw.rounded_rectangle((355, 1071, 2385, 1135), radius=25, fill='#eee8f2')
    draw.text((1370, 1103), 'OPTION CHICKEN : remplacer les 2 smash par 1 filet de poulet frit gourmand et conserver les 2 cheddars.',
              font=font(31, True), fill=GREEN, anchor='mm')

    board = Image.open(PROCESS_BOARD).convert('RGB')
    photos = process_panels(board)
    photos[5] = Image.open(CLOSING_STEP).convert('RGB')
    steps = [
        'Beurrer puis toaster les deux pains.',
        'Étaler la sauce Biggie sur les deux pains.',
        'Ajouter une couche légère de salade iceberg.',
        'Cuire 2 smash de 65 g. Poser 1 tranche de cheddar sur chaque steak et laisser fondre.',
        'Empiler les 2 smash au cheddar sur la salade.',
        'Ajouter 1 longue tranche de cornichon Colona puis refermer.',
    ]
    margin, gap = 45, 28
    card_w = (W - 2 * margin - 2 * gap) // 3
    card_h = 610
    top = 1165
    for i, (text, photo) in enumerate(zip(steps, photos)):
        row, col = divmod(i, 3)
        x0 = margin + col * (card_w + gap)
        y0 = top + row * (card_h + gap)
        focus = (0.5, 0.67) if i < 5 else (0.5, 0.54)
        draw_step(page, (x0, y0, x0 + card_w, y0 + card_h), i + 1, text, photo, focus)

    # Step 7 uses exactly the same compact card format as the other steps.
    final_y = 2440
    final_scene = Image.open(FINAL_SCENE).convert('RGB')
    final_x = (W - card_w) // 2
    draw_step(page, (final_x, final_y, final_x + card_w, final_y + card_h), 7,
              'Servir immédiatement avec 200 g de frites.', final_scene, (0.5, 0.55))

    # Compact footer, preserving the visual language without stealing process space.
    footer_y = 3090
    footer = cover(bg, (W, H - footer_y), (0.5, 0.85))
    page.paste(footer, (0, footer_y))
    draw = ImageDraw.Draw(page)
    draw.text((W / 2, footer_y + 82), 'QUALITÉ   •   RAPIDITÉ   •   PLAISIR   •   TOUJOURS',
              font=font(43, True), fill=WHITE, anchor='mm')
    draw.text((W / 2, footer_y + 187), 'SAFE LOUNGE  ·  GOOD FOOD  ·  GOOD MOOD',
              font=font(36, True), fill=WHITE, anchor='mm')

    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    page.save(PREVIEW, quality=96)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    page.save(OUT, 'PDF', resolution=300.0, quality=95)
    print(PREVIEW)
    print(OUT)


if __name__ == '__main__':
    build()
