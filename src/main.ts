import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import rawMenu from './menu.json';
import { initMedia } from './media';
import { asset } from './asset';

gsap.registerPlugin(ScrollTrigger);
interface Dish { id: string; name: string; description: string; extra: string; price: number; image: string | null; sourceImage: string | null }
interface Category { id: string; label: string; description: string; source: string; items: Dish[] }
// The default category leads the list; the rest keeps a plates-sweets-drinks reading.
const DISPLAY_ORDER = ['burgers','pizzas','pates','salades','desserts','crepes','milkshakes','mocktails','boissons','hookah'];
const menu = (rawMenu as Category[]).slice().sort((a, b) => DISPLAY_ORDER.indexOf(a.id) - DISPLAY_ORDER.indexOf(b.id));
const allDishes = menu.flatMap(category => category.items.map(dish => ({ ...dish, category: category.id })));
const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let selectedCategory = 'burgers';
const search = $<HTMLInputElement>('#dish-search');
const grid = $('#dish-grid');
const panel = $('#menu-panel');
const titles: Record<string, string> = { burgers: 'Burgers gourmets', pizzas: 'Pizzas traditionnelles', hookah: 'Les formules lounge' };
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = reducedQuery.matches;
try { motionPaused = motionPaused || localStorage.getItem('safe-motion-paused') === 'true'; } catch { /* Preferences are optional. */ }
const canAnimate = () => !motionPaused;
const categories = $('#categories');
categories.innerHTML = menu.map(category => `<button role="tab" id="tab-${category.id}" aria-controls="menu-panel" aria-selected="${category.id === selectedCategory}" tabindex="${category.id === selectedCategory ? '0' : '-1'}" data-category="${category.id}"><span>${category.label}</span><span class="category-count">${String(category.items.length).padStart(2,'0')}</span><span class="category-arrow">↗︎</span></button>`).join('');
const tabs = [...categories.querySelectorAll<HTMLButtonElement>('button')];

function renderMenu(animate = true) {
  const query = normalize(search.value.trim());
  const category = menu.find(category => category.id === selectedCategory)!;
  const dishes = query ? allDishes.filter(dish => normalize(`${dish.name} ${dish.description} ${menu.find(c => c.id === dish.category)!.label}`).includes(query)) : category.items;
  $('#category-title').textContent = query ? 'Votre envie, à la carte.' : titles[category.id] || category.label;
  $('#category-description').textContent = query ? `Recherche dans toute la carte : « ${search.value.trim()} »` : category.description;
  $('#result-count').textContent = `${dishes.length} ${dishes.length === 1 ? 'choix' : 'choix'}`;
  $<HTMLButtonElement>('.clear-search').hidden = !query;
  tabs.forEach(tab => { const active = !query && tab.dataset.category === category.id; tab.setAttribute('aria-selected',String(active)); tab.tabIndex = tab.dataset.category === category.id ? 0 : -1; });
  if (query) { panel.removeAttribute('aria-labelledby'); panel.setAttribute('aria-label','Résultats de recherche dans toute la carte'); }
  else { panel.setAttribute('aria-labelledby',`tab-${category.id}`); panel.removeAttribute('aria-label'); }
  grid.innerHTML = dishes.length ? dishes.map((dish, index) => `<button class="dish-card" data-open="${dish.id}" aria-label="Voir ${escape(dish.name)}, ${dish.price} euros"><div class="dish-photo">${dish.image ? `<img src="${asset(dish.image)}" alt="${escape(dish.name)}" width="1080" height="1080" loading="${index < 3 ? 'eager' : 'lazy'}" />` : `<div class="no-photo"><img src="${asset('/assets/symbol-lilac.svg')}" alt="" /><span>LES RAFRAÎCHISSEMENTS</span></div>`}<span class="dish-open">↗︎</span></div><div class="dish-title"><h4>${dish.id === 'boissons-5' ? 'Les boissons fraîches' : escape(dish.name)}</h4><span>${dish.price}<small>€</small></span></div><p>${escape(dish.id === 'boissons-5' ? dish.name : dish.description || (category.id === 'milkshakes' ? 'Milkshake' : ''))}</p>${dish.extra ? `<span class="dish-extra">${escape(dish.extra)}</span>` : ''}</button>`).join('') : '<div class="no-results"><span>Rien dans l’assiette… pour le moment.</span><p>Essayez « pizza », « chocolat » ou « poulet ».</p><button type="button" data-clear>Revenir à la carte ↗︎</button></div>';
  if (animate && canAnimate()) gsap.fromTo('.dish-card',{y:24,opacity:0},{y:0,opacity:1,duration:.45,stagger:.045,ease:'power2.out',clearProps:'transform,opacity'});
  requestAnimationFrame(() => ScrollTrigger.refresh());
}
function selectCategory(id: string) {
  selectedCategory = id; search.value = ''; renderMenu();
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
  if (dishLink) openDish(dishLink.dataset.open!);
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
function openDish(id: string) {
  const dish = allDishes.find(dish => dish.id === id)!;
  const category = menu.find(category => category.id === dish.category)!;
  $('#dialog-content').innerHTML = `${dish.image ? `<img class="dialog-photo" src="${asset(dish.image)}" alt="${escape(dish.name)}" width="1080" height="1080" />` : `<div class="dialog-photo no-photo"><img src="${asset('/assets/symbol-lilac.svg')}" alt="" /></div>`}<div class="dialog-copy"><p class="eyebrow">${escape(category.label)}</p><h2 id="dialog-title">${dish.id === 'boissons-5' ? 'Les boissons fraîches' : escape(dish.name)}</h2><strong class="dialog-price">${dish.price} €</strong><p>${escape(dish.id === 'boissons-5' ? dish.name : dish.description)}</p>${dish.extra ? `<p class="dialog-extra">${escape(dish.extra)}</p>` : ''}${category.id === 'burgers' ? '<p class="dialog-extra">Servi avec frites allumettes croustillantes.</p>' : ''}<div class="dialog-footer">${category.id === 'hookah' ? 'Espace hookah réservé aux adultes.' : 'Une question sur les allergènes ? Notre équipe vous renseigne.'}</div></div>`;
  dialog.showModal(); document.body.classList.add('dialog-open');
  if (canAnimate()) gsap.fromTo(dialog,{opacity:0,y:20,scale:.97},{opacity:1,y:0,scale:1,duration:.3,clearProps:'all'});
}
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) {const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();} });
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));

