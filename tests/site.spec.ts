import { test, expect } from '@playwright/test';

test('les dix rubriques conservent tous les plats et les tarifs importants', async ({ page }) => {
  await page.goto('/');
  const counts: Record<string, number> = { salades:2, pates:7, pizzas:12, burgers:5, desserts:6, crepes:6, milkshakes:4, mocktails:7, boissons:5, hookah:2 };
  let total = 0;
  for (const [category, count] of Object.entries(counts)) {
    await page.locator(`#tab-${category}`).click();
    await expect(page.locator('.dish-card')).toHaveCount(count);
    const images=page.locator('.dish-card img');
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(()=>image.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
    }
    total += count;
  }
  expect(total).toBe(56);
  await page.locator('[data-open="hookah-2"]').last().click();
  await expect(page.getByRole('dialog')).toContainText('25 €');
  await page.keyboard.press('Escape');
  await page.locator('#tab-desserts').click();
  await page.locator('.dish-card[data-open="desserts-1"]').click();
  await expect(page.getByRole('dialog')).toContainText('7 €');
  await expect(page.getByRole('dialog')).toContainText('Boule vanille +2€');
  await page.getByRole('button',{name:'Fermer le détail du plat'}).click();
  await expect(page.locator('.dish-card[data-open="desserts-1"]')).toBeFocused();
  await page.locator('#tab-mocktails').click();
  await page.locator('.dish-card[data-open="mocktails-2"]').click();
  await expect(page.getByRole('dialog')).toContainText('9 €');
  await expect(page.getByRole('dialog')).toContainText('Fraise');
});

test('recherche transversale, accents et aucun résultat', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Une envie précise ?').fill('speculoos');
  await expect(page.locator('.dish-card')).toHaveCount(3);
  await page.getByLabel('Une envie précise ?').fill('xyzxyz');
  await expect(page.getByText('Rien dans l’assiette… pour le moment.')).toBeVisible();
  await page.getByRole('button',{name:'Revenir à la carte'}).click();
  await expect(page.locator('.dish-card')).toHaveCount(5);
  await page.locator('#tab-burgers').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#tab-pizzas')).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('End');
  await expect(page.locator('#tab-hookah')).toHaveAttribute('aria-selected','true');
});

test('les trois plats de l’accueil changent de photo, de prix et de fiche', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button',{name:'02 Burger mood'}).click();
  await expect(page.locator('#hero-image')).toHaveAttribute('src','/assets/menu/smokey.jpg');
  await expect(page.locator('#hero-price')).toHaveText('14€');
  await page.locator('.hero-dish-label').click();
  await expect(page.getByRole('dialog')).toContainText('Smokey bacon');
  await expect(page.getByRole('dialog')).toContainText('Servi avec frites allumettes croustillantes.');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'03 Sweet tooth'}).click();
  await expect(page.locator('#hero-image')).toHaveAttribute('src','/assets/menu/pistache.jpg');
  await expect(page.locator('#hero-price')).toHaveText('9€');
});

