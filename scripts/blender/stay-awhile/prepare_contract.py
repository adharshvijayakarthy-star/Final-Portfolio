"""Extract the production contract from the supplied DOCX; no application writes."""
from pathlib import Path
import hashlib, json, re
from zipfile import ZipFile
from xml.etree import ElementTree as E

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
DOC = ROOT / 'PROJECT_AURA_STAY_AWHILE_MASTER_IMPLEMENTATION_SPEC_v1.0.docx'
ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
body = E.fromstring(ZipFile(DOC).read('word/document.xml')).find('w:body',ns)
lines=[]
for child in body:
    if child.tag.endswith('}p'): lines.append(''.join(child.itertext()))
    elif child.tag.endswith('}tbl'):
        for row in child.findall('w:tr',ns):
            lines.append(' | '.join(''.join(c.itertext()) for c in row.findall('w:tc',ns)))
# Use only w:t to avoid XML indentation/formatting whitespace.
def txt(el): return ''.join(t.text or '' for t in el.findall('.//w:t',ns))
lines=[]
for child in body:
    if child.tag.endswith('}p'): lines.append(txt(child))
    elif child.tag.endswith('}tbl'):
        for row in child.findall('w:tr',ns): lines.append(' | '.join(txt(c) for c in row.findall('w:tc',ns)))
assets={}
for i,l in enumerate(lines):
    m=re.match(r'^([GPTBLSWFAC]\d\d)  (.+)',l)
    if m:
        aid,name=m.groups(); rec={'id':aid,'name':name}
        for x in lines[i+1:i+7]:
            if ': ' in x: k,v=x.split(': ',1); rec[k]=v
        e=rec['Export and hooks']
        rec['path']=re.search(r'public/models/stay/v1/[^ ]+\.desktop\.glb',e)[0]
        rec['owner'],rec['slug']=rec['path'].split('/')[-2:]; rec['slug']=rec['slug'].replace('.desktop.glb','')
        rec['source']=re.search(r'\d\d-[a-z]+\.blend',e)[0]
        g=rec['Surface and light']
        rec['triangles']=list(map(lambda x:int(x.replace(',','')),re.search(r'Geometry cap: ([\d,]+) desktop / ([\d,]+) mobile',g).groups()))
        rec['kib']=list(map(int,re.search(r'High binary target ≤(\d+) KiB, mobile ≤(\d+) KiB',g).groups()))
        motion=rec['Motion and trigger']
        clip=re.match(r'([A-Z]+_[A-Z]+), ([\d.]+) s',motion)
        rec['clips']= [{'name':clip[1],'duration':float(clip[2])}] if clip else []
        assets[aid]=rec
routes={}; route=None; beat=None
for i,l in enumerate(lines):
    if l.startswith('Route: /stay/'):
        route=l.split('/')[2] or 'garden'; routes[route]={'id':route,'knots':[]}
    if route and l.startswith('World origin '):
        routes[route]['worldOrigin']=[float(v) for v in re.search(r'\(([^)]+)\)',l)[1].split(',')]
        routes[route]['extent']=[float(v) for v in re.search(r'Local extent ([\d.]+) × ([\d.]+)',l).groups()]
    m=re.match(r'^(GARDEN|PERSON|BUILDER|THINKER|LEADER|STORIES|WORK|FUTURE|AURA|CONTACT) B(\d+)  (\d+) to (\d+) percent',l)
    if m:
        route=m[1].lower(); beat={'index':int(m[2])-1,'band':[int(m[3])/100,int(m[4])/100]}
        row=lines[i+2]; vectors=re.findall(r'\(([^)]+)\)',row)
        beat.update(dict(zip(['start','end','look'],[[float(x) for x in v.split(',')] for v in vectors])))
        beat['reading']=row.split(' | ')[-1]
        pos=re.search(r'x=(\d+)%, y=(\d+)%, (\d+)ch',beat['reading'])
        beat['clearance']={'x':int(pos[1])/100,'y':int(pos[2])/100,'widthCh':int(pos[3]),'alignment':beat['reading'].split(',')[0]}
        for j in range(i+3,min(i+12,len(lines))):
            if lines[j].startswith('Environment and object score:'): beat['objectScore']=lines[j].split(': ',1)[1]; break
        routes[route]['knots'].append(beat)
assert len(assets)==47 and len(routes)==10
assert sum(len(a['clips']) for a in assets.values())==18
out={'specification':DOC.name,'specSha256':hashlib.sha256(DOC.read_bytes()).hexdigest(),'assets':assets,'routes':routes}
(OUT/'contract.json').write_text(json.dumps(out,indent=2,ensure_ascii=False),encoding='utf8')
protected=[]
for folder in ['src','scripts/blender/quick-discovery','scripts/blender/motion-lab','.aura-work/blender-poc','public/models/quick-discovery','public/models/aura-poc']:
    for p in (ROOT/folder).rglob('*'):
        if p.is_file(): protected.append({'path':p.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
for p in (ROOT/'scripts/blender').glob('*'):
    if p.is_file(): protected.append({'path':p.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
if not (OUT/'protected-baseline.json').exists(): (OUT/'protected-baseline.json').write_text(json.dumps(protected,indent=2),encoding='utf8')
print(f'Contract: {len(assets)} assets, {len(routes)} routes, 18 clips; {len(protected)} protected files hashed')
