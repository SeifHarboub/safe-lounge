import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const menuData: { items: { id: string; price: number | null; allergens: string[] }[] }[] = JSON.parse(readFileSync(new URL('../src/menu.json', import.meta.url), 'utf8'));
const menuDish = (id: string) => menuData.flatMap(category => category.items).find(item => item.id === id)!;

const categoryLabels = [
  'Burgers', 'Panuozzos', 'Pizzas', 'Pâtes', 'Salades', 'Desserts', 'Crêpes',
  'Boissons fraîches', 'Boissons chaudes', 'Mocktails', 'Milkshakes', 'Iced lattes', 'Frappuccinos',
];

test('la nouvelle carte affiche les treize catégories dans le bon ordre', async ({ page }) => {
  await page.goto('/#carte');
  const tabs = page.locator('#categories > button');
  await expect(tabs).toHaveCount(categoryLabels.length);
  for (let index = 0; index < categoryLabels.length; index += 1) {
    await expect(tabs.nth(index).locator('span').first()).toHaveText(categoryLabels[index]);
  }
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
});

// Each dish shows its ingredients as a customer reads them, never the recipe steps.
const dishes: { id: string; tab?: string; name: string; has: string[]; hasNot?: string[] }[] = [
  { id: 'burger-bbq-raclette', name: 'BBQ’ Raclette', has: ['poulet frit croustillant', 'raclette fondue', 'sauce BBQ'] },
  { id: 'burger-chicken-biggie', name: 'Chicken Biggie', has: ['poulet frit croustillant', 'double cheddar fondu', 'sauce classic burger'] },
  { id: 'burger-chicken-creamy', name: 'Chicken Creamy', has: ['poulet frit croustillant', 'double cheddar fondu', 'mayonnaise'] },
  { id: 'burger-smokey-bacon', name: 'Smokey Bacon', has: ['poulet frit croustillant', 'bacon de bœuf snacké', 'sauce Smokey Baconnaise'] },
  { id: 'burger-classic-smash', name: 'Classic Smash', has: ['deux steaks smash', 'double cheddar fondu', 'ketchup', 'moutarde'] },
  { id: 'burger-smokey-beef-bacon', name: 'Smokey Beef Bacon', has: ['deux steaks smash', 'bacon de bœuf snacké', 'sauce Smoked Beef'] },
  { id: 'burger-original-smash', name: 'Original Smash', has: ['deux steaks smash', 'double cheddar fondu', 'sauce Original Smash'], hasNot: ['bacon'] },
  { id: 'burger-biggie-smash', name: 'Biggie Smash', has: ['deux steaks smash', 'double cheddar fondu', 'sauce classic burger'] },
  { id: 'panuozzo-rosso', tab: 'panuozzo', name: 'Rosso', has: ['pain en pâte à pizza', 'crème de poivrons', 'roquette', 'jambon de dinde', 'chorizo finement tranché', 'stracciatella', 'poivrons', 'oignons confits', 'huile piquante'] },
  { id: 'panuozzo-tartufo', tab: 'panuozzo', name: 'Tartufo', has: ['pain en pâte à pizza', 'crème de truffe', 'roquette', 'jambon de dinde', 'jambon de bœuf', 'stracciatella', 'champignons poêlés', 'copeaux de parmesan', 'poivre moulu'] },
  { id: 'panuozzo-verde', tab: 'panuozzo', name: 'Verde', has: ['pain en pâte à pizza', 'pesto basilic', 'roquette', 'jambon de dinde', 'stracciatella', 'tomates cerises confites', 'copeaux de parmesan', 'crème balsamique'] },
  { id: 'pates-spaghetti-sicilienne', tab: 'pates', name: 'Spaghetti Sicilienne', has: ['sauce tomate', 'thon', 'olives', 'parmesan', 'tomate cerise'] },
  { id: 'pates-rigatoni-tartufo', tab: 'pates', name: 'Rigatoni Tartufo', has: ['truffe', 'champignons', 'copeaux de parmesan'] },
  { id: 'pates-spaghetti-merguez', tab: 'pates', name: 'Spaghetti Merguez', has: ['merguez', 'sauce tomate crémeuse', 'olives', 'parmesan'] },
  { id: 'pates-spaghetti-formaggi', tab: 'pates', name: 'Spaghetti Formaggi', has: ['gorgonzola', 'copeaux de parmesan'] },
  { id: 'pates-penne-arrabiata', tab: 'pates', name: 'Penne Arrabbiata', has: ['sauce tomate relevée à l’huile piquante'], hasNot: ['parmesan'] },
  { id: 'pates-penne-forestiere', tab: 'pates', name: 'Penne Forestière', has: ['poulet', 'champignons', 'sauce crémeuse au parmesan'] },
  { id: 'pates-penne-saumon', tab: 'pates', name: 'Penne Saumon', has: ['saumon', 'sauce tomate crémeuse au parmesan'] },
  { id: 'pizzas-bollywood-style', tab: 'pizzas', name: 'Bollywood Style', has: ['sauce curry', 'mozzarella', 'poulet', 'oignons confits', 'tomates cerises', 'sauce basilic', 'crème balsamique'] },
  { id: 'pizzas-burratella-lov', tab: 'pizzas', name: 'Burratella Lov’', has: ['sauce tomate', 'stracciatella', 'jambon de dinde', 'copeaux de parmesan', 'sauce basilic', 'crème balsamique'] },
  { id: 'pizzas-classica-queen', tab: 'pizzas', name: 'Classica Queen', has: ['sauce tomate', 'mozzarella', 'champignons', 'jambon'] },
  { id: 'pizzas-malaga', tab: 'pizzas', name: 'Malaga', has: ['merguez', 'œuf', 'jambon de dinde', 'sauce basilic'] },
  { id: 'pizzas-marmithon', tab: 'pizzas', name: 'Marmithon', has: ['thon', 'olives', 'oignons confits', 'sauce basilic'] },
  { id: 'pizzas-paysanne', tab: 'pizzas', name: 'Paysanne', has: ['base crème', 'lardons', 'pommes de terre', 'sauce persillade'], hasNot: ['sauce tomate'] },
  { id: 'pizzas-pizz-arabia', tab: 'pizzas', name: 'Pizz’Arabia', has: ['merguez', 'poivrons rouges et verts', 'œuf', 'oignons confits'], hasNot: ['sauce basilic'] },
  { id: 'pizzas-ranch', tab: 'pizzas', name: 'Ranch’', has: ['sauce barbecue', 'poivrons rouges et verts', 'poulet', 'chorizo', 'crème', 'oignons confits', 'cheddar'], hasNot: ['sauce tomate'] },
  { id: 'pizzas-rosalia', tab: 'pizzas', name: 'Rosalia', has: ['sauce tomate', 'mozzarella', 'champignons', 'poulet', 'merguez artisanale', 'crème'], hasNot: ['oignons confits', 'sauce basilic'] },
  { id: 'pizzas-sugar-pepperoni', tab: 'pizzas', name: 'Sugar Pepperoni', has: ['sauce tomate à la barbecue', 'mozzarella', 'pepperoni'], hasNot: ['oignons', 'sauce basilic'] },
  { id: 'pizzas-tartuffe-mafia', tab: 'pizzas', name: 'Tartuffe Mafia', has: ['crème truffée', 'champignons', 'stracciatella', 'tomates cerises', 'copeaux de parmesan', 'sauce basilic', 'crème balsamique'], hasNot: ['mozzarella', 'sauce tomate'] },
  { id: 'pizzas-tutti-formaggi', tab: 'pizzas', name: 'Tutti Formaggi', has: ['sauce tomate', 'mozzarella', 'chèvre', 'gorgonzola', 'copeaux de parmesan'], hasNot: ['viande', 'champignons'] },
  { id: 'pizzas-vieille-fermiere', tab: 'pizzas', name: 'Vieille Fermière', has: ['base crème', 'mozzarella', 'poulet', 'champignons', 'oignons confits'], hasNot: ['sauce tomate'] },
  { id: 'pizzas-western', tab: 'pizzas', name: 'Western', has: ['sauce moutarde', 'mozzarella', 'poulet rôti', 'crème', 'oignons confits', 'sauce persillade'], hasNot: ['sauce tomate'] },
  { id: 'frappuccino-caramello', tab: 'frappuccino', name: 'Caramello', has: ['Espresso Caramello', 'lait entier', 'sirop vanille', 'glace vanille', 'glaçons', 'chantilly', 'coulis caramel'] },
  { id: 'frappuccino-coffee-latte', tab: 'frappuccino', name: 'Coffee Latte', has: ['Espresso Forte', 'lait entier', 'sirop de sucre', 'glace vanille', 'glaçons', 'chantilly'], hasNot: ['caramel'] },
  { id: 'frappuccino-nocciola', tab: 'frappuccino', name: 'Nocciola', has: ['Café Nocciola', 'lait entier', 'coulis chocolat', 'glace vanille', 'glaçons', 'chantilly', 'filet de chocolat'], hasNot: ['caramel'] },
  { id: 'mocktail-amor-amor', tab: 'mocktail', name: 'Amor Amor', has: ['jus de passion', 'jus d’ananas', 'jus de mangue', 'sirop de vanille', 'grenadine', 'glace pilée'] },
  { id: 'mocktail-coco-loco', tab: 'mocktail', name: 'Coco Loco', has: ['jus de piña colada', 'lait de coco', 'jus d’ananas', 'sirop de vanille', 'glace pilée'] },
  { id: 'mocktail-virgin-mojito', tab: 'mocktail', name: 'Virgin Mojito', has: ['menthe fraîche', 'citron vert', 'sirop de sucre de canne', 'Sprite', 'glace pilée'], hasNot: ['fraise', 'framboise'] },
  { id: 'mocktail-mojito-framboise', tab: 'mocktail', name: 'Mojito Framboise', has: ['menthe fraîche', 'citron vert', 'sirop de framboise', 'Sprite', 'glace pilée'] },
  { id: 'mocktail-mojito-fraise', tab: 'mocktail', name: 'Mojito Fraise', has: ['menthe fraîche', 'citron vert', 'sirop de fraise', 'Sprite', 'glace pilée'], hasNot: ['framboise'] },
  { id: 'mocktail-passion-fruit-lemonade', tab: 'mocktail', name: 'Passion Fruit Lemonade', has: ['jus de passion', 'jus de citron jaune', 'sirop de sucre de canne', 'eau pétillante', 'glace pilée'] },
  { id: 'boisson-coca-cola', tab: 'boissons-fraiches', name: 'Coca-Cola', has: ['bouteille en verre', '33 cl'] },
  { id: 'boisson-coca-cola-zero', tab: 'boissons-fraiches', name: 'Coca-Cola Zéro', has: ['Zéro Sucres', 'bouteille en verre', '33 cl'] },
  { id: 'boisson-coca-cola-cherry', tab: 'boissons-fraiches', name: 'Coca-Cola Cherry', has: ['cerise', 'bouteille en verre', '33 cl'] },
  { id: 'boisson-oasis-tropical', tab: 'boissons-fraiches', name: 'Oasis Tropical', has: ['bouteille en verre', '25 cl'] },
  { id: 'boisson-fuze-tea-peche', tab: 'boissons-fraiches', name: 'Fuze Tea Pêche', has: ['thé glacé', 'pêche', '25 cl'] },
  { id: 'boisson-sprite', tab: 'boissons-fraiches', name: 'Sprite', has: ['citron', 'bouteille en verre', '33 cl'] },
  { id: 'boisson-orangina', tab: 'boissons-fraiches', name: 'Orangina', has: ['pulpe', 'bouteille en verre', '25 cl'] },
  { id: 'boisson-san-pellegrino', tab: 'boissons-fraiches', name: 'San Pellegrino', has: ['gazeuse', 'bouteille en verre', '50 cl'] },
  { id: 'boisson-vittel', tab: 'boissons-fraiches', name: 'Vittel', has: ['eau minérale', 'bouteille en verre', '50 cl'] },
  { id: 'milkshake-bueno', tab: 'milkshake', name: 'Bueno', has: ['glace vanille', 'lait', 'Kinder Bueno mixé', 'chantilly', 'demi-barre de Bueno'], hasNot: ['coulis'] },
  { id: 'milkshake-cookies', tab: 'milkshake', name: 'Cookies', has: ['glace vanille', 'lait', 'cookies aux pépites de chocolat mixés', 'chantilly', 'demi-cookie'], hasNot: ['coulis'] },
  { id: 'milkshake-oreo', tab: 'milkshake', name: 'Oreo', has: ['glace vanille', 'lait', 'biscuits Oreo mixés', 'chantilly', 'un biscuit Oreo'], hasNot: ['coulis'] },
  { id: 'milkshake-petit-beurre', tab: 'milkshake', name: 'Petit Beurre', has: ['glace vanille', 'lait', 'biscuits Petit Beurre mixés', 'chantilly', 'demi-biscuit Petit Beurre'], hasNot: ['coulis'] },
  { id: 'milkshake-speculoos', tab: 'milkshake', name: 'Spéculoos', has: ['glace vanille', 'lait', 'biscuits Spéculoos mixés', 'chantilly', 'demi-biscuit Spéculoos'], hasNot: ['coulis'] },
  { id: 'milkshake-vanille', tab: 'milkshake', name: 'Vanille', has: ['glace vanille', 'lait', 'chantilly'], hasNot: ['coulis', 'biscuit'] },
  { id: 'iced-latte-caramello', tab: 'iced-latte', name: 'Iced Caramello', has: ['sirop de vanille', 'café Caramello', 'lait entier', 'glaçons', 'chantilly', 'coulis caramel'] },
  { id: 'iced-latte-coffee-latte', tab: 'iced-latte', name: 'Iced Coffee Latte', has: ['sirop de sucre', 'Espresso Forte', 'lait entier', 'glaçons', 'chantilly'], hasNot: ['caramel', 'cacao'] },
  { id: 'iced-latte-nocciola', tab: 'iced-latte', name: 'Iced Nocciola', has: ['coulis chocolat', 'café Nocciola', 'lait entier', 'glaçons', 'chantilly'], hasNot: ['caramel', 'vanille'] },
  { id: 'salade-original-burrata', tab: 'salade', name: 'Original Burrata', has: ['burrata', 'huile d’olive', 'olives de Ligurie', 'sauce basilic', 'crème balsamique'], hasNot: ['poulet', 'tomate'] },
  { id: 'salade-cesar', tab: 'salade', name: 'César', has: ['salade', 'poulet', 'croûtons', 'sauce César'], hasNot: ['burrata', 'tomate'] },
  { id: 'dessert-fondant-chocolat', tab: 'dessert', name: 'Fondant au chocolat', has: ['mi-cuit au chocolat', 'glace vanille +2 €'] },
  { id: 'dessert-tiramisu-coffee', tab: 'dessert', name: 'Original Tiramisu Coffee', has: ['mascarpone', 'café', 'cacao'] },
  { id: 'dessert-tiramisu-nutella-speculoos', tab: 'dessert', name: 'Tiramisu Nutella-Spéculoos', has: ['mascarpone', 'Nutella', 'spéculoos'] },
  { id: 'dessert-tiramisu-pistachio', tab: 'dessert', name: 'Tiramisu Pistachio', has: ['mascarpone', 'pistache'] },
  { id: 'dessert-bowl-fruits', tab: 'dessert', name: 'Bowl de fruits', has: ['fruits frais de saison'] },
  { id: 'dessert-brioche-perdue', tab: 'dessert', name: 'Brioche perdue', has: ['pain perdu', 'topping au choix', 'caramel beurre salé'] },
  { id: 'crepe-beurre-sucre', tab: 'crepes', name: 'Crêpe beurre sucre', has: ['beurre et sucre'] },
  { id: 'crepe-nutella', tab: 'crepes', name: 'Crêpe Nutella', has: ['Nutella'] },
  { id: 'crepe-speculoos', tab: 'crepes', name: 'Crêpe crème spéculoos', has: ['crème spéculoos'] },
  { id: 'crepe-caramel', tab: 'crepes', name: 'Crêpe caramel beurre salé', has: ['caramel au beurre salé'] },
  { id: 'crepe-bueno', tab: 'crepes', name: 'Crêpe crème Bueno', has: ['crème Bueno'] },
  { id: 'chaud-expresso-leggero', tab: 'boissons-chaudes', name: 'Expresso Leggero', has: ['doux'] },
  { id: 'chaud-expresso-forte', tab: 'boissons-chaudes', name: 'Expresso Forte', has: ['corsé'] },
  { id: 'chaud-expresso-caramello', tab: 'boissons-chaudes', name: 'Expresso Caramello', has: ['caramel'] },
  { id: 'chaud-expresso-nocciola', tab: 'boissons-chaudes', name: 'Expresso Nocciola', has: ['noisette'] },
  { id: 'chaud-cafe-au-lait', tab: 'boissons-chaudes', name: 'Café au lait', has: ['lait chaud'] },
  { id: 'chaud-chocolat-chaud', tab: 'boissons-chaudes', name: 'Chocolat chaud', has: ['chocolat'] },
  { id: 'chaud-the', tab: 'boissons-chaudes', name: 'Thé', has: ['thé'] },
];

