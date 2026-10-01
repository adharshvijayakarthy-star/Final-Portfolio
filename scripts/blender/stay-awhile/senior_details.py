"""Measured surface and silhouette corrections; never changes animation data."""
import bpy,math
from mathutils import Vector
from pathlib import Path

def refine(route,api):
    H=Path(__file__).resolve().parent
    for lod in ('desktop','mobile'):
        suffix='_MOBILE' if lod=='mobile' else ''
        if route=='garden':
            for o in bpy.data.collections['SA_G01_'+lod.upper()].objects:
                if o.type!='MESH':continue
                # These closed volumes are moss cushions, not luminous leaf masses.
                if any('LEAF' in m.name for m in o.data.materials) and any(len(p.vertices)>4 for p in o.data.polygons):
                    for i,m in enumerate(o.data.materials):o.data.materials[i]=bpy.data.materials['SA_M_MOSS']
                    for p in o.data.polygons:p.use_smooth=True
                if lod=='desktop' and o.name=='SA_G01_MESH_00' and not o.get('seniorTerrainCompact'):
                    from mathutils.bvhtree import BVHTree
                    tree=BVHTree.FromPolygons([v.co.copy() for v in o.data.vertices],[list(p.vertices) for p in o.data.polygons])
                    mod=o.modifiers.new('Terrain redundant edge reduction','DECIMATE');mod.ratio=.88
                    api.apply_modifier(o,mod)
                    error=max(tree.find_nearest(v.co)[3] for v in o.data.vertices)
                    assert error<.02,('Terrain reduction error',error)
                    o['seniorTerrainCompact']=True;o['seniorTerrainMaxVertexError']=error
            # The original isolated cones read as steep artificial berms near Contact.
            # Keep the continuous skirt and soften/push back only the raised hills.
            for o in bpy.data.collections['SA_G09_'+lod.upper()].objects:
                if o.type!='MESH' or o.get('seniorHorizon'):continue
                for v in o.data.vertices:
                    if v.co.z>.51:
                        v.co.x*=1.30;v.co.y*=1.30;v.co.z=.5+(v.co.z-.5)*.48
                for i,m in enumerate(o.data.materials):
                    o.data.materials[i]=bpy.data.materials['SA_M_MOSS']
                o['seniorHorizon']=True
            # Small ripples are authored into the static water mesh, not a runtime effect.
            for o in bpy.data.collections['SA_G07_'+lod.upper()].objects:
                if o.type!='MESH' or o.get('seniorWater'):continue
                for v in o.data.vertices:
                    v.co.z+=.005*math.sin(v.co.x*3.1+v.co.y*1.8)
                for p in o.data.polygons:p.use_smooth=True
                o['seniorWater']=True
            m=bpy.data.materials.get('SA_M_WATER')
            if m and not m.library:
                p=m.node_tree.nodes.get('Principled BSDF')
                if p:p.inputs['Roughness'].default_value=.17;p.inputs['Metallic'].default_value=.12
        if route=='person':
            for o in bpy.data.collections['SA_P03_'+lod.upper()].objects:
                if o.type!='MESH':continue
                for i,m in enumerate(o.data.materials):
                    if 'BARK' in m.name:o.data.materials[i]=api.tree_material(lod)
                for p in o.data.polygons:p.use_smooth=True
        if route=='leader':
            name='SA_M_COURT'+suffix
            mat=bpy.data.materials.get(name) or bpy.data.materials.new(name);mat.use_nodes=True
            api.texture_material(mat,'stone',lod)
            p=mat.node_tree.nodes.get('Principled BSDF')
            # Neutral earthen base with the sourced stone micro-normal and roughness.
            for link in list(p.inputs['Base Color'].links):mat.node_tree.links.remove(link)
            p.inputs['Base Color'].default_value=api.color('92836C')
            for o in bpy.data.collections['SA_L01_'+lod.upper()].objects:
                if o.type!='MESH':continue
                for i,m in enumerate(o.data.materials):
                    if 'CLAY' in m.name or 'COURT' in m.name:o.data.materials[i]=mat
        if route=='aura':
            for o in bpy.data.collections['SA_A04_'+lod.upper()].objects:
                if o.type!='MESH' or o.get('seniorShelf'):continue
                # Preserve shelf length, hinge pivots and assembly motion; reduce fascia bulk.
                if o.parent and 'ROOT' not in o.parent.name and any('BARK' in m.name for m in o.data.materials):
                    z0=sum(v.co.z for v in o.data.vertices)/len(o.data.vertices)
                    for v in o.data.vertices:v.co.z=z0+(v.co.z-z0)*.60
                    o['seniorShelf']=True
            for o in bpy.data.collections['SA_A02_'+lod.upper()].objects:
                if o.type!='MESH' or o.get('seniorPaper'):continue
                if any('PAPER' in m.name for m in o.data.materials):
                    for v in o.data.vertices:v.co.y+=.006*math.sin(v.co.x*7+v.co.z*3)
                    o['seniorPaper']=True
    # Keep the paper warm and matte across the scroll, archive and work artifacts.
    for m in bpy.data.materials:
        if m.library or not m.use_nodes or 'PAPER' not in m.name:continue
        p=m.node_tree.nodes.get('Principled BSDF')
        if p:p.inputs['Roughness'].default_value=.94;p.inputs['Specular IOR Level'].default_value=.17
    api.uv_and_surface(route)