test('mobile : navigation, raccourcis de catégorie et absence de débordement', async ({ page }) => {
  for (const width of [360,390,768,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Ouvrir la navigation'}).click();
  await page.locator('#mobile-nav').getByRole('link',{name:'La carte'}).click();
  await expect(page.locator('#mobile-nav')).toBeHidden();
  await page.getByRole('link',{name:'Je craque pour un dessert'}).click();
  await expect(page.locator('#tab-desserts')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('.dish-card')).toHaveCount(6);
});

test('les animations peuvent être arrêtées et le choix est mémorisé', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await page.locator('#motion-toggle').click();
  await expect(page.locator('html')).toHaveClass('motion-paused');
  await page.reload();
  await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#motion-label')).toHaveText('Animations en pause');
  expect(errors).toEqual([]);
});

test('les vidéos restent locales, respectent la réduction des mouvements et se ferment proprement', async ({ page }) => {
  await page.goto('/');
  const preview=page.locator('#arrival-video');
  await expect(preview).not.toHaveAttribute('src', /.+/);
  await page.getByRole('button',{name:'Lire l’aperçu vidéo',exact:true}).click();
  await expect.poll(()=>preview.evaluate((video:HTMLVideoElement)=>!video.paused&&video.currentTime>0)).toBe(true);
  await page.getByRole('button',{name:'Mettre l’aperçu vidéo en pause',exact:true}).click();
  await expect.poll(()=>preview.evaluate((video:HTMLVideoElement)=>video.paused)).toBe(true);
  await page.locator('.film-caption').click();
  await expect(page.locator('#film-dialog')).toBeVisible();
  await expect(page.locator('#film-player')).toHaveAttribute('src','/assets/instagram/safe-moments.mp4');
  await expect.poll(()=>page.locator('#film-player').evaluate((video:HTMLVideoElement)=>video.readyState>=2&&video.currentTime>0)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#film-dialog')).not.toBeVisible();
  await expect(page.locator('#film-player')).not.toHaveAttribute('src', /.+/);
  await expect(page.locator('body')).not.toHaveClass('dialog-open');
  await expect(page.locator('.film-caption')).toBeFocused();
  await page.getByRole('button',{name:/DANS LES COULISSES/}).click();
  await expect(page.locator('#film-player')).toHaveAttribute('src','/assets/instagram/en-cuisine.mp4');
  await page.getByRole('button',{name:'Fermer la vidéo',exact:true}).click();
});

test('la vidéo muette se met en pause hors écran', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  const preview=page.locator('#arrival-video');
  await expect.poll(()=>preview.evaluate((video:HTMLVideoElement)=>!video.paused&&video.currentTime>0)).toBe(true);
  await expect.poll(()=>preview.evaluate((video:HTMLVideoElement)=>video.muted)).toBe(true);
  await page.locator('#carte').scrollIntoViewIfNeeded();
  await expect.poll(()=>preview.evaluate((video:HTMLVideoElement)=>video.paused)).toBe(true);
});

test('chaque lien interne amène sa section en haut de l’écran', async ({ page }) => {
  await page.setViewportSize({width:1280,height:800});
  await page.goto('/');
  const jumps: [string, string, string?][] = [
    ['.craving-card[data-go="burgers"] .image-arrow', '#carte', 'Burgers gourmets'],
    ['.craving-card[data-go="pates"] .image-arrow', '#carte', 'Pâtes fraîches'],
    ['.sweet-copy a.button', '#carte', 'Desserts'],
    ['.lounge-copy .text-link', '#carte', 'Mocktails'],
    ['.header nav a[href="#lieu"]', '#lieu'],
    ['.header nav a[href="#lounge"]', '#lounge'],
    ['.header-cta', '#contact'],
    ['.scroll-cue', '#envies'],
  ];
  for (const [trigger, section, category] of jumps) {
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.locator(trigger).click();
    await expect.poll(()=>page.locator(section).evaluate(element=>Math.round(Math.abs(element.getBoundingClientRect().top)))).toBe(0);
    if (category) await expect(page.locator('#category-title')).toHaveText(category);
  }
});

test('aucun lien ne pointe dans le vide', async ({ page }) => {
  await page.goto('/');
  const targets = await page.locator('a[href^="#"]').evaluateAll(links =>
    links.map(link => link.getAttribute('href')!).filter(href => href.length > 1));
  expect(targets.length).toBeGreaterThan(5);
  for (const target of targets) await expect(page.locator(target)).toHaveCount(1);
});

test('le ruban défile vite et sans trou à toutes les largeurs', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  for (const width of [390,768,1280,1920,2560]) {
    await page.setViewportSize({width,height:800});
    await page.goto('/');
    const ribbon = await page.locator('.marquee-track').evaluate((track: HTMLElement) => ({
      slack: track.getBoundingClientRect().width + parseFloat(getComputedStyle(track).getPropertyValue('--marquee-shift')) - innerWidth,
      speed: (track.firstElementChild as HTMLElement).getBoundingClientRect().width / parseFloat(getComputedStyle(track).animationDuration),
      loops: getComputedStyle(track).animationIterationCount,
    }));
    expect(ribbon.slack, `largeur ${width}`).toBeGreaterThanOrEqual(0);
    expect(ribbon.speed, `largeur ${width}`).toBeGreaterThan(70);
    expect(ribbon.speed, `largeur ${width}`).toBeLessThan(110);
    expect(ribbon.loops).toBe('infinite');
  }
});