for (const dish of dishes) {
  test(`${dish.name} présente ses ingrédients et le prix de la carte`, async ({ page }) => {
    await page.goto('/#carte');
    if (dish.tab) await page.locator(`#tab-${dish.tab}`).click();
    const card = page.locator(`.dish-card[data-open="${dish.id}"]`);
    await expect(card).toBeVisible();
    await expect(card).toContainText(dish.name);
    for (const ingredient of dish.has) await expect(card).toContainText(ingredient, { ignoreCase: true });
    for (const ingredient of dish.hasNot ?? []) await expect(card.locator('p')).not.toContainText(ingredient, { ignoreCase: true });
    const { price } = menuDish(dish.id);
    if (price === null) await expect(card.locator('.dish-title > span')).toHaveCount(0);
    else await expect(card.locator('.dish-title > span')).toHaveText(`${price}€`);
  });
}

test('les burgers sont servis avec des frites et les panuozzos avec une salade', async ({ page }) => {
  await page.goto('/#carte');
  await expect(page.locator('.dish-card[data-open="burger-classic-smash"] .dish-served')).toHaveText('Servi avec des frites');
  await expect(page.locator('.dish-card[data-open^="burger-"] .dish-served')).toHaveCount(8);
  await page.locator('#tab-panuozzo').click();
  await expect(page.locator('.dish-card[data-open^="panuozzo-"] .dish-served')).toHaveCount(3);
  await page.locator('.dish-card[data-open="panuozzo-verde"]').click();
  await expect(page.getByRole('dialog').locator('.dialog-served')).toHaveText('Servi avec une salade');
});

