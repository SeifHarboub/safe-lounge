import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import rawMenu from './menu.json';
import { asset } from './asset';

gsap.registerPlugin(ScrollTrigger);
interface Dish { id: string; name: string; description: string; extra: string; served?: string; group?: string; price: number | null; image: string | null; sourceImage: string | null; allergens: string[] }
interface Category { id: string; label: string; description: string; source: string; groups?: string[]; items: Dish[] }
// Follow a meal: salads to start, main dishes, desserts and crêpes, then drinks,
// from soft drinks to signature drinks, ending with hot drinks as after a meal.
const DISPLAY_ORDER = ['salade','burger','panuozzo','pizzas','pates','dessert','crepes','boissons-fraiches','mocktail','milkshake','iced-latte','frappuccino','boissons-chaudes'];
// Within each category, dishes are listed from the cheapest to the dearest; a
// dish without a price goes last, and equal prices keep the menu's own order.
const byPrice = (a: Dish, b: Dish) => (a.price ?? Infinity) - (b.price ?? Infinity);
// A category split into groups (smash, then chicken burgers) keeps each group
// together, and sorts by price inside it.
const byGroup = (groups: string[] = []) => (a: Dish, b: Dish) => groups.indexOf(a.group ?? '') - groups.indexOf(b.group ?? '') || byPrice(a, b);
const menu = (rawMenu as Category[]).slice().sort((a, b) => DISPLAY_ORDER.indexOf(a.id) - DISPLAY_ORDER.indexOf(b.id)).map(category => ({ ...category, items: category.items.slice().sort(byGroup(category.groups)) }));
const allDishes = menu.flatMap(category => category.items.map(dish => ({ ...dish, category: category.id })));
const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let selectedCategory = 'burger';
const search = $<HTMLInputElement>('#dish-search');
const grid = $('#dish-grid');
const panel = $('#menu-panel');
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = reducedQuery.matches;
const canAnimate = () => !motionPaused;
const categories = $('#categories');
categories.innerHTML = menu.map(category => `<button role="tab" id="tab-${category.id}"${category.items.length ? '' : ' class="is-empty"'} aria-controls="menu-panel" aria-selected="${category.id === selectedCategory}" tabindex="${category.id === selectedCategory ? '0' : '-1'}" data-category="${category.id}"><span>${category.label}</span><span class="category-count">${category.items.length ? String(category.items.length).padStart(2,'0') : 'bientôt'}</span><span class="category-arrow">↗︎</span></button>`).join('');
const tabs = [...categories.querySelectorAll<HTMLButtonElement>('button')];

