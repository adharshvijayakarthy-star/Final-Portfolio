import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Variant } from "./types";

type Palette = "sakura" | "green" | "distant";
type Stem = { from: THREE.Vector3; to: THREE.Vector3; radius: number };
type Bud = { point: THREE.Vector3; radius: number; color: THREE.Color; turn: number };
const up = new THREE.Vector3(0, 1, 0);

function randomSource(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function rod(from: THREE.Vector3, to: THREE.Vector3, radius: number, sides = 5) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius * .67, radius, length, sides, 1);
  const middle = from.clone().add(to).multiplyScalar(.5);
  geometry.applyMatrix4(new THREE.Matrix4().compose(middle, new THREE.Quaternion().setFromUnitVectors(up, direction.normalize()), new THREE.Vector3(1, 1, 1)));
  return geometry;
}

function sprayGeometry(palette: Palette) {
  const vertices: number[] = [];
  const count = palette === "sakura" ? 5 : 7;
  const blossom = palette === "sakura";
  for (let petal = 0; petal < count; petal++) {
    const angle = Math.PI * 2 * petal / count;
    const direction = new THREE.Vector3(Math.cos(angle), blossom ? .18 : .22 + (petal % 3) * .16, Math.sin(angle)).normalize();
    const side = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    const base = direction.clone().multiplyScalar(blossom ? .12 : .09);
    const shoulder = direction.clone().multiplyScalar(blossom ? .62 : .56).add(new THREE.Vector3(0, blossom ? .08 : .14, 0));
    const width = blossom ? .28 : .19;
    const left = shoulder.clone().addScaledVector(side, width);
    const right = shoulder.clone().addScaledVector(side, -width);
    const tip = direction.clone().multiplyScalar(blossom ? 1 : 1.28).add(new THREE.Vector3(0, blossom ? .16 : .12, 0));
    for (const point of [base, left, right, left, tip, right]) vertices.push(point.x, point.y, point.z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** One merged bark draw and one instanced foliage draw per specimen. */
function makeSpecimen(stems: Stem[], buds: Bud[], palette: Palette) {
  const group = new THREE.Group();
  const rods = stems.map(item => rod(item.from, item.to, item.radius, item.radius > .12 ? 7 : 5));
  const bark = mergeGeometries(rods);
  rods.forEach(item => item.dispose());
  if (bark) group.add(new THREE.Mesh(bark, new THREE.MeshStandardMaterial({ color: palette === "distant" ? "#574939" : "#604934", roughness: .98, flatShading: false })));
  if (buds.length) {
    const leafGeometry = palette === "sakura" ? sprayGeometry(palette) : new THREE.IcosahedronGeometry(1, 0);
    const leaves = new THREE.InstancedMesh(leafGeometry, new THREE.MeshStandardMaterial({ color: "#fff", roughness: .9, side: THREE.DoubleSide }), buds.length);
    const transform = new THREE.Object3D();
    buds.forEach((bud, index) => {
      transform.position.copy(bud.point);
      transform.rotation.set(bud.turn * .51, bud.turn, bud.turn * .23);
      transform.scale.set(bud.radius * (palette === "sakura" ? 1.55 : 1.05), bud.radius * (palette === "sakura" ? 1.2 : .73), bud.radius * (palette === "sakura" ? 1.55 : 1.08));
      transform.updateMatrix();
      leaves.setMatrixAt(index, transform.matrix);
      leaves.setColorAt(index, bud.color);
    });
    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    leaves.frustumCulled = false;
    group.add(leaves);
  }
  return group;
}

function colorFor(palette: Palette, value: number) {
  const colors = palette === "sakura"
    ? ["#f2d1c5", "#e3a8ac", "#f7e5d7", "#cb8991", "#e9b9b8"]
    : palette === "distant"
      ? ["#40583c", "#516b46", "#647b50", "#354f39", "#71845d"]
      : ["#314e32", "#456b3c", "#648049", "#79935b", "#3b603a"];
  return new THREE.Color(colors[Math.floor(value * colors.length)]!);
}

function sakuraCrown(seed: number, variant: Variant) {
  const rand = randomSource(seed);
  const stems: Stem[] = [], buds: Bud[] = [];
  // The delivered stems have long planar wedges that cross the camera rail.
  // Keep their authored placement while constructing a curved, tapered trunk
  // with four distinct leaders and open blossom sprays at the branch tips.
  const p = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  stems.push({ from: p(0, 0, 0), to: p(-.12, 1.15, .08), radius: .31 });
  stems.push({ from: p(-.12, 1.15, .08), to: p(.08, 2.35, -.08), radius: .24 });
  stems.push({ from: p(.08, 2.35, -.08), to: p(0, 3.55, 0), radius: .16 });
  stems.push({ from: p(-.1, 1.45, .06), to: p(1.45, 1.9, .45), radius: .13 });
  stems.push({ from: p(-.1, 1.65, .04), to: p(-1.35, 2, .55), radius: .14 });
  stems.push({ from: p(.05, 1.75, -.08), to: p(-.2, 1.95, -1.5), radius: .12 });
  const bases = [
    { root: [0, 3.55, 0], width: 1.65, height: 1.55 },
    { root: [1.45, 1.9, .45], width: 1.15, height: 1.1 },
    { root: [-1.35, 2.0, .55], width: 1.3, height: 1.1 },
    { root: [-.2, 1.95, -1.5], width: 1.2, height: 1.05 },
  ] as const;
  for (const [treeIndex, base] of bases.entries()) {
    const center = new THREE.Vector3(...base.root);
    const count = treeIndex === 0 ? 7 : 5;
    for (let limb = 0; limb < count; limb++) {
      const angle = Math.PI * 2 * (limb + rand() * .42) / count + treeIndex * .8;
      const spread = base.width * (.65 + rand() * .55);
      const shoulder = center.clone().add(new THREE.Vector3(Math.cos(angle) * spread * .55, base.height * (.18 + rand() * .22), Math.sin(angle) * spread * .55));
      const tip = center.clone().add(new THREE.Vector3(Math.cos(angle) * spread, base.height * (.57 + rand() * .45), Math.sin(angle) * spread));
      stems.push({ from: center.clone(), to: shoulder, radius: treeIndex === 0 ? .09 : .075 });
      stems.push({ from: shoulder, to: tip, radius: .047 });
      for (let fork = 0; fork < 2; fork++) {
        const twig = tip.clone().add(new THREE.Vector3((rand() - .5) * .72, .22 + rand() * .43, (rand() - .5) * .75));
        stems.push({ from: tip.clone(), to: twig, radius: .024 });
        const flowers = variant === "mobile" ? 7 : 13;
        for (let flower = 0; flower < flowers; flower++) {
          const point = twig.clone().add(new THREE.Vector3((rand() - .5) * .64, (rand() - .5) * .52, (rand() - .5) * .68));
          buds.push({ point, radius: .11 + rand() * .085, color: colorFor("sakura", rand()), turn: rand() * Math.PI * 2 });
        }
      }
    }
  }
  return makeSpecimen(stems, buds, "sakura");
}

function tree(seed: number, variant: Variant, palette: "green" | "distant", height: number) {
  const rand = randomSource(seed);
  const stems: Stem[] = [], buds: Bud[] = [];
  const lean = (rand() - .5) * .65;
  const base = new THREE.Vector3(0, 0, 0);
  const shoulder = new THREE.Vector3(lean * .42, height * .48, 0);
  const crown = new THREE.Vector3(lean, height * .78, (rand() - .5) * .35);
  stems.push({ from: base, to: shoulder, radius: height * .055 });
  stems.push({ from: shoulder, to: crown, radius: height * .036 });
  const limbs = palette === "distant" ? 5 : 8;
  for (let limb = 0; limb < limbs; limb++) {
    const angle = (limb + rand() * .38) * Math.PI * 2 / limbs;
    const spread = height * (palette === "distant" ? .34 : .38) * (.7 + rand() * .55);
    const start = shoulder.clone().lerp(crown, .18 + rand() * .65);
    const end = start.clone().add(new THREE.Vector3(Math.cos(angle) * spread, height * (.07 + rand() * .15), Math.sin(angle) * spread));
    stems.push({ from: start, to: end, radius: height * (palette === "distant" ? .018 : .026) });
    const forks = palette === "distant" ? 2 : 3;
    for (let fork = 0; fork < forks; fork++) {
      const twig = end.clone().add(new THREE.Vector3((rand() - .5) * spread * .65, height * (.08 + rand() * .09), (rand() - .5) * spread * .65));
      stems.push({ from: end.clone(), to: twig, radius: height * .009 });
      const clusters = palette === "distant" ? (variant === "mobile" ? 4 : 6) : variant === "mobile" ? 6 : 10;
      for (let cluster = 0; cluster < clusters; cluster++) {
        const point = twig.clone().add(new THREE.Vector3((rand() - .5) * .62, (rand() - .5) * .45, (rand() - .5) * .62));
        buds.push({ point, radius: height * (palette === "distant" ? .049 : .034) * (.7 + rand() * .45), color: colorFor(palette, rand()), turn: rand() * Math.PI * 2 });
      }
    }
  }
  return makeSpecimen(stems, buds, palette);
}

function distantBank(seed: number, variant: Variant, index: number) {
  const bank = new THREE.Group();
  const branchParts: THREE.BufferGeometry[] = [];
  const leafParts: THREE.BufferGeometry[] = [];
  const rand = randomSource(seed);
  const positions = variant === "mobile" ? [-9.6, -7.2, -3.8, 1.4, 3.1, 8.5]
    : [-9.8, -8.1, -6.9, -3.5, .4, 1.8, 3.1, 7.5, 9.3];
  const instanceMatrix = new THREE.Matrix4();
  const combined = new THREE.Matrix4();
  const color = new THREE.Color();
  for (let i = 0; i < positions.length; i++) {
    const specimen = tree(8000 + index * 111 + i * 73, variant, "distant", 2.3 + rand() * 3.4);
    specimen.position.set(positions[i]! + (rand() - .5) * .7 + (index ? .55 : -.4), 0, (rand() - .5) * 4.2);
    specimen.rotation.y = rand() * Math.PI * 2;
    specimen.updateMatrix();
    specimen.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      if (node instanceof THREE.InstancedMesh) {
        for (let leaf = 0; leaf < node.count; leaf++) {
          node.getMatrixAt(leaf, instanceMatrix);
          combined.multiplyMatrices(specimen.matrix, instanceMatrix);
          const geometry = node.geometry.clone().applyMatrix4(combined);
          node.getColorAt(leaf, color);
          const colors = new Float32Array(geometry.getAttribute("position").count * 3);
          for (let vertex = 0; vertex < colors.length; vertex += 3) { colors[vertex] = color.r; colors[vertex + 1] = color.g; colors[vertex + 2] = color.b; }
          geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
          leafParts.push(geometry);
        }
      } else branchParts.push(node.geometry.clone().applyMatrix4(specimen.matrix));
    });
    specimen.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      node.geometry.dispose();
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose();
    });
  }
  const bark = mergeGeometries(branchParts);
  const foliage = mergeGeometries(leafParts);
  branchParts.forEach(part => part.dispose());
  leafParts.forEach(part => part.dispose());
  if (!bark || !foliage) throw new Error("Distant garden bank could not be batched");
  bank.add(new THREE.Mesh(bark, new THREE.MeshStandardMaterial({ color: "#574939", roughness: .98 })));
  bank.add(new THREE.Mesh(foliage, new THREE.MeshStandardMaterial({ color: "#fff", vertexColors: true, roughness: .94, flatShading: true, side: THREE.DoubleSide })));
  return bank;
}