test('les prix de Bilal et les suppléments des smash burgers s’affichent', async ({ page }) => {
  await page.goto('/#carte');
  await expect(page.locator('.dish-card[data-open="burger-classic-smash"] .dish-title > span')).toHaveText('13€');
  await expect(page.locator('.dish-card[data-open="burger-classic-smash"]')).toContainText('Bacon de bœuf +2 € · Version XL (triple steak) +3 €');
  await expect(page.locator('.dish-card[data-open="burger-smokey-beef-bacon"] .dish-title > span')).toHaveText('14€');
  await page.locator('#tab-pizzas').click();
  await expect(page.locator('.dish-card[data-open="pizzas-burratella-lov"] .dish-title > span')).toHaveText('16€');
  await page.locator('#tab-milkshake').click();
  await expect(page.locator('.dish-card[data-open="milkshake-vanille"] .dish-title > span')).toHaveText('8€');
  await expect(page.locator('.dish-card[data-open="milkshake-oreo"] .dish-title > span')).toHaveText('9€');
});

test('chaque fiche détaille ses allergènes', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('.dish-card[data-open="burger-classic-smash"]').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.dialog-price')).toHaveText('13 €');
  await expect(dialog.locator('.dialog-allergens li')).toHaveText(['Gluten', 'Œufs', 'Lait', 'Moutarde']);
  await expect(dialog.locator('.dialog-footer')).toContainText('traces restent possibles');
  await dialog.locator('.dialog-close').click();
  await page.locator('#tab-mocktail').click();
  await page.locator('.dish-card[data-open="mocktail-mojito-fraise"]').click();
  await expect(dialog.locator('.dialog-allergens')).toContainText('Aucun des 14 allergènes majeurs');
  for (const category of menuData) for (const item of category.items) expect(Array.isArray(item.allergens), item.id).toBe(true);
});

