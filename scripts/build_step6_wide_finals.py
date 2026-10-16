"""Wide step-6 photos for the non-Biggie sheets.

The Biggie step 6 uses a wide scene (counter, bokeh, fries bowl). The other
recipes only had square menu photos, so their step 6 was squeezed into a blurred
frame. Here we reuse the Biggie wide scenes and swap the Biggie burger for the
recipe cutout, same position and scale, so every sheet shares the same step 6.
"""
from PIL import Image, ImageFilter

from build_biggie_sheet_v2 import WORK
from build_biggie_two_sheets import SMASH_FINAL, CHICKEN_FINAL
from build_remaining_combined_burger_sheets import CHICKEN_CUTOUTS, RECIPES

OUT = WORK / 'step6-wide'

# Biggie burger bounding box in each scene (x0, y0, x1, y1), measured on the source.
SCENES = {
    'smash': (SMASH_FINAL, (405, 168, 1000, 665)),
    'chicken': (CHICKEN_FINAL, (270, 198, 910, 728)),
}
# Slightly wider than the Biggie so none of it shows behind the new burger.
COVER = {'smash': 1.10, 'chicken': 1.14}


def cutout_for(slug, variant):
    path = WORK / f'cutouts/{slug}.png' if variant == 'smash' else CHICKEN_CUTOUTS[slug]
    im = Image.open(path).convert('RGBA')
    # Bounding box on opaque pixels only: faint alpha would leave the Biggie bun visible below.
    return im.crop(im.getchannel('A').point(lambda a: 255 if a > 160 else 0).getbbox())


def compose(slug, variant):
    scene_path, (x0, y0, x1, y1) = SCENES[variant]
    scene = Image.open(scene_path).convert('RGB')
    burger = cutout_for(slug, variant)
    target_w = round((x1 - x0) * COVER[variant])
    target_h = round(burger.height * target_w / burger.width)
    burger = burger.resize((target_w, target_h), Image.Resampling.LANCZOS)
    bx = round((x0 + x1) / 2 - target_w / 2)
    by = y1 + 4 - target_h

    # Soft contact shadow so the burger sits on the counter like the Biggie.
    shadow = Image.new('L', scene.size, 0)
    alpha = burger.getchannel('A').point(lambda a: 150 if a > 40 else 0)
    shadow.paste(alpha, (bx, by + 10))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    scene.paste((0, 0, 0), (0, 0), shadow)
    scene.paste(burger, (bx, by), burger)
    return scene


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    for slug in RECIPES:
        for variant in SCENES:
            path = OUT / f'{slug}-{variant}.png'
            compose(slug, variant).save(path)
            print(path)


if __name__ == '__main__':
    build()
