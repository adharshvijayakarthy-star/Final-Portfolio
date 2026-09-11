"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import styles from "./prototype.module.css";

const MODEL_URL = "/models/aura-poc/aura-garden-poc.glb";

function disposeModel(model: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  textures.forEach((value) => value.dispose());
  materials.forEach((value) => value.dispose());
  geometries.forEach((value) => value.dispose());
}

export default function BlenderViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState("Awaiting Blender export inspection…");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const abort = new AbortController();
    let stopped = false;
    let cleanupViewer = () => {};

    async function load() {
      let model: THREE.Group | undefined;
      try {
        // Fetch first: a missing Blender export is never replaced with fake geometry.
        const response = await fetch(MODEL_URL, { signal: abort.signal, cache: "no-store" });
        if (response.status === 404) {
          setStatus("Waiting for manual Blender export. Run scripts/blender/create-aura-poc.py in Blender, then refresh this page. No GLB has been rendered yet.");
          return;
        }
        if (!response.ok) throw new Error("GLB request returned HTTP " + response.status);
        const bytes = await response.arrayBuffer();
        const gltf = await new GLTFLoader().parseAsync(bytes, "/models/aura-poc/");
        model = gltf.scene;
        if (stopped) return;
        let meshCount = 0;
        const materialNames = new Set<string>();
        model.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            meshCount++;
            (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => materialNames.add(m.name));
          }
        });
        if (!meshCount) throw new Error("The GLB contains no mesh geometry.");
        const exportedCamera = gltf.cameras.find((camera) => camera instanceof THREE.PerspectiveCamera);
        if (!(exportedCamera instanceof THREE.PerspectiveCamera)) throw new Error("The GLB has no perspective camera. Enable Cameras in Blender's glTF export.");
        if (!model.getObjectByName("POC_Sun")) throw new Error("The GLB is missing POC_Sun. Enable Punctual Lights in Blender's glTF export.");
        model.updateMatrixWorld(true);
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#242c35");
        scene.add(model);
        // The website owns the active camera, initialized from Blender's world pose.
        const camera = new THREE.PerspectiveCamera(exportedCamera.fov, 1, 0.05, 200);
        exportedCamera.getWorldPosition(camera.position);
        exportedCamera.getWorldQuaternion(camera.quaternion);
        const initialPosition = camera.position.clone();
        const target = new THREE.Vector3(0, 0.8, 0); // Blender (0, 0, .8), exported Y-up.
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        host!.appendChild(renderer.domElement);
        renderer.domElement.setAttribute("aria-label", "Actual Blender GLB scene; orbit with pointer or touch");
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.copy(target);
        controls.minDistance = 3;
        controls.maxDistance = 40;
        controls.maxPolarAngle = Math.PI * 0.49;
        controls.enableDamping = false;
        const render = () => { if (!stopped) renderer.render(scene, camera); };
        const resize = () => {
          const width = host!.clientWidth, height = host!.clientHeight;
          if (!width || !height) return;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          // Keep vertical and horizontal framing roomy on a narrow window.
          camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(exportedCamera.fov / 2)) / Math.min(1, camera.aspect)));
          camera.updateProjectionMatrix();
          render();
        };
        const observer = new ResizeObserver(resize);
        const contextLost = (event: Event) => {
          event.preventDefault();
          setReady(false);
          setStatus("WebGL context lost. Rendering stopped. Refresh after checking browser graphics acceleration.");
        };
        cleanupViewer = () => {
          observer.disconnect();
          renderer.domElement.removeEventListener("webglcontextlost", contextLost);
          controls.removeEventListener("change", render);
          controls.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        controls.addEventListener("change", render);
        resetRef.current = () => { camera.position.copy(initialPosition); controls.target.copy(target); controls.update(); render(); };
        controls.update();
        observer.observe(host!);
        resize();
        const info = renderer.info.render;
        setReady(true);
        setStatus("Rendered Blender GLB · " + (bytes.byteLength / 1024).toFixed(1) + " KB · " + meshCount + " meshes · " + materialNames.size + " materials · " + info.triangles + " triangles · " + info.calls + " draw calls. Renders only on orbit or resize.");
      } catch (error) {
        cleanupViewer();
        if (!stopped) {
          setStatus("Pipeline stopped: " + (error instanceof Error ? error.message : String(error)) + ". No substitute scene is displayed.");
          setReady(false);
        }
      } finally {
        // Model lifetime extends to unmount after successful rendering.
        if (model) {
          const loadedModel = model;
          const cleanup = cleanupViewer;
          cleanupViewer = () => { cleanup(); disposeModel(loadedModel); };
          if (stopped) cleanupViewer();
        }
      }
    }
    void load();
    return () => { stopped = true; abort.abort(); resetRef.current = null; cleanupViewer(); };
  }, []);

  return (
    <>
      <div ref={hostRef} className={styles.canvas} />
      <div role="status" className={styles.status}>{status}</div>
      {ready && <button type="button" className={styles.button} onClick={() => resetRef.current?.()}>Reset camera</button>}
    </>
  );
}
