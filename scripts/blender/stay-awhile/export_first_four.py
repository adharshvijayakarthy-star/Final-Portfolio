"""Refresh only the four approved Stay Awhile scene asset pairs."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from produce import export_master, sha

root = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
contract = json.loads((HERE / 'contract.json').read_text(encoding='utf8'))
assert sha(root / contract['specification']) == contract['specSha256']
for route in ('garden', 'person', 'builder', 'thinker'):
    export_master(route, contract, root, refresh=True)
print('FIRST_FOUR_EXPORT_COMPLETE', flush=True)
