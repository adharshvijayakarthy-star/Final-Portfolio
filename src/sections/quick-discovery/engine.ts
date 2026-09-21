import { bindChapterNavigation } from "./navigation";
import { clamp, damp, headingPose, journeyAt, range, STAGE_ORDER } from "./continuity";
import type { Track } from "./continuity";
import { SpatialAsset } from "./spatial-asset";

const all = <T extends Element = HTMLElement>(root: Element, selector: string) => Array.from(root.querySelectorAll<T>(selector));

/** A single lifecycle-owned loop: scroll → damped journey → Blender + DOM.
 * No stage timers or observers can race with reverse scroll/direct navigation.
 */
export function startQuickDiscovery(root: HTMLElement) {
  const scenes=STAGE_ORDER.map(name=>{
    const section=root.querySelector<HTMLElement>(`[data-stage="${name}"]`)!;
    const view=section.querySelector<HTMLElement>("[data-scene]")!;
    return {name,section,view,title:view.querySelector<HTMLElement>("[data-title]"),words:all<HTMLElement>(view,"[data-word]"),chars:all<HTMLElement>(view,"[data-char]"),support:all<HTMLElement>(view,"[data-support]"),label:view.querySelector<HTMLElement>("[data-label]"),evidence:view.querySelector<HTMLElement>("[data-evidence]"),beats:all<HTMLElement>(view,"[data-beat]"),roles:all<HTMLElement>(view,"[data-role]"),caps:all<HTMLElement>(view,"[data-cap]"),indices:all<HTMLElement>(view,"[data-index-item]"),archives:all<HTMLElement>(view,"[data-archive]"),planes:all<HTMLElement>(view,"[data-plane]"),lastActive:false};
  });
  const canvas=root.querySelector<HTMLCanvasElement>("[data-world-canvas]")!;
  const toggle=root.querySelector<HTMLButtonElement>("[data-motion-toggle]")!;
  const atmosphere=root.querySelector<HTMLElement>("[data-atmosphere]")!;
  const progress=root.querySelector<HTMLElement>("[data-progress]")!;
  const line=root.querySelector<SVGPathElement>("[data-build-line]")!;
  const count=root.querySelector<HTMLElement>("[data-count]")!;
  const tier=root.querySelector<HTMLElement>("[data-tier]")!;
  const media=matchMedia("(prefers-reduced-motion: reduce)");
  let reduced=media.matches, disposed=false, loading=false, failed=false;
  let asset:SpatialAsset|null=null, raf=0, bounds:Track[]=[], current=0, target=0;
  let x=0,y=0,tx=0,ty=0,last=performance.now(),elapsed=0,needsMeasure=true;
  let active=-1,frameCount=0,frameTotal=0,sampleTime=0;
  const magnets=all<HTMLElement>(root,"[data-rail] a,[data-deeper],[data-stay]").map(el=>({el,x:0,y:0,tx:0,ty:0}));

  const measure=()=>{
    bounds=scenes.map(s=>({top:s.section.getBoundingClientRect().top+scrollY,height:s.section.offsetHeight}));
    asset?.resize(innerWidth,innerHeight);needsMeasure=false;
  };
  const resetStyles=()=>{
    scenes.forEach(s=>{
      s.view.inert=false;s.view.removeAttribute("data-active");s.view.removeAttribute("aria-hidden");
      all<HTMLElement>(s.view,"[style]").forEach(el=>el.removeAttribute("style"));s.view.removeAttribute("style");
      s.chars.forEach(el=>el.removeAttribute("data-cursor"));
    });
    magnets.forEach(m=>{m.el.style.removeProperty("translate");m.x=m.y=m.tx=m.ty=0;});
    line.style.strokeDashoffset="0";
  };
  const updateNavigation=()=>{
    const dominant=reduced?Math.max(0,bounds.findLastIndex(b=>b.top<=scrollY+innerHeight*.4)):Math.floor(clamp(current+.04,0,STAGE_ORDER.length-1));
    if(dominant===active)return;
    active=dominant;
    const name=STAGE_ORDER[dominant];
    const key=name==="entry"?"who":["workcard","plan","papers","mun","snrled","aura"].includes(name!)?"work":name;
    all<HTMLAnchorElement>(root,"[data-rail] a").forEach(a=>{if(a.dataset["chip"]===key)a.setAttribute("aria-current","location");else a.removeAttribute("aria-current");});
    root.dataset["current"]=STAGE_ORDER[dominant]??"entry";
  };

  const drawNative=(j:number)=>{
    scenes.forEach((s,index)=>{
      let p=j-index;
      if(index===0&&j<.23)p=Math.max(p,-.16+range(elapsed,.1,2.1)*.4);
      const visible=p>-.24&&(s.name==="contact"||p<1.12);
      const alpha=range(p,-.24,-.08)*(s.name==="contact"?1:1-range(p,.92,1.12));
      s.view.style.opacity=alpha.toFixed(4);
      const interactive=p>=.08&&(s.name==="contact"||p<.91);
      if(interactive!==s.lastActive){s.view.inert=!interactive;s.view.dataset["active"]=String(interactive);s.lastActive=interactive;}
      if(!visible)return;
      const chapter=["build","think","lead","workcard","beyond","future"].includes(s.name);
      const textP=chapter?p-.12:p;
      const exit=s.name==="contact"?0:range(p,.76,.98);
      s.words.forEach((word,i)=>{
        const pose=headingPose(s.name==="contact"?Math.min(p,.7):textP,i,0);
        word.style.transform=`translate3d(${pose.x.toFixed(2)}px,${pose.y.toFixed(2)}%,0) rotate(${pose.rotation.toFixed(2)}deg)`;
        word.style.clipPath=`inset(0 ${pose.clip.toFixed(2)}% 0 0)`;
        word.style.opacity=String(pose.opacity);
      });
      if(s.chars.length){
        const reveal=clamp((p-.025)/.29);const n=Math.floor(reveal*s.chars.length);
        s.chars.forEach((ch,i)=>{
          ch.style.opacity=String(clamp((reveal*s.chars.length-i)*1.6));
          if(i===n-1&&n<s.chars.length)ch.setAttribute("data-cursor","");else ch.removeAttribute("data-cursor");
        });
      }
      s.support.forEach((text,i)=>{
        const t=range(textP,.09+i*.027,.25+i*.027);
        text.style.opacity=String(t*(1-exit));
        text.style.clipPath=`inset(0 ${(1-t)*100}% 0 0)`;
        text.style.transform=`translateY(${(1-t)*12-exit*9}px)`;
      });
      if(s.label){const t=range(p,-.09,.1);s.label.style.clipPath=`inset(0 ${(1-t)*100}% 0 0)`;s.label.style.opacity=String(1-exit);s.label.style.letterSpacing=`${.13+(1-t)*.09}em`;}
      if(s.evidence){s.evidence.style.opacity=String(range(p,.24,.4)*(1-exit));}
      s.beats.forEach((beat,i)=>{
        const n=Math.min(s.beats.length-1,Math.floor(clamp((p-.12)/.68)*s.beats.length));
        beat.toggleAttribute("data-current",i===n);beat.style.opacity=String(range(p,.06+i*.045,.16+i*.045)*(1-exit));
      });
      s.roles.forEach((role,i)=>{const t=range(p,.1+i*.07,.31+i*.07);role.style.clipPath=`inset(0 ${(1-t)*100}% 0 0)`;role.style.transform=`translateX(${(1-t)*(i%2?32:-22)}px) scale(${.94+.06*t-exit*.09})`;role.style.opacity=String(1-exit);});
      s.caps.forEach((cap,i)=>{const t=range(p,.09+i*.055,.3+i*.055);cap.style.transform=`translate(${(1-t)*(i%2?-26:26)}px,${(1-t)*(i<2?22:-22)}px)`;cap.style.clipPath=`inset(0 0 ${(1-t)*100}% 0)`;cap.style.opacity=String(1-exit);});
      if(s.name==="build")line.style.strokeDashoffset=String(1-range(p,.04,.55));
      s.indices.forEach((item,i)=>{const t=range(p,.04+i*.055,.24+i*.055);item.style.clipPath=`inset(0 ${(1-t)*100}% 0 0)`;item.style.transform=`translateX(${(1-t)*22}px)`;item.style.opacity=String(1-exit);});
      s.archives.forEach((item,i)=>{
        const mobile=innerWidth<761;
        const t=range(p,-.1+i*.045,.17+i*.045), departure=range(p,.73,1.12);
        const depth=[-230,110,-100,40][i]??0;
        const dx=[-34,18,0,42][i]??0, dy=[0,0,75,-16][i]??0;
        const drift=(clamp(p,.2,.72)-.45)*(i%2?20:-16);
        // Focus is a stable reading pose; the modal uses the same native dialog.
        const focused=item.matches(":hover, :focus-within");
        const motion=mobile?.22:1;
        item.style.transform=focused?"none":`perspective(1100px) translate3d(${((1-t)*dx+drift+departure*(i%2?190:-150))*motion}px,${((1-t)*dy+departure*80+y*(i+1)*2)*motion}px,${((1-t)*-450+depth*(1-departure)-departure*750)*motion}px) rotateY(${((1-t)*(i===2?18:-6)+x*2)*motion}deg) rotateZ(${(i%2?1:-1)*1.6*motion}deg)`;
        item.style.opacity=String(t*(1-departure));
      });
      s.planes.forEach((plane,i)=>{const t=range(p,.2+i*.055,.4+i*.055);const departure=range(p,.88,1.1);plane.style.transform=`translate3d(${(1-t)*(-15+i*10)}px,${-(departure*40)}px,${-(1-t)*130-departure*150}px) scale(${1-departure*.1})`;plane.style.opacity=String(t*(1-departure*.7));plane.style.clipPath=`inset(0 ${(1-t)*100}% 0 0)`;});
      if(s.name==="snrled"){
        count.textContent=String(Math.round(range(p,.14,.65)*40));
        tier.textContent=p>.65?"STANDARD":"EARLY-BIRD";
      }
    });
  };

  const tick=(now:number)=>{
    raf=0;if(disposed||document.hidden||reduced||failed)return;
    const actualDt=(now-last)/1000;const dt=Math.min(.05,actualDt);last=now;elapsed+=dt;
    if(needsMeasure)measure();
    target=journeyAt(scrollY,bounds);
    current=damp(current,target,dt,15);
    if(Math.abs(target-current)<.0001)current=target;
    x=damp(x,tx,dt,5);y=damp(y,ty,dt,5);
    drawNative(current);updateNavigation();
    asset?.draw(current,x,y,elapsed);
    atmosphere.style.transform=`translate3d(${x*7+Math.sin(elapsed*.11)*5}px,${y*4+Math.cos(elapsed*.09)*4}px,0)`;
    progress.style.transform=`scaleX(${clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))})`;
    magnets.forEach(m=>{m.x=damp(m.x,m.tx,dt,9);m.y=damp(m.y,m.ty,dt,9);m.el.style.translate=`${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;});
    frameCount++;frameTotal+=actualDt;sampleTime+=dt;
    if(sampleTime>2){root.dataset["frameMs"]=(frameTotal/frameCount*1000).toFixed(1);root.dataset["journey"]=current.toFixed(3);frameCount=0;frameTotal=0;sampleTime=0;}
    raf=requestAnimationFrame(tick);
  };
  const start=()=>{if(!raf&&!reduced&&!disposed&&!failed&&!document.hidden){last=performance.now();raf=requestAnimationFrame(tick);}};
  const ensureAsset=()=>{
    if(asset||loading||reduced||failed)return;
    loading=true;
    const onFailure=()=>{failed=true;root.querySelector<HTMLElement>("[data-asset-error]")!.hidden=false;root.dataset["enhanced"]="false";cancelAnimationFrame(raf);raf=0;resetStyles();};
    // Keep the renderer in the route bundle: a stale lazy chunk previously left
    // the complete atmosphere and every project invisible after a dev restart.
    // GLBs still load asynchronously and only when motion is enabled.
    try{asset=new SpatialAsset(canvas,onFailure);asset.resize(innerWidth,innerHeight);}
    catch(error){console.error("AURA WebGL unavailable",error);onFailure();}
    finally{loading=false;}
  };
  const applyMode=()=>{
    const previousIndex=bounds.length?Math.floor(journeyAt(scrollY,bounds)):0;
    cancelAnimationFrame(raf);raf=0;
    root.dataset["enhanced"]=String(!reduced&&!failed);
    toggle.setAttribute("aria-pressed",String(reduced));toggle.textContent=reduced?"Enable motion":"Reduce motion";
    resetStyles();measure();active=-1;
    if(reduced){asset?.dispose();asset=null;}
    else{scenes.forEach(s=>{s.view.inert=true;s.lastActive=false;});current=journeyAt(scrollY,bounds);drawNative(current);ensureAsset();}
    // Keep a mode change at the same semantic destination, not an arbitrary
    // scroll offset in a document whose height just changed.
    if(elapsed>0&&bounds[previousIndex])window.scrollTo({top:bounds[previousIndex]!.top+(reduced?-80:bounds[previousIndex]!.height*.3),behavior:"instant"});
    if(!reduced){current=journeyAt(scrollY,bounds);drawNative(current);}
    updateNavigation();start();
  };
  const scroll=()=>{if(reduced||failed){if(needsMeasure)measure();updateNavigation();}else start();};
  const resize=()=>{needsMeasure=true;if(reduced)measure();start();};
  const pointer=(event:PointerEvent)=>{
    if(reduced||innerWidth<761||event.pointerType!=="mouse")return;
    tx=(event.clientX/innerWidth-.5)*2;ty=(event.clientY/innerHeight-.5)*2;
    const hovered=(event.target as Element).closest("a");
    magnets.forEach(m=>{if(hovered===m.el){const r=m.el.getBoundingClientRect();m.tx=clamp((event.clientX-r.left-r.width/2)*.08,-3,3);m.ty=clamp((event.clientY-r.top-r.height/2)*.08,-2,2);}else m.tx=m.ty=0;});
  };
  const leave=()=>{tx=ty=0;magnets.forEach(m=>{m.tx=m.ty=0;});};
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else start();};
  const motionClick=()=>{reduced=!reduced;applyMode();};
  const motionChange=()=>{reduced=media.matches;applyMode();};
  const offNav=bindChapterNavigation(root,()=>reduced||failed);
  const observer=new ResizeObserver(resize);observer.observe(root);
  window.addEventListener("scroll",scroll,{passive:true});window.addEventListener("resize",resize);
  root.addEventListener("pointermove",pointer,{passive:true});root.addEventListener("pointerleave",leave);
  document.addEventListener("visibilitychange",visibility);media.addEventListener("change",motionChange);toggle.addEventListener("click",motionClick);
  applyMode();
  void document.fonts.ready.then(()=>{if(!disposed)resize();});
  return()=>{
    disposed=true;cancelAnimationFrame(raf);offNav();observer.disconnect();asset?.dispose();
    window.removeEventListener("scroll",scroll);window.removeEventListener("resize",resize);
    root.removeEventListener("pointermove",pointer);root.removeEventListener("pointerleave",leave);
    document.removeEventListener("visibilitychange",visibility);media.removeEventListener("change",motionChange);toggle.removeEventListener("click",motionClick);
    resetStyles();delete root.dataset["enhanced"];
  };
}
