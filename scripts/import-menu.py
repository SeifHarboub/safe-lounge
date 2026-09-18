"""Convertit l'archive des pages du site client en carte structurée, sans inventer de contenu."""
import json,re,html
from pathlib import Path
raw=json.loads(Path('research/original-menu.json').read_text())
labels={'salades':('Salades','De la fraîcheur dans l’assiette.'),'pates':('Pâtes fraîches','Préparées à la minute.'),'pizzas':('Pizzas','Traditionnelles, cuites sur pierre.'),'burgers':('Burgers','Servis avec des frites allumettes croustillantes.'),'desserts':('Desserts','Une dernière touche de gourmandise.'),'crepes':('Crêpes sucrées','Pour prolonger le plaisir.'),'milkshakes':('Milkshakes','Une pause tout en douceur.'),'mocktails':('Mocktails','Des mélanges fruités, sans alcool.'),'boissons':('Boissons','Boissons chaudes et rafraîchissements.'),'hookah':('Chichas','Les formules du lounge.')}
def clean(s):return html.unescape(re.sub('<[^>]+>','',s)).replace('\xa0',' ').strip()
result=[]
for page in raw:
 slug=page['slug'];items=[];current_image=None
 for module in page['modules']:
  s=module['html'];img=re.search(r'<img[^>]+src="([^"]+)"',s)
  if img:current_image=img.group(1)
  heading=re.search(r'<h3[^>]*>(.*?)</h3>',s,re.S)
  if not heading:continue
  price=re.search(r'<h4[^>]*>\s*(\d+)\s*€',s,re.S)
  if not price:price=re.search(r'(\d+)\s*€',s)
  if not price:continue
  name=clean(heading.group(1));paras=[clean(p) for p in re.findall(r'<p[^>]*>(.*?)</p>',s,re.S)]
  paras=[re.sub(r'\s*\d+€\s*$','',p) if p.endswith('9€') else p for p in paras]
  # The drinks list is a single 5€ entry on the original menu, without a photo.
  if slug=='boissons' and 'COCA' in name.upper():current_image=None
  items.append({'id':slug+'-'+str(len(items)+1),'name':name.capitalize(),'description':paras[0] if paras else '', 'extra':' · '.join(paras[1:]),'price':int(price.group(1)),'image':'/assets/menu/'+current_image.rsplit('/',1)[1] if current_image else None,'sourceImage':current_image})
 result.append({'id':slug,'label':labels[slug][0],'description':labels[slug][1],'source':'https://lesafelounge.com/'+slug,'items':items})
Path('src/menu.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
for c in result: print(c['label'],len(c['items']),[(x['name'],x['price']) for x in c['items']])
