import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';

// BASE_PATH is set when publishing under a sub-path (a GitHub Pages project site).
// Development, preview and the test suite run at the root unless it is exported.
const base = process.env.BASE_PATH || '/';
// SITE_URL is the public address search engines should index (canonical, Open Graph).
const siteUrl = process.env.SITE_URL || 'https://lesafelounge.com/';

interface Dish { id: string; name: string; description: string; extra: string; image: string | null }
interface Category { id: string; label: string; description: string; items: Dish[] }

// The restaurant and its whole menu, as schema.org data, built from the same
// menu.json as the page so the two never disagree.
function structuredData(): Plugin {
  return {
    name: 'safe-structured-data',
    transformIndexHtml(html) {
      const menu = JSON.parse(readFileSync(new URL('./src/menu.json', import.meta.url), 'utf8')) as Category[];
      const image = (path: string) => siteUrl + path.replace(/^\/+/, '');
      const restaurant = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        '@id': `${siteUrl}#restaurant`,
        name: 'Le Safe Lounge',
        description: 'Restaurant et lounge à Noisy-le-Sec : smash burgers, chicken burgers, pizzas, pâtes et formules hookah.',
        url: siteUrl,
        image: [image('assets/og-image.jpg'), image('assets/instagram/salon.webp'), image('assets/instagram/terrasse.webp')],
        logo: image('assets/logo-dark.svg'),
        telephone: '+33148501547',
        email: 'contact@lesafelounge.fr',
        foundingDate: '2017',
        servesCuisine: ['Burgers', 'Pizzas', 'Pâtes'],
        address: { '@type': 'PostalAddress', streetAddress: '82 boulevard Michelet', postalCode: '93130', addressLocality: 'Noisy-le-Sec', addressRegion: 'Île-de-France', addressCountry: 'FR' },
        areaServed: ['Noisy-le-Sec', 'Seine-Saint-Denis'],
        openingHoursSpecification: [
          { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Sunday'], opens: '15:00', closes: '01:00' },
          { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Friday', 'Saturday'], opens: '15:00', closes: '02:00' },
        ],
        sameAs: ['https://www.instagram.com/lesafelounge/', 'https://lesafelounge.com/'],
        hasMenu: {
          '@type': 'Menu',
          name: 'La carte du Safe Lounge',
          inLanguage: 'fr',
          hasMenuSection: menu.filter(category => category.items.length).map(category => ({
            '@type': 'MenuSection',
            name: category.label,
            description: category.description,
            hasMenuItem: category.items.map(dish => ({
              '@type': 'MenuItem',
              name: dish.name,
              description: [dish.description, dish.extra].filter(Boolean).join(' '),
              ...(dish.image ? { image: image(dish.image) } : {}),
            })),
          })),
        },
      };
      const json = JSON.stringify(restaurant).replace(/</g, '\\u003c');
      return html
        .replaceAll('%SITE_URL%', siteUrl)
        .replace('<!--structured-data-->', `<script type="application/ld+json">${json}</script>`);
    },
  };
}

export default defineConfig({ base, plugins: [structuredData()] });
