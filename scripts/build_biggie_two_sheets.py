from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

from build_biggie_sheet_v2 import (
    ROOT, WORK, W, H, WHITE, OFF_WHITE, INK, GREEN, PURPLE, YELLOW, LINE,
    font, cover, contain, rounded_paste, wrap, draw_step, process_panels,
)


OUT_DIR = Path('/Users/seifharboub/Desktop/Divers/Safe/Burger/NOUVELLE_CARTE_6_BURGERS')
GEN = Path('/Users/seifharboub/.codex/generated_images/01a0b5aa-71ea-7801-8d97-e06e6bd977f0')
INGREDIENT_BOARD = GEN / 'exec-d62048ca-60c4-4bcc-ad2b-1ce2f4ea391b.png'
SMASH_PROCESS_BOARD = GEN / 'exec-73806151-8bd6-4cde-a206-71cc1b5643df.png'
SMASH_CLOSING = GEN / 'exec-04c19e28-db07-4fbd-84f6-fec71511e058.png'
SMASH_FINAL = GEN / 'exec-ddff3ebd-2453-4423-b38f-ab8f952fa575.png'
CHICKEN_HERO = GEN / 'exec-d2dc4b59-58bc-40fd-ae0a-039125799edb.png'
CHICKEN_PROCESS_BOARD = GEN / 'exec-c0038dfd-8fa1-4423-8daa-12d064ee2fd4.png'
CHICKEN_FINAL = GEN / 'exec-f05f03e6-6d64-45b4-913b-898ee626b9ad.png'
CHICKEN_CLOSING = GEN / 'exec-a7832354-7934-44fb-946b-bedf781c4761.png'
CHICKEN_CHEESE = GEN / 'exec-54f7d4e7-a423-434f-99a7-72c1caebe677.png'
PROTEINS = GEN / 'exec-33b38455-819f-4494-bedf-4ac504ebab37.png'
CHICKEN_STEP_4 = GEN / 'exec-a83ce9ad-d3c8-4047-8c64-a778751c0cf6.png'
CHICKEN_STEP_5 = GEN / 'exec-097443fd-3a0a-400c-9c10-0b05aa3d0729.png'
LETTUCE = GEN / 'exec-4e0ffc86-8331-4035-bee7-b585037e607f.png'
SAUCE = GEN / 'exec-a95de673-4c2b-48d5-854a-50d19bd58941.png'
PICKLE = ROOT / 'research/menu-v3-candidates/ingredient-cornichon-colona.png'


def chicken_process_panels():
    board = Image.open(CHICKEN_PROCESS_BOARD).convert('RGB')
    return [
        board.crop((0, 0, 717, 724)),
        board.crop((728, 0, 1444, 724)),
        board.crop((1455, 0, 2172, 724)),
    ]


def ingredient_sources(variant):
    board = Image.open(INGREDIENT_BOARD).convert('RGB')
    proteins = Image.open(PROTEINS).convert('RGBA')
    bun = board.crop((0, 110, 428, 590))
    if variant == 'smash':
        protein = proteins.crop((0, 0, 960, 820))
        protein_label = '2 smash de 65 g'
    else:
        protein = proteins.crop((960, 0, 1919, 820))
        protein_label = '1 filet de poulet frit'
    cheddar = board.crop((865, 110, 1192, 600))
    return [
        (bun, 'Pain potato bun'),
        (protein, protein_label),
        (cheddar, 'Cheddar x2'),
        (Image.open(LETTUCE).convert('RGBA'), 'Salade iceberg'),
        (Image.open(PICKLE).convert('RGB'), '1 tranche longue de cornichon Colona'),
        (Image.open(SAUCE).convert('RGBA'), 'Sauce Biggie'),
    ]


def draw_ingredients(page, variant):
    draw = ImageDraw.Draw(page)
    draw.rounded_rectangle((35, 652, 470, 790), radius=26, fill=WHITE)
    draw.text((252, 693), 'INGRÉDIENTS', font=font(47, True), fill=PURPLE, anchor='mm')
    draw.text((252, 746), '(pour 1 burger)', font=font(34, True), fill=INK, anchor='mm')
    draw.rounded_rectangle((35, 785, 2445, 1045), radius=24, fill=WHITE)

    sources = ingredient_sources(variant)
    slot_w = 2410 // 6
    for i, (source, label) in enumerate(sources):
        x0 = 35 + i * slot_w
        visual = contain(source, (slot_w - 24, 198), WHITE, pad=8)
        page.paste(visual, (x0 + 12, 791))
        used = font(30, True)
        lines = wrap(draw, label, used, 360, 2)
        ly = 997 - (len(lines) - 1) * 16
        for line in lines:
            draw.text((x0 + slot_w / 2, ly), line, font=used, fill=INK, anchor='mm')
            ly += 34


