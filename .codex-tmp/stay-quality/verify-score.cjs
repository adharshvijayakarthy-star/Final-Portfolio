const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const THREE = require('three');
const target = path.join(__dirname, 'modules');
fs.mkdirSync(target, { recursive: true });
fs.writeFileSync(path.join(target,'package.json'),'{"type":"commonjs"}');
for (const name of ['narrative-score', 'CameraController', 'FrameProfiler']) {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/sections/stay/world', `${name}.ts`), 'utf8');
  fs.writeFileSync(path.join(target, `${name}.js`), ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText);
}
const {cameraScore, textState} = require('./modules/narrative-score');
const {sampleCamera} = require('./modules/CameraController');
const {FrameProfiler} = require('./modules/FrameProfiler');
const ids = ['garden','person','builder','thinker','leader','stories','work','future','aura','contact'];
const results = [];
for (const id of ids) {
  const manifest = JSON.parse(fs.readFileSync(`public/models/stay/v1/${id}/${id}.scene.json`, 'utf8'));
  const bands = manifest.cameraKnots.map(k=>({from:k.band[0],to:k.band[1]}));
  let previous = -1;
  const snapshots = [];
  const camera = new THREE.PerspectiveCamera();
  for (let i=0;i<=1000;i++) {
    const p = i/1000, scored = cameraScore(p,bands);
    assert(scored>=previous-1e-10 && scored>=0 && scored<=1, `${id} monotonic score`);
    previous=scored;
    sampleCamera(camera,manifest,p,false);
    const pose=[...camera.position.toArray(),...camera.quaternion.toArray()];
    assert(pose.every(Number.isFinite), `${id} finite pose`);
    snapshots.push(pose);
  }
  for (let i=1000;i>=0;i--) {
    sampleCamera(camera,manifest,i/1000,false);
    assert.deepEqual([...camera.position.toArray(),...camera.quaternion.toArray()],snapshots[i],`${id} reverse is deterministic`);
  }
  let maxVelocityDifference=0;
  for (const band of bands.slice(0,-1)) {
    const p=band.to, e=1e-6;
    sampleCamera(camera,manifest,p-e,false);const before=camera.position.clone();
    sampleCamera(camera,manifest,p,false);const at=camera.position.clone();
    sampleCamera(camera,manifest,p+e,false);const after=camera.position.clone();
    const difference=at.clone().sub(before).divideScalar(e).sub(after.clone().sub(at).divideScalar(e)).length();
    maxVelocityDifference=Math.max(difference,maxVelocityDifference);
    assert(difference<.25,`${id} camera velocity discontinuity ${difference}`);
  }
  results.push({id,samples:2002,maxVelocityDifference});
}
for (let i=0;i<=1000;i++) {
  const p=i/1000; assert.deepEqual(textState(p),textState(p));
  assert.equal(textState(p,true).reveal,1,'readable override');
}
const profiler=new FrameProfiler();
for(let i=0;i<400;i++) profiler.record(16.7,2);
profiler.record(2000,80);profiler.record(0,0);
assert.equal(profiler.stats().samples,240);assert(profiler.stats().frameP95<17);
assert.equal(profiler.stats().frameMax,2000,'visible stalls remain recorded');
profiler.reset();assert.equal(profiler.stats().samples,0);
fs.writeFileSync(path.join(__dirname,'score-results.json'),JSON.stringify({routes:results,textSamples:1001,profiler:'bounded, reset, zero interval exclusion, visible stall inclusion passed'},null,2));
console.log(`PASS: ${ids.length} camera rails, 20,020 forward/reverse poses, C1 position boundaries, 1,001 readable text states, bounded profiler.`);
