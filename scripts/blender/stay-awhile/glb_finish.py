"""Lossless buffer repack plus bounded transform-curve simplification (1 mm)."""
import json, struct, math
from pathlib import Path
TYPES={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
FORMATS={5120:'b',5121:'B',5122:'h',5123:'H',5125:'I',5126:'f'}

def finish(path,duration=None,endpoint=None,quantize=False,material_settings=None):
    raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+n]);binary=raw[28+n:]
    arrays=[];targets=[]
    for a in d['accessors']:
        view=d['bufferViews'][a['bufferView']];size=TYPES[a['type']];fmt='<'+FORMATS[a['componentType']]*size
        stride=view.get('byteStride',struct.calcsize(fmt));start=view.get('byteOffset',0)+a.get('byteOffset',0)
        arrays.append([list(struct.unpack_from(fmt,binary,start+i*stride)) for i in range(a['count'])]);targets.append(view.get('target'))
    def simplify(ts,vs,tolerance):
        keep={0,len(ts)-1};stack=[(0,len(ts)-1)]
        while stack:
            lo,hi=stack.pop()
            if hi-lo<2:continue
            worst=-1;at=-1
            for j in range(lo+1,hi):
                t=(ts[j][0]-ts[lo][0])/(ts[hi][0]-ts[lo][0]);pred=[x+(y-x)*t for x,y in zip(vs[lo],vs[hi])]
                error=max(abs(x-y) for x,y in zip(pred,vs[j]))
                if error>worst:worst=error;at=j
            if worst>tolerance:keep.add(at);stack.extend([(lo,at),(at,hi)])
        return sorted(keep)
    for anim in d.get('animations',[]):
        # Copy sampler inputs because Blender shares timelines across channels.
        for channel in anim['channels']:
            s=anim['samplers'][channel['sampler']];times=[v[:] for v in arrays[s['input']]];vals=[v[:] for v in arrays[s['output']]]
            if duration is not None and abs(times[-1][0]-duration)<.04:
                times[-1][0]=duration
                if endpoint:
                    name=d['nodes'][channel['target']['node']]['name'];v=endpoint(name,channel['target']['path'])
                    if v is not None:vals[-1]=list(v)
            indices=simplify(times,vals,0.0001 if channel['target']['path']=='rotation' else .001)
            for field,values in [('input',[times[i] for i in indices]),('output',[vals[i] for i in indices])]:
                orig=d['accessors'][s[field]];new=dict(orig);new.pop('byteOffset',None);new['count']=len(values)
                d['accessors'].append(new);arrays.append(values);targets.append(None);s[field]=len(arrays)-1
    for material in d.get('materials',[]):
        setting=(material_settings or {}).get(material.get('name'))
        if setting:material.setdefault('pbrMetallicRoughness',{})['baseColorFactor']=setting['baseColorFactor']
    # Color values need only byte precision; preserve normalized COLOR_0.
    for mesh in d.get('meshes',[]):
        for pr in mesh['primitives']:
            mat=d.get('materials',[])[pr['material']] if 'material' in pr else {}
            setting=(material_settings or {}).get(mat.get('name'))
            if setting and not setting['usesVertexColor']:pr['attributes'].pop('COLOR_0',None)
            def has_texture(value):
                if isinstance(value,dict):return any(('Texture' in k and isinstance(v,dict) and 'index' in v) or has_texture(v) for k,v in value.items())
                if isinstance(value,list):return any(has_texture(v) for v in value)
                return False
            if not has_texture(mat):
                for key in list(pr['attributes']):
                    if key.startswith('TEXCOORD_'):pr['attributes'].pop(key)
            idx=pr['attributes'].get('COLOR_0')
            if idx is not None and d['accessors'][idx]['componentType'] in (5123,5126):
                source=d['accessors'][idx]
                divisor=65535 if source['componentType']==5123 and source.get('normalized') else 1
                arrays[idx]=[[round(max(0,min(1,v/divisor))*255) for v in row] for row in arrays[idx]]
                d['accessors'][idx]['componentType']=5121;d['accessors'][idx]['normalized']=True
            if idx is not None and all(all(v==255 for v in row) for row in arrays[idx]):
                # White vertex colors are multiplicative identity, not visual data.
                pr['attributes'].pop('COLOR_0',None)
    # A material-wide constant vertex tint belongs in baseColorFactor. This is
    # algebraically identical and avoids repeating the same four bytes per vertex.
    for mi,mat in enumerate(d.get('materials',[])):
        prs=[pr for mesh in d.get('meshes',[]) for pr in mesh['primitives'] if pr.get('material')==mi]
        if not prs or any('COLOR_0' not in pr['attributes'] for pr in prs):continue
        ids={pr['attributes']['COLOR_0'] for pr in prs};first=arrays[next(iter(ids))][0]
        if all(row==first for i in ids for row in arrays[i]):
            pbr=mat.setdefault('pbrMetallicRoughness',{});base=pbr.get('baseColorFactor',[1,1,1,1])
            pbr['baseColorFactor']=[base[k]*first[k]/255 for k in range(4)]
            for pr in prs:pr['attributes'].pop('COLOR_0')
    if quantize:
        # Preserve tiling UVs with a bounded 16-bit encoding and standard texture
        # transforms. Positions/normals and material appearance are unchanged.
        # Each material gets its own UV range; no decoder or runtime code is needed.
        for mi,material in enumerate(d.get('materials',[])):
            primitives=[pr for mesh in d.get('meshes',[]) for pr in mesh['primitives']
                        if pr.get('material')==mi and 'TEXCOORD_0' in pr['attributes']]
            indices={pr['attributes']['TEXCOORD_0'] for pr in primitives}
            if not indices or any(d['accessors'][i]['componentType']!=5126 for i in indices):continue
            lo=[min(row[k] for i in indices for row in arrays[i]) for k in range(2)]
            hi=[max(row[k] for i in indices for row in arrays[i]) for k in range(2)]
            if min(lo)>=0 and max(hi)<=1:continue
            low=[math.floor(v) for v in lo];span=[max(1,math.ceil(hi[k])-low[k]) for k in range(2)]
            def transform_textures(value):
                if not isinstance(value,dict):return
                for key,info in value.items():
                    if 'Texture' in key and isinstance(info,dict) and 'index' in info and info.get('texCoord',0)==0:
                        ext=info.setdefault('extensions',{}).setdefault('KHR_texture_transform',{})
                        assert not ext.get('rotation'), 'Rotated UV transform needs explicit composition'
                        scale=ext.get('scale',[1,1]);offset=ext.get('offset',[0,0])
                        ext['offset']=[offset[k]+scale[k]*low[k] for k in range(2)]
                        ext['scale']=[scale[k]*span[k] for k in range(2)]
                    else:transform_textures(info)
            transform_textures(material)
            for pr in primitives:
                i=pr['attributes']['TEXCOORD_0'];a=dict(d['accessors'][i]);values=arrays[i]
                encoded=[[round((row[k]-low[k])/span[k]*65535) for k in range(2)] for row in values]
                assert max(abs(row[k]-(encoded[j][k]/65535*span[k]+low[k])) for j,row in enumerate(values) for k in range(2))<=max(span)/65535*.501+1e-8
                a['componentType']=5123;a['normalized']=True
                pr['attributes']['TEXCOORD_0']=len(arrays)
                d['accessors'].append(a);arrays.append(encoded);targets.append(targets[i])
            for key in ('extensionsUsed','extensionsRequired'):
                if 'KHR_texture_transform' not in d.setdefault(key,[]):d[key].append('KHR_texture_transform')
        # KHR_mesh_quantization is handled by the bundled GLTFLoader without
        # an external decoder. A uniform leaf-mesh scale dequantizes positions;
        # animation pivots, asset roots and guide nodes are untouched.
        animation_targets={ch['target']['node'] for anim in d.get('animations',[]) for ch in anim['channels']}
        for mesh_index,mesh in enumerate(d.get('meshes',[])):
            mesh_name=mesh.get('name','')
            positions={pr['attributes']['POSITION'] for pr in mesh['primitives']}
            maximum=max(abs(value) for idx in positions for row in arrays[idx] for value in row)
            scale=max(.001,math.ceil(maximum/32700/.001)*.001)
            for idx in positions:
                arrays[idx]=[[max(-32767,min(32767,round(value/scale))) for value in row] for row in arrays[idx]]
                d['accessors'][idx]['componentType']=5122
                d['accessors'][idx].pop('normalized',None)
            for pr in mesh['primitives']:
                uv=pr['attributes'].get('TEXCOORD_0')
                if uv is not None and d['accessors'][uv]['componentType']==5126:
                    if all(0<=value<=1 for row in arrays[uv] for value in row):
                        arrays[uv]=[[round(value*65535) for value in row] for row in arrays[uv]]
                        d['accessors'][uv]['componentType']=5123
                        d['accessors'][uv]['normalized']=True
                # These authored meshes are naturally faceted. Omit redundant
                # per-vertex normals; GLTFLoader uses flat shading for them.
                normal_mapped='normalTexture' in d['materials'][pr['material']]
                if not normal_mapped and (mesh_name=='SA_G01_GEOMETRY_00' or
                    mesh_name.startswith(('SA_G01_SCULPT_60','SA_G01_SCULPT_61',
                                          'SA_G01_SCULPT_64','SA_T01_SCULPT_60'))):
                    pr['attributes'].pop('NORMAL',None)
                normal=pr['attributes'].get('NORMAL')
                if normal is not None and d['accessors'][normal]['componentType']==5126:
                    arrays[normal]=[[max(-127,min(127,round(value*127))) for value in row] for row in arrays[normal]]
                    d['accessors'][normal]['componentType']=5120
                    d['accessors'][normal]['normalized']=True
            for node_index,node in enumerate(d['nodes']):
                if node.get('mesh')!=mesh_index:continue
                assert node_index not in animation_targets, ('animated mesh quantization',node.get('name'))
                assert not node.get('children'), ('mesh node has children',node.get('name'))
                if 'matrix' in node:
                    for column in range(3):
                        for row in range(3):node['matrix'][column*4+row]*=scale
                else:
                    node['scale']=[value*scale for value in node.get('scale',[1,1,1])]
        d.setdefault('extensionsUsed',[]).append('KHR_mesh_quantization')
        d.setdefault('extensionsRequired',[]).append('KHR_mesh_quantization')
    # Retain only live accessors after optional removal of redundant normals.
    used=set()
    for mesh in d.get('meshes',[]):
        for pr in mesh['primitives']:
            used.update(pr['attributes'].values())
            if 'indices' in pr:used.add(pr['indices'])
            for target in pr.get('targets',[]):used.update(target.values())
    for skin in d.get('skins',[]):
        if 'inverseBindMatrices' in skin:used.add(skin['inverseBindMatrices'])
    for anim in d.get('animations',[]):
        for s in anim['samplers']:used.update([s['input'],s['output']])
    remap={old:new for new,old in enumerate(sorted(used))}
    for mesh in d.get('meshes',[]):
        for pr in mesh['primitives']:
            pr['attributes']={k:remap[v] for k,v in pr['attributes'].items()}
            if 'indices' in pr:pr['indices']=remap[pr['indices']]
            for target in pr.get('targets',[]):
                for k in target:target[k]=remap[target[k]]
    for skin in d.get('skins',[]):
        if 'inverseBindMatrices' in skin:skin['inverseBindMatrices']=remap[skin['inverseBindMatrices']]
    for anim in d.get('animations',[]):
        for s in anim['samplers']:
            s['input']=remap[s['input']];s['output']=remap[s['output']]
    output=bytearray();views=[];accessors=[]
    def append(blob,target=None,stride=None):
        output.extend(b'\0'*((-len(output))%4));v={'buffer':0,'byteOffset':len(output),'byteLength':len(blob)}
        if target:v['target']=target
        if stride:v['byteStride']=stride
        views.append(v);output.extend(blob);return len(views)-1
    for old in sorted(used):
        a=dict(d['accessors'][old]);values=arrays[old];fmt='<'+FORMATS[a['componentType']]*TYPES[a['type']]
        stride=4 if a['componentType']==5120 and a['type']=='VEC3' else 8 if a['componentType']==5122 and a['type']=='VEC3' else None
        if stride:
            blob=b''.join(struct.pack(fmt,*v)+b'\0'*(stride-struct.calcsize(fmt)) for v in values)
        else:blob=b''.join(struct.pack(fmt,*v) for v in values)
        a['bufferView']=append(blob,targets[old],stride);a.pop('byteOffset',None)
        if 'min' in a:a['min']=[min(v[i] for v in values) for i in range(len(values[0]))]
        if 'max' in a:a['max']=[max(v[i] for v in values) for i in range(len(values[0]))]
        accessors.append(a)
    for image in d.get('images',[]):
        if 'bufferView' in image:
            v=d['bufferViews'][image['bufferView']];start=v.get('byteOffset',0)
            original=binary[start:start+v['byteLength']]
            name=image.get('name','')
            if name.startswith('senior-'):
                # Shared PBR images are deliberately external: caps exclude the shared atlas.
                canonical=name.split('.desktop')[0]+'.desktop' if '.desktop' in name else name.split('.mobile')[0]+'.mobile'
                extension='.png' if canonical.startswith('senior-spray') else '.jpg'
                shared=Path(__file__).resolve().parents[3]/'public/models/stay/v1/shared'/(canonical+extension)
                assert shared.is_file(),shared
                image.pop('bufferView',None);image['uri']='../shared/'+shared.name;image['mimeType']='image/png' if extension=='.png' else 'image/jpeg'
                continue
            source=Path(__file__).resolve().parent/(name+'.png')
            if name in ('beauty-timber.desktop','beauty-timber.mobile') and source.exists():
                # Blender re-encodes this packed PNG at 9-27x the source size.
                # The original lossless file is the image authored in the master.
                original=source.read_bytes()
            image['bufferView']=append(original)
    for material in d.get('materials',[]):
        if 'SPRAY' in material.get('name',''):
            material['alphaMode']='MASK';material['alphaCutoff']=.45;material['doubleSided']=True
    d['accessors']=accessors;d['bufferViews']=views;d['buffers']=[{'byteLength':len(output)}]
    for mesh in d.get('meshes',[]):mesh.pop('name',None) # Contract names live on nodes.
    for node in d.get('nodes',[]):
        if 'mesh' in node and 'extras' in node:
            node['extras']={k:v for k,v in node['extras'].items() if not k.startswith(('senior','astraV2','beautyPass'))}
            if not node['extras']:node.pop('extras')
        if node.get('name') in ('SA_G01_ROOT_00','SA_G03_ROOT_00','SA_G11_ROOT_00','SA_F01_ROOT_00'):
            node['extras']['provenance']='Poly Haven Tree Small 02 adaptation; Rico Cilliers; CC0-1.0. See READ_ME.'
    def compact_numbers(value):
        if isinstance(value,float):
            v=round(value,7);return int(v) if v==int(v) else v
        if isinstance(value,list):return [compact_numbers(v) for v in value]
        if isinstance(value,dict):return {k:compact_numbers(v) for k,v in value.items()}
        return value
    d=compact_numbers(d)
    text=json.dumps(d,separators=(',',':')).encode();text+=b' '*((-len(text))%4);output.extend(b'\0'*((-len(output))%4))
    path.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(text)+len(output))+struct.pack('<II',len(text),0x4e4f534a)+text+struct.pack('<II',len(output),0x004e4942)+output)
