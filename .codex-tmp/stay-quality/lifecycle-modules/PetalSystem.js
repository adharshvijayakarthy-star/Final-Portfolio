"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetalSystem = void 0;
const THREE = require("three");
const density = { garden: 8, person: 5, builder: 2, thinker: 2, leader: 4, stories: 6, work: 3, future: 3, aura: 4, contact: 0 };
const seed = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** Each emission zone is an actual authored blossom canopy. G12 is instanced
 * once; typed state and the world's scheduler own the small air disturbance. */
class PetalSystem {
    mesh = null;
    seeds = new Float32Array(0);
    air = new Float32Array(0);
    object = new THREE.Object3D();
    point = new THREE.Vector3();
    projected = new THREE.Vector3();
    lastPointer = new THREE.Vector2(10, 10);
    pointerEnergy = 0;
    previousTime = 0;
    visible = 0;
    nearCanopy = 0;
    maximumPixels = 0;
    zones = [];
    emitterCount;
    constructor(routeId, variant, group, trees, kit) {
        const anchors = [];
        const perTree = variant === "mobile" ? Math.max(1, Math.ceil((density[routeId] ?? 0) * .45)) : density[routeId] ?? 0;
        group.updateMatrixWorld(true);
        const inverse = group.matrixWorld.clone().invert();
        for (const tree of trees) {
            if (!perTree)
                break;
            const blossoms = [];
            tree.traverse(node => {
                if (!(node instanceof THREE.Mesh))
                    return;
                const materials = Array.isArray(node.material) ? node.material : [node.material];
                if (materials.some(material => material.name === "SA_M_SAKURA"))
                    blossoms.push(node);
            });
            if (!blossoms.length)
                continue;
            const bounds = new THREE.Box3();
            blossoms.forEach(blossom => bounds.union(new THREE.Box3().setFromObject(blossom)));
            bounds.applyMatrix4(inverse);
            this.zones.push({ min: bounds.min.toArray(), max: bounds.max.toArray() });
            const upperCanopy = bounds.min.y + (bounds.max.y - bounds.min.y) * .45;
            for (let i = 0; i < perTree && anchors.length < (variant === "mobile" ? 24 : 64); i++) {
                const blossom = blossoms[Math.floor(seed(anchors.length + 19) * blossoms.length)];
                const vertices = blossom.geometry.getAttribute("position");
                if (!vertices)
                    continue;
                const candidate = new THREE.Vector3(), highest = new THREE.Vector3(0, -Infinity, 0);
                // Choose a real vertex in the upper canopy, never an invented sky point.
                for (let attempt = 0; attempt < 24; attempt++) {
                    const vertex = Math.floor(seed(anchors.length * 37 + attempt * 13 + 7) * vertices.count);
                    candidate.fromBufferAttribute(vertices, vertex).applyMatrix4(blossom.matrixWorld).applyMatrix4(inverse);
                    if (candidate.y > highest.y)
                        highest.copy(candidate);
                    if (candidate.y >= upperCanopy)
                        break;
                }
                anchors.push((candidate.y >= upperCanopy ? candidate : highest).clone());
            }
        }
        this.emitterCount = this.zones.length;
        let source = null;
        kit.updateMatrixWorld(true);
        kit.traverse(node => { if (!source && node instanceof THREE.Mesh && node.geometry.getAttribute("position"))
            source = node; });
        const selected = source;
        if (!selected || !anchors.length)
            return;
        const geometry = selected.geometry.clone().applyMatrix4(selected.matrixWorld);
        geometry.computeBoundingBox();
        geometry.center();
        const size = new THREE.Vector3();
        geometry.boundingBox.getSize(size);
        const extent = Math.max(size.x, size.y, size.z);
        geometry.scale(1 / extent, 1 / extent, 1 / extent);
        const material = new THREE.MeshBasicMaterial({ color: "#f4c7d2", side: THREE.DoubleSide, transparent: true, opacity: .92, depthWrite: false });
        this.mesh = new THREE.InstancedMesh(geometry, material, anchors.length);
        this.mesh.name = "Stay canopy petals";
        this.mesh.frustumCulled = false;
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.seeds = new Float32Array(anchors.length * 8);
        this.air = new Float32Array(anchors.length * 6);
        for (let i = 0; i < anchors.length; i++) {
            const anchor = anchors[i];
            const phase = ((i % perTree) + seed(i + 3) * .6) / perTree;
            const layer = i % 24 === 0 ? 2 : i % 3 === 0 ? 0 : 1;
            this.seeds.set([anchor.x, anchor.y, anchor.z, phase, seed(i + 39), seed(i + 85), layer, perTree], i * 8);
        }
        group.add(this.mesh);
    }
    update(time, camera, pointer, pointerActive) {
        if (!this.mesh)
            return;
        const dt = Math.min(.05, Math.max(0, time - this.previousTime));
        this.previousTime = time;
        const moving = pointerActive && pointer.distanceToSquared(this.lastPointer) > .000002;
        this.pointerEnergy = moving ? 1 : Math.max(0, this.pointerEnergy - dt * 3);
        this.lastPointer.copy(pointer);
        camera.updateMatrixWorld();
        const axes = camera.matrixWorld.elements, projection = camera.projectionMatrix.elements[5], height = window.innerHeight;
        this.visible = 0;
        this.nearCanopy = 0;
        this.maximumPixels = 0;
        for (let i = 0; i < this.mesh.count; i++) {
            const k = i * 8, a = i * 6, phase = this.seeds[k + 3], wind = this.seeds[k + 4], turn = this.seeds[k + 5], layer = this.seeds[k + 6];
            const life = (layer === 0 ? 18 : layer === 2 ? 11 : 14) + wind * 4;
            const age = (time + phase * life) % life, q = age / life;
            if (q < .01)
                for (let axis = 0; axis < 6; axis++)
                    this.air[a + axis] = 0;
            this.point.set(this.seeds[k] + Math.sin(age * .55 + wind * 6) * q * .5 + q * (wind - .5) * 1.4, this.seeds[k + 1] - (.18 * q + .82 * q * q) * (this.seeds[k + 1] + .12), this.seeds[k + 2] + q * .65 + Math.sin(age * .42 + phase * 6) * q * .32);
            this.projected.copy(this.point).applyMatrix4(this.mesh.parent.matrixWorld).project(camera);
            const dx = this.projected.x - pointer.x, dy = this.projected.y - pointer.y, d2 = dx * dx + dy * dy;
            const force = pointerActive && this.pointerEnergy > 0 && this.projected.z > -1 && this.projected.z < 1 && d2 < .025
                ? (1 - d2 / .025) * this.pointerEnergy * .45 * dt / Math.max(.025, Math.sqrt(d2)) : 0;
            for (let axis = 0; axis < 3; axis++) {
                const velocity = Math.max(-.18, Math.min(.18, this.air[a + 3 + axis] + (axes[axis] * dx + axes[4 + axis] * dy) * force));
                this.air[a + 3 + axis] = velocity * Math.exp(-dt * 3);
                this.air[a + axis] = (this.air[a + axis] + velocity * dt) * Math.exp(-dt * 1.8);
            }
            this.point.x += this.air[a];
            this.point.y += this.air[a + 1];
            this.point.z += this.air[a + 2];
            this.projected.copy(this.point).applyMatrix4(this.mesh.parent.matrixWorld);
            const distance = Math.max(.5, this.projected.distanceTo(camera.position));
            const naturalSize = layer === 0 ? .065 + turn * .018 : layer === 2 ? .125 : .085 + turn * .025;
            const scale = Math.min(naturalSize, 9 * distance / (height * projection * .5)) * Math.min(1, age * 3, (life - age) * 3);
            this.projected.project(camera);
            if (Math.abs(this.projected.x) < 1 && Math.abs(this.projected.y) < 1 && Math.abs(this.projected.z) < 1 && scale > .01) {
                this.visible++;
                if (q < .25)
                    this.nearCanopy++;
                this.maximumPixels = Math.max(this.maximumPixels, scale * height * projection * .5 / distance);
            }
            this.object.position.copy(this.point);
            this.object.rotation.set(age * .7 + turn * 6, age * .31, Math.sin(age * .9 + phase * 6) * .65);
            this.object.scale.setScalar(scale);
            this.object.updateMatrix();
            this.mesh.setMatrixAt(i, this.object.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }
    diagnostics() { return { count: this.mesh?.count ?? 0, visible: this.visible, nearCanopy: this.nearCanopy, maxPixels: Number(this.maximumPixels.toFixed(2)), zones: this.zones }; }
    dispose() {
        if (!this.mesh)
            return;
        this.mesh.parent?.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.mesh.dispose();
        this.mesh = null;
    }
}
exports.PetalSystem = PetalSystem;
