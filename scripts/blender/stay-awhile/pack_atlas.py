"""Replace identical embedded atlas PNGs with lossless palette PNGs; geometry untouched."""
import json,struct,sys
from pathlib import Path
root=Path(sys.argv[1]);base=root/'public/models/stay/v1'
for p in base.rglob('*.glb'):
    raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+n]);binary=raw[28+n:]
    if not d.get('images'):continue
    for mat in d.get('materials',[]):
        mat['name']=mat.get('name','').removesuffix('_MOBILE')
    lod='mobile' if '.mobile.' in p.name else 'desktop';png=(base/'shared'/f'timber-paper.{lod}.png').read_bytes()
    image_views={im['bufferView'] for im in d['images']};out=bytearray()
    for i,v in enumerate(d['bufferViews']):
        blob=png if i in image_views else binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
        out.extend(b'\0'*((-len(out))%4));v['byteOffset']=len(out);v['byteLength']=len(blob);out.extend(blob)
    d['buffers'][0]['byteLength']=len(out);out.extend(b'\0'*((-len(out))%4))
    text=json.dumps(d,separators=(',',':')).encode();text+=b' '*((-len(text))%4)
    p.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(text)+len(out))+struct.pack('<II',len(text),0x4e4f534a)+text+struct.pack('<II',len(out),0x004e4942)+out)
print('ATLAS_PACKED')
