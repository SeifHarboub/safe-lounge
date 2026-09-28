import { expect, test } from '@playwright/test';

const categoryLabels = [
  'Burger', 'Panuozzo', 'Pizzas', 'Pâtes', 'Tiramisu',
  'Mocktail', 'Milkshake', 'Iced Latte', 'Frappuccino',
];

test('la nouvelle carte affiche les neuf catégories dans le bon ordre', async ({ page }) => {
  await page.goto('/#carte');
  const tabs = page.locator('#categories > button');
  await expect(tabs).toHaveCount(categoryLabels.length);
  for (let index = 0; index < categoryLabels.length; index += 1) {
    await expect(tabs.nth(index).locator('span').first()).toHaveText(categoryLabels[index]);
  }
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
});

test('le BBQ Raclette reprend la recette du PDF sans prix inventé', async ({ page }) => {
  await page.goto('/#carte');
  const card = page.locator('.dish-card[data-open="burger-bbq-raclette"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('BBQ’ Raclette');
  await expect(card).toContainText('poulet frit croustillant');
  await expect(card).toContainText('une tranche de raclette');
  await expect(card).toContainText('200 g de frites');
  await expect(card.locator('img')).toHaveAttribute('src', /menu-v2\/burger-bbq-raclette\.webp$/);
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('le Chicken Biggie reprend sa sauce et son double cheddar', async ({ page }) => {
  await page.goto('/#carte');
  const card = page.locator('.dish-card[data-open="burger-chicken-biggie"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Chicken Biggie');
  await expect(card).toContainText('sauce classic burger sur les deux pains');
  await expect(card).toContainText('deux tranches de cheddar fondu');
  await expect(card).toContainText('200 g de frites');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('le Chicken Creamy affiche la mayonnaise sur les deux pains', async ({ page }) => {
  await page.goto('/#carte');
  const card = page.locator('.dish-card[data-open="burger-chicken-creamy"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Chicken Creamy');
  await expect(card).toContainText('sauce mayonnaise sur les deux pains');
  await expect(card).toContainText('deux tranches de cheddar fondu');
  await expect(card).toContainText('200 g de frites');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('le Smokey Bacon respecte le bacon de bœuf et la sauce dédiée', async ({ page }) => {
  await page.goto('/#carte');
  const card = page.locator('.dish-card[data-open="burger-smokey-bacon"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Smokey Bacon');
  await expect(card).toContainText('Smokey Baconnaise sur les deux pains');
  await expect(card).toContainText('deux tranches de cheddar fondu');
  await expect(card).toContainText('une tranche de bacon de bœuf snackée');
  await expect(card).toContainText('200 g de frites');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('le Classic Smash contient bien deux steaks et les deux sauces séparées', async ({ page }) => {
  await page.goto('/#carte');
  const card = page.locator('.dish-card[data-open="burger-classic-smash"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Classic Smash');
  await expect(card).toContainText('ketchup sur le pain inférieur');
  await expect(card).toContainText('deux steaks smash');
  await expect(card).toContainText('deux tranches de cheddar fondu');
  await expect(card).toContainText('moutarde sous le pain supérieur');
  await expect(card).toContainText('200 g de frites');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('le Smokey Beef Bacon reste limité au menu et respecte sa recette', async ({ page }) => {
  await page.goto('/#carte');
  const card = page.locator('.dish-card[data-open="burger-smokey-beef-bacon"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Smokey Beef Bacon');
  await expect(card).toContainText('sauce Smoked Beef sur les deux pains');
  await expect(card).toContainText('deux steaks smash');
  await expect(card).toContainText('deux tranches de cheddar fondu');
  await expect(card).toContainText('une tranche de bacon de bœuf snackée');
  await expect(card).toContainText('200 g de frites');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('l’Original Smash reste limité au menu et sans bacon', async ({ page }) => {
  await page.goto('/#carte');
  const card = page.locator('.dish-card[data-open="burger-original-smash"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Original Smash');
  await expect(card).toContainText('sauce Original Smash sur les deux pains');
  await expect(card).toContainText('deux steaks smash');
  await expect(card).toContainText('deux tranches de cheddar fondu');
  await expect(card).toContainText('200 g de frites');
  await expect(card).not.toContainText('bacon');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('le Biggie Smash reste limité au menu avec sa sauce classic burger', async ({ page }) => {
  await page.goto('/#carte');
  const card = page.locator('.dish-card[data-open="burger-biggie-smash"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Biggie Smash');
  await expect(card).toContainText('sauce classic burger sur les deux pains');
  await expect(card).toContainText('deux steaks smash');
  await expect(card).toContainText('deux tranches de cheddar fondu');
  await expect(card).toContainText('200 g de frites');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('la Spaghetti Sicilienne ouvre la nouvelle catégorie Pâtes', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pates').click();
  const card = page.locator('.dish-card[data-open="pates-spaghetti-sicilienne"]');
  await expect(page.locator('#category-title')).toHaveText('Pâtes');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Spaghetti Sicilienne');
  await expect(card).toContainText('sauce tomate');
  await expect(card).toContainText('thon égoutté');
  await expect(card).toContainText('six olives');
  await expect(card).toContainText('parmesan râpé');
  await expect(card).toContainText('une tomate cerise coupée en deux');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('le Rigatoni Tartufo respecte la truffe et les cinq copeaux', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pates').click();
  const card = page.locator('.dish-card[data-open="pates-rigatoni-tartufo"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Rigatoni Tartufo');
  await expect(card).toContainText('champignons émincés');
  await expect(card).toContainText('une cuillère à soupe de truffe');
  await expect(card).toContainText('Cinq copeaux de parmesan');
  await expect(card).toContainText('une tomate cerise coupée en deux');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('les Spaghetti Merguez respectent la sauce crémeuse et les six olives', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pates').click();
  const card = page.locator('.dish-card[data-open="pates-spaghetti-merguez"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Spaghetti Merguez');
  await expect(card).toContainText('merguez en morceaux');
  await expect(card).toContainText('six olives');
  await expect(card).toContainText('une louche de sauce tomate');
  await expect(card).toContainText('crème liquide');
  await expect(card).toContainText('une tomate cerise coupée en deux');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('les Spaghetti Formaggi suivent les deux fromages détaillés par la fiche', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pates').click();
  const card = page.locator('.dish-card[data-open="pates-spaghetti-formaggi"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Spaghetti Formaggi');
  await expect(card).toContainText('crème liquide et au gorgonzola');
  await expect(card).toContainText('Cinq copeaux de parmesan');
  await expect(card).toContainText('une tomate cerise coupée en deux');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('les Penne Arrabiata restent fidèles à la recette sans fromage', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pates').click();
  const card = page.locator('.dish-card[data-open="pates-penne-arrabiata"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Penne Arrabiata');
  await expect(card).toContainText('sauce tomate relevée à l’huile piquante');
  await expect(card).toContainText('sel et de poivre');
  await expect(card).toContainText('une tomate cerise coupée en deux');
  await expect(card).not.toContainText('parmesan');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('les Penne Forestière respectent le poulet et le fond de veau', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pates').click();
  const card = page.locator('.dish-card[data-open="pates-penne-forestiere"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Penne Forestière');
  await expect(card).toContainText('champignons émincés');
  await expect(card).toContainText('poulet en morceaux');
  await expect(card).toContainText('crème et au parmesan');
  await expect(card).toContainText('une cuillère à café de fond de veau');
  await expect(card).toContainText('une tomate cerise coupée en deux');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('les Penne Saumon respectent la sauce rosée et le saumon émietté', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pates').click();
  const card = page.locator('.dish-card[data-open="pates-penne-saumon"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Penne Saumon');
  await expect(card).toContainText('sauce tomate à la crème et au parmesan');
  await expect(card).toContainText('saumon émietté ajouté en fin de cuisson');
  await expect(card).toContainText('une tomate cerise coupée en deux');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('la Bollywood Style respecte les ingrédients avant et après cuisson', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pizzas').click();
  await expect(page.locator('#category-title')).toHaveText('Pizzas');
  const card = page.locator('.dish-card[data-open="pizzas-bollywood-style"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Bollywood Style');
  await expect(card).toContainText('sauce curry');
  await expect(card).toContainText('mozzarella râpée');
  await expect(card).toContainText('poulet émincé');
  await expect(card).toContainText('crème liquide');
  await expect(card).toContainText('oignons confits');
  await expect(card).toContainText('tomates cerises coupées en deux');
  await expect(card).toContainText('sauce basilic');
  await expect(card).toContainText('crème balsamique');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('la Burratella Lov respecte les garnitures ajoutées après cuisson', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pizzas').click();
  const card = page.locator('.dish-card[data-open="pizzas-burratella-lov"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Burratella Lov’');
  await expect(card).toContainText('sauce tomate et mozzarella râpée');
  await expect(card).toContainText('stracciatella');
  await expect(card).toContainText('jambon cru');
  await expect(card).toContainText('copeaux de parmesan');
  await expect(card).toContainText('tomates cerises coupées en deux');
  await expect(card).toContainText('sauce basilic');
  await expect(card).toContainText('crème balsamique');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('la Classica Queen reste fidèle à sa recette simple', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pizzas').click();
  const card = page.locator('.dish-card[data-open="pizzas-classica-queen"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Classica Queen');
  await expect(card).toContainText('sauce tomate et mozzarella râpée');
  await expect(card).toContainText('champignons émincés');
  await expect(card).toContainText('Après cuisson : jambon');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('la Malaga affiche la merguez et son œuf central', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pizzas').click();
  const card = page.locator('.dish-card[data-open="pizzas-malaga"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Malaga');
  await expect(card).toContainText('rondelles de merguez et un œuf');
  await expect(card).toContainText('Après cuisson : jambon cru et sauce basilic');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('la Marmithon respecte le thon, les olives et les finitions', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pizzas').click();
  const card = page.locator('.dish-card[data-open="pizzas-marmithon"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Marmithon');
  await expect(card).toContainText('thon égoutté et des olives');
  await expect(card).toContainText('Après cuisson : sauce basilic et oignons confits');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('la Paysanne suit sa base blanche sans sauce tomate ajoutée', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pizzas').click();
  const card = page.locator('.dish-card[data-open="pizzas-paysanne"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Paysanne');
  await expect(card).toContainText('mozzarella râpée');
  await expect(card).toContainText('lardons émincés');
  await expect(card).toContainText('pommes de terre précuites en rondelles');
  await expect(card).toContainText('crème liquide');
  await expect(card).toContainText('Après cuisson : oignons confits et sauce persillade');
  await expect(card).not.toContainText('sauce tomate');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('la Pizz’Arabia respecte ses poivrons et sa finition aux oignons', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pizzas').click();
  const card = page.locator('.dish-card[data-open="pizzas-pizz-arabia"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Pizz’Arabia');
  await expect(card).toContainText('rondelles de merguez');
  await expect(card).toContainText('poivrons rouges et verts émincés');
  await expect(card).toContainText('un œuf');
  await expect(card).toContainText('Après cuisson : oignons confits');
  await expect(card).not.toContainText('sauce basilic');
  await expect(card.locator('.dish-title > span')).toHaveCount(0);
});

test('la fiche du burger fonctionne sur mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#carte');
  await page.locator('.dish-card[data-open="burger-bbq-raclette"]').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('BBQ’ Raclette');
  await expect(dialog).toContainText('Servi avec 200 g de frites.');
  await expect(dialog.locator('.dialog-price')).toHaveCount(0);
});

test('une catégorie en attente ne conserve aucun ancien plat', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-panuozzo').click();
  await expect(page.locator('#category-title')).toHaveText('Panuozzos');
  await expect(page.locator('#dish-grid')).toContainText('Cette catégorie arrive bientôt.');
  await expect(page.locator('.dish-card')).toHaveCount(0);
});

test('l’accueil présente les plats en relief, nom au-dessus et sans sélecteur', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#arrival-video')).toHaveCount(0);
  await expect(page.locator('#assiettes')).toHaveCount(0);
  await expect(page.locator('[data-dish3d], .dish3d-dots')).toHaveCount(0);
  const caption = page.locator('.dish3d-caption');
  await expect(caption).toContainText('Smokey Beef Bacon');
  await expect(page.locator('.dish3d-still')).toHaveAttribute('src', /hero-3d\/burger-smokey-beef-bacon\.webp$/);
  const captionBox = (await caption.boundingBox())!;
  const stageBox = (await page.locator('.dish3d-stage').boundingBox())!;
  expect(captionBox.y + captionBox.height).toBeLessThanOrEqual(stageBox.y + 1);
  await caption.click();
  await expect(page.getByRole('dialog')).toContainText('Smokey Beef Bacon');
});

test('les plats en relief se succèdent seuls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('.dish3d-timer').dispatchEvent('animationiteration');
  await expect(page.locator('.dish3d-caption')).toContainText('Burratella Lov’');
  await page.locator('.dish3d-timer').dispatchEvent('animationiteration');
  await expect(page.locator('.dish3d-caption')).toContainText('Penne Forestière');
});

test('la page expose un référencement local complet', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Noisy-le-Sec/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Noisy-le-Sec/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\//);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.jpg$/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toContainText('Noisy-le-Sec');
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? '{}');
  expect(data['@type']).toBe('Restaurant');
  expect(data.address.postalCode).toBe('93130');
  const items = data.hasMenu.hasMenuSection.flatMap((section: { hasMenuItem: unknown[] }) => section.hasMenuItem);
  expect(items).toHaveLength(22);
  const missingAlt = await page.locator('img:not([alt])').count();
  expect(missingAlt).toBe(0);
});

test('le lounge met en avant la Wookah en bois et sa chauffe Quasar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#lieu')).toHaveCount(0);
  await expect(page.locator('a[href="#lieu"]')).toHaveCount(0);
  const lounge = page.locator('#lounge');
  await expect(lounge.locator('.lounge-specs')).toContainText('Wookah en bois');
  await expect(lounge.locator('.lounge-specs')).toContainText('Quasar');
  await expect(lounge.locator('.lounge-picture img')).toHaveAttribute('src', /lounge\/wookah-quasar\.webp$/);
  await expect(lounge.locator('.lounge-tile img')).toHaveCount(2);
  await expect(lounge.locator('.lounge-formula')).toHaveCount(2);
});
