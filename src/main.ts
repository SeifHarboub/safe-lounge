import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import rawMenu from './menu.json';
import { initDish3D } from './dish3d';
import { asset } from './asset';

gsap.registerPlugin(ScrollTrigger);
interface Dish { id: string; name: string; description: string; extra: string; price: number | null; image: string | null; sourceImage: string | null }
interface Category { id: string; label: string; description: string; source: string; items: Dish[] }
// Follow a natural meal journey: savoury dishes, dessert, then cold drinks and coffees.
const DISPLAY_ORDER = ['burger','panuozzo','pizzas','pates','tiramisu','mocktail','milkshake','iced-latte','frappuccino'];
const menu = (rawMenu as Category[]).slice().sort((a, b) => DISPLAY_ORDER.indexOf(a.id) - DISPLAY_ORDER.indexOf(b.id));
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
  $('#category-description').textContent = query ? `Recherche dans toute la carte : « ${search.value.trim()} »` : category.description;
  // An empty category says so once, in the box below: no count, no second notice.
  $('#result-count').textContent = dishes.length ? `${dishes.length} choix` : '';
  $<HTMLButtonElement>('.clear-search').hidden = !query;
  tabs.forEach(tab => { const active = !query && tab.dataset.category === category.id; tab.setAttribute('aria-selected',String(active)); tab.tabIndex = tab.dataset.category === category.id ? 0 : -1; });
  if (query) { panel.removeAttribute('aria-labelledby'); panel.setAttribute('aria-label','Résultats de recherche dans toute la carte'); }
  else { panel.setAttribute('aria-labelledby',`tab-${category.id}`); panel.removeAttribute('aria-label'); }
  grid.innerHTML = dishes.length ? dishes.map((dish, index) => { const label = menu.find(c => c.items.some(item => item.id === dish.id))!.label; return `<button class="dish-card" data-open="${dish.id}" aria-label="Voir ${escape(dish.name)}${dish.price === null ? '' : `, ${dish.price} euros`}"><div class="dish-frame"><div class="dish-photo">${dish.image ? `<img src="${asset(dish.image)}" alt="${escape(`${dish.name}, ${label.toLowerCase()} du Safe Lounge à Noisy-le-Sec`)}" width="1080" height="1080" loading="${index < 3 ? 'eager' : 'lazy'}" />` : `<div class="no-photo"><img src="${asset('/assets/symbol-lilac.svg')}" alt="" /><span>BIENTÔT À LA CARTE</span></div>`}<span class="dish-open">↗︎</span></div></div><div class="dish-title"><h4>${escape(dish.name)}</h4>${dish.price === null ? '' : `<span>${dish.price}<small>€</small></span>`}</div><p>${escape(dish.description)}</p>${dish.extra ? `<span class="dish-extra">${escape(dish.extra)}</span>` : ''}</button>`; }).join('') : '<div class="no-results"><span>Cette catégorie arrive bientôt.</span><p>Notre équipe finalise cette sélection. En attendant, demandez-nous ce qui est servi sur place.</p></div>';
  if (animate && canAnimate()) gsap.fromTo('.dish-card',{y:24,opacity:0},{y:0,opacity:1,duration:.45,stagger:.045,ease:'power2.out',clearProps:'transform,opacity'});
  requestAnimationFrame(() => ScrollTrigger.refresh());
}
function selectCategory(id: string) {
  if (!menu.some(category => category.id === id)) return;
  selectedCategory = id; search.value = ''; renderMenu();
  if (!mobileQuery.matches) return;
  // On a phone the tabs are one sticky row: centre the chosen tab, and if the
  // row is stuck at the top, bring the start of the list back under it.
  const tab = tabs.find(tab => tab.dataset.category === id)!;
  const behavior = canAnimate() ? 'smooth' : 'auto';
  categories.scrollTo({ left: tab.offsetLeft - (categories.clientWidth - tab.offsetWidth) / 2, behavior });
  // Two frames: renderMenu's ScrollTrigger refresh would cancel a smooth scroll started now.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const offset = $('.menu-results').getBoundingClientRect().top - $('.menu-sidebar').offsetHeight;
    if (offset < 0) window.scrollTo({ top: window.scrollY + offset, behavior });
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
  $('#dialog-content').innerHTML = `${dish.image ? `<img class="dialog-photo" src="${asset(dish.image)}" alt="${escape(`${dish.name}, ${category.label.toLowerCase()} du Safe Lounge`)}" width="1080" height="1080" />` : `<div class="dialog-photo no-photo"><img src="${asset('/assets/symbol-lilac.svg')}" alt="" /></div>`}<div class="dialog-copy"><p class="eyebrow">${escape(category.label)}</p><h2 id="dialog-title">${escape(dish.name)}</h2>${dish.price === null ? '' : `<strong class="dialog-price">${dish.price} €</strong>`}<p>${escape(dish.description)}</p>${dish.extra ? `<p class="dialog-extra">${escape(dish.extra)}</p>` : ''}<div class="dialog-footer">Une question sur les allergènes ? Notre équipe vous renseigne.</div></div>`;
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

// The arrival shows three dishes of the new menu in relief, one after the other.
const reliefDishes = [
  {id:'burger-smokey-beef-bacon',width:1302,height:684,name:'Smokey Beef Bacon',tag:'BURGER · DOUBLE SMASH & BACON DE BŒUF',alt:'Le burger Smokey Beef Bacon du Safe Lounge : double smash, cheddar fondu et bacon de bœuf, servi avec ses frites'},
  {id:'pizzas-burratella-lov',width:1255,height:915,name:'Burratella Lov’',tag:'PIZZA · STRACCIATELLA & JAMBON CRU',alt:'La pizza Burratella Lov’ du Safe Lounge : stracciatella, jambon cru, tomates cerises, copeaux de parmesan et crème balsamique'},
  {id:'pates-penne-forestiere',width:1281,height:802,name:'Penne Forestière',tag:'PÂTES · POULET & CHAMPIGNONS',alt:'Les Penne Forestière du Safe Lounge : poulet, champignons émincés, sauce à la crème et parmesan'},
].map(dish => ({ ...dish, image:`/assets/hero-3d/${dish.id}.webp`, depth:`/assets/hero-3d/${dish.id}-depth.webp` }));
const reliefStage = $('[data-dish3d-stage]');
const relief = initDish3D(reliefStage, reliefDishes);
const reliefSpin = $('.dish3d-spin');
const reliefCaption = $('.dish3d-caption');
let currentRelief = 0;
let reliefTimeline: gsap.core.Timeline | undefined;
// The dish sits on the bottom of the stage and fills it by width or by height,
// so its top moves from one dish to the next. The label rests just above it.
function placeReliefCaption() {
  const dish = reliefDishes[currentRelief];
  const stageRatio = reliefStage.clientWidth / Math.max(1, reliefStage.clientHeight);
  const filled = Math.min(1, stageRatio / (dish.width / dish.height));
  // Each cut-out keeps a 24 px transparent margin around the dish.
  reliefStage.style.setProperty('--dish-rise', `${(filled * (1 - 24 / dish.height) * 100).toFixed(1)}%`);
}
placeReliefCaption();
new ResizeObserver(placeReliefCaption).observe(reliefStage);
function changeRelief(index: number) {
  if (index === currentRelief) return;
  currentRelief = index;
  const dish = reliefDishes[index];
  const update = () => {
    relief.show(index);
    placeReliefCaption();
    $('#dish3d-name').textContent = dish.name;
    $('#dish3d-tag').textContent = dish.tag;
    $('.dish3d-caption').dataset.open = dish.id;
  };
  reliefTimeline?.kill();
  if (!canAnimate()) { update(); gsap.set([reliefSpin, reliefCaption], { clearProps: 'transform,opacity' }); return; }
  // The dish spins away on its vertical axis and the next one spins in.
  reliefTimeline = gsap.timeline()
    .to(reliefSpin, { rotationY: -75, scale: .86, opacity: 0, duration: .32, ease: 'power2.in' })
    .to(reliefCaption, { y: -8, opacity: 0, duration: .25, ease: 'power2.in' }, 0)
    .call(update)
    .fromTo(reliefSpin, { rotationY: 75, scale: .86, opacity: 0 }, { rotationY: 0, scale: 1, opacity: 1, duration: .8, ease: 'power3.out', clearProps: 'transform,opacity' })
    .fromTo(reliefCaption, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out', clearProps: 'transform,opacity' }, '<.1');
}
// No visible control: an invisible CSS timer turns the dishes, and pauses with
// the same holds as the other rotations.
$('.dish3d-timer').addEventListener('animationiteration', () => changeRelief((currentRelief + 1) % reliefDishes.length));
holdWhenOutOfSight($('.arrival'), $('.arrival-dish'));

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
  relief.setPaused(motionPaused);
  document.documentElement.classList.toggle('motion-paused',motionPaused);
  if (motionPaused) { gsap.set('.dish-card',{clearProps:'all'}); return; }
  animationContext=gsap.context(()=>{
    gsap.from('.arrival h1 .h1-line',{y:55,opacity:0,rotation:3,stagger:.12,duration:1,ease:'power3.out'});
    gsap.to('.arrival-background',{yPercent:12,ease:'none',scrollTrigger:{trigger:'.arrival',start:'top top',end:'bottom top',scrub:1}});
    gsap.from('.arrival-dish',{y:45,opacity:0,duration:1.1,ease:'power3.out'});
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
