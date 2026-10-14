import { beginEntryHandoff, finishEntryHandoff, type EntryHandoff } from "@/lib/entry-handoff";
import { routes } from "@/data/content";
import { releaseEntryPreparation } from "./preparation";
import "./transition.css";

type Destination = EntryHandoff["destination"];
type Cue = { animation: Animation; start: number };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const departureEase = "cubic-bezier(0.16,1,0.3,1)";
const settleEase = "cubic-bezier(0.22,1,0.36,1)";
const foregroundSelector = "[data-landing-foreground],[data-landing-foliage]";

// One clock supplies both the DOM compositor and the temporary arrival pose.
export function bezier(x: number, x1: number, y1: number, x2: number, y2: number) {
  const sample = (t: number, a: number, b: number) => 3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;
  let low=0, high=1;
  for(let i=0;i<18;i++){const mid=(low+high)/2;if(sample(mid,x1,x2)<x)low=mid;else high=mid;}
  return sample((low+high)/2,y1,y2);
}
const settle = (n: number) => n<=0?0:n>=1?1:bezier(n,.22,1,.36,1);

/** Freeze the existing environmental composition, including its particle
 * canvas. No replacement artwork or transition-only foliage is generated. */
function snapshot(scene: HTMLElement) {
  const copy=scene.cloneNode(true) as HTMLElement;
  const originals=[scene,...scene.querySelectorAll<HTMLElement|SVGElement>("*")];
  const copies=[copy,...copy.querySelectorAll<HTMLElement|SVGElement>("*")];
  for(let i=0;i<originals.length;i++){
    const original=originals[i]!, node=copies[i]!, style=getComputedStyle(original);
    if(style.animationName!=="none"){
      for(const key of ["opacity","transform","mask-position","stroke-dashoffset"])
        node.style.setProperty(key,style.getPropertyValue(key));
    }
    node.style.animation="none";node.style.transition="none";
    if(original instanceof HTMLCanvasElement&&node instanceof HTMLCanvasElement)
      node.getContext("2d")?.drawImage(original,0,0);
  }
  copy.removeAttribute("data-aura-scene");
  copy.setAttribute("aria-hidden","true");copy.inert=true;
  const rect=scene.getBoundingClientRect();
  Object.assign(copy.style,{position:"absolute",top:`${rect.top}px`,left:`${rect.left}px`,width:`${rect.width}px`,height:`${rect.height}px`,minHeight:"0",margin:"0",pointerEvents:"none"});
  // SVG filters retain their references without duplicating live document IDs.
  const prefix=`entry-${Math.round(performance.now())}-`;
  copy.querySelectorAll("[id]").forEach(node=>{const id=node.id;node.id=prefix+id;copy.querySelectorAll(`[filter="url(#${id})"]`).forEach(item=>item.setAttribute("filter",`url(#${prefix+id})`));});
  return copy;
}

const warmed=new Set<Destination>();
function warm(destination: Destination) {
  if(warmed.has(destination))return;warmed.add(destination);
  const fetchAsset=(url:string)=>fetch(url).then(response=>response.ok?response.arrayBuffer():undefined);
  if(destination==="quick"){
    void Promise.all(["motion-manifest.json","quick-world.glb","quick-embers.glb"].map(file=>fetchAsset(`/models/quick-discovery/${file}`))).catch(()=>warmed.delete(destination));
  }else{
    type Manifest={assets:{assetId:string;variants:Record<string,{uri:string}>}[]};
    const variant=matchMedia("(max-width:767px), (pointer:coarse)").matches?"mobile":"desktop";
    void Promise.all([
      fetch("/models/stay/v1/asset-manifest.json").then(response=>response.json() as Promise<Manifest>),
      fetch("/models/stay/v1/garden/garden.scene.json").then(response=>response.json() as Promise<{assetIds:string[]}>),
    ]).then(([manifest,scene])=>Promise.all(manifest.assets.filter(asset=>scene.assetIds.includes(asset.assetId)).map(asset=>fetchAsset(asset.variants[variant]!.uri)))).catch(()=>warmed.delete(destination));
    const poster=new Image();poster.src=`/assets/stay/v1/garden-${variant}.webp`;
  }
}

