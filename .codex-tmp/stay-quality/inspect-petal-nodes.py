import json,struct
from pathlib import Path
data=Path('public/models/stay/v1/garden/petal-kit.desktop.glb').read_bytes();n=struct.unpack_from('<I',data,12)[0];g=json.loads(data[20:20+n]);print(json.dumps({'nodes':g['nodes'],'scene':g['scenes']},indent=2))
