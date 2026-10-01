import json,struct
from pathlib import Path
for name in ['petal-kit.desktop.glb','sakura-canopy.desktop.glb']:
 data=(Path('public/models/stay/v1/garden')/name).read_bytes();length=struct.unpack_from('<I',data,12)[0];gltf=json.loads(data[20:20+length]); print(name)
 print('materials',[(i,m.get('name')) for i,m in enumerate(gltf.get('materials',[]))])
 for i,node in enumerate(gltf['nodes']):
  if 'mesh' not in node: continue
  mesh=gltf['meshes'][node['mesh']]
  for primitive in mesh['primitives'][:2]:
   accessor=gltf['accessors'][primitive['attributes']['POSITION']]
   print(node.get('name'),node.get('translation'),node.get('rotation'),node.get('scale'),gltf['materials'][primitive['material']].get('name'),accessor['count'],accessor.get('min'),accessor.get('max'))
