from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
import json
import re
import time

directory = Path(__file__).resolve().parent
root = directory.parents[1] / 'out'
log = directory / 'scenario-requests.jsonl'
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root), **kwargs)
    def log_message(self, *args): pass
    def do_GET(self):
        parsed = urlsplit(self.path)
        mode = parse_qs(parsed.query).get('qa', [''])[0]
        referer = self.headers.get('Referer', '')
        with log.open('a', encoding='utf-8') as stream:
            stream.write(json.dumps({'path':parsed.path,'mode':mode,'referer':referer})+'\n')
        if parsed.path.endswith('.glb') and 'qa=fail' in referer:
            self.send_error(503, 'QA fixture: unavailable GLB')
            return
        if parsed.path.endswith('.glb') and 'qa=slow' in referer:
            time.sleep(.25)
        if mode in ('reduced', 'text200', 'nojs') and parsed.path.endswith('/'):
            target = root / parsed.path.lstrip('/') / 'index.html'
            if not target.is_file():
                self.send_error(404)
                return
            html = target.read_text(encoding='utf-8')
            if mode == 'reduced':
                injection = '''<script>const originalMedia=window.matchMedia.bind(window);window.matchMedia=q=>q.includes('prefers-reduced-motion')?{matches:true,media:q,onchange:null,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){},dispatchEvent(){return true}}:originalMedia(q);</script><style>[data-stay-native] *,[data-stay-native] *::before,[data-stay-native] *::after{animation:none!important;transition:none!important}[data-stay-route] section[data-stay-beat]{min-height:auto;padding-top:135px;padding-bottom:100px}[data-title-phrase]{clip-path:none!important;opacity:1!important;transform:none!important}</style>'''
                html = html.replace('</head>', injection+'</head>')
            elif mode == 'text200':
                html = html.replace('</head>', '<style>html{font-size:200%!important}</style></head>')
            elif mode == 'nojs':
                html = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.S)
                html = html.replace('<noscript>', '').replace('</noscript>', '')
                html = re.sub(r'href="(/stay[^"?]*)"', lambda match: 'href="'+match[1].split('#')[0]+'?qa=nojs'+('#'+match[1].split('#',1)[1] if '#' in match[1] else '')+'"', html)
            body = html.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type','text/html; charset=utf-8')
            self.send_header('Content-Length',str(len(body)))
            self.send_header('Cache-Control','no-store')
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()
ThreadingHTTPServer(('127.0.0.1',3133), Handler).serve_forever()
