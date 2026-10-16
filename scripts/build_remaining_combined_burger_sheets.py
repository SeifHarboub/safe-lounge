from pathlib import Path
import colorsys

from PIL import Image, ImageDraw, ImageFilter

from build_biggie_sheet_v2 import (
    ROOT, WORK, W, H, WHITE, OFF_WHITE, INK, PURPLE, YELLOW,
    font, cover, contain, wrap, rounded_paste, draw_step, process_panels,
)
from build_biggie_two_sheets import (
    OUT_DIR, GEN, INGREDIENT_BOARD, SMASH_PROCESS_BOARD,
    CHICKEN_STEP_4, CHICKEN_STEP_5, LETTUCE, PICKLE, PROTEINS,
)


ORANGE = '#ef7b18'
BACON_ONIONS = ROOT / 'research/menu-v3-candidates/ingredient-bacon-boeuf-oignons.png'
CHICKEN_CUTOUTS = {
    'classic': GEN / 'exec-feafd582-b711-4f60-b9df-5944b774f54c.png',
    'original': GEN / 'exec-97acb90b-4dea-4e7f-b5d7-8bcba6fe07eb.png',
    'creamy': GEN / 'exec-95bb6f28-ce90-43bd-aec7-1e2373576c29.png',
    'tasty-bacon': GEN / 'exec-182611c5-bed6-4997-b3b0-c07f6d54d50b.png',
    'frenchy': GEN / 'exec-f4ac3038-4f3a-446b-bb22-025e1f611ee9.png',
}
OPEN_EXTRA = {
    ('tasty-bacon', 'smash'): GEN / 'exec-ae483e86-d5b2-4989-8170-47ee14b56ad0.png',
    ('tasty-bacon', 'chicken'): GEN / 'exec-2fca97a9-f35b-476f-b6ff-5d317bb84ea1.png',
    ('frenchy', 'smash'): GEN / 'exec-3f40305e-6bc3-4a84-aceb-7998d42499ce.png',
    ('frenchy', 'chicken'): GEN / 'exec-97cdccb0-415f-4fe3-aadb-99938f004e67.png',
}
FRENCHY_PROTEIN = {
    'smash': GEN / 'exec-8ecda5e8-410a-478a-b5f4-fb2a8c24cd05.png',
    'chicken': GEN / 'exec-fa88c90d-8927-443d-8480-d6bf4985fdf3.png',
}


RECIPES = {
    'classic': {
        'name': 'CLASSIC', 'sauce': 'Ketchup (bas) + moutarde (haut)',
        'sauce_rgb': (198, 32, 25), 'pickle': True, 'cheese': 'Cheddar x2',
        'common2': 'Mettre le ketchup en bas et la moutarde en haut.',
        'extra': None,
    },
    'original': {
        'name': 'ORIGINAL', 'sauce': 'Sauce Original',
        'sauce_rgb': (226, 132, 67), 'pickle': False, 'cheese': 'Cheddar x2',
        'common2': 'Étaler la sauce Original sur les deux pains.',
        'extra': None,
    },
    'creamy': {
        'name': 'CREAMY', 'sauce': 'Sauce mayonnaise',
        'sauce_rgb': (238, 232, 216), 'pickle': False, 'cheese': 'Cheddar x2',
        'common2': 'Étaler la mayonnaise sur les deux pains.',
        'extra': None,
    },
    'tasty-bacon': {
        'name': 'TASTY BACON', 'sauce': 'Sauce smoked beef',
        'sauce_rgb': (116, 65, 42), 'pickle': False, 'cheese': 'Cheddar x2',
        'common2': 'Étaler la sauce smoked beef sur les deux pains.',
        'extra': 'Ajouter 1 tranche de bacon de bœuf et les oignons caramélisés.',
    },
    'frenchy': {
        'name': 'FRENCHY', 'sauce': 'Sauce barbecue',
        'sauce_rgb': (111, 34, 25), 'pickle': False, 'cheese': 'Raclette x1',
        'common2': 'Étaler la sauce barbecue sur les deux pains.',
        'extra': 'Ajouter 1 tranche de bacon de bœuf et les oignons caramélisés.',
    },
}


