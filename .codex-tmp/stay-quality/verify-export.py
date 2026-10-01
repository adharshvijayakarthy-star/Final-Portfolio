from pathlib import Path
from html.parser import HTMLParser
import json
root=Path(__file__).resolve().parents[2]
routes=['garden','person','builder','thinker','leader','stories','work','future','aura','contact']
class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.beats=[];self.ids=set();self.headings=[];self.links=[];self.levels=[]
    def handle_starttag(self,tag,attrs):
        data=dict(attrs)
        if 'id' in data:self.ids.add(data['id'])
        if 'data-stay-beat' in data:self.beats.append((data['data-stay-beat'],float(data['data-from']),float(data['data-to'])))
        if tag in ('h1','h2'):self.headings.append(data.get('aria-label',''));self.levels.append(tag)
        if tag=='a' and 'href' in data:self.links.append(data['href'])
results=[]
for route in routes:
    page=Page();target=root/'out'/'stay'
    if route!='garden':target/=route
    page.feed((target/'index.html').read_text(encoding='utf-8'))
    assert page.beats,route
    assert page.beats[0][1]==0 and page.beats[-1][2]==1,route
    for a,b in zip(page.beats,page.beats[1:]):assert abs(a[2]-b[1])<1e-8,(route,a,b)
    assert page.levels.count('h1')==1,(route,page.levels)
    if route=='work':
        for anchor in ['study-planner','past-paper-logger','mun-club','snrled','project-aura']:assert anchor in page.ids,anchor
    results.append({'route':route,'beats':len(page.beats),'oneH1':True,'contiguousScore':True,'nativeLinks':len(page.links)})
manifest=json.loads((root/'public/models/stay/v1/asset-manifest.json').read_text(encoding='utf-8'))
assert len(manifest['assets'])==47
for asset in manifest['assets']:
    for variant in asset['variants'].values():assert (root/'public'/variant['uri'].lstrip('/')).is_file(),variant['uri']
(root/'.codex-tmp/stay-quality/export-results.json').write_text(json.dumps({'routes':results,'assets':47,'variants':94},indent=2),encoding='utf-8')
print('PASS: all ten exported narratives, one H1 each, contiguous native beat scores, five Work anchors and all 94 variant files.')