function renderMenu(animate = true) {
  const query = normalize(search.value.trim());
  const category = menu.find(category => category.id === selectedCategory)!;
  const dishes = query ? allDishes.filter(dish => normalize(`${dish.name} ${dish.description} ${menu.find(c => c.id === dish.category)!.label}`).includes(query)) : category.items;
  $('#category-title').textContent = query ? 'Votre envie, à la carte.' : category.label;
  // Each dish already details its ingredients: a category only says something during a search.
  $('#category-description').textContent = query ? `Recherche dans toute la carte : « ${search.value.trim()} »` : '';
  // An empty category says so once, in the box below: no count, no second notice.
  $('#result-count').textContent = dishes.length ? `${dishes.length} choix` : '';
  $<HTMLButtonElement>('.clear-search').hidden = !query;
  tabs.forEach(tab => { const active = !query && tab.dataset.category === category.id; tab.setAttribute('aria-selected',String(active)); tab.tabIndex = tab.dataset.category === category.id ? 0 : -1; });
  if (query) { panel.removeAttribute('aria-labelledby'); panel.setAttribute('aria-label','Résultats de recherche dans toute la carte'); }
  else { panel.setAttribute('aria-labelledby',`tab-${category.id}`); panel.removeAttribute('aria-label'); }
  grid.innerHTML = dishes.length ? dishes.map((dish, index) => { const heading = !query && dish.group && dish.group !== dishes[index - 1]?.group ? `<h4 class="dish-group">${escape(dish.group)}</h4>` : ''; const label = menu.find(c => c.items.some(item => item.id === dish.id))!.label; return `${heading}<button class="dish-card" data-open="${dish.id}" aria-label="Voir ${escape(dish.name)}${dish.price === null ? '' : `, ${dish.price} euros`}"><div class="dish-frame"><div class="dish-photo">${dish.image ? `<img src="${asset(dish.image)}" alt="${escape(`${dish.name}, ${label.toLowerCase()} du Safe Lounge à Noisy-le-Sec`)}" width="1080" height="1080" loading="${index < 3 ? 'eager' : 'lazy'}" />` : `<div class="no-photo"><img src="${asset('/assets/symbol-lilac.svg')}" alt="" /></div>`}<span class="dish-open">↗︎</span></div></div><div class="dish-title"><h4>${escape(dish.name)}</h4>${dish.price === null ? '' : `<span>${dish.price}<small>€</small></span>`}</div><p>${escape(dish.description)}</p>${dish.served ? `<span class="dish-served">${escape(dish.served)}</span>` : ''}${dish.extra ? `<span class="dish-extra">${escape(dish.extra)}</span>` : ''}</button>`; }).join('') : '<div class="no-results"><span>Cette catégorie arrive bientôt.</span><p>Notre équipe finalise cette sélection. En attendant, demandez-nous ce qui est servi sur place.</p></div>';
  if (animate && canAnimate()) gsap.fromTo('.dish-card',{y:24,opacity:0},{y:0,opacity:1,duration:.45,stagger:.045,ease:'power2.out',clearProps:'transform,opacity'});
  requestAnimationFrame(() => ScrollTrigger.refresh());
}
function selectCategory(id: string) {
  if (!menu.some(category => category.id === id)) return;
  selectedCategory = id; search.value = ''; renderMenu();
  const behavior = canAnimate() ? 'smooth' : 'auto';
  // On a phone the tabs are one sticky row: centre the chosen tab in it.
  if (mobileQuery.matches) {
    const tab = tabs.find(tab => tab.dataset.category === id)!;
    categories.scrollTo({ left: tab.offsetLeft - (categories.clientWidth - tab.offsetWidth) / 2, behavior });
  }
  // A new category starts at its title. When the list was scrolled past, bring
  // that title back to the top, under the sticky tabs on a phone. Two frames:
  // renderMenu's ScrollTrigger refresh would cancel a smooth scroll started now,
  // and a short category can shrink the page and shift the scroll on its own.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const top = mobileQuery.matches ? $('.menu-sidebar').offsetHeight : 24;
    const offset = $('.menu-results').getBoundingClientRect().top - top;
    if (offset < 0 || offset > innerHeight * .6) window.scrollTo({ top: window.scrollY + offset, behavior });
  }));
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectCategory(tab.dataset.category!));
  tab.addEventListener('keydown', event => {
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); tabs[next].focus(); selectCategory(tabs[next].dataset.category!);
  });
});
search.addEventListener('input', () => renderMenu());
$('.clear-search').addEventListener('click', () => { search.value=''; renderMenu(); search.focus(); });
function goToSection(hash: string) {
  const section = document.querySelector<HTMLElement>(hash);
  if (!section) return;
  ScrollTrigger.refresh();
  section.setAttribute('tabindex','-1');
  section.focus({ preventScroll: true });
  window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY, behavior: canAnimate() ? 'smooth' : 'auto' });
  history.replaceState(null,'',hash);
}
document.addEventListener('click', event => {
  const target = event.target as Element;
  const categoryLink = target.closest<HTMLElement>('[data-go]');
  if (categoryLink) selectCategory(categoryLink.dataset.go!);
  if (target.closest('[data-clear]')) { search.value='';renderMenu();search.focus(); }
  const dishLink = target.closest<HTMLElement>('[data-open]');
  if (dishLink) openDish(dishLink.dataset.open!, (event as MouseEvent).detail > 0);
  const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
  const hash = anchor?.getAttribute('href');
  if (!hash || hash.length < 2 || !document.querySelector(hash)) return;
  event.preventDefault();
  // Two frames: the menu finishes rendering and refreshes ScrollTrigger first.
  requestAnimationFrame(() => requestAnimationFrame(() => goToSection(hash)));
});
renderMenu(false);

