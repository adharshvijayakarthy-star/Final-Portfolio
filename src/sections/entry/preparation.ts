import type { SpatialAsset } from "../quick-discovery/spatial-asset";
import type { WorldRuntime } from "../stay/world/WorldRuntime";
import type { SceneManifest } from "../stay/world/types";

type Quick = { canvas: HTMLCanvasElement; asset: SpatialAsset; ready: boolean };
type Stay = { host: HTMLDivElement; runtime: WorldRuntime; manifest: SceneManifest | null; ready: boolean };
let quick: Quick | null = null, stay: Stay | null = null;
let generation=0;

/** Prepare GPU frames during Landing, then transfer the chosen renderer. The
 * unused destination is disposed; direct route visits keep their normal path. */
export function prepareEntryWorlds() {
  if(matchMedia("(prefers-reduced-motion:reduce)").matches)return;
  const token=++generation;
  const width=innerWidth,height=innerHeight;
  void import("../quick-discovery/spatial-asset").then(({SpatialAsset})=>{
    if(token!==generation)return;
    const canvas=document.createElement("canvas");
    const asset=new SpatialAsset(canvas,()=>{if(quick?.asset===asset){asset.dispose();quick=null;}});
    quick={canvas,asset,ready:false};asset.resize(width,height);
    const prepare=()=>{
      if(token!==generation||quick?.asset!==asset)return;
      if(canvas.dataset.asset==="ready"){
        asset.draw(0,0,0,0);canvas.dataset.renderReady="true";quick.ready=true;
      }else requestAnimationFrame(prepare);
    };
    requestAnimationFrame(prepare);
  }).catch(()=>undefined);
  void import("../stay/world/WorldRuntime").then(async({WorldRuntime})=>{
    if(token!==generation)return;
    const host=document.createElement("div");host.dataset.entryPreparation="stay";
    host.style.cssText="position:fixed;inset:0;visibility:hidden;pointer-events:none;contain:strict";
    document.body.append(host);
    let runtime:WorldRuntime;
    try{runtime=new WorldRuntime(host);}catch{host.remove();return;}
    const prepared:Stay={host,runtime,manifest:null,ready:false};stay=prepared;
    try{
      const variant=matchMedia("(max-width:767px), (pointer:coarse)").matches?"mobile":"desktop";
      prepared.manifest=await runtime.attach("garden",variant);
      const settle=()=>{
        if(token!==generation||stay!==prepared)return;
        if(runtime.renderer.domElement.dataset.stayFirstFrameMs){
          prepared.ready=true;runtime.setVisible(false);
        }else requestAnimationFrame(settle);
      };
      requestAnimationFrame(settle);
    }catch{runtime.dispose();host.remove();if(stay===prepared)stay=null;}
  }).catch(()=>undefined);
}

export function takePreparedQuick(original: HTMLCanvasElement) {
  if(!quick?.ready)return null;
  const result=quick;quick=null;
  for(const attribute of original.attributes)result.canvas.setAttribute(attribute.name,attribute.value);
  original.replaceWith(result.canvas);
  return result;
}
export function takePreparedStay(host: HTMLDivElement) {
  if(!stay?.ready||!stay.manifest)return null;
  const result={runtime:stay.runtime,manifest:stay.manifest};
  const oldHost=stay.host;stay=null;
  result.runtime.adoptEntryHost(host);oldHost.remove();
  return result;
}
export function releaseEntryPreparation() {
  generation++;
  quick?.asset.dispose();quick=null;
  stay?.runtime.dispose();stay?.host.remove();stay=null;
}
