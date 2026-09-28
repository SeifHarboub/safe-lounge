# Plats en relief de l’accueil

Chaque plat part de sa photo de carte (`research/menu-v2-originals/`).

```sh
swiftc -O cutout.swift -o cutout            # détourage Vision de macOS, pixels d’origine conservés
./cutout photo.png dish-cut.png
python depth.py photo.png dish-cut.png dish-depth.png
# Recadrer les deux images sur le plat (même boîte), puis :
cwebp -q 92 -alpha_q 100 -exact dish-cut.png -o public/assets/hero-3d/<id>.webp
cwebp -q 85 dish-depth.png -o public/assets/hero-3d/<id>-depth.webp
```

`magick dish-cut.png -alpha extract -threshold 3% -format '%@' info:` donne la boîte du plat ;
la couleur et la profondeur doivent être recadrées avec la même boîte, plus 24 px de marge.