def tint_cutout(source, target):
    """Keep highlights and texture while giving an isolated sauce/cheese its recipe colour."""
    im = source.convert('RGBA')
    px = im.load()
    tr, tg, tb = target
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 10:
                continue
            lum = (0.2126*r + 0.7152*g + 0.0722*b) / 255
            strength = 0.56 + 0.72 * lum
            px[x, y] = (min(255, int(tr*strength)), min(255, int(tg*strength)),
                        min(255, int(tb*strength)), a)
    return im


def recolor_sauce(photo, target, classic=False):
    """Recolour only the pale sauce in the approved process photographs."""
    im = photo.convert('RGB').copy()
    pix = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = pix[x, y]
            h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
            # Biggie sauce is light salmon. Bread and steel remain outside this mask.
            if 0.005 <= h <= 0.105 and 0.18 <= s <= 0.58 and v >= 0.53 and r > g * 1.05:
                use = target
                if classic:
                    # Left/bottom bun receives ketchup; right/top bun receives mustard.
                    use = (198, 32, 25) if x < im.width * 0.52 else (224, 178, 21)
                tr, tg, tb = use
                lum = 0.70 + 0.38 * v
                pix[x, y] = (min(255, int(tr*lum)), min(255, int(tg*lum)), min(255, int(tb*lum)))
    return im


def pale_raclette(photo):
    im = photo.convert('RGB').copy()
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y]
            h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
            if 0.08 <= h <= 0.17 and s > 0.55 and v > 0.55:
                shade = 0.82 + 0.18*v
                px[x, y] = (int(246*shade), int(230*shade), int(188*shade))
    return im


def soft_full_photo(source, size, focus=(0.5, 0.5)):
    """Show the whole square dish without borders in a wide process card."""
    bg = cover(source.convert('RGB'), size, focus).filter(ImageFilter.GaussianBlur(22))
    fg = source.convert('RGB').copy()
    fg.thumbnail((size[0], size[1]), Image.Resampling.LANCZOS)
    x, y = (size[0]-fg.width)//2, (size[1]-fg.height)//2
    bg.paste(fg, (x, y))
    return bg


def ingredient_items(slug, cfg):
    board = Image.open(INGREDIENT_BOARD).convert('RGB')
    proteins = Image.open(PROTEINS).convert('RGBA')
    sauce_base = Image.open(GEN / 'exec-a95de673-4c2b-48d5-854a-50d19bd58941.png').convert('RGBA')
    if slug == 'classic':
        ketchup = tint_cutout(sauce_base, (198, 32, 25))
        mustard = tint_cutout(sauce_base, (224, 178, 21))
        duo = Image.new('RGBA', (ketchup.width*2, ketchup.height), (255,255,255,0))
        duo.paste(ketchup, (0,0), ketchup); duo.paste(mustard, (ketchup.width,0), mustard)
        sauce = duo
    else:
        sauce = tint_cutout(sauce_base, cfg['sauce_rgb'])
    cheese = board.crop((865, 110, 1192, 600)).convert('RGBA')
    if slug == 'frenchy':
        cheese = tint_cutout(cheese, (241, 222, 178))
    items = [
        (board.crop((0, 110, 428, 590)), 'Pain potato bun'),
        (sauce, cfg['sauce']),
        (Image.open(LETTUCE).convert('RGBA'), 'Salade iceberg'),
        (cheese, cfg['cheese']),
    ]
    if cfg['pickle']:
        items.append((Image.open(PICKLE).convert('RGB'), '1 tranche longue de cornichon Colona'))
    if cfg['extra']:
        items.append((Image.open(BACON_ONIONS).convert('RGB'), 'Bacon de bœuf x1 + oignons caramélisés'))
    items.extend([
        (proteins.crop((0, 0, 960, 820)), 'SMASH : 2 steaks de 65 g'),
        (proteins.crop((960, 0, 1919, 820)), 'CHICKEN : 1 filet frit'),
    ])
    return items


