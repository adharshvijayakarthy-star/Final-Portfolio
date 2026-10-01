"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type Variant = "desktop" | "mobile";
type Asset = { assetId: string; ownerRoute: string; variants: Record<Variant, { uri: string; nodeNames: string[]; clips: { name: string; duration: number }[] }> };
type Manifest = { assets: Asset[] };
type SceneManifest = { routeId: string; guideAssetId: string; guideNodeNames: string[]; cameraKnots: unknown[]; focusAnchors: unknown[] };
type Result = { route: string; variant: Variant; assets: number; meshes: number; materials: number; textures: number; vertexColors: number; clips: number; anchors: number; triangles: number; passed: boolean; error?: string };
const routes = ["garden", "builder", "thinker", "stories", "work", "aura", "future", "person", "leader", "contact"];

function dispose(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}

async function json<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export default function StayAssetGate() {
  const host = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [state, setState] = useState("Checking delivered GLBs in the browser…");
  useEffect(() => {
    const target = host.current;
    if (!target) return;
    const controller = new AbortController();
    let alive = true;
    let renderer: THREE.WebGLRenderer;
    const loader = new GLTFLoader();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e7e4da");
    scene.add(new THREE.HemisphereLight("#f2efe6", "#35493a", 1.4));
    const sun = new THREE.DirectionalLight("#fff0d6", 2);
    sun.position.set(-4.5, 8, 3); scene.add(sun);
    const camera = new THREE.PerspectiveCamera(46, 1, .1, 220);
    let mounted: THREE.Object3D | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      target.appendChild(renderer.domElement);
    } catch (error) {
      const message = `WebGL unavailable: ${String(error)}`;
      queueMicrotask(() => { if (alive) setState(message); });
      return () => { alive = false; controller.abort(); };
    }
    const resize = () => {
      if (!alive) return;
      const width = Math.max(1, target.clientWidth), height = Math.max(1, target.clientHeight);
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(target);
    const run = async () => {
      try {
        const manifest = await json<Manifest>("/models/stay/v1/asset-manifest.json", controller.signal);
        for (const route of routes) {
          const contract = await json<SceneManifest>(`/models/stay/v1/${route}/${route}.scene.json`, controller.signal);
          for (const variant of ["desktop", "mobile"] as const) {
            const result: Result = { route, variant, assets: 0, meshes: 0, materials: 0, textures: 0, vertexColors: 0, clips: 0, anchors: 0, triangles: 0, passed: false };
            try {
              if (!contract.cameraKnots.length || !contract.focusAnchors.length) throw new Error("Missing camera or focus references");
              for (const assetId of manifest.assets.filter(item => item.ownerRoute === route).map(item => item.assetId)) {
                const asset = manifest.assets.find(item => item.assetId === assetId);
                if (!asset) throw new Error(`Missing manifest asset ${assetId}`);
                const expected = asset.variants[variant];
                const response = await fetch(expected.uri, { signal: controller.signal, cache: "no-store" });
                if (!response.ok) throw new Error(`${expected.uri}: HTTP ${response.status}`);
                const gltf = await loader.parseAsync(await response.arrayBuffer(), expected.uri.slice(0, expected.uri.lastIndexOf("/") + 1));
                if (!alive) { dispose(gltf.scene); return; }
                const root = gltf.scene;
                const names = new Set<string>();
                const materialSet = new Set<THREE.Material>();
                const textureSet = new Set<THREE.Texture>();
                root.traverse(node => {
                  if (node.name) names.add(node.name);
                  if (!(node instanceof THREE.Mesh)) return;
                  result.meshes++;
                  result.triangles += node.geometry.index ? node.geometry.index.count / 3 : (node.geometry.getAttribute("position")?.count ?? 0) / 3;
                  for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
                    materialSet.add(material);
                    if ((material as THREE.MeshStandardMaterial).vertexColors) result.vertexColors++;
                    for (const value of Object.values(material)) if (value instanceof THREE.Texture) textureSet.add(value);
                  }
                });
                for (const name of expected.nodeNames) if (!names.has(name)) throw new Error(`${assetId}: missing ${name}`);
                for (const clip of expected.clips) {
                  const animation = gltf.animations.find(item => item.name === clip.name);
                  if (!animation) throw new Error(`${assetId}: missing clip ${clip.name}`);
                  const mixer = new THREE.AnimationMixer(root);
                  const action = mixer.clipAction(animation);
                  action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play();
                  const pose = (time: number) => {
                    action.reset(); action.play();
                    mixer.setTime(time); root.updateMatrixWorld(true);
                    return animation.tracks.map(track => {
                      const nodeName = track.name.split(".")[0];
                      return root.getObjectByName(nodeName ?? "")?.matrixWorld.elements.map(value => value.toFixed(5)).join(",") ?? "";
                    }).join("|");
                  };
                  const first = pose(0), last = pose(animation.duration);
                  const middle = pose(animation.duration * .5);
                  const reversedFirst = pose(0), reversedLast = pose(animation.duration);
                  if (first !== reversedFirst || last !== reversedLast) throw new Error(`${clip.name}: reverse seek changed endpoints`);
                  if (first === last && first === middle) throw new Error(`${clip.name}: no transform change across clip`);
                  mixer.stopAllAction(); mixer.uncacheRoot(root);
                  result.clips++;
                }
                if (assetId === contract.guideAssetId) {
                  for (const name of contract.guideNodeNames) if (!names.has(name)) throw new Error(`${assetId}: missing guide ${name}`);
                  result.anchors = contract.guideNodeNames.length;
                }
                result.assets++; result.materials += materialSet.size; result.textures += textureSet.size;
                if (mounted) { scene.remove(mounted); dispose(mounted); }
                mounted = root; scene.add(root);
                const bounds = new THREE.Box3().setFromObject(root);
                const size = bounds.getSize(new THREE.Vector3());
                const center = bounds.getCenter(new THREE.Vector3());
                const distance = Math.max(3, size.length() * .8);
                camera.position.copy(center).add(new THREE.Vector3(distance * .55, distance * .35, distance));
                camera.lookAt(center);
                resize();
              }
              result.passed = result.meshes > 0 && result.anchors > 0;
              if (!result.passed) throw new Error("No mesh or guide anchors rendered");
            } catch (error) { result.error = error instanceof Error ? error.message : String(error); }
            if (!alive) return;
            setResults(previous => [...previous, result]);
          }
        }
        if (mounted) { scene.remove(mounted); dispose(mounted); mounted = null; }
        renderer.render(scene, camera);
        setState("Browser gate finished. Every sample was mounted, rendered, and released.");
      } catch (error) { if (alive) setState(`Browser gate stopped: ${String(error)}`); }
    };
    void run();
    return () => {
      alive = false; controller.abort(); observer.disconnect();
      if (mounted) { scene.remove(mounted); dispose(mounted); }
      renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div style={{ padding: "2rem", color: "#182118", background: "#f2efe6" }}>
    <h1>Stay Awhile · final GLB browser gate</h1><p>Development-only verification of all 94 final exports, in both independent variants.</p>
    <div ref={host} style={{ width: "100%", height: "40vh", minHeight: 240, background: "#e7e4da" }} aria-hidden="true" />
    <p role="status" data-gate-state>{state}</p>
    <p data-gate-count>{results.filter(item => item.passed).length} / {routes.length * 2} route-variant samples passed</p>
    <ul>{results.map(item => <li key={`${item.route}-${item.variant}`} data-gate-result={`${item.route}-${item.variant}`}>
      {item.route} {item.variant}: {item.passed ? "PASS" : `FAIL — ${item.error}`} · {item.assets} assets · {item.meshes} meshes · {item.materials} materials · {item.textures} textures · {item.vertexColors} vertex-color materials · {item.clips} clips · {item.anchors} anchors · {Math.round(item.triangles)} triangles
    </li>)}</ul>
  </div>;
}