const slides = [
  {id:'pizzas-3',name:'Sugar Pepperoni',tag:'CUITE SUR PIERRE',image:'PEPERONI.jpg',price:12,shape:'pizza'},
  {id:'burgers-5',name:'Smokey Bacon',tag:'SERVI AVEC FRITES',image:'smokey.jpg',price:14,shape:'burger'},
  {id:'desserts-4',name:'Tiramisu Pistachio',tag:'LA TOUCHE SUCRÉE',image:'pistache.jpg',price:9,shape:'dessert'},
];
let currentSlide = 0;
const heroFood = $('.hero-food');
const slideButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-slide]')];
let slideTimeline: gsap.core.Timeline | undefined;
function changeSlide(index: number) {
  if (index === currentSlide) return;
  currentSlide = index;
  slideButtons.forEach((button,i) => { button.classList.toggle('selected',i===index);button.setAttribute('aria-pressed',String(i===index)); });
  const slide = slides[index];
  const update = () => {
    const image = $<HTMLImageElement>('#hero-image'); image.src=asset('/assets/menu/'+slide.image); image.alt=slide.name;
    heroFood.className='hero-food '+slide.shape;
    $('#hero-dish-name').textContent=slide.name;
    $('.hero-dish-label small').textContent=slide.tag;
    $('.hero-dish-label').dataset.open=slide.id;
    $('#hero-price').innerHTML=`${slide.price}<small>€</small>`;
  };
  slideTimeline?.kill();
  if (!canAnimate()) {update();gsap.set(heroFood,{clearProps:'transform,opacity'});return;}
  slideTimeline = gsap.timeline().to(heroFood,{scale:.82,rotation:-12,opacity:0,duration:.22,ease:'power2.in'}).call(update).fromTo(heroFood,{scale:.8,rotation:12,opacity:0},{scale:1,rotation:0,opacity:1,duration:.65,ease:'power3.out',clearProps:'transform,opacity'});
}
slideButtons.forEach(button=>button.addEventListener('click',()=>changeSlide(Number(button.dataset.slide))));