export function bindLandingTransitions(scene: HTMLElement, navigate: (href: string) => void) {
  let busy=false, routed=false;
  let cancelCurrent:(()=>void)|undefined;
  const prepare=(event:Event)=>{
    const disc=(event.target as Element).closest<HTMLElement>("[data-disc]");
    if(disc)warm(disc.dataset.disc as Destination);
  };
  const click=(event:MouseEvent)=>{
    const disc=(event.target as Element).closest<HTMLAnchorElement>("a[data-disc]");
    if(!disc||event.button||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
    event.preventDefault();event.stopPropagation();if(busy)return;busy=true;
    const activated=performance.now();
    const destination=disc.dataset.disc as Destination;
    const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;
    const duration=reduced?(destination==="stay"?250:180):(destination==="stay"?1450:900);
    const bridge=reduced?0:destination==="stay"?680:480;
    const state=beginEntryHandoff(destination,reduced);
    const html=document.documentElement;
    const overlay=document.createElement("div");
    overlay.dataset.entryOverlay=destination;overlay.setAttribute("aria-hidden","true");overlay.inert=true;
    overlay.style.cssText="position:fixed;inset:0;z-index:9999;overflow:hidden;pointer-events:none;contain:layout paint;";
    const source=snapshot(scene);source.dataset.entrySource="";overlay.append(source);document.body.append(overlay);
    const title=source.querySelector<HTMLElement>("[data-landing-title]")!;
    const content=source.querySelector<HTMLElement>("[data-threshold-copy]")!;
    const stage=source.querySelector<HTMLElement>("[data-landing-stage]")!;
    const cues:Cue[]=[];
    const cue=(node:Element,frames:Keyframe[],start:number,end:number,easing="linear")=>{
      const animation=node.animate(frames,{duration:end-start,easing,fill:"both"});animation.pause();animation.currentTime=0;cues.push({animation,start});
    };
    if(reduced){
      cue(source,[{opacity:1},{opacity:0}],0,duration);
    }else if(destination==="stay"){
      cue(title,[{transform:"scale(1)",opacity:1},{transform:"scale(1.015)",opacity:1}],0,220,settleEase);
      const box=content.getBoundingClientRect(),dx=innerWidth/2-(box.x+box.width/2),dy=innerHeight/2-(box.y+box.height/2),length=Math.hypot(dx,dy)||1;
      const base=getComputedStyle(content).transform;
      cue(content,[{transform:base},{transform:`${base==="none"?"":base} translate(${dx/length*Math.min(length,4)}px,${dy/length*Math.min(length,4)}px)`}],0,220,settleEase);
      source.querySelectorAll("[data-disc-copy],a[href='/']").forEach(node=>cue(node,[{opacity:1},{opacity:.92}],0,220,settleEase));
      // Landing is a layered DOM environment: its projection depth is 1000px.
      // 25px forward is exactly 2.5%; lateral/rise are screen-space CSS pixels.
      cue(stage,[{transform:"perspective(1000px) translate3d(0,0,0) rotate(0deg)"},{transform:"perspective(1000px) translate3d(10px,-16px,25px) rotate(1.5deg)"}],220,680,departureEase);
      const foreground=source.cloneNode(true) as HTMLElement;
      foreground.dataset.entryForeground="";
      foreground.style.visibility="hidden";foreground.style.background="transparent";
      foreground.querySelectorAll<HTMLElement|SVGElement>(foregroundSelector).forEach(node=>{node.style.visibility="visible";});
      // Animated source canvases are not part of the foreground cover.
      foreground.querySelectorAll("canvas").forEach(node=>node.remove());
      overlay.append(foreground);
      source.querySelectorAll<HTMLElement|SVGElement>(foregroundSelector).forEach(node=>{node.style.visibility="hidden";});
      const foregroundStage=foreground.querySelector<HTMLElement>("[data-landing-stage]")!;
      cue(foregroundStage,[{transform:"perspective(1000px) translate3d(0,0,0) rotate(0deg)"},{transform:"perspective(1000px) translate3d(10px,-16px,25px) rotate(1.5deg)"}],220,680,departureEase);
      const distance=Math.max(70,Math.min(140,innerWidth*.0972));
      foreground.querySelectorAll<HTMLElement|SVGElement>(foregroundSelector).forEach(node=>{
        const transform=getComputedStyle(node).transform;
        cue(node,[{transform},{transform:`translate(${-distance}px,-12px) ${transform==="none"?"":transform}`}],300,650,departureEase);
      });
      cue(source,[{transform:"scale(1)",opacity:1},{transform:"scale(.98)",opacity:0}],680,1080,settleEase);
      cue(foreground,[{opacity:1},{opacity:0}],1080,1450,settleEase);
    }else{
      cue(title,[{transform:"scale(1)"},{transform:"scale(.985)"}],0,160,settleEase);
      const base=getComputedStyle(content).transform;
      cue(content,[{transform:base,opacity:1},{transform:`${base==="none"?"":base} translateY(-8px)`,opacity:.82}],0,160,settleEase);
      const material=scene.querySelector<HTMLElement>(innerWidth<700?'[data-scene-layer="mq-fore"]':'[data-scene-layer="q-fore-1"]');
      const wipe=document.createElement("div");wipe.dataset.entryWipe="";
      // The existing obsidian foreground material becomes a horizontal edge.
      wipe.style.cssText=`position:absolute;inset:0 auto 0 -100vw;width:100vw;background:${material?getComputedStyle(material).backgroundImage:"linear-gradient(160deg,#06060a,#030305)"};border-right:1px solid #805155;`;
      overlay.append(wipe);
      // Each segment has the specified easing while sharing the master clock.
      cue(wipe,[
        {transform:"translateX(0)",offset:0,easing:"cubic-bezier(.76,0,.24,1)"},
        {transform:"translateX(100vw)",offset:320/540,easing:settleEase},
        {transform:"translateX(200vw)",offset:1},
      ],160,700);
      cue(source,[{clipPath:"inset(0 0 0 0)"},{clipPath:"inset(0 0 0 100%)"}],160,480,"cubic-bezier(.76,0,.24,1)");
    }
    html.dataset.entryTransition=destination;
    html.dataset.entryDuration=String(duration);
    html.style.setProperty("--entry-exposure","0");
    warm(destination);
    // Mount the chosen route behind the frozen live composition immediately.
    // The visible bridge is gated by an actual completed destination frame.
    routed=true;navigate(destination==="stay"?routes.stay:routes.quick);
    let time=0,last=activated,frame=0,done=false,wait=0,skip=false,readyAt:number|null=null;
    const started=last;
    const ready=()=>{
      if(destination==="quick"){
        const root=document.querySelector<HTMLElement>("[data-qd-root]");
        return Boolean(root&&(reduced||root.querySelector('[data-render-ready="true"]')||root.dataset.enhanced==="false"));
      }
      const world=document.querySelector<HTMLElement>('[data-world-route="garden"]');
      if(!world)return false;
      if(world.dataset.worldStatus==="ready"&&world.querySelector("[data-stay-first-frame-ms]"))return true;
      if(reduced||world.dataset.worldStatus==="failed"||document.querySelector('[data-stay-route="garden"][data-stay-quiet="true"]')){
        const image=world.querySelector<HTMLImageElement>("img");return Boolean(image?.complete&&image.naturalWidth);
      }
      return false;
    };
    const cleanup=(cancelled=false)=>{
      if(done)return;done=true;cancelAnimationFrame(frame);
      cues.forEach(item=>item.animation.cancel());overlay.remove();
      delete html.dataset.entryTransition;delete html.dataset.entryDuration;delete html.dataset.entryTime;
      for(const property of ["--entry-exposure","--entry-content-x","--entry-tracking"])html.style.removeProperty(property);
      html.dataset.entryLast=JSON.stringify({destination,duration,elapsed:performance.now()-started,wait,readyAt,cancelled});
      finishEntryHandoff();
      releaseEntryPreparation();
      window.removeEventListener("popstate",cancel);window.removeEventListener("keydown",key);media.removeEventListener("change",motion);
      if(!cancelled){const main=document.querySelector<HTMLElement>("main");main?.focus({preventScroll:true});}
      busy=false;cancelCurrent=undefined;
    };
    const cancel=()=>cleanup(true);
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape"||event.key==="Tab")skip=true;};
    const motion=()=>{skip=true;};
    const media=matchMedia("(prefers-reduced-motion:reduce)");media.addEventListener("change",motion);
    window.addEventListener("popstate",cancel);window.addEventListener("keydown",key);
    const tick=(now:number)=>{
      if(done)return;
      const dt=now-last;last=now;
      if(!state.ready&&ready()){state.ready=true;readyAt=now-started;}
      const next=Math.min(duration,time+dt);
      if(!state.ready&&next>bridge){wait+=next-Math.min(bridge,next);time=Math.min(time+dt,bridge);}else time=next;
      if(skip&&state.ready)time=duration;
      state.time=time;
      const exposure=reduced?time/duration:destination==="stay"?settle(clamp((time-680)/400)):settle(clamp((time-480)/420));
      state.arrival=destination==="stay"?settle(clamp((time-1080)/370)):1;
      html.style.setProperty("--entry-exposure",String(exposure));
      html.style.setProperty("--entry-content-x",`${reduced?0:-16*(1-exposure)}px`);
      html.style.setProperty("--entry-tracking",`${reduced?-.025:.015-.04*exposure}em`);
      html.dataset.entryTime=time.toFixed(2);
      for(const item of cues)item.animation.currentTime=Math.max(0,time-item.start);
      if(time>=duration){cleanup();return;}
      frame=requestAnimationFrame(tick);
    };
    cancelCurrent=cancel;frame=requestAnimationFrame(tick);
  };
  scene.addEventListener("pointerover",prepare);scene.addEventListener("focusin",prepare);scene.addEventListener("pointerdown",prepare);
  scene.addEventListener("click",click,true);
  return()=>{
    scene.removeEventListener("pointerover",prepare);scene.removeEventListener("focusin",prepare);scene.removeEventListener("pointerdown",prepare);scene.removeEventListener("click",click,true);
    // Route replacement unmounts Landing; its single handoff clock owns cleanup.
    if(!routed)cancelCurrent?.();
  };
}
