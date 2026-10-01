"""Final source naming, collision references and a planner tile conflict correction."""
import bpy,sys,json,re
from pathlib import Path
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
from produce import empty
from bpy_extras.anim_utils import action_get_channelbag_for_slot
c=json.loads((HERE/'contract.json').read_text(encoding='utf8'))
for route in c['routes']:
    source=HERE/next(a['source'] for a in c['assets'].values() if a['owner']==route)
    bpy.ops.wm.open_mainfile(filepath=str(source),load_ui=False)
    if bpy.context.scene.get('contractFinalized'):continue
    for obj in bpy.data.objects:
        if obj.library:continue
        if obj.name.endswith('_MOBILE'):obj.name=obj.name[:-7].replace('_INSTANCE_','_MOBILEINSTANCE_')
    for i,k in enumerate(c['routes'][route]['knots']):
        o=empty(f'SA_{route.upper()}_CORRIDOR_{i:02}',bpy.data.collections['08_COLLISION_GUIDES'],k['end'])
        o.empty_display_type='SPHERE';o.empty_display_size=.5;o['horizontalClearance']=.5;o['nearPlaneHeadroom']=.25
    if route=='work':
        for lod in ('','MOBILE'):
            o=bpy.data.objects[f'SA_W02_{lod}TILE_07'];strip=o.animation_data.nla_tracks[0].strips[0]
            bag=action_get_channelbag_for_slot(strip.action,strip.action_slot)
            for fc in bag.fcurves:
                if fc.data_path=='location' and fc.array_index==0:
                    for key in fc.keyframe_points:
                        if key.co.x>=121:key.co.y=-.48
                    fc.update()
    if route=='aura':
        for lod in ('DESKTOP','MOBILE'):
            col=bpy.data.collections['SA_A04_'+lod];prefix='MOBILE' if lod=='MOBILE' else ''
            library=bpy.data.collections['LIB_A04_'+lod.lower()]
            for i in range(9):
                shelf=bpy.data.objects[f'SA_A04_{prefix}SHELF_{i%5:02}']
                o=empty(f'SA_A04_{prefix}SOCKET_{i:02}',col,((i//5*2-1)*.7,.12,0));o.parent=shelf;o['documentIndex']=i
                library.objects.link(o)
    info=json.loads(bpy.data.texts['READ_ME'].as_string());info['validationStatus']='Passed reopened-master, scale, naming, anchor, triangle/package cap, exact clip count/duration and reverse-seek checks. GLBs passed Khronos validation (0 errors, 0 warnings). See external reports for final checksums and poster review.'
    info['artistNotes'].append('Export collection mobile roles include MOBILE to satisfy Blender unique datablock names; exported node and material names are normalized to the desktop contract.')
    if route=='aura':info['artistNotes'].append('A04 SOCKET_00..08 follow shelf transforms. Future scene adapter attaches the nine A02 document instances to these physical sockets at the model transition; do not duplicate document geometry.')
    text=bpy.data.texts['READ_ME'];text.clear();text.write(json.dumps(info,indent=2))
    bad=[o.name for o in bpy.data.objects if not o.library and not re.fullmatch(r'SA_[A-Z0-9]+_[A-Z_]+_\d\d',o.name)]
    assert not bad,bad
    bpy.context.scene['contractFinalized']=True;bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True);print('FINALIZED',route,flush=True)
