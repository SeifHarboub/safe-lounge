import { asset } from './asset';

interface Film { title: string; description: string; code: string }
const films: Record<string, Film> = {
  'safe-moments': { title:'Un moment au Safe.', description:'Une table entre amis, les plats et l’ambiance du salon.', code:'DbWcW3BNjET' },
  'ambiance': { title:'Bienvenue au Safe.', description:'Découvrez le lieu, depuis la façade jusqu’aux espaces du lounge.', code:'DbOhImpNEXd' },
  'a-table': { title:'Une table qui donne envie.', description:'Pizzas, pâtes et boissons, servis à table au Safe Lounge.', code:'Da5rrZ4NH4r' },
  'en-cuisine': { title:'Le goût du fait maison.', description:'Les coulisses de la préparation du panuozzo, présenté sur Instagram. Disponibilité à demander sur place.', code:'DcohjEDt2Tn' },
};

export function initMedia(initialMotionPaused: boolean) {
  const preview = document.querySelector<HTMLVideoElement>('#arrival-video')!;
  const previewToggle = document.querySelector<HTMLButtonElement>('#preview-toggle')!;
  const dialog = document.querySelector<HTMLDialogElement>('#film-dialog')!;
  const player = document.querySelector<HTMLVideoElement>('#film-player')!;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  let motionPaused = initialMotionPaused;
  let inView = false;
  let manualPlay = false;
  let manualPause = false;
  let playRequest = 0;
  let lastTrigger: HTMLElement | null = null;
  preview.muted = true;

  const shouldPlay = () => inView && !document.hidden && !dialog.open && !manualPause && (manualPlay || (!motionPaused && !connection?.saveData));
  function refresh() {
    const request = ++playRequest;
    if (!shouldPlay()) { preview.pause(); return; }
    if (!preview.getAttribute('src')) preview.src = asset(preview.dataset.src!);
    preview.play().then(() => { if (request !== playRequest || !shouldPlay()) preview.pause(); }).catch(() => { /* Poster and explicit play control remain available when autoplay is blocked. */ });
  }
  function updatePreviewControl() {
    const playing = !preview.paused;
    previewToggle.setAttribute('aria-pressed',String(playing));
    previewToggle.setAttribute('aria-label',playing ? 'Mettre l’aperçu vidéo en pause' : 'Lire l’aperçu vidéo');
    previewToggle.innerHTML = `<span aria-hidden="true">${playing ? 'Ⅱ' : '▶'}</span>`;
  }
  preview.addEventListener('play',updatePreviewControl);
  preview.addEventListener('pause',updatePreviewControl);
  preview.addEventListener('error',() => { previewToggle.disabled=true;previewToggle.setAttribute('aria-label','Aperçu vidéo indisponible'); });
  previewToggle.addEventListener('click',()=>{if(preview.paused){manualPlay=true;manualPause=false;}else{manualPause=true;manualPlay=false;}refresh();});
  const observer = new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;refresh();},{threshold:.2});
  observer.observe(preview);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();refresh();});
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
    dialog.showModal();document.body.classList.add('dialog-open');refresh();
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
    document.body.classList.remove('dialog-open');lastTrigger?.focus({preventScroll:true});refresh();
  });
  return { setMotionPaused(paused: boolean) {motionPaused=paused;if(paused)manualPlay=false;refresh();} };
}