// The three dishes and the desserts rotate on their own. The progress bar *is*
// the timer: it is a CSS animation, so pausing it — off screen, behind a dialog,
// on the motion toggle or under a reduced-motion preference — stops the rotation
// too, and the two can never drift apart.
function autoRotate(bars: HTMLElement[], advance: () => void) {
  bars.forEach(bar => bar.addEventListener('animationend', event => {
    if ((event as AnimationEvent).animationName === 'slide-progress') advance();
  }));
}
const filmDialog = $<HTMLDialogElement>('#film-dialog');
const mobileQuery = matchMedia('(max-width: 760px)');
const holds: (() => void)[] = [];
function holdWhenOutOfSight(section: Element, holder: Element) {
  let onScreen = false;
  const refresh = () => holder.classList.toggle('rotation-hold', !onScreen || document.hidden || dialog.open || filmDialog.open);
  new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; refresh(); }, { threshold: .25 }).observe(section);
  holds.push(refresh);
}
const refreshHolds = () => holds.forEach(hold => hold());
document.addEventListener('visibilitychange', refreshHolds);
[dialog, filmDialog].forEach(element => element.addEventListener('close', refreshHolds));
// A dialog opens on a click; the next frame is when its state is readable.
document.addEventListener('click', () => requestAnimationFrame(refreshHolds));
autoRotate(slideButtons.map(button => button.querySelector('i')!), () => changeSlide((currentSlide + 1) % slides.length));
holdWhenOutOfSight($('.hero'), $('.hero-bottom'));

const sweets = [
  {id:'desserts-4',name:'Tiramisu pistachio',image:'pistache.jpg',price:9},
  {id:'desserts-1',name:'Fondant chocolat',image:'fondant.jpg',price:7},
  {id:'desserts-6',name:'Brioche perdue',image:'brioche.jpg',price:11},
  {id:'desserts-3',name:'Tiramisu nutella-spéculoos',image:'speculoos2.jpg',price:9},
];
let currentSweet = 0;
const sweetImage = $<HTMLImageElement>('#sweet-image');
const sweetDots = $('.sweet-dots');
sweetDots.innerHTML = sweets.map((sweet, index) => `<button data-sweet="${index}" aria-pressed="${index === 0}" aria-label="Voir ${escape(sweet.name)}"><i></i></button>`).join('');
const sweetButtons = [...sweetDots.querySelectorAll<HTMLButtonElement>('button')];
let sweetTimeline: gsap.core.Timeline | undefined;
function changeSweet(index: number) {
  if (index === currentSweet) return;
  currentSweet = index;
  const sweet = sweets[index];
  sweetButtons.forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
  const update = () => {
    sweetImage.src = asset('/assets/menu/' + sweet.image);
    sweetImage.alt = sweet.name;
    $('#sweet-name').textContent = sweet.name.toUpperCase();
    $('#sweet-cost').textContent = `${sweet.price} €`;
    $('.sweet-price').dataset.open = sweet.id;
  };
  sweetTimeline?.kill();
  if (!canAnimate()) { update(); gsap.set(sweetImage, { clearProps: 'transform,opacity' }); return; }
  sweetTimeline = gsap.timeline()
    .to(sweetImage,{scale:.86,rotation:-10,opacity:0,duration:.25,ease:'power2.in'})
    .call(update)
    .fromTo(sweetImage,{scale:.88,rotation:10,opacity:0},{scale:1,rotation:0,opacity:1,duration:.6,ease:'power3.out',clearProps:'transform,opacity'});
}
sweetButtons.forEach(button => button.addEventListener('click', () => changeSweet(Number(button.dataset.sweet))));
autoRotate(sweetButtons.map(button => button.querySelector('i')!), () => changeSweet((currentSweet + 1) % sweets.length));
holdWhenOutOfSight($('.sweet-section'), $('.sweet-dots'));