test('l’accueil et les desserts tournent en boucle et rendent la main au clic', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await page.locator('.hero-bottom').scrollIntoViewIfNeeded();
  await page.getByRole('button',{name:'03 Sweet tooth'}).click();
  await expect(page.locator('#hero-dish-name')).toHaveText('Tiramisu Pistachio');
  // From the last dish the rotation wraps round to the first on its own.
  await expect.poll(()=>page.locator('#hero-dish-name').textContent(),{timeout:14000}).toBe('Sugar Pepperoni');

  await page.locator('.sweet-section').scrollIntoViewIfNeeded();
  const lastDot = page.locator('.sweet-dots button').last();
  await lastDot.click();
  await expect(page.locator('#sweet-name')).toHaveText('TIRAMISU NUTELLA-SPÉCULOOS');
  await expect(page.locator('.sweet-price')).toHaveAttribute('data-open','desserts-3');
  await expect.poll(()=>page.locator('#sweet-name').textContent(),{timeout:14000}).toBe('TIRAMISU PISTACHIO');
  await expect(page.locator('#sweet-image')).toHaveAttribute('src','/assets/menu/pistache.jpg');
  await page.locator('.sweet-price').click();
  await expect(page.getByRole('dialog')).toContainText('Tiramisu pistachio');
});

test('mobile : le rail des envies défile seul puis laisse la main au visiteur', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const rail = page.locator('.craving-grid');
  await rail.scrollIntoViewIfNeeded();
  const left = () => rail.evaluate(element => Math.round(element.scrollLeft));
  const dot = () => page.locator('.craving-dots button[aria-pressed="true"]').getAttribute('data-rail');
  expect(await left()).toBeLessThan(10);
  await expect.poll(left,{timeout:20000}).toBeGreaterThan(50);
  await expect.poll(dot).not.toBe('0');

  // Posing a finger on a card — the way one scrolls the page — must not stop it.
  await rail.evaluate(element => {
    element.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
    element.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
  });
  const beforeTap = await left();
  await expect.poll(left,{timeout:20000}).not.toBe(beforeTap);

  // Scrolling the rail sideways does, and for good. Three nudges, spaced out, so
  // that at least one lands outside the window that covers an automatic move.
  for (let nudge = 0; nudge < 4; nudge += 1) {
    // Alternate the target: scrolling to where it already sits fires no event.
    await rail.evaluate((element, spot) => element.scrollTo({left:spot}), nudge % 2 ? 0 : 130);
    await page.waitForTimeout(1300);
  }
  const held = await left();
  expect(held).toBeLessThan(20);
  await page.waitForTimeout(6000);
  expect(await left()).toBe(held);
});

test('mobile : toutes les catégories tiennent à l’écran, la catégorie par défaut en tête', async ({ page }) => {
  await page.setViewportSize({width:360,height:800});
  await page.goto('/');
  const shelf = page.locator('#categories');
  expect(await shelf.evaluate(element => element.scrollWidth - element.clientWidth)).toBe(0);
  expect(await shelf.evaluate(element => {
    const edge = element.getBoundingClientRect().right;
    return [...element.children].filter(tab => tab.getBoundingClientRect().right > edge + 1).length;
  })).toBe(0);
  await expect(page.locator('#categories>button').first()).toHaveAttribute('data-category','burgers');
  await expect(page.locator('#categories>button').first()).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#categories>button')).toHaveCount(10);
});

test('mobile : aucun texte sous 9 px et aucun débordement', async ({ page }) => {
  for (const width of [360,390,430]) {
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}scrollTo(0,0);});
    const tiny = await page.evaluate(()=>[...document.querySelectorAll('body *')]
      .filter(element=>element.children.length===0 && element.textContent!.trim() && element.getBoundingClientRect().width>0)
      .filter(element=>parseFloat(getComputedStyle(element).fontSize)<9)
      .map(element=>`${element.tagName}.${element.className} ${getComputedStyle(element).fontSize}`));
    expect(tiny,`largeur ${width}`).toEqual([]);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),`largeur ${width}`).toBe(0);
  }
});