// Native dialog handles focus trapping, Escape and returning focus to its trigger.
const dialog = $<HTMLDialogElement>('#dish-dialog');
// A pointer click has no detail of 0; Enter or Space on the card has.
let dishOpenedByPointer = false;
function openDish(id: string, byPointer = false) {
  dishOpenedByPointer = byPointer;
  const dish = allDishes.find(dish => dish.id === id);
  if (!dish) return;
  const category = menu.find(category => category.id === dish.category)!;
  $('#dialog-content').innerHTML = `${dish.image ? `<img class="dialog-photo" src="${asset(dish.image)}" alt="${escape(`${dish.name}, ${category.label.toLowerCase()} du Safe Lounge`)}" width="1080" height="1080" />` : `<div class="dialog-photo no-photo"><img src="${asset('/assets/symbol-lilac.svg')}" alt="" /></div>`}<div class="dialog-copy"><p class="eyebrow">${escape(category.label)}</p><h2 id="dialog-title">${escape(dish.name)}</h2>${dish.price === null ? '' : `<strong class="dialog-price">${dish.price} €</strong>`}<p>${escape(dish.description)}</p>${dish.served ? `<p class="dialog-served">${escape(dish.served)}</p>` : ''}${dish.extra ? `<p class="dialog-extra">${escape(dish.extra)}</p>` : ''}<div class="dialog-allergens"><h3>Allergènes</h3>${dish.allergens.length ? `<ul>${dish.allergens.map(allergen => `<li>${escape(allergen)}</li>`).join('')}</ul>` : '<p>Aucun des 14 allergènes majeurs.</p>'}</div><div class="dialog-footer">D’après nos recettes. Tout est préparé dans la même cuisine : des traces restent possibles. Une allergie ? Signalez-la avant de commander.</div></div>`;
  dialog.showModal(); document.body.classList.add('dialog-open');
  if (canAnimate()) gsap.fromTo(dialog,{opacity:0,y:20,scale:.97},{opacity:1,y:0,scale:1,duration:.3,clearProps:'all'});
}
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) {const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();} });
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  // The dialog hands focus back to the card that opened it. For a keyboard user
  // that ring is the way back; after a click or a tap it is only a stray outline.
  if (dishOpenedByPointer) (document.activeElement as HTMLElement | null)?.blur();
});

const mobileQuery = matchMedia('(max-width: 760px)');
const holds: (() => void)[] = [];
function holdWhenOutOfSight(section: Element, holder: Element) {
  let onScreen = false;
  const refresh = () => holder.classList.toggle('rotation-hold', !onScreen || document.hidden || dialog.open);
  new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; refresh(); }, { threshold: .25 }).observe(section);
  holds.push(refresh);
}
const refreshHolds = () => holds.forEach(hold => hold());
document.addEventListener('visibilitychange', refreshHolds);
dialog.addEventListener('close', refreshHolds);
// A dialog opens on a click; the next frame is when its state is readable.
document.addEventListener('click', () => requestAnimationFrame(refreshHolds));

