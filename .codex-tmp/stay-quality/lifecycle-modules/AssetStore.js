"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetStore = void 0;
const THREE = require("three");
const GLTFLoader_js_1 = require("three/addons/loaders/GLTFLoader.js");
const types_1 = require("./types");
function disposeTree(root) {
    const geometry = new Set(), material = new Set(), texture = new Set();
    root.traverse(node => {
        if (!(node instanceof THREE.Mesh))
            return;
        geometry.add(node.geometry);
        for (const item of Array.isArray(node.material) ? node.material : [node.material]) {
            material.add(item);
            for (const value of Object.values(item))
                if (value instanceof THREE.Texture)
                    texture.add(value);
        }
    });
    texture.forEach(item => { if (item.image instanceof ImageBitmap)
        item.image.close(); item.dispose(); });
    material.forEach(item => item.dispose());
    geometry.forEach(item => item.dispose());
}
class AssetStore {
    loader = new GLTFLoader_js_1.GLTFLoader();
    entries = new Map();
    manifestController = new AbortController();
    manifestPromise = null;
    disposed = false;
    timings = new Map();
    manifest() {
        this.manifestPromise ??= (0, types_1.fetchJson)("/models/stay/v1/asset-manifest.json", this.manifestController.signal)
            .then(data => { if (data.schemaVersion !== 1 || data.assets.length !== 47)
            throw new Error("Stay asset manifest contract changed"); return data; });
        return this.manifestPromise;
    }
    async acquire(id, variant) {
        if (this.disposed)
            throw new Error("AssetStore has been disposed");
        const manifest = await this.manifest();
        if (this.disposed)
            throw new Error("AssetStore has been disposed");
        const record = manifest.assets.find(asset => asset.assetId === id);
        if (!record)
            throw new Error(`Unknown Stay asset ${id}`);
        const expected = record.variants[variant];
        const key = expected.uri;
        let entry = this.entries.get(key);
        if (!entry) {
            const controller = new AbortController();
            const started = performance.now();
            const promise = fetch(expected.uri, { signal: controller.signal }).then(async (response) => {
                if (!response.ok)
                    throw new Error(`${expected.uri}: HTTP ${response.status}`);
                const buffer = await response.arrayBuffer(), parsedAt = performance.now();
                const gltf = await this.loader.parseAsync(buffer, expected.uri.slice(0, expected.uri.lastIndexOf("/") + 1));
                this.timings.set(key, { bytes: buffer.byteLength, fetchMs: parsedAt - started, parseMs: performance.now() - parsedAt });
                if (controller.signal.aborted || this.disposed) {
                    disposeTree(gltf.scene);
                    throw new Error(`${id} load cancelled`);
                }
                const names = new Set();
                gltf.scene.traverse(node => { if (node.name)
                    names.add(node.name); });
                for (const name of expected.nodeNames)
                    if (!names.has(name)) {
                        disposeTree(gltf.scene);
                        throw new Error(`${id} missing node ${name}`);
                    }
                for (const clip of expected.clips)
                    if (!gltf.animations.some(animation => animation.name === clip.name)) {
                        disposeTree(gltf.scene);
                        throw new Error(`${id} missing clip ${clip.name}`);
                    }
                return { root: gltf.scene, animations: gltf.animations };
            });
            entry = { refs: 0, controller, promise };
            this.entries.set(key, entry);
            void promise.catch(() => { if (this.entries.get(key) === entry)
                this.entries.delete(key); });
        }
        entry.refs++;
        try {
            const parsed = await entry.promise;
            if (this.disposed || entry.controller.signal.aborted)
                throw new Error(`${id} load cancelled`);
            let released = false;
            return { record, ...parsed, release: () => {
                    if (released)
                        return;
                    released = true;
                    entry.refs--;
                    if (entry.refs === 0) {
                        this.entries.delete(key);
                        entry.controller.abort();
                        void entry.promise.then(value => disposeTree(value.root), () => { });
                    }
                } };
        }
        catch (error) {
            entry.refs--;
            if (entry.refs === 0) {
                this.entries.delete(key);
                entry.controller.abort();
            }
            throw error;
        }
    }
    stats() { return { entries: this.entries.size, references: [...this.entries.values()].reduce((sum, entry) => sum + entry.refs, 0) }; }
    metrics() { return Object.fromEntries(this.timings); }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.manifestController.abort();
        for (const [key, entry] of this.entries) {
            entry.controller.abort();
            this.entries.delete(key);
            void entry.promise.then(value => disposeTree(value.root), () => { });
        }
    }
}
exports.AssetStore = AssetStore;
