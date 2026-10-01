"""Build the single delivery inventory and its readable specification audit."""
from pathlib import Path
import json, hashlib, datetime
from collections import Counter
HERE=Path(__file__).resolve().parent; ROOT=HERE.parents[2]
def read(p):return json.loads(p.read_text(encoding='utf8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
inv=read(HERE/'delivery-inventory.json'); contract=read(HERE/'contract.json')
masters=read(HERE/'master-handoff-validation.json'); rail=read(HERE/'rail-validation.json'); motion=read(HERE/'motion-validation.json')
matrix=[]
def row(item,status,evidence,notes):matrix.append({'specificationItem':item,'status':status,'evidence':evidence,'notes':notes})
C='COMPLETE'; P='PARTIALLY COMPLETE'; N='NOT STARTED'; A='NOT APPLICABLE'
row('Part I 1.1 — 47 unique modeled identities and ten Stay masters',C,'delivery-inventory.json; master-handoff-validation.json','47 logical IDs; LOD pairs and scene instances do not inflate the count.')
row('Part I 1.1 — full integration asset gate',P,'validation-report.json; this audit','Blender/package checks pass. The isolated browser viewer, direct mobile entry, rendered reading clearances and integrated performance gates have not been run.')
row('Part I 1.2 — ten named source files',C,'00-garden.blend through 09-contact.blend','All reopened with Blender 5.2.1 LTS; no missing source.')
row('Part I 1.2 — protected Quick and reserved Landing source',A,'protected-baseline.json','Quick remains protected; creating or migrating a Landing master is excluded by the specification.')
row('Part I 1.2 — shared kit linked relatively',C,'master-handoff-validation.json: libraries','Nine dependent masters resolve //00-garden.blend; no duplicated shared kit exports under route names.')
row('Part I 1.2 — world/map reference anchors',C,'00-garden.blend: 00_REFERENCE; contract.json: routes','Garden carries the ten world-position reference empties; this is authoring reference, not a functioning website map.')
row('Part I 1.2 — READ_ME content and source provenance',C,'master-handoff-validation.json: readMe','Version, purpose, IDs, provenance, coordinates, export command, dependencies, validation status and artist notes are present in all ten masters.')
row('Part I 1.2 — portable exporter root validation',C,'produce.py; render_review.py','Exporter requires passed repository root and checks package.json/scripts/blender. Render helper now resolves its root before handing paths to Blender.')
row('Part I 1.3 — metric units and applied object scales',C,'validation-report.json; master-handoff-validation.json','Metric unit scale 1; owned export objects have applied scale and root origins at zero; glTF conversion applied once.')
row('Part I 1.3 — eleven required collection groups',C,'master-handoff-validation.json: collections','00_REFERENCE through 10_EXPORT_MOBILE exist; authoring guides do not become prop geometry.')
row('Part I 1.3 — node grammar, roots and LOD anchors',C,'asset-manifest.json; validation-report.json','All 94 exports have unique SA names and matching assetId/lod extras; anchor names match with translation tolerance 0.01 m.')
row('Part I 1.3 — ENTRY/EXIT/CAM/LOOK/TEXT guides',C,'master-handoff-validation.json; *.scene.json: guideAssetId','All route guides exist; CAM/LOOK/TEXT coordinates match the extracted specification. The first owned asset pair is the documented guide container.')
row('Part I 1.3 — scene metadata',C,'ten *.scene.json files','Route/source hashes, version/date, IDs, instance transforms, camera knots, focus anchors, bounds, reading rectangles, clips and five settled reference poses verified; no required fields missing.')
row('Part I 1.3 — 0.5 m sampled camera clearance',C,'rail-validation.json','5,760 camera samples, desktop/mobile camera poses, ten routes and five geometry states; zero nearest-surface clearance violations. This is a sampled Blender test.')
row('Part I 1.3 — near-plane headroom and continuous mobile geometry clearance',P,'08_COLLISION_GUIDES; check_rails.py; render_review.py','0.25 m headroom is authored as metadata. The existing BVH test measures camera-center clearance using the active desktop composition and both camera poses; it is not a continuous frustum sweep or an independent mobile-geometry sweep.')
row('Part I 1.4 — material palette and export references',C,'master-handoff-validation.json; all GLBs; geometry.py','Required meshes have assigned SA_M materials; no missing GLB primitive material indices or broken image references. Blank paper remains unlettered.')
row('Part I 1.4 — shared atlas, UVs and vertex colors',C,'public/models/stay/v1/shared/timber-paper.*.png; GLBs','1024-square desktop and 512-square mobile atlas, sRGB image flags, UV0 on textured surfaces and exported COLOR_0 channels; PNGs embedded in affected GLBs.')
row('Part I 1.4 — gray/ivory browser color calibration',N,'No browser color calibration report','Blender preview uses Standard view transform; exact browser ACES/sRGB equivalence remains unverified.')
row('Part I 1.4 — runtime hemisphere/directional rig, fog and light limits',N,'produce.py: preview rig only','Blender light/camera references and route multipliers exist; the specified runtime lighting system is not implemented by this asset task.')
row('Part I 1.5 — final triangle and per-file byte caps',C,'asset-manifest.json; delivery-inventory.json: assets','All 47 desktop/mobile pairs pass their own final-triangle and binary-size limits.')
row('Part I 1.5 — selected GLB2 exports and dependencies',C,'94 GLBs; produce.py; khronos-validation.json','No prop cameras, unsupported external buffers/images, mandatory compression decoders or accidental default Blender object names.')
row('Part I 1.5 — 30 fps authored transform clips',C,'master-handoff-validation.json; motion-validation.json','Exactly 18 Actions and the corresponding 18 logical clips in both variants; exact names/durations and frame counts verified.')
row('Part I 1.5 — deterministic first/last and reverse seeking',C,'validation-report.json; motion-validation.json','Five canonical clip fractions compared to source transforms within 0.005 m/rad; source forward/reverse frame evaluation matches. Browser mixer seeking is a later check.')
row('Part I 1.5 — runtime channel separation',C,'contract.json; *.scene.json: runtimeNotes','No SWAY, water, petal, visibility, opacity or AURA_CONNECTIONS Action was counted or exported.')
row('Part I 1.5 — browser batching, live instancing and cache disposal',N,'No new Stay world runtime','Source collection instances and material grouping exist; runtime batching/refcounts/disposal are not implemented.')
row('Part I 1.5 — optional KTX2/Draco/meshopt and extra atlases',A,'GLB extension inspection','Optional measured optimizations are not baseline production requirements and were not introduced.')
for master in inv['masters']:
    route=master['route']; owned=[a for a in inv['assets'] if contract['assets'][a['assetId']]['owner']==route]
    row(f'Part I 1.6 — {Path(master["path"]).name} authored deliverables',C,master['path']+f'; public/models/stay/v1/{route}/{route}.scene.json',f'{len(owned)} owned IDs, paired exports, source guides, five settled reference poses and both posters verified; layout exceptions are documented.')
row('Part I 1.6 — route runtime, mobile transformation and reduced-motion HTML behavior',N,'Existing native pages are unchanged','Production posters/mobile assets exist. New route adapters, full fallbacks, mobile runtime cameras and reduced-motion behavior have not been integrated.')
row('Part I 1.7 / Appendix B — individual 47 asset delivery contracts',C,'47-row asset table below; asset-manifest.json','Every specified ID maps to the correct source and both exports, with required roots, materials, clips and caps. This completes the file/export contract, not every in-browser behavioral condition in the asset prose.')
row('Part I 1.7 — camera relationships, reading volumes and all runtime asset states',P,'ten poster pairs; camera guides; scene metadata','Specified poster viewpoints reviewed for catastrophic defects. Unloaded/loading/active/failed/released behavior, HTML hooks, complete rail visual review and DOM reading-clearance tests remain runtime work.')
row('Part I 1.8 — staging, parsing and checksummed asset manifest',C,'produce.py; validate.py; asset-manifest.json','Final staging directory has no files; all 94 published exports parse and match manifest checksums.')
row('Part I 1.8 — twenty prescribed posters',C,'poster-review.json; delivery-inventory.json: renderReview','10 desktop at 1600x1000, 10 mobile at 780x1200; prescribed p values; all byte caps pass; visual review completed after two targeted overlap corrections.')
row('Part I 1.8 — Khronos validation',C,'khronos-validation.json','94 final files, zero errors and zero warnings. Informational empty-node messages are expected guide/hook nodes.')
row('Part I 1.8 — absolute bounds inside every declared route zone',P,'asset-manifest.json: bounds; *.scene.json: boundsExceptions','Bounds are measured. G01/G09 world extents and G11/F03 distance deliberately exceed local zones; manifests explicitly document exceptions. A blanket all-bounds-inside assertion would be false.')
row('Part I 1.8 — isolated GLB viewer and five browser poses',N,'No isolated final-export browser viewer report','Source/GLB numerical comparison is complete; it does not substitute for an actual browser viewer load/seek/release check.')
row('Part I 1.8 — direct mobile entry without Garden',N,'No new route integration','Requires later browser asset-gate/integration work; no website changes were authorized here.')
row('Part I 1.8 — loader schema rejection and fallback behavior',N,'No AssetStore implementation','Manifest schema is present; the consuming loader and failure UI are later work.')
row('Appendix B — 47 IDs / 94 GLBs / 10 scene manifests / 1 asset manifest / 20 posters',C,'delivery-inventory.json','Exact deliverable counts, paths and source/export checksums verified.')
row('Appendix B — eighteen authored clip register',C,'18-row authored clip table below','18 logical clips, 36 clip-bearing GLB variants. No additional authored clips.')
row('Appendix B — protected/reserved non-Stay source locations',A,'Part I 1.2 exclusion; protected-baseline.json','Ten Stay masters are complete; the two non-Stay locations are not missing Stay deliverables.')
for line in (HERE/'spec-extract.txt').read_text(encoding='utf8').splitlines():
    if re_match:=__import__('re').match(r'^(AN-\d\d [^|]+) \|',line):
        name=re_match[1].strip(); num=int(name[3:5]); asset_systems={10,11,12,13,14,15,16,17,18,19,20,21,22}
        row('Appendix C — '+name,P if num in asset_systems else N,'contract.json; authored clip table; existing native code unchanged','Asset/clip or static geometry prerequisite exists; the specified runtime driver, state lifecycle and reduced-motion outcome are not implemented.' if num in asset_systems else 'The specified shared-runtime system has not been implemented; existing native effects do not establish completion of this specification.')
row('Appendix C.1 — single writer, interruption and lifecycle invariants',P,'*.scene.json: runtimeNotes; source/GLB reverse checks','Authoring ownership and deterministic transform prerequisites are recorded; runtime camera arbitration, cancellation and cleanup are not implemented.')
performance_lines=(HERE/'spec-extract.txt').read_text(encoding='utf8').splitlines(); start=performance_lines.index('APPENDIX F — PERFORMANCE BUDGETS')
for line in performance_lines[start+2:]:
    if not line:break
    cells=line.split(' | ')
    if len(cells)!=4:break
    label=cells[0]
    status=P if label in ('Shared garden kit first use','Active route unique GLBs','Initial visible poster','Total first route 3D transfer','Texture GPU allocation','Active animated transform nodes') else N
    note={'Initial visible poster':'All physical poster dimensions and file caps pass. Correct responsive source selection and single-poster network transfer remain untested.',
          'Shared garden kit first use':'Stored asset sizes are available and individually pass. First-use visibility, compressed network transfer and loading policy are not measured.',
          'Active route unique GLBs':'Owned package byte totals are recorded. Active set, actual transfer and loading policy remain unmeasured.',
          'Total first route 3D transfer':'Individual files pass; no cold-cache route/network test has established this combined cap.',
          'Texture GPU allocation':'Atlas dimensions and embedded images verified; actual decoded texture residency/duplicates/render targets are not measured.',
          'Active animated transform nodes':'Clip target nodes are inventoried; active runtime action scheduling and simultaneous-node counts remain untested.'}.get(label,'This is a rendered/runtime/device metric. No measurement was made in this Blender-only continuation.')
    row('Appendix F — '+label,status,'asset-manifest.json; poster-review.json; no browser performance trace',note+' Target: '+cells[1]+' desktop; '+cells[2]+' mobile.')
row('Appendix I — source scripts and masters folder',C,'scripts/blender/stay-awhile/','Ten masters, exporter, checks and handoff reports exist.')
row('Appendix I — public model and poster folders',C,'public/models/stay/v1/; public/assets/stay/v1/','GLBs, manifests and posters exist. Shared PNG atlases are under models/stay/v1/shared, consistent with 1.8 dependency containment; Appendix I also generically mentions an atlas under assets. No broken path is concealed.')
row('Appendix I — proposed world/content/data/adapters/tests/docs web families',N,'src/sections/stay/world and src/data/stay absent','Existing ten native route entry files remain; the proposed new runtime families are absent. No website implementation was performed.')
check_status={1:C,2:P,3:C,4:C,5:C,6:P}
start=performance_lines.index('APPENDIX L — IMPLEMENTATION CHECKLIST')
for line in performance_lines[start+1:]:
    if not line.startswith('• '):break
    num=int(line[2:4]); title=line[6:]
    notes={1:'216/216 protected hashes match. Four Quick files differ from Git but match the pre-production baseline.',2:'The authoritative document and asset contract fix routes/asset evidence boundaries. Future typed website content schema and source-gap resolution have not been implemented.',3:'Collections, axis, node grammar, materials and export validation verified.',4:'Shared desktop/mobile kit, atlas and per-asset material references/budgets verified. Browser performance limits remain Appendix F work.',5:'10 masters, 47 IDs and 18 authored clips verified.',6:'All paired exports, manifests and 20 posters complete; broader browser acceptance subgates are pending.'}.get(num,'Not completed under this specification. Existing native website code is baseline, not evidence of the new implementation phase.')
    row(f'Appendix L {num:02} — {title}',check_status.get(num,N),'delivery-inventory.json; protected-baseline.json' if num<=6 else 'No new Stay world integration or acceptance evidence',notes)
row('Appendix L.1 — specification inventory compared with production',P,'Authoritative DOCX; delivery-inventory.json','10 routes / 47 IDs / 94 outputs / 10 masters / 18 clips verified. 24 systems, 64 beats, 107 tests and 20 phases are specification counts, not completion claims.')

review_notes={
'garden':'Path and wayfinding stone visible; no catastrophic obstruction or unsupported landmark.',
'person':'Converging roots visible. Bench is at the edge/outside the portrait frame at the prescribed root-focused pose; no camera change made.',
'builder':'Completed bench and tokens visible under the slatted structure; portrait frame crops the outer tokens at the specified close camera.',
'thinker':'Water and freedom stones visible; deck is at the left edge of this lateral reference pose.',
'leader':'Lesson rail and coordination markers grounded; corrected rail placement remains clear.',
'stories':'Black coplanar path patches corrected by a 1 cm bay-slab offset; both final posters reviewed.',
'work':'Planner station and tiles visible. The offset amber spacer is an authored demo transform, not accidental floating environment geometry.',
'future':'Black terrain/skirt overlap corrected by lowering this route G09 instance 1 cm. Distant marker remains visible; camera is near/beyond the modeled path end, so path is largely below the desktop frame.',
'aura':'Spine, sheets and relationship strands visible. Close shelving framing is prescribed; runtime document-to-socket binding remains explicit in the manifest.',
'contact':'Resting stone, outward path and open ground visible; no catastrophic obstruction.'}
inv['generatedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat(); inv['schemaVersion']=1
inv['counts']={'masters':10,'assetIds':47,'desktopGlbs':47,'mobileGlbs':47,'totalGlbs':94,'sceneManifests':10,'assetManifests':1,'authoredClips':18,'clipBearingGlbs':36,'posters':20,'protectedFiles':216}
inv['renderReview']={'routesReviewed':10,'postersReviewed':20,'status':'COMPLETE','scope':'Specified final still viewpoints; obvious composition/placement/clipping/obstruction/landmark defects only; not full rail cinematography or website screenshots.','routes':[{'route':r,'status':'COMPLETE','notes':review_notes[r]} for r in contract['routes']]}
inv['validation'].update({'clearanceSamples':rail['totalSamples'],'clearanceViolations':rail['violations'],'clearanceScope':'Five geometry states; active desktop geometry with both camera poses; sampled nearest-surface distance 0.5 m, not a swept frustum test.','motionVariantComparisons':len(motion['results']),'motionErrors':len(motion['errors']),'motionTolerance':motion['tolerance'],'motionMaxError':max(r['maxPositionMetresOrRotationRadiansError'] for r in motion['results']),'sourceReverseSeek':True,'masterOpenPass':10})
original=HERE/'handoff-evidence.json'
if original.exists():
    old=read(original)
    changed_masters=[m['path'] for m in inv['masters'] if m['sha256']!=next(x['sha256'] for x in old['masters'] if x['route']==m['route'])]
    old_assets={a['assetId']:a for a in old['assets']}
    changed_glbs=[v['path'] for a in inv['assets'] for lod,v in a['variants'].items() if v['sha256']!=old_assets[a['assetId']]['variants'][lod]['sha256']]
    old_posters={p['path']:p['sha256'] for p in old['posters']}
    changed_posters=[p['path'] for p in inv['posters'] if p['sha256']!=old_posters[p['path']]]
    inv['continuationChanges']={'masters':changed_masters,'glbs':changed_glbs,'posters':changed_posters,'allAnimatedGlbsUnchanged':all(v['path'] not in changed_glbs for a in inv['assets'] if a['variants']['desktop']['clips'] for v in a['variants'].values()),'corrections':read(HERE/'poster-overlap-corrections.json'),'websiteFilesChanged':[],'note':'Refreshed manifests and validation evidence after two narrow source fixes. Corrected render helper root resolution; discarded four stray preview files from the first relative-path attempt.'}
inv['specificationAudit']=matrix
frontier={
'COMPLETED':['Part I 1.1 delivery counts; 1.2 Stay sources, linked kit, READ_ME and portable export utilities; 1.3 collection/axis/node/guide/manifest contracts and sampled clearance; 1.4 authored material/atlas prerequisites; 1.5 export/clip/LOD/cap prerequisites; 1.6 all ten authored deliverable packages; 1.7 all 47 file/export identity contracts; 1.8 checksummed exports and twenty reviewed posters.','Appendix B complete delivery and authored clip registers; Appendix I Blender/export/poster directories; Appendix L 01, 03, 04 and 05.'],
'PARTIALLY COMPLETED':['Part I asset/integration gate, near-plane/continuous and mobile-geometry clearance proof, full bounds-zone compliance with recorded exceptions, asset prose runtime requirements, browser color equivalence.','Appendix C systems with modeled/authored prerequisites; Appendix F file prerequisites without integrated performance proof; Appendix L 02, 06 and L.1.'],
'NOT YET IMPLEMENTED':['Part I 1.8 isolated final-GLB browser load/seek/release and direct-mobile acceptance checks.','New specification runtime in Parts II–XXIII: persistent host/AssetStore, route adapters, scroll/camera controllers, map/travel/history, typography and narrative integration, demos, lighting/ambient channels, responsive fallbacks, accessibility, disposal and quality tiers.','Part XXIV web implementation phases, Part XXV acceptance execution, Parts XXVII–XXIX implementation/verification/optimization handoffs, Part XXX final website acceptance; Appendix L 07–20. Existing native routes are preserved and are not counted as the new implementation.'],
'CURRENT STOPPING POINT':'The ten Blender masters, 47 paired asset exports, manifests, 18 authored clips and twenty reviewed posters are delivered and pass the stated offline checks; the full browser-facing asset gate and new website/runtime integration remain uncompleted.',
'NEXT REQUIRED STEP':'Perform the missing isolated final-GLB browser asset-gate checks, including mobile loading, pose/anchor/material verification and measured clearance, before starting the specification’s web implementation phases.'}
inv['implementationFrontier']=frontier
inv['evidenceFiles']=[{'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p)} for p in [HERE/'validation-report.json',HERE/'khronos-validation.json',HERE/'motion-validation.json',HERE/'rail-validation.json',HERE/'poster-review.json',HERE/'master-handoff-validation.json',HERE/'protected-baseline.json',ROOT/'public/models/stay/v1/asset-manifest.json']]
inv['scripts']=[p.name for p in HERE.iterdir() if p.suffix in ('.py','.cjs')]
inv['logs']=[p.name for p in HERE.glob('*.log')]
inv['storedPackageTotals']={r:{lod:sum(a['variants'][lod]['bytes'] for a in inv['assets'] if contract['assets'][a['assetId']]['owner']==r) for lod in ('desktop','mobile')} for r in contract['routes']}
(HERE/'delivery-inventory.json').write_text(json.dumps(inv,indent=2,ensure_ascii=False),encoding='utf8')

md=['# Project AURA Stay Awhile Blender final handoff audit','',f'Audit generated {inv["generatedAt"]}. The authoritative DOCX remains unchanged (SHA-256 `{inv["specification"]["sha256"]}`). It was reopened and freshly extracted; its text matches the audited contract. This companion report marks completion without rewriting the source of truth.','',
'The required Blender deliverables are present and pass the offline checks below. Do not equate this with completion of all Part I acceptance conditions or the website. Browser-specific gates remain explicitly open. No website, Landing or Quick Discovery files were modified.','',
'## A Actual filesystem state','',
'On entry: ten masters, 47 asset IDs, 94 GLBs, ten scene manifests, one asset manifest, twenty final posters, all principal validation logs, and no delivery inventory. The previous render log ended with POSTERS_COMPLETE. Staging contained no files, and no Blender process remained. No asset or master was rebuilt.','',
'The continuation visually reviewed all posters and fixed two concrete overlap artifacts: Stories S01 bay tops and path tops shared the same height; Future terrain and its horizon skirt were coplanar. Stories bay geometry was offset upward by 0.01 m; Future’s G09 instance was offset downward by 0.01 m. Only 05-stories.blend and 07-future.blend changed. Only S01’s two GLBs were re-exported; four posters were re-rendered. Layout metadata/manifests and validation evidence were refreshed. The remaining eight masters, 92 GLBs and sixteen posters retain their entry hashes.','',
'The render utility was also corrected to resolve a passed repository root. Four previews from an initial relative-path attempt were removed from C:/public/assets/stay/v1; only the verified workspace posters form the delivery.','',
'## B Blender masters','',
'All 10/10 open successfully. Each has required collections, owned desktop/mobile roots, materials, reference guides, READ_ME and the expected Actions; nine dependent masters resolve the relative Garden library. No accidental default/unrelated object names were found.','',
'| Route | Source blend | Owned IDs | Authored Actions | Status |','|---|---|---|---:|---|']
for m in masters['masters']:md.append(f'| {m["route"]} | scripts/blender/stay-awhile/{m["path"]} | {", ".join(m["assetIds"])} | {len(m["actions"])} | COMPLETE |')
md+=['','## C and D Exact asset and export contract','','47/47 desktop, 47/47 mobile, 94/94 total. All 47 expected identities have both variants. In this table COMPLETE means the asset delivery identity/export contract passes; broader behavior is graded separately in the specification matrix. Source names are under scripts/blender/stay-awhile; export paths are under public/models/stay/v1.','','| Asset ID | Expected | Actual | Source blend | Desktop GLB | Mobile GLB | Status |','|---|---|---|---|---|---|---|']
for a in inv['assets']:
    md.append('| '+' | '.join([a['assetId'],a['expected'],a['actual'],Path(a['sourceBlend']).name,a['variants']['desktop']['path'].replace('public/models/stay/v1/',''),a['variants']['mobile']['path'].replace('public/models/stay/v1/',''),a['status']])+' |')
md+=['','## E Scene manifests','','10/10 scene manifests plus one asset-manifest.json. No missing required metadata fields were found. All route IDs, owned/shared IDs, source/specification checksums, clip names/durations/frame counts, instance transforms, camera/reference nodes, focus anchors, local bounds, reading rectangles and five settled reference poses were checked. Guide nodes are carried by each route’s first owned asset pair, identified by guideAssetId.','','Bounds exceptions are explicit; the manifests do not assert every world-scale or distant mesh lies inside the small local route footprint. 0.25 m near-plane headroom is source metadata, not a completed swept-frustum test.','','| Route | Scene manifest | Guide container | Status |','|---|---|---|---|']
for s in inv['sceneManifests']:
    data=read(ROOT/s['path']);md.append(f'| {s["route"]} | {s["path"]} | {data["guideAssetId"]} | COMPLETE |')
md+=['','## F Authored animation contract','','Exactly 18/18 logical Blender-authored Actions; both variants export each clip (36 clip-bearing GLBs). Durations below match actual Action key spans at 30 fps and final GLB sampler bounds.','','| Clip name | Route | Source blend | Duration | Export status |','|---|---|---|---:|---|']
for cl in inv['authoredClips']:md.append(f'| {cl["name"]} | {cl["route"]} | {Path(cl["sourceBlend"]).name} | {cl["duration"]:g} s | Desktop + mobile verified |')
md+=['','Runtime-owned channels are **not authored clips**: foliage/branch sway (SWAY pivots), water response, petals, fog, lighting, opacity/visibility, camera/scroll, text/UI motion and AURA_CONNECTIONS draw-range reveal. A03 and all static assets have no exported animations. Appendix C’s 24 animation systems are controller-level systems and must not be confused with the 18 authored clips.','','## G Validation','','| Check | Final result | Evidence / limit |','|---|---|---|',
'| Khronos | 94 files, 0 errors, 0 warnings | khronos-validation.json, rerun after S01 correction; informational guide-node messages remain |',
'| Identity, variant, nodes, materials, structure | 94/94 pass | Parsed GLB headers, JSON, extras, material references, no external buffers/images; manifest SHA-256 matches |',
'| Triangle and file-size caps | 47/47 pairs pass | Per-file actuals and caps recorded in delivery-inventory.json and asset-manifest.json |',
'| LOD anchors | Pass | Same names and translations within 0.01 m; validation-report.json |',
'| Exact clip names/durations | 18/18 pass in both LODs | Fresh source reopening and final GLB inspection |',
f'| Source/GLB motion | 36 animated variants, 0 errors | Five fractions; maximum error {inv["validation"]["motionMaxError"]:.9f}, tolerance 0.005 m/rad; all animated GLBs unchanged by continuation |',
'| Reverse seeking | 10/10 source checks pass | Forward/backward five-frame evaluation; browser reverse seeking not claimed |',
'| Camera clearance | 5,760 samples, 0 violations | Fresh rail-validation.json; 0.5 m camera-center distance against desktop composition at five states and both camera tiers |',
'| Full frustum/mobile-geometry clearance | PARTIALLY COMPLETE | Existing test does not independently sweep the mobile meshes or the near plane |',
'| Runtime performance/lifecycle | NOT STARTED | No device trace, network waterfall, browser draw-call count or dispose test |','',
'Stored owned-asset totals below are uncompressed file totals, **not** active-route transfer measurements or proof of Appendix F runtime budgets.','','| Route | Desktop bytes | Mobile bytes |','|---|---:|---:|']
for r,totals in inv['storedPackageTotals'].items():md.append(f'| {r} | {totals["desktop"]:,} | {totals["mobile"]:,} |')
md+=['','## H Final render review','','10/10 routes, 20/20 posters reviewed. Every desktop poster is 1600×1000 and ≤180 KiB; every mobile poster is 780×1200 and ≤110 KiB. Review is limited to the user’s catastrophic composition/placement/clipping criteria at specified reference poses. These are Blender asset previews, not final website screenshots or proof of text contrast.','','| Route | Status | Review notes |','|---|---|---|']
for r,n in review_notes.items():md.append(f'| {r} | COMPLETE | {n} |')
md+=['','## I Protected files','','216/216 baseline files remain byte-identical. No protected mismatch was repaired or hidden. Git still lists QuickDiscovery.module.css, QuickDiscovery.tsx, engine.ts and spatial-asset.ts as modified relative to HEAD; all four match the pre-production protected hashes, so these are existing edits rather than Blender-production changes. The baseline covers src, Quick Blender/models, motion studies, POC files and top-level Blender scripts. This is an exact baseline comparison, not a claim that every file on the computer was historically unchanged.','','## J Specification completion matrix','','The allowed statuses are COMPLETE, PARTIALLY COMPLETE, NOT STARTED and NOT APPLICABLE. Each row scopes its claim explicitly. This is not a blanket Part I completion declaration.','','| Specification item | Status | Evidence / file | Notes |','|---|---|---|---|']
for m in matrix:md.append('| '+' | '.join(str(m[k]).replace('|','/') for k in ('specificationItem','status','evidence','notes'))+' |')
md+=['','## K CURRENT IMPLEMENTATION FRONTIER','']
for key,values in frontier.items():
    md+=['**'+key+':**','']
    if isinstance(values,list):md += ['- '+x for x in values]+['']
    else:md += [values,'']
md+=['## L Delivery files and next step','','Use delivery-inventory.json as the single machine-readable handoff inventory. asset-manifest.json remains the existing runtime package authority; it was not replaced by a competing loader schema. Supporting source/export/motion/rail/poster validation reports are listed and checksummed in the inventory. The authoritative DOCX is unchanged.','',frontier['NEXT REQUIRED STEP'],'','No React, Three.js, route, navigation, scroll, DOM typography, accessibility, transition or website optimization implementation was performed.','',
'### Existing and continuation scripts','',', '.join('`'+x+'`' for x in inv['scripts']), '', '### Available logs','',', '.join('`'+x+'`' for x in inv['logs']),'']
(HERE/'FINAL_HANDOFF_REPORT.md').write_text('\n'.join(md),encoding='utf8')
assert inv['protectedFiles']['changed']==[] and rail['violations']==0 and not motion['errors']
print(json.dumps({'matrixItems':len(matrix),'statuses':dict(Counter(x['status'] for x in matrix)),'changes':{k:inv.get('continuationChanges',{}).get(k) for k in ['masters','glbs','posters','allAnimatedGlbsUnchanged']},'reportLines':len(md)},indent=2))
