"""Read current source geometry, material graphs, links, and animation contracts."""
import bpy,json,sys
from pathlib import Path
H=Path(__file__).resolve().parent
R=H.parents[2]
C=json.loads((H/'contract.json').read_text())
out={}
for route in C['routes']:
    src=next(a['source'] for a in C['assets'].values() if a['owner']==route)
    bpy.ops.wm.open_mainfile(filepath=str(H/src),load_ui=False)
    row={'objects':{},'materials':{},'instances':{},'actions':{},'libraries':[l.filepath for l in bpy.data.libraries]}
    for a in C['assets'].values():
        if a['owner']!=route:continue
        for lod in ('desktop','mobile'):
            col=bpy.data.collections[f"SA_{a['id']}_{lod.upper()}"]
            entries=[]
            for o in col.objects:
                if o.type=='MESH':o.data.calc_loop_triangles()
                entries.append({'name':o.name,'type':o.type,'parent':o.parent.name if o.parent else None,'location':list(o.location),'tris':len(o.data.loop_triangles) if o.type=='MESH' else 0,'materials':[m.name for m in o.data.materials] if o.type=='MESH' else [],'props':dict(o.items())})
            row['objects'][a['id']+'_'+lod]=entries
    for o in bpy.data.objects:
        if o.instance_type=='COLLECTION':row['instances'][o.name]={'assetId':o.get('assetId'),'collection':o.instance_collection.name,'location':list(o.location),'scale':list(o.scale),'rotation':list(o.rotation_euler)}
    for m in bpy.data.materials:
        if m.library or not m.use_nodes:continue
        row['materials'][m.name]={'nodes':[(n.name,n.type,n.image.name if n.type=='TEX_IMAGE' and n.image else None) for n in m.node_tree.nodes],'links':[(l.from_node.name,l.from_socket.name,l.to_node.name,l.to_socket.name) for l in m.node_tree.links]}
    for a in bpy.data.actions:
        if a.library:continue
        channels=[]
        for layer in a.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for fc in bag.fcurves:channels.append([fc.data_path,fc.array_index,[[*k.co] for k in fc.keyframe_points]])
        row['actions'][a.name]=channels
    out[route]=row
    print('AUDIT',route,len(row['objects']),len(row['actions']),flush=True)
(R/'.aura-work/senior-art-pass/source-audit.json').write_text(json.dumps(out,indent=2))