test('mobile : chaque lien et bouton reste confortable au doigt', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}scrollTo(0,0);});
  const cramped = await page.evaluate(() => {
    const small: string[] = [];
    for (const element of document.querySelectorAll<HTMLElement>('a,button')) {
      if (element.offsetParent === null) continue;
      element.scrollIntoView({ block: 'center', behavior: 'instant' });
      const box = element.getBoundingClientRect();
      if (box.height >= 36 && box.width >= 36) continue;
      // A pseudo-element may widen the tap area beyond the painted box.
      const middle = box.left + box.width / 2;
      let above = 0, below = 0;
      for (let gap = 1; gap <= 26; gap += 1) { const hit = document.elementFromPoint(middle, box.top - gap); if (hit !== element && !element.contains(hit)) break; above = gap; }
      for (let gap = 1; gap <= 26; gap += 1) { const hit = document.elementFromPoint(middle, box.bottom + gap); if (hit !== element && !element.contains(hit)) break; below = gap; }
      if (box.height + above + below < 36) small.push(`${(element.textContent || '↗').trim().slice(0,24)} — ${Math.round(box.height + above + below)}px`);
    }
    return small;
  });
  expect(cramped).toEqual([]);
});

test('les flèches restent des glyphes texte, jamais des emoji', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Ouvrir la navigation'}).click();
  await page.locator('#tab-hookah').click();
  await page.locator('.dish-card').first().click();
  // Every arrow, including those written by the script, must carry U+FE0E:
  // without it iOS falls back to the colour emoji font wherever the serif has
  // no glyph, and the arrow turns into a blue square.
  const bare = await page.evaluate(() => {
    const found: string[] = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walk.nextNode(); node; node = walk.nextNode()) {
      const text = node.textContent || '';
      for (let i = 0; i < text.length; i += 1) {
        if ('↗▶↓↑'.includes(text[i]) && text[i + 1] !== '︎') {
          found.push(`${(node.parentElement?.className || node.parentElement?.tagName || '?')} « ${text.trim().slice(0,24)} »`);
        }
      }
    }
    return [...new Set(found)];
  });
  expect(bare).toEqual([]);
  await expect(page.locator('#tab-hookah span').first()).toHaveText('Hookah');
});

test('mobile : le menu se ferme au doigt posé à côté, pas seulement sur la croix', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const panel = page.locator('#mobile-nav');
  await page.getByRole('button',{name:'Ouvrir la navigation'}).click();
  await expect(panel).toBeVisible();
  await page.mouse.click(200, 700);
  await expect(panel).toBeHidden();
  await page.getByRole('button',{name:'Ouvrir la navigation'}).click();
  await expect(panel).toBeVisible();
  await page.getByRole('button',{name:'Fermer la navigation'}).click();
  await expect(panel).toBeHidden();
});

test('l’aperçu vidéo tient dans une barre sur mobile et s’affiche en grand sur desktop', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const film = page.locator('.arrival-film');
  const barre = await film.boundingBox();
  // Une barre, pas une carte : elle ne doit plus dévorer le haut de page.
  expect(barre!.height).toBeLessThan(110);
  // Et elle ne passe pas sous la barre d’actions fixe.
  const dock = (await page.locator('.mobile-dock').boundingBox())!;
  expect(barre!.y + barre!.height).toBeLessThanOrEqual(dock.y + 1);

  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');
  const fenetre = (await page.locator('.film-window').boundingBox())!;
  expect(fenetre.width).toBeGreaterThan(340);
  const hero = (await page.locator('.arrival').boundingBox())!;
  const repere = (await page.locator('.arrival-scroll').boundingBox())!;
  const carte = (await page.locator('.arrival-film').boundingBox())!;
  expect(carte.y).toBeGreaterThan(hero.y);
  expect(carte.y + carte.height).toBeLessThanOrEqual(repere.y);
});