// The arrival fills its frame with one dish per craving, one after the other.
// The photos share the arrival's dark green backdrop, so they melt into it.
const HERO_PICKS = ['burger-smokey-beef-bacon','pizzas-burratella-lov','panuozzo-tartufo','pates-penne-saumon','salade-original-burrata','dessert-fondant-chocolat','dessert-tiramisu-coffee','crepe-nutella','dessert-brioche-perdue','milkshake-bueno','iced-latte-nocciola','mocktail-mojito-fraise'];
const DRINK_CATEGORIES = ['milkshake','iced-latte','mocktail','frappuccino'];
const heroDishes = HERO_PICKS.map(id => allDishes.find(dish => dish.id === id)!).filter(dish => dish?.image);
const heroSlides = $('.hero-slides');
const heroNow = $<HTMLButtonElement>('.hero-now');
const heroAlt = (dish: typeof heroDishes[number]) => `${dish.name}, ${menu.find(category => category.id === dish.category)!.label.toLowerCase()} du Safe Lounge`;
heroSlides.innerHTML = heroDishes.map((dish, index) => index === 0 ? heroSlides.innerHTML : `<img src="${asset(dish.image!)}" alt="${escape(heroAlt(dish))}" width="1080" height="1080" loading="lazy" />`).join('');
const heroImages = [...heroSlides.querySelectorAll('img')];
// Phone only: a blurred copy of each photo sits behind its lower part, so the
// photo's edges melt into its own colours instead of showing a seam. The top,
// behind the text, stays plain green.
const heroAmbient = $('.hero-ambient');
heroAmbient.innerHTML = heroDishes.map((dish, index) => `<img src="${asset(dish.image!)}" alt="" width="1080" height="1080" loading="lazy"${index === 0 ? ' class="is-on"' : ''} />`).join('');
const heroAmbientImages = [...heroAmbient.querySelectorAll('img')];
heroImages.forEach((image, index) => image.classList.toggle('is-tall', DRINK_CATEGORIES.includes(heroDishes[index].category)));
let currentHero = 0;
function showHero(next: number) {
  currentHero = (next + heroDishes.length) % heroDishes.length;
  const dish = heroDishes[currentHero];
  heroImages.forEach((image, index) => image.classList.toggle('is-on', index === currentHero));
  heroAmbientImages.forEach((image, index) => image.classList.toggle('is-on', index === currentHero));
  // Restart the timer so a swiped-to dish gets its full turn.
  const timer = $('.hero-timer'); timer.style.animation = 'none'; void timer.offsetWidth; timer.style.animation = '';
  const update = () => {
    $('#hero-tag').textContent = menu.find(category => category.id === dish.category)!.label;
    $('#hero-name').textContent = dish.name;
    $('#hero-price').innerHTML = dish.price === null ? '' : `${dish.price}<small>€</small>`;
    heroNow.dataset.open = dish.id;
  };
  if (!canAnimate()) { update(); return; }
  gsap.timeline().to(heroNow, { opacity: 0, y: 6, duration: .25, ease: 'power2.in' }).call(update).to(heroNow, { opacity: 1, y: 0, duration: .45, ease: 'power3.out', clearProps: 'transform,opacity' });
}
// A horizontal flick on a phone moves to the next or previous dish.
let heroSwipeX: number | null = null, heroSwipeY = 0;
const arrival = $('.arrival');
arrival.addEventListener('pointerdown', event => { heroSwipeX = event.clientX; heroSwipeY = event.clientY; });
arrival.addEventListener('pointerup', event => {
  if (heroSwipeX === null) return;
  const dx = event.clientX - heroSwipeX, dy = event.clientY - heroSwipeY;
  heroSwipeX = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) showHero(currentHero + (dx < 0 ? 1 : -1));
});
// No visible clock: an invisible CSS timer turns the dishes, and pauses with
// the same holds as the other rotations.
$('.hero-timer').addEventListener('animationiteration', () => showHero(currentHero + 1));
holdWhenOutOfSight(arrival, arrival);

const MARQUEE_SPEED = 88; // pixels per second
const marqueeTrack = document.querySelector<HTMLElement>('.marquee-track');
function layoutMarquee() {
  const group = marqueeTrack?.firstElementChild as HTMLElement | null;
  if (!marqueeTrack || !group) return;
  while (marqueeTrack.children.length > 1) marqueeTrack.lastElementChild!.remove();
  const width = group.getBoundingClientRect().width;
  if (!width) return;
  // One full group of extra width beyond the viewport keeps the loop seamless.
  const copies = Math.max(2, Math.ceil(window.innerWidth / width) + 1);
  for (let index = 1; index < copies; index += 1) marqueeTrack.append(group.cloneNode(true));
  marqueeTrack.style.setProperty('--marquee-shift', `-${width}px`);
  marqueeTrack.style.setProperty('--marquee-duration', `${(width / MARQUEE_SPEED).toFixed(2)}s`);
}
layoutMarquee();
document.fonts.ready.then(layoutMarquee);
let marqueeResize: number | undefined;
window.addEventListener('resize', () => { clearTimeout(marqueeResize); marqueeResize = setTimeout(layoutMarquee, 180); });