/** Runtime foliage is complementary geometry; no authored asset is rewritten. */
export class GardenVegetation {
  private readonly additions: THREE.Object3D[] = [];
  constructor(routeId: string, variant: Variant, group: THREE.Group, objects: Map<string, THREE.Object3D[]>) {
    for (const placed of objects.get("G01") ?? []) {
      // Four oversized accent meshes embedded in the terrain cross the
      // camera rail and turn into screen-filling triangles midway through
      // a walk. The terrain, stones and small ground details remain authored.
      placed.traverse(node => {
        if (/^SA_G01_MESH_(62|63|64|65)$/.test(node.name)) node.visible = false;
      });
    }
    for (const [index, placed] of (objects.get("G03") ?? []).entries()) {
      const source = placed.children[0];
      if (source) source.visible = false;
      const detail = sakuraCrown(713 + index * 101 + routeId.length * 37, variant);
      detail.name = "Stay sakura branch and blossom detail";
      placed.add(detail); this.additions.push(detail);
    }
    for (const [index, placed] of (objects.get("G11") ?? []).entries()) {
      // The delivered distant bank repeats a handful of polygon crowns.
      // Keep its placement contract and substitute varied silhouettes.
      const original = placed.children[0];
      if (original) original.visible = false;
      const bank = distantBank(5001 + routeId.length * 53 + index * 941, variant, index);
      placed.add(bank); this.additions.push(bank);
    }
    const near: Record<string, [number, number, number][]> = {
      garden: [[-8.8, -3.5, 411], [9.2, -10.5, 907]],
      person: [[-9.3, -5.5, 588]],
      thinker: [[-9.6, -17, 361]],
    };
    for (const [x, z, seed] of near[routeId] ?? []) {
      const specimen = tree(seed, variant, "green", 4.9 + (seed % 4) * .38);
      specimen.position.set(x, .04, z);
      specimen.rotation.y = (seed % 17) * .17;
      group.add(specimen); this.additions.push(specimen);
    }
  }

  dispose() {
    for (const addition of this.additions) {
      addition.parent?.remove(addition);
      addition.traverse(node => {
        if (!(node instanceof THREE.Mesh)) return;
        node.geometry.dispose();
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose();
      });
    }
    this.additions.length = 0;
  }
}
