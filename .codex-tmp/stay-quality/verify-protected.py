from pathlib import Path
import hashlib
import json
directory=Path(__file__).resolve().parent
root=directory.parents[1]
baseline=json.loads((directory/'protected-baseline.json').read_text(encoding='utf-8-sig'))
changes=[]
for relative, expected in baseline.items():
    target=root/relative
    actual=hashlib.sha256(target.read_bytes()).hexdigest().upper() if target.is_file() else None
    if actual!=expected: changes.append(relative)
(directory/'protected-results.json').write_text(json.dumps({'Files':len(baseline),'Changes':changes},indent=2),encoding='utf-8')
if changes: raise SystemExit('FAIL: protected changes '+str(changes))
print(f'PASS: {len(baseline)} protected files retain their original SHA-256 hashes.')