const toggle = $<HTMLButtonElement>('.nav-toggle');const mobileNav = $('#mobile-nav');
function closeNav() { toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-label','Ouvrir la navigation');mobileNav.hidden=true; }
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fermer la navigation':'Ouvrir la navigation');mobileNav.hidden=!open;});
mobileNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeNav));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobileNav.hidden){closeNav();toggle.focus();}});
// A tap anywhere outside the panel closes it, not only the cross.
document.addEventListener('click',event=>{
  if (mobileNav.hidden) return;
  const target = event.target as Element;
  if (target.closest('#mobile-nav') || target.closest('.nav-toggle')) return;
  closeNav();
});
function syncViewport(){categories.setAttribute('aria-orientation',mobileQuery.matches?'horizontal':'vertical');if(!mobileQuery.matches)closeNav();}
mobileQuery.addEventListener('change',syncViewport);syncViewport();

// Motion is optional. Scroll-based movement follows the visitor's own pace.
let animationContext: gsap.Context | undefined;
function setupMotion() {
  animationContext?.revert();
  document.documentElement.classList.toggle('motion-paused',motionPaused);
  if (motionPaused) { gsap.set('.dish-card',{clearProps:'all'}); return; }
  animationContext=gsap.context(()=>{
    gsap.from('.arrival h1 .h1-line',{y:55,opacity:0,rotation:3,stagger:.12,duration:1,ease:'power3.out'});
    gsap.from('.hero-now',{y:30,opacity:0,duration:1,delay:.3,ease:'power3.out'});
    gsap.utils.toArray<HTMLElement>('.reveal').forEach(element=>gsap.from(element,{y:45,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:element,start:'top 92%',once:true}}));
    gsap.utils.toArray<HTMLElement>('.lounge-tile').forEach((element,index)=>gsap.from(element,{y:40,opacity:0,duration:.8,delay:index*.1,ease:'power3.out',scrollTrigger:{trigger:'.lounge-strip',start:'top 94%',once:true}}));
  });
}
reducedQuery.addEventListener('change',event=>{motionPaused=event.matches;setupMotion();});
setupMotion();
window.addEventListener('load',()=>ScrollTrigger.refresh());
document.fonts.ready.then(()=>ScrollTrigger.refresh());
$('#year').textContent=String(new Date().getFullYear());

// Opening status in Paris time. A night past midnight belongs to the day it
// started: at 1 am on Saturday, Friday's service (open until 2 am) is running.
const CLOSING_HOUR = [1, 1, 1, 1, 1, 2, 2]; // after midnight, by opening day (Sunday first)
const openStatus = $('#open-status');
function updateOpenStatus() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find(part => part.type === 'weekday')!.value);
  const hour = Number(parts.find(part => part.type === 'hour')!.value);
  const serviceDay = hour < 5 ? (day + 6) % 7 : day;
  const closes = CLOSING_HOUR[serviceDay];
  const open = hour < 5 ? hour < closes : hour >= 15;
  $('#open-status-text').textContent = open
    ? `Ouvert maintenant · jusqu’à ${String(closes).padStart(2, '0')}h`
    : `Fermé · ouvre ${hour < 5 ? 'à' : 'aujourd’hui à'} 15h`;
  openStatus.classList.toggle('is-open', open);
  openStatus.classList.toggle('is-closed', !open);
  openStatus.hidden = false;
  document.querySelectorAll<HTMLElement>('.hours li').forEach(row => row.classList.toggle('today', row.dataset.days!.split(' ').includes(String(serviceDay))));
}
updateOpenStatus();
setInterval(updateOpenStatus, 60_000);
