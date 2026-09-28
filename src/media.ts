import { asset } from './asset';

interface Film { title: string; description: string; code: string }
const films: Record<string, Film> = {
  'ambiance': { title:'Bienvenue au Safe.', description:'Découvrez le lieu, depuis la façade jusqu’aux espaces du lounge.', code:'DbOhImpNEXd' },
  'a-table': { title:'Une table qui donne envie.', description:'Pizzas, pâtes et boissons, servis à table au Safe Lounge.', code:'Da5rrZ4NH4r' },
  'en-cuisine': { title:'Le goût du fait maison.', description:'Les coulisses de la préparation du panuozzo, présenté sur Instagram. Disponibilité à demander sur place.', code:'DcohjEDt2Tn' },
};

export function initMedia() {
  const dialog = document.querySelector<HTMLDialogElement>('#film-dialog')!;
  const player = document.querySelector<HTMLVideoElement>('#film-player')!;
  let lastTrigger: HTMLElement | null = null;
  document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});
  document.addEventListener('click',event=>{
    const trigger=(event.target as Element).closest<HTMLElement>('[data-film]');
    if(!trigger)return;
    const id=trigger.dataset.film!;const film=films[id];if(!film)return;
    lastTrigger=trigger;
    document.querySelector('#film-title')!.textContent=film.title;
    document.querySelector('#film-description')!.textContent=film.description;
    (document.querySelector('#film-source') as HTMLAnchorElement).href=`https://www.instagram.com/lesafelounge/reel/${film.code}/`;
    player.poster=asset(`/assets/instagram/${id}.jpg`);
    player.src=asset(`/assets/instagram/${id}.mp4`);
    player.setAttribute('aria-label',film.title+' '+film.description);
    dialog.showModal();document.body.classList.add('dialog-open');
    // Sound is enabled only after the visitor explicitly opens a film.
    player.muted=false;
    player.play().catch(()=>{ /* Native controls allow a second explicit play attempt. */ });
  });
  document.querySelector('.film-close')!.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const bounds=dialog.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();
  });
  dialog.addEventListener('close',()=>{
    player.pause();player.removeAttribute('src');player.load();
    document.body.classList.remove('dialog-open');lastTrigger?.focus({preventScroll:true});
  });
}