def draw_header(page, variant):
    draw = ImageDraw.Draw(page)
    bg = Image.open(WORK / 'title-background-clean.png').convert('RGB')
    page.paste(cover(bg, (W, 700), (0.52, 0.45)), (0, 0))
    shade = Image.new('RGBA', (W, 700), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    sd.rectangle((0, 0, 470, 700), fill=(0, 18, 11, 112))
    sd.rectangle((1690, 0, W, 700), fill=(0, 14, 8, 130))
    shade = shade.filter(ImageFilter.GaussianBlur(20))
    page.paste(shade, (0, 0), shade)

    # Only the supplied Safe Lounge logo is used; no recreated signature text.
    logo = Image.open(WORK / 'assets/logo-cream.png').convert('RGBA')
    logo.thumbnail((390, 275), Image.Resampling.LANCZOS)
    page.paste(logo, (62, 48), logo)

    if variant == 'smash':
        hero = Image.open(WORK / 'cutouts/biggie.png').convert('RGBA')
        hero.thumbnail((1120, 645), Image.Resampling.LANCZOS)
        variant_text = 'VERSION SMASH'
        tagline = '2 SMASH · 2 CHEDDARS'
    else:
        hero = Image.open(CHICKEN_HERO).convert('RGBA')
        hero.thumbnail((1040, 620), Image.Resampling.LANCZOS)
        variant_text = 'VERSION CHICKEN'
        tagline = '1 FILET FRIT · 2 CHEDDARS'
    page.paste(hero, (440 + (1120 - hero.width) // 2, 25 + (635 - hero.height) // 2), hero)

    draw.rounded_rectangle((1715, 72, 2265, 154), radius=18, fill=PURPLE)
    draw.text((1990, 113), 'FICHE RECETTE', font=font(42, True), fill=WHITE, anchor='mm')
    draw.text((1990, 235), variant_text, font=font(39, True), fill=WHITE, anchor='mm')
    draw.text((1990, 352), 'BIGGIE', font=font(98, True), fill=WHITE, anchor='mm')
    draw.rounded_rectangle((1815, 435, 2165, 455), radius=10, fill=YELLOW)
    draw.text((1990, 535), tagline, font=font(30, True), fill=WHITE, anchor='mm')
    return bg


def variant_process(variant):
    base = process_panels(Image.open(SMASH_PROCESS_BOARD).convert('RGB'))
    if variant == 'smash':
        base[5] = Image.open(SMASH_CLOSING).convert('RGB')
        steps = [
            'Beurrer puis toaster les deux pains.',
            'Étaler la sauce Biggie sur les deux pains.',
            'Ajouter une couche légère de salade iceberg.',
            'Cuire 2 smash de 65 g. Poser 1 cheddar sur chaque steak et laisser fondre.',
            'Empiler les 2 smash au cheddar sur la salade.',
            'Ajouter 1 longue tranche de cornichon Colona puis refermer.',
        ]
        return base, steps, Image.open(SMASH_FINAL).convert('RGB')

    chicken = chicken_process_panels()
    chicken[0] = Image.open(CHICKEN_STEP_4).convert('RGB')
    chicken[1] = Image.open(CHICKEN_STEP_5).convert('RGB')
    chicken[2] = Image.open(CHICKEN_CLOSING).convert('RGB')
    base[3:] = chicken
    steps = [
        'Beurrer puis toaster les deux pains.',
        'Étaler la sauce Biggie sur les deux pains.',
        'Ajouter une couche légère de salade iceberg.',
        'Déposer 1 filet de poulet frit sur la salade.',
        'Poser 2 tranches de cheddar sur le poulet et laisser fondre.',
        'Ajouter 1 longue tranche de cornichon Colona puis refermer.',
    ]
    return base, steps, Image.open(CHICKEN_FINAL).convert('RGB')


def build(variant):
    page = Image.new('RGB', (W, H), OFF_WHITE)
    bg = draw_header(page, variant)
    draw_ingredients(page, variant)
    draw = ImageDraw.Draw(page)
    draw.text((55, 1094), 'PROCESS', font=font(52, True), fill=PURPLE)
    draw.line((350, 1118, 2425, 1118), fill='#d8d0dd', width=4)

    photos, steps, final_scene = variant_process(variant)
    margin, gap = 45, 28
    card_w = (W - 2 * margin - 2 * gap) // 3
    card_h = 610
    top = 1150
    for i, (text, photo) in enumerate(zip(steps, photos)):
        row, col = divmod(i, 3)
        x0 = margin + col * (card_w + gap)
        y0 = top + row * (card_h + gap)
        focus = (0.5, 0.67) if i < 5 else (0.5, 0.55)
        draw_step(page, (x0, y0, x0 + card_w, y0 + card_h), i + 1, text, photo, focus)

    final_y = 2425
    final_x = (W - card_w) // 2
    draw_step(page, (final_x, final_y, final_x + card_w, final_y + card_h), 7,
              'Servir immédiatement avec 200 g de frites.', final_scene, (0.5, 0.55))

    footer_y = 3075
    page.paste(cover(bg, (W, H - footer_y), (0.5, 0.85)), (0, footer_y))
    draw = ImageDraw.Draw(page)
    draw.text((W / 2, footer_y + 90), 'QUALITÉ   •   RAPIDITÉ   •   PLAISIR   •   TOUJOURS',
              font=font(43, True), fill=WHITE, anchor='mm')
    footer_logo = Image.open(WORK / 'assets/logo-cream.png').convert('RGBA')
    footer_logo.thumbnail((260, 170), Image.Resampling.LANCZOS)
    page.paste(footer_logo, ((W - footer_logo.width) // 2, footer_y + 145), footer_logo)

    suffix = 'SMASH' if variant == 'smash' else 'CHICKEN'
    output = OUT_DIR / f'SAFE_LOUNGE_BIGGIE_{suffix}_PROCESS_A4.pdf'
    preview = WORK / 'previews' / f'SAFE_LOUNGE_BIGGIE_{suffix}_PROCESS_A4.png'
    preview.parent.mkdir(parents=True, exist_ok=True)
    page.save(preview, quality=96)
    page.save(output, 'PDF', resolution=300.0, quality=95)
    print(preview)
    print(output)


if __name__ == '__main__':
    build('smash')
    build('chicken')
