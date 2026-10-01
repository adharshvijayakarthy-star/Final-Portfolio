from pathlib import Path
from urllib.request import urlopen, Request
import json
import re
routes=['garden','person','builder','thinker','leader','stories','work','future','aura','contact']
records=[]
for route in routes:
    path='/stay/' if route=='garden' else f'/stay/{route}/'
    for mode in ('nojs','reduced','text200'):
        with urlopen(f'http://localhost:3133{path}?qa={mode}') as response: html=response.read().decode('utf-8')
        assert len(re.findall(r'<h1\b',html))==1
        if mode=='nojs':
            assert not re.search(r'<script\b',html)
            assert 'All garden paths' in html
            assert len(re.findall(r'\?qa=nojs',html))>=10
        elif mode=='reduced': assert 'matches:true' in html and 'prefers-reduced-motion' in html
        else: assert 'font-size:200%!important' in html
        records.append({'route':route,'mode':mode,'bytes':len(html.encode('utf-8'))})
request=Request('http://localhost:3133/models/stay/v1/garden/petal-kit.desktop.glb',headers={'Referer':'http://localhost:3133/stay/?qa=fail'})
try: urlopen(request); raise AssertionError('failure fixture must return 503')
except Exception as error: assert getattr(error,'code',None)==503
directory=Path(__file__).resolve().parent
(directory/'scenario-source-results.json').write_text(json.dumps({'environment':'HTTP fixture-source validation only; no browser rendering or accessibility acceptance','pages':records,'failureHTTP':503},indent=2),encoding='utf-8')
print('PASS: 30 derived scenario HTML responses and GLB failure injection. Browser acceptance remains separate.')