def draw_header(page, slug, cfg):
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

    smash = Image.open(WORK / f'cutouts/{slug}.png').convert('RGBA')
    smash.thumbnail((650, 485), Image.Resampling.LANCZOS)
    chicken = Image.open(CHICKEN_CUTOUTS[slug]).convert('RGBA')
    chicken.thumbnail((650, 485), Image.Resampling.LANCZOS)
    page.paste(smash, (400 + (650-smash.width)//2, 25 + (485-smash.height)//2), smash)
    page.paste(chicken, (1040 + (650-chicken.width)//2, 25 + (485-chicken.height)//2), chicken)
    draw.rounded_rectangle((540, 520, 900, 585), radius=18, fill=PURPLE)
    draw.text((720, 553), 'SMASH', font=font(34, True), fill=WHITE, anchor='mm')
    draw.rounded_rectangle((1185, 520, 1545, 585), radius=18, fill=ORANGE)
    draw.text((1365, 553), 'CHICKEN', font=font(34, True), fill=WHITE, anchor='mm')

    draw.rounded_rectangle((1810, 65, 2290, 145), radius=18, fill=PURPLE)
    draw.text((2050, 105), 'FICHE RECETTE', font=font(39, True), fill=WHITE, anchor='mm')
    title_size = 75 if len(cfg['name']) > 10 else 94
    draw.text((2050, 250), cfg['name'], font=font(title_size, True), fill=WHITE, anchor='mm')
    draw.rounded_rectangle((1880, 335, 2220, 355), radius=10, fill=YELLOW)
    draw.text((2050, 445), 'SMASH  OU  CHICKEN', font=font(32, True), fill=WHITE, anchor='mm')
    return bg


def draw_ingredients(page, slug, cfg):
    draw = ImageDraw.Draw(page)
    draw.rounded_rectangle((35, 575, 470, 710), radius=26, fill=WHITE)
    draw.text((252, 615), 'INGRÉDIENTS', font=font(45, True), fill=PURPLE, anchor='mm')
    draw.text((252, 667), '(pour 1 burger)', font=font(33, True), fill=INK, anchor='mm')
    draw.rounded_rectangle((35, 705, 2445, 1010), radius=24, fill=WHITE)
    items = ingredient_items(slug, cfg)
    slot_w = 2410 / len(items)
    for i, (source, label) in enumerate(items):
        x0, x1 = round(35+i*slot_w), round(35+(i+1)*slot_w)
        visual = contain(source, (x1-x0-14, 205), WHITE, pad=5)
        page.paste(visual, (x0+7, 716))
        color = PURPLE if label.startswith('SMASH') else ORANGE if label.startswith('CHICKEN') else INK
        used = font(24 if len(label)>28 else 27, True)
        lines = wrap(draw, label, used, x1-x0-16, 3)
        ly = 964 - (len(lines)-1)*14
        for line in lines:
            draw.text(((x0+x1)/2, ly), line, font=used, fill=color, anchor='mm'); ly += 29


def lane_header(page, y, title, color, description):
    draw = ImageDraw.Draw(page)
    draw.rounded_rectangle((45, y, 350, y+62), radius=18, fill=color)
    draw.text((198, y+31), title, font=font(36, True), fill=WHITE, anchor='mm')
    draw.text((385, y+31), description, font=font(29, True), fill=INK, anchor='lm')
    draw.line((980, y+31, 2435, y+31), fill='#d8d0dd', width=4)


def final_card_photo(slug, variant):
    # Wide scene like the Biggie step 6 (see build_step6_wide_finals.py), stretched across the card.
    return Image.open(WORK / f'step6-wide/{slug}-{variant}.png').convert('RGB')


def build_one(slug, cfg):
    page = Image.new('RGB', (W, H), OFF_WHITE)
    bg = draw_header(page, slug, cfg)
    draw_ingredients(page, slug, cfg)
    draw = ImageDraw.Draw(page)
    draw.text((55, 1055), 'ÉTAPES COMMUNES', font=font(46, True), fill=PURPLE)
    draw.line((470, 1080, 2430, 1080), fill='#d8d0dd', width=4)

    base = process_panels(Image.open(SMASH_PROCESS_BOARD).convert('RGB'))
    classic = slug == 'classic'
    common = [base[0], recolor_sauce(base[1], cfg['sauce_rgb'], classic), recolor_sauce(base[2], cfg['sauce_rgb'], classic)]
    common_steps = ['Beurrer puis toaster les deux pains.', cfg['common2'], 'Ajouter une couche légère de salade iceberg.']
    margin, gap = 45, 28
    card_w = (W-2*margin-2*gap)//3
    for i, (txt, photo) in enumerate(zip(common_steps, common)):
        x0 = margin+i*(card_w+gap)
        draw_step(page, (x0,1105,x0+card_w,1640), i+1, txt, photo, (0.5,0.67))

    extra = cfg['extra'] is not None
    smash4 = Image.open(FRENCHY_PROTEIN['smash']).convert('RGB') if slug == 'frenchy' else base[3]
    smash5 = recolor_sauce(base[4], cfg['sauce_rgb'], classic)
    if extra:
        smash5 = Image.open(OPEN_EXTRA[(slug, 'smash')]).convert('RGB')
        smash_protein_text = ('Cuire 2 smash de 65 g. Poser 1 raclette sur un steak.' if slug == 'frenchy'
                              else 'Cuire 2 smash de 65 g. Poser 1 cheddar sur chaque steak.')
        smash_steps = [
            (smash_protein_text, smash4),
            (cfg['extra'], smash5),
            ('Refermer et servir avec 200 g de frites.', final_card_photo(slug,'smash')),
        ]
    else:
        close = 'Ajouter 1 cornichon, refermer et servir avec 200 g de frites.' if cfg['pickle'] else 'Refermer et servir avec 200 g de frites.'
        smash_steps = [
            ('Cuire 2 smash de 65 g. Poser 1 cheddar sur chaque steak.', smash4),
            ('Empiler les 2 smash au fromage sur la salade.', smash5),
            (close, final_card_photo(slug,'smash')),
        ]
    lane_header(page, 1665, 'SMASH', PURPLE, 'Suivre uniquement cette ligne pour la version steak.')
    for i,(txt,photo) in enumerate(smash_steps):
        x0=margin+i*(card_w+gap); draw_step(page,(x0,1740,x0+card_w,2255),i+4,txt,photo,(0.5,0.60))

    chicken4 = Image.open(CHICKEN_STEP_4).convert('RGB')
    chicken5 = Image.open(CHICKEN_STEP_5).convert('RGB')
    if slug == 'frenchy': chicken5 = Image.open(FRENCHY_PROTEIN['chicken']).convert('RGB')
    if extra:
        chicken_protein_text = ('Déposer 1 filet de poulet frit et poser 1 raclette dessus.' if slug == 'frenchy'
                                else 'Déposer 1 filet de poulet frit et poser 2 cheddars dessus.')
        chicken_steps = [
            (chicken_protein_text, chicken5),
            (cfg['extra'], Image.open(OPEN_EXTRA[(slug, 'chicken')]).convert('RGB')),
            ('Refermer et servir avec 200 g de frites.', final_card_photo(slug,'chicken')),
        ]
    else:
        close = 'Ajouter 1 cornichon, refermer et servir avec 200 g de frites.' if cfg['pickle'] else 'Refermer et servir avec 200 g de frites.'
        chicken_steps = [
            ('Déposer 1 filet de poulet frit sur la salade.', chicken4),
            ('Poser 2 cheddars sur le poulet et laisser fondre.', chicken5),
            (close, final_card_photo(slug,'chicken')),
        ]
    lane_header(page, 2285, 'CHICKEN', ORANGE, 'Suivre uniquement cette ligne pour la version poulet.')
    for i,(txt,photo) in enumerate(chicken_steps):
        x0=margin+i*(card_w+gap); draw_step(page,(x0,2360,x0+card_w,2875),i+4,txt,photo,(0.5,0.60))

    footer_y=2915
    page.paste(cover(bg,(W,H-footer_y),(0.5,0.85)),(0,footer_y))
    draw=ImageDraw.Draw(page)
    draw.text((W/2,footer_y+95),'QUALITÉ   •   RAPIDITÉ   •   PLAISIR   •   TOUJOURS',font=font(43,True),fill=WHITE,anchor='mm')
    logo=Image.open(WORK/'assets/logo-cream.png').convert('RGBA'); logo.thumbnail((280,185),Image.Resampling.LANCZOS)
    page.paste(logo,((W-logo.width)//2,footer_y+155),logo)

    out = OUT_DIR / f"SAFE_LOUNGE_{cfg['name'].replace(' ','_')}_PROCESS_A4.pdf"
    preview = WORK / 'previews' / f"SAFE_LOUNGE_{cfg['name'].replace(' ','_')}_COMBINED.png"
    preview.parent.mkdir(parents=True, exist_ok=True); OUT_DIR.mkdir(parents=True, exist_ok=True)
    page.save(preview, quality=96); page.save(out, 'PDF', resolution=300.0, quality=95)
    print(preview); print(out)


if __name__ == '__main__':
    for slug,cfg in RECIPES.items(): build_one(slug,cfg)
