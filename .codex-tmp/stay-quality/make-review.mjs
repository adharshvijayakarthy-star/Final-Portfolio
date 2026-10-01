import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const directory=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'));
const decoded=decodeURIComponent(directory);
const source=JSON.parse(await fs.readFile(path.join(decoded,'browser-results.json'),'utf8'));
const data=[...new Map(source.map(entry=>[entry.name,entry])).values()];
const routes=['garden','person','builder','thinker','leader','stories','work','future','aura','contact'];
const canonical=routes.flatMap(route=>['000','025','050','075','100'].map(p=>data.find(x=>x.name===`${route}-${p}-desktop`))).filter(Boolean);
const width=400,height=250,label=32,columns=5;
const composite=[];
for(let i=0;i<canonical.length;i++) {
  const entry=canonical[i], left=(i%columns)*width, top=Math.floor(i/columns)*(height+label);
  composite.push({input:await sharp(path.join(decoded,'screenshots',entry.name+'.jpg')).resize(width,height,{fit:'contain',background:'#17271f'}).toBuffer(),left,top});
  composite.push({input:Buffer.from(`<svg width="400" height="32"><rect width="400" height="32" fill="#eee8db"/><text x="10" y="21" font-size="14" font-family="Arial" fill="#17271f">${entry.name} · p=${entry.canvas?.stayProgress}</text></svg>`),left,top:top+height});
}
await sharp({create:{width:width*columns,height:Math.ceil(canonical.length/columns)*(height+label),channels:3,background:'#eee8db'}}).composite(composite).png().toFile(path.join(decoded,'canonical-contact-sheet.png'));
const cards=data.map(entry=>`<a href="screenshots/${entry.name}.jpg"><img loading="lazy" src="screenshots/${entry.name}.jpg" alt="${entry.name}"><span>${entry.name} · actual p=${entry.canvas?.stayProgress??'reading'} · ${entry.overflow?'OVERFLOW':'no horizontal overflow'}</span></a>`).join('\n');
await fs.writeFile(path.join(decoded,'review.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stay Awhile browser review</title><style>body{background:#17271f;color:#eee8db;margin:24px;font:15px/1.5 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}a{color:inherit}img{width:100%;display:block}span{display:block;padding:10px}h1{font-weight:500}</style><h1>Stay Awhile · production browser review</h1><p>Actual Chrome captures. Canonical desktop scores, intermediate beats, narrow viewports and interactions. Click a composition to inspect it at full size.</p><main>${cards}</main></html>`);
console.log(`Generated canonical sheet (${canonical.length} captures) and review (${data.length} captures).`);
