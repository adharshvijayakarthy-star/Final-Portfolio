const fs=require('fs');const path=require('path');
const validator=require('./validation-tools/node_modules/gltf-validator');
const root=path.resolve(__dirname,'../../..');
const files=fs.readdirSync(path.join(root,'public/models/stay/v1'),{recursive:true})
 .filter(p=>p.endsWith('.glb')).map(p=>path.join(root,'public/models/stay/v1',p));
(async()=>{const reports=[];for(const f of files){const r=await validator.validateBytes(new Uint8Array(fs.readFileSync(f)),{uri:path.basename(f),maxIssues:100});
reports.push({path:path.relative(root,f),errors:r.issues.numErrors,warnings:r.issues.numWarnings,infos:r.issues.numInfos,messages:r.issues.messages});}
fs.writeFileSync(path.join(__dirname,'khronos-validation.json'),JSON.stringify({validatorVersion:validator.version(),reports},null,2));
console.log(JSON.stringify({files:reports.length,errors:reports.reduce((s,r)=>s+r.errors,0),warnings:reports.reduce((s,r)=>s+r.warnings,0),failures:reports.filter(r=>r.errors)},null,2));})();
