import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const directory=decodeURIComponent(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')));
const data=JSON.parse(await fs.readFile(path.join(directory,'browser-results.json'),'utf8'));
const categories={canonical:0,intermediate:0,mobile390:0,mobile320:0,interaction:0};
for(const entry of data){const category=entry.name.includes('mobile390')?'mobile390':entry.name.includes('mobile320')?'mobile320':entry.name.includes('-beat-')?'intermediate':/-(000|025|050|075|100)-desktop$/.test(entry.name)?'canonical':'interaction';categories[category]++;}
const poses=data.filter(entry=>/-(000|025|050|075|100)-desktop$/.test(entry.name));
const invalid=poses.filter(entry=>Math.abs(Number(entry.canvas?.stayProgress)-Number(entry.name.match(/-(\d{3})-/)[1])/100)>.01);
const timings=data.flatMap(entry=>{try{return [{name:entry.name,...JSON.parse(entry.canvas?.stayTiming??'{}')}]}catch{return []}}).sort((a,b)=>(b.samples??0)-(a.samples??0));
const summary={captures:data.length,categories,horizontalOverflow:data.filter(entry=>entry.overflow).map(entry=>entry.name),canonicalScoreMismatch:invalid.map(entry=>entry.name),largestTimingWindows:timings.slice(0,8),selectedTimingWindows:timings.filter(entry=>['aura-beat-08-desktop','thinker-100-mobile390'].includes(entry.name)),browserReturnCycles:data.filter(entry=>/^cycle-\d+-garden$/.test(entry.name)).map(entry=>({name:entry.name,renderer:entry.canvas.stayRenderer,resources:entry.canvas.stayResources})),routes:[...new Set(poses.map(entry=>entry.name.split('-')[0]))]};
await fs.writeFile(path.join(directory,'browser-summary.json'),JSON.stringify(summary,null,2));
const names=['garden-050-desktop','builder-050-desktop','thinker-050-desktop','aura-beat-08-desktop'];
const pictures=[];
for(let i=0;i<names.length;i++)pictures.push({input:await sharp(path.join(directory,'screenshots',names[i]+'.jpg')).resize(720,450,{fit:'contain'}).toBuffer(),left:(i%2)*720,top:Math.floor(i/2)*450});
await sharp({create:{width:1440,height:900,channels:3,background:'#17271f'}}).composite(pictures).jpeg({quality:90}).toFile(path.join(directory,'review-preview.jpg'));
console.log(JSON.stringify(summary,null,2));