test('aucune description ne détaille la recette', async ({ page }) => {
  await page.goto('/#carte');
  await expect(page.locator('.dish-card[data-open="burger-bbq-raclette"] img')).toHaveAttribute('src', /menu-v2\/burger-bbq-raclette\.webp$/);
  for (const tab of ['burger', 'pates', 'pizzas']) {
    await page.locator(`#tab-${tab}`).click();
    const text = (await page.locator('#menu-panel').textContent()) ?? '';
    expect(text).not.toMatch(/cuisson|louche|cuillère|égoutt|précuit|sel et|poivre\b|coupée en deux/i);
  }
});

test('la fiche du burger fonctionne sur mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#carte');
  await page.locator('.dish-card[data-open="burger-bbq-raclette"]').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('BBQ’ Raclette');
  await expect(dialog).not.toContainText('200 g de frites');
  await expect(dialog.locator('.dialog-price')).toHaveText('14 €');
});

test('les desserts regroupent les six douceurs de la carte, sans les crêpes, avec prix et suppléments', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-dessert').click();
  await expect(page.locator('#category-title')).toHaveText('Desserts');
  await expect(page.locator('#tab-tiramisu')).toHaveCount(0);
  await expect(page.locator('.dish-card')).toHaveCount(6);
  await expect(page.locator('#dish-grid')).not.toContainText('Crêpe');
  const prices: [string, string][] = [['dessert-fondant-chocolat', '7€'], ['dessert-tiramisu-coffee', '8€'], ['dessert-tiramisu-nutella-speculoos', '9€'], ['dessert-tiramisu-pistachio', '9€'], ['dessert-bowl-fruits', '10€'], ['dessert-brioche-perdue', '11€']];
  for (const [id, price] of prices) await expect(page.locator(`.dish-card[data-open="${id}"] .dish-title > span`)).toHaveText(price);
  await expect(page.locator('.dish-card[data-open="dessert-fondant-chocolat"]')).toContainText('Boule de glace vanille +2 €');
  await expect(page.locator('.dish-card[data-open="dessert-brioche-perdue"]')).toContainText('Nutella, spéculoos, crème Bueno ou caramel beurre salé');
  await expect(page.locator('.dish-card[data-open="dessert-brioche-perdue"]')).toContainText('Topping supplémentaire +2 €');
  await expect(page.locator('#dish-grid')).not.toContainText('BIENTÔT');
});