// On phones the appetite cards are a swipe rail. It advances on its own so the
// second and third cards are seen at all, and hands over for good the moment the
// visitor touches, drags or scrolls it themselves.
const rail = $('.craving-grid');
const railCards = [...rail.querySelectorAll<HTMLElement>('.craving-card')];
const railDots = $('.craving-dots');
railDots.innerHTML = railCards.map((card, index) => {
  const label = card.querySelector('h3')!.textContent!.replace(/\.$/, '');
  return `<button data-rail="${index}" aria-pressed="${index === 0}" aria-label="Voir ${escape(label)}"><i></i></button>`;
}).join('');
const railButtons = [...railDots.querySelectorAll<HTMLButtonElement>('button')];
let railIndex = 0;
let railStep = 1;
let railTimer: number | undefined;
let railTakenOver = false;
let railInView = false;
// Any scroll of the rail outside this window came from the visitor, not from us.
let ownScrollUntil = 0;
function railRuns() {
  return canAnimate() && mobileQuery.matches && railInView && !railTakenOver
    && !document.hidden && !dialog.open && !filmDialog.open && rail.scrollWidth > rail.clientWidth + 4;
}
function showRailCard(index: number) {
  railIndex = index;
  railButtons.forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
  ownScrollUntil = performance.now() + 900;
  rail.scrollTo({ left: railCards[index].offsetLeft - railCards[0].offsetLeft, behavior: canAnimate() ? 'smooth' : 'auto' });
}
function advanceRail() {
  if (railIndex + railStep >= railCards.length || railIndex + railStep < 0) railStep = -railStep;
  showRailCard(railIndex + railStep);
}
function syncRail() {
  clearInterval(railTimer);
  if (railRuns()) railTimer = setInterval(advanceRail, 3200);
}
function railHandOver() { railTakenOver = true; syncRail(); }
// A tap, or a finger scrolling the page over the cards, must not count as taking
// over — only a scroll of the rail itself that we did not start.
rail.addEventListener('scroll', () => {
  if (performance.now() > ownScrollUntil) railHandOver();
  const here = rail.scrollLeft + rail.clientWidth / 2;
  const nearest = railCards.reduce((best, card, index) =>
    Math.abs(card.offsetLeft - railCards[0].offsetLeft + card.clientWidth / 2 - here) <
    Math.abs(railCards[best].offsetLeft - railCards[0].offsetLeft + railCards[best].clientWidth / 2 - here) ? index : best, 0);
  railIndex = nearest;
  railButtons.forEach((button, position) => button.setAttribute('aria-pressed', String(position === nearest)));
}, { passive: true });
rail.addEventListener('keydown', railHandOver);
railButtons.forEach(button => button.addEventListener('click', () => { railHandOver(); showRailCard(Number(button.dataset.rail)); }));
new IntersectionObserver(entries => { railInView = entries[0].isIntersecting; syncRail(); }, { threshold: .3 }).observe(rail);
holds.push(syncRail);
mobileQuery.addEventListener('change', syncRail);

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
const media = initMedia(motionPaused);
let animationContext: gsap.Context | undefined;
function setupMotion() {
  animationContext?.revert();
  media.setMotionPaused(motionPaused);
  document.documentElement.classList.toggle('motion-paused',motionPaused);
  $('#motion-toggle').setAttribute('aria-pressed',String(motionPaused));
  $('#motion-label').textContent=motionPaused?'Animations en pause':'Animations activées';
  if (motionPaused) { gsap.set('.dish-card',{clearProps:'all'}); return; }
  animationContext=gsap.context(()=>{
    gsap.from('.arrival h1 span',{y:55,opacity:0,rotation:3,stagger:.12,duration:1,ease:'power3.out'});
    gsap.to('.arrival-background',{yPercent:12,ease:'none',scrollTrigger:{trigger:'.arrival',start:'top top',end:'bottom top',scrub:1}});
    gsap.from('.arrival-film',{y:45,opacity:0,rotation:4,duration:1.1,ease:'power3.out'});
    gsap.from('.hero-food-wrap',{scale:.8,opacity:0,duration:1.3,ease:'power3.out'});
    gsap.to('.hero-food-wrap',{rotation:24,y:65,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
    gsap.to('.hero-symbol',{rotation:180,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
    gsap.utils.toArray<HTMLElement>('.reveal').forEach(element=>gsap.from(element,{y:45,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:element,start:'top 92%',once:true}}));
    gsap.utils.toArray<HTMLElement>('.craving-card').forEach((element,index)=>gsap.from(element,{y:70,opacity:0,rotation:index%2?-3:3,duration:.85,delay:index*.08,ease:'power3.out',scrollTrigger:{trigger:element,start:'top 94%',once:true}}));
    gsap.to('.sweet-photo>img',{rotation:35,ease:'none',scrollTrigger:{trigger:'.sweet-section',start:'top bottom',end:'bottom top',scrub:1}});
    gsap.fromTo('.sweet-sticker',{rotation:-15},{rotation:10,ease:'none',scrollTrigger:{trigger:'.sweet-section',start:'top bottom',end:'bottom top',scrub:1}});
    gsap.utils.toArray<HTMLElement>('.lounge-tile').forEach((element,index)=>gsap.from(element,{y:40,opacity:0,duration:.8,delay:index*.1,ease:'power3.out',scrollTrigger:{trigger:'.lounge-strip',start:'top 94%',once:true}}));
  });
}
$('#motion-toggle').addEventListener('click',()=>{motionPaused=!motionPaused;try{localStorage.setItem('safe-motion-paused',String(motionPaused));}catch{} setupMotion();});
reducedQuery.addEventListener('change',event=>{motionPaused=event.matches;setupMotion();});
setupMotion();
window.addEventListener('load',()=>ScrollTrigger.refresh());
document.fonts.ready.then(()=>ScrollTrigger.refresh());
$('#year').textContent=String(new Date().getFullYear());
