"""Create compact PBR textures from documented CC0 sources; keep originals."""
from pathlib import Path
from PIL import Image,ImageOps,ImageEnhance
import json,hashlib
H=Path(__file__).resolve().parent;R=H.parents[2];S=R/'.aura-work/senior-art-pass/sources';O=R/'public/models/stay/v1/shared'
O.mkdir(exist_ok=True)
for family,source in [('bark','bark_brown_02'),('stone','mossy_rock'),('ground','forest_ground_04'),('timber','wood_planks_grey')]:
    for kind in ('diff','nor_gl','rough'):
        im=Image.open(S/f'{source}_{kind}.jpg').convert('RGB')
        if family=='timber' and kind=='diff':
            im=ImageOps.colorize(ImageOps.grayscale(im),'#2D2117','#B4936C')
        if family=='ground' and kind=='diff':
            im=ImageOps.colorize(ImageOps.grayscale(im),'#253422','#809166')
        if family=='stone' and kind=='diff':
            im=ImageOps.colorize(ImageOps.grayscale(im),'#414B42','#9D9F90')
        for lod,size in [('desktop',512),('mobile',256)]:
            im.resize((size,size),Image.Resampling.LANCZOS).save(O/f'senior-{family}-{kind}.{lod}.jpg',quality=87 if kind=='nor_gl' else 82,optimize=True)
notes=[]
leaf=Image.open(S/'tree_leaves_diff.jpg').convert('RGBA').crop((555,25,890,674))
alpha=Image.open(S/'tree_leaves_alpha.jpg').convert('L').crop((555,25,890,674))
leaf.putalpha(alpha)
for lod,size in [('desktop',(256,512)),('mobile',(128,256))]:
    leaf.resize(size,Image.Resampling.LANCZOS).save(O/f'senior-spray.{lod}.png',optimize=True)
for name,creator,mod in [('tree_small_02','Rico Cilliers','Trunk retopology by geometric reduction; source crown distribution sampled; varied proportions. Source diffuse and opacity maps cropped to a masked leaf spray; shared desktop/mobile PNGs. Sakura crown remodeled as opaque geometry.'),('bark_brown_02','Rob Tuytel','Downsampled for shared desktop/mobile PBR maps.'),('mossy_rock','Rob Tuytel','Recolored to a restrained grey-green palette; downsampled for shared desktop/mobile PBR maps.'),('forest_ground_04','Rob Tuytel; Rico Cilliers','Recolored to moss and earth palette; downsampled.'),('wood_planks_grey','Rob Tuytel','Recolored to warm cedar; downsampled.')]:
    notes.append({'asset':name,'creator':creator,'source':'Poly Haven','url':'https://polyhaven.com/a/'+name,'license':'CC0-1.0','licenseUrl':'https://polyhaven.com/license','accessed':'2026-09-26','modified':True,'modification':mod})
(H/'senior-provenance.json').write_text(json.dumps(notes,indent=2))
print('TEXTURES',len(list(O.glob('senior-*'))),sum(p.stat().st_size for p in O.glob('senior-*')))