test('l’accueil montre un plat en plein cadre, avec son nom et son prix', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#arrival-video, #assiettes, .dish3d-stage')).toHaveCount(0);
  await expect(page.locator('.hero-slides img')).toHaveCount(12);
  await expect(page.locator('.hero-slides img.is-on')).toHaveAttribute('src', /menu-v2\/burger-smokey-beef-bacon\.webp$/);
  const now = page.locator('.hero-now');
  await expect(now).toContainText('Smokey Beef Bacon');
  await expect(page.locator('#hero-price')).toHaveText('14€');
  await expect(page.locator('.hero-slides img.is-tall')).toHaveCount(3);
  await now.click();
  await expect(page.getByRole('dialog')).toContainText('Smokey Beef Bacon');
});

test('les plats de l’accueil se succèdent seuls, sans barre de progression', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('.hero-timer').dispatchEvent('animationiteration');
  await expect(page.locator('.hero-now')).toContainText('Burratella Lov’');
  await expect(page.locator('.hero-dots')).toHaveCount(0);
  for (let step = 0; step < 8; step += 1) await page.locator('.hero-timer').dispatchEvent('animationiteration');
  await expect(page.locator('.hero-now')).toContainText('Bueno');
  await expect(page.locator('#hero-price')).toHaveText('9€');
});

