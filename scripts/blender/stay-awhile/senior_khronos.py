"""Invoke the installed validator with access to the actual shared texture files.

No website or JavaScript source file is edited. The older CLI did not supply an
external-resource reader and therefore cannot validate this shared-atlas package.
"""
import subprocess
from pathlib import Path
H=Path(__file__).resolve().parent
code=r'''
const fs=require('fs'),path=require('path');
const h=process.cwd(),root=path.resolve(h,'../../..');
const v=require(path.join(h,'validation-tools/node_modules/gltf-validator'));
const base=path.join(root,'public/models/stay/v1');
(async()=>{const reports=[];
for(const rel of fs.readdirSync(base,{recursive:true}).filter(x=>x.endsWith('.glb'))){
const f=path.join(base,rel);
const r=await v.validateBytes(new Uint8Array(fs.readFileSync(f)),{
uri:path.basename(f),maxIssues:1000,
externalResourceFunction:async uri=>new Uint8Array(fs.readFileSync(path.resolve(path.dirname(f),decodeURIComponent(uri))))});
reports.push({path:path.relative(root,f),errors:r.issues.numErrors,warnings:r.issues.numWarnings,infos:r.issues.numInfos,messages:r.issues.messages});
}
fs.writeFileSync(path.join(h,'khronos-validation.json'),JSON.stringify({validatorVersion:v.version(),externalResourcesLoaded:true,reports},null,2));
console.log(JSON.stringify({files:reports.length,errors:reports.reduce((s,r)=>s+r.errors,0),warnings:reports.reduce((s,r)=>s+r.warnings,0)}));
if(reports.some(r=>r.errors))process.exitCode=1;
})();
'''
raise SystemExit(subprocess.run(['node','-e',code],cwd=H).returncode)