test('sur téléphone, l’accueil laisse la place au plat, sans bouton', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.arrival-actions')).toBeHidden();
  await expect(page.locator('.hero-now')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
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
  expect(items).toHaveLength(dishes.length);
  const missingAlt = await page.locator('img:not([alt])').count();
  expect(missingAlt).toBe(0);
});

test('le lounge présente ses hookahs et la chauffe Quasar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#lieu')).toHaveCount(0);
  await expect(page.locator('a[href="#lieu"]')).toHaveCount(0);
  const lounge = page.locator('#lounge');
  await expect(lounge.locator('.lounge-specs')).toContainText('Alpha, Brodator, Mig tradi');
  expect((await page.locator('body').innerText()).match(/chicha|wookah/i)).toBeNull();
  await expect(lounge.locator('.lounge-specs')).toContainText('Quasar');
  await expect(lounge.locator('.lounge-picture img')).toHaveAttribute('src', /lounge\/wookah-quasar\.webp$/);
  await expect(lounge.locator('.lounge-tile img')).toHaveCount(2);
  await expect(lounge.locator('.lounge-formula')).toHaveCount(2);
  await expect(lounge.locator('h2')).not.toContainText('soirée');
  await expect(lounge.locator('.lounge-intro')).toContainText('dès 15 h');
  await expect(lounge.locator('.lounge-intro')).not.toContainText('assiette');
  await expect(lounge.locator('.lounge-formula').nth(0)).toContainText('FORMULE 1');
  await expect(lounge.locator('.lounge-formula').nth(0)).toContainText('Hookah & Drink');
  await expect(lounge.locator('.lounge-formula').nth(1)).toContainText('FORMULE 2');
  await expect(lounge.locator('.lounge-formula').nth(0)).toContainText('Hookah + boisson fraîche ou boisson chaude');
  await expect(lounge.locator('.lounge-formula').nth(1)).toContainText('Hookah & Signature Drink');
  await expect(lounge.locator('.lounge-formula').nth(1)).toContainText('Hookah + mocktail, milkshake, iced latte ou frappuccino');
});

test('les infos pratiques donnent adresse, horaires, téléphone et état d’ouverture', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-03T00:30:00+02:00'));
  await page.goto('/');
  await expect(page.locator('.header nav a[href="#contact"]')).toHaveText(/Infos & accès/);
  const contact = page.locator('#contact');
  await expect(contact.locator('address')).toContainText('82 boulevard Michelet');
  await expect(contact.locator('address')).toContainText('93130 Noisy-le-Sec');
  await expect(contact.locator('.contact-phone')).toHaveAttribute('href', 'tel:+33148501547');
  await expect(contact.locator('.hours li')).toHaveCount(3);
  // Saturday 0:30 in Paris: Friday's service runs until 2 am.
  await expect(page.locator('#open-status')).toContainText('Ouvert maintenant · jusqu’à 02h');
  await expect(contact.locator('.hours li.today')).toContainText('Vendredi');
  await expect(contact.locator('.contact-map iframe')).toHaveAttribute('src', /google\.com\/maps/);
});

test('l’état d’ouverture annonce la réouverture l’après-midi', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-05T11:00:00+02:00'));
  await page.goto('/');
  await expect(page.locator('#open-status')).toContainText('Fermé · ouvre aujourd’hui à 15h');
  await expect(page.locator('.hours li.today')).toContainText('Lundi');
});

test('sur téléphone, le titre d’accueil tient sur une ligne et les catégories forment une barre', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  const kicker = page.locator('.h1-kicker');
  const box = (await kicker.boundingBox())!;
  expect(box.height).toBeLessThan(20);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  const tabs = page.locator('#categories > button');
  const first = (await tabs.first().boundingBox())!;
  const last = (await tabs.last().boundingBox())!;
  expect(Math.abs(first.y - last.y)).toBeLessThan(1);
  await expect(page.locator('.menu-sidebar')).toHaveCSS('position', 'sticky');
});

test('sur téléphone, choisir une catégorie ramène le début de la liste sous la barre', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, document.querySelector<HTMLElement>('#carte')!.offsetTop + 900));
  await page.locator('#tab-pizzas').click();
  await expect(page.locator('#category-title')).toHaveText('Pizzas');
  await expect.poll(async () => page.evaluate(() => Math.abs(document.querySelector('.menu-results')!.getBoundingClientRect().top - document.querySelector('.menu-sidebar')!.getBoundingClientRect().bottom))).toBeLessThan(1);
});

test('les itinéraires tiennent sur une ligne avec leurs icônes, même sur téléphone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  const routes = page.locator('.contact-routes a');
  await expect(routes).toHaveCount(3);
  await expect(routes.locator('svg')).toHaveCount(3);
  const boxes = await routes.evaluateAll(links => links.map(link => link.getBoundingClientRect()).map(box => ({ y: box.y, right: box.right })));
  expect(new Set(boxes.map(box => Math.round(box.y))).size).toBe(1);
  const card = (await page.locator('.contact-address').boundingBox())!;
  expect(Math.max(...boxes.map(box => box.right))).toBeLessThanOrEqual(card.x + card.width);
});

test('fermer la fiche d’un plat ne laisse pas de contour après un clic', async ({ page }) => {
  await page.goto('/#carte');
  await page.locator('#tab-pizzas').click();
  const card = page.locator('.dish-card[data-open="pizzas-malaga"]');
  await card.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await card.evaluate(element => element === document.activeElement)).toBe(false);
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await card.evaluate(element => element === document.activeElement)).toBe(true);
});

test('les titres de section portent les mots-clés et le contact affiche la bonne adresse e-mail', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/hookah à Noisy-le-Sec/);
  await expect(page.locator('#carte h2')).toContainText('cuisine généreuse, comme à la maison, à Noisy-le-Sec');
  await expect(page.locator('#lounge h2')).toContainText('Lounge hookah à Noisy-le-Sec');
  await expect(page.locator('#contact h2')).toContainText('Adresse, horaires & accès');
  await expect(page.locator('section[hidden]')).toHaveCount(0);
  await expect(page.locator('a[href^="mailto:"]').first()).toHaveAttribute('href', 'mailto:lesafelounge@gmail.com');
  await expect(page.locator('a[href*="lesafelounge.fr"]')).toHaveCount(0);
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? '{}');
  expect(data.email).toBe('lesafelounge@gmail.com');
  expect(data.geo.latitude).toBeCloseTo(48.8933, 3);
});

test('changer de catégorie en bas de liste ramène au début de la nouvelle liste', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, document.querySelector<HTMLElement>('#carte')!.offsetTop + 1400));
  await page.locator('#tab-panuozzo').click();
  await page.locator('#tab-burger').click();
  await expect.poll(async () => page.evaluate(() => Math.round(document.querySelector('.menu-results')!.getBoundingClientRect().top))).toBe(24);
  await expect(page.locator('#category-description')).toBeHidden();
  await expect(page.locator('.arrival-content')).not.toContainText('La soirée ne fait que commencer');
  await expect(page.locator('#menu-panel')).not.toContainText('200 g de frites');
});
