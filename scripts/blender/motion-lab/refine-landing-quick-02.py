"""Prototype 02: additive refinement of the saved Prototype 01, Blender 5.2.

Never rebuilds Prototype 01; loads its native scene and saves to a new directory.
Run: blender --background --factory-startup --python <this script> -- --stills
Render: blender --background <02.blend> --python <this script> -- --render-only
"""
from pathlib import Path
import argparse
import bpy
import hashlib
import json
import math
import random
import sys
from bpy_extras.anim_utils import action_get_channelbag_for_slot

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / '.aura-work/blender-poc/motion-lab-01/landing-to-quick-01.blend'
OUT = ROOT / '.aura-work/blender-poc/motion-lab-02'
SHIFT, END, FPS = 150, 450, 30
STAGES = {1:'Quiet atmosphere',18:'AURA begins',42:'Name begins',72:'Surname follows',
    118:'Roles begin',150:'Secondary identity',174:'Entry resolves',181:'Identity complete',186:'Reading hold',
    187:'Anticipation',205:'Release',229:'Primary travel',241:'Trailing response',253:'Secondary travel',
    265:'Counterbalance',277:'Spatial reorganization',289:'Depth handoff',301:'Depth crossing',
    313:'Rail preparation',325:'Quick takes shape',337:'Navigation alignment',349:'Hierarchy emerges',
    373:'Final alignment',397:'Settling',421:'Quick arrival',450:'End hold'}
PALETTE = {'ink':'07070a','paper':'e8e2d8','muted':'a69c92','red':'c0182a',
    'purple':'9b72cf','rail':'242830','warm':'ee8456','facet':'16151d'}

def rgb(code):
    v=[int(code[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v)

def channels(action):
    for slot in action.slots:
        bag=action_get_channelbag_for_slot(action,slot)
        if bag:
            yield from bag.fcurves

def soften(idblock):
    if not idblock.animation_data or not idblock.animation_data.action: return
    for curve in channels(idblock.animation_data.action):
        for k in curve.keyframe_points:
            k.interpolation='BEZIER'
            k.handle_left_type=k.handle_right_type='AUTO_CLAMPED'

def mesh(scene,name,vertices,material):
    data=bpy.data.meshes.new(name)
    data.from_pydata(vertices,[],[tuple(range(len(vertices)))])
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj)
    obj.data.materials.append(material)
    uv=data.uv_layers.new(name='UVMap')
    for i,co in enumerate([(0,0),(1,0),(1,1),(0,1)]):
        if i<len(uv.data): uv.data[i].uv=co
    return obj

def quad(scene,name,mat):
    return mesh(scene,name,[(-.5,-.5,0),(.5,-.5,0),(.5,.5,0),(-.5,.5,0)],mat)

def emissive(name,color,strength=1):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    n=mat.node_tree.nodes;n.clear()
    e=n.new('ShaderNodeEmission');e.inputs['Color'].default_value=(*color,1)
    e.inputs['Strength'].default_value=strength
    o=n.new('ShaderNodeOutputMaterial');mat.node_tree.links.new(e.outputs[0],o.inputs['Surface'])
    mat.diffuse_color=(*color,1)
    return mat

def soft_material(name,color,radial=False,core=False):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    # True blending keeps low-opacity atmospheric gradients soft at preview samples.
    mat.surface_render_method='BLENDED'
    n=mat.node_tree.nodes;n.clear();l=mat.node_tree.links
    e=n.new('ShaderNodeEmission');e.inputs['Color'].default_value=(*color,1)
    e.inputs['Strength'].default_value=1.6 if core else 1
    transparent=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader')
    o=n.new('ShaderNodeOutputMaterial');l.new(transparent.outputs[0],mix.inputs[1]);l.new(e.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],o.inputs['Surface'])
    value=n.new('ShaderNodeValue');value.name='Visibility envelope';value.outputs[0].default_value=1
    if radial:
        uv=n.new('ShaderNodeTexCoord');dist=n.new('ShaderNodeVectorMath');dist.operation='DISTANCE';dist.inputs[1].default_value=(.5,.5,0);l.new(uv.outputs['UV'],dist.inputs[0])
        ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements.remove(ramp.color_ramp.elements[1])
        first=ramp.color_ramp.elements[0];first.position=0;first.color=(1,1,1,1)
        for pos,v in ([(.07,.9),(.17,.22),(.35,.02),(.5,0)] if core else [(.06,.75),(.20,.28),(.36,.035),(.5,0)]):
            stop=ramp.color_ramp.elements.new(pos);stop.color=(v,v,v,1)
        ramp.color_ramp.interpolation='EASE';l.new(dist.outputs['Value'],ramp.inputs[0])
        mult=n.new('ShaderNodeMath');mult.operation='MULTIPLY';l.new(ramp.outputs['Color'],mult.inputs[0]);l.new(value.outputs[0],mult.inputs[1]);l.new(mult.outputs[0],mix.inputs[0])
    else:l.new(value.outputs[0],mix.inputs[0])
    mat.diffuse_color=(*color,1)
    return mat,value.outputs[0]

def preserve_and_shift(scene):
    """Keep original key values and Bezier handles; only add an opening prelude."""
    original={}
    for action in bpy.data.actions:
        records=[]
        for c in channels(action):
            records.append((c.data_path,c.array_index,[(float(k.co.x),float(k.co.y)) for k in c.keyframe_points]))
            for k in c.keyframe_points:
                k.co.x+=SHIFT;k.handle_left.x+=SHIFT;k.handle_right.x+=SHIFT
        original[action.name]=records
    for marker in list(scene.timeline_markers):scene.timeline_markers.remove(marker)
    for frame,name in STAGES.items():scene.timeline_markers.new(name,frame=frame)
    scene.frame_end=END
    # Additional small counterbalance states between existing authored anchors.
    # Camera curves and every original checkpoint remain numerically unchanged.
    for obj in scene.objects:
        if not obj.name.startswith(('01 IDENTITY','02 IDENTITY','04 ROLE','05 ENTRY')):continue
        if not obj.animation_data:continue
        index=1 if obj.name.startswith('05') else -1
        for c in channels(obj.animation_data.action):
            if c.data_path!='location':continue
            for frame,amount in [(241,.028),(265,-.035),(289,.024),(313,-.015),(337,.010)]:
                value=c.evaluate(frame)+(amount*index if c.array_index==2 else amount*.18*index)
                k=c.keyframe_points.insert(frame,value,options={'FAST'});k.interpolation='BEZIER';k.handle_left_type=k.handle_right_type='AUTO_CLAMPED'
            c.update()
    # Give the small persistent introduction clearance under the expanding arc.
    # This is between its original 265 and 295 keys; both endpoints are retained.
    intro=scene.objects['03 COPY / persistent introduction']
    for c in channels(intro.animation_data.action):
        if c.data_path=='location' and c.array_index==1:
            k=c.keyframe_points.insert(277,c.evaluate(277)-.24)
            k.interpolation='BEZIER';k.handle_left_type=k.handle_right_type='AUTO_CLAMPED';c.update()
    return original

def verify_anchors(original):
    checked=0
    for name,records in original.items():
        curves={(c.data_path,c.array_index):c for c in channels(bpy.data.actions[name])}
        for path,index,keys in records:
            curve=curves[(path,index)]
            for frame,value in keys:
                actual=curve.evaluate(frame+SHIFT)
                if abs(actual-value)>0.0001:raise AssertionError(f'Original key changed: {name}/{path}/{frame}: {actual} != {value}')
                checked+=1
    return checked

def typography(scene):
    fonts={name:bpy.data.fonts.load(str(OUT/'fonts'/file)) for name,file in {
        'display':'InstrumentSerif-Regular.ttf','italic':'InstrumentSerif-Italic.ttf','meta':'IBMPlexMono-Regular.ttf'}.items()}
    for font in fonts.values():font.pack()
    for obj in scene.objects:
        if obj.type!='FONT':continue
        obj.data.font=fonts['display' if obj.name.startswith(('01','02','04','IDENTITY')) else 'meta']
        obj.data.space_character=1.03
    scene.objects['LAB / edition'].data.body='MOTION LAB  /  02'
    scene.objects['LAB / note'].data.body='AURA  /  MOTION REFINEMENT'
    scene.objects['01 IDENTITY / persistent name'].data.body='Adharsh'
    scene.objects['01 IDENTITY / persistent name'].data.size=1.12
    scene.objects['02 IDENTITY / surname'].data.body='Vijayakarthy'
    scene.objects['02 IDENTITY / surname'].data.size=.43
    roles=sorted([o for o in scene.objects if o.name.startswith('04 ROLE')],key=lambda o:o.name)
    for role in roles:
        role.data.body=role.data.body.title();role.data.font=fonts['italic'];role.data.size=.91
    wordmark=scene.objects['IDENTITY / AURA placeholder'];wordmark.data.size=.35
    entries=[(wordmark,18,6),
        (scene.objects['01 IDENTITY / persistent name'],42,4),
        (scene.objects['02 IDENTITY / surname'],72,3),
        *[(o,118+i*12,2) for i,o in enumerate(roles)],
        (scene.objects['03 COPY / persistent introduction'],141,.42),
        (scene.objects['05 ENTRY / label becomes breadcrumb'],165,.6)]
    reveal=[]
    for parent,start,pace in entries:
        body=parent.data.body;parent['full_text']=body;parent['motion_role']='Persistent Prototype 01 transform carrier'
        parent.hide_render=True;parent.hide_set(True)
        # Prefix + sentinel preserves trailing-space advance in proportional fonts.
        measure=parent.copy();measure.data=parent.data.copy();measure.animation_data_clear();measure.location=(0,0,0);measure.rotation_euler=(0,0,0);measure.scale=(1,1,1);measure.hide_render=True
        scene.collection.objects.link(measure);measure.hide_set(False)
        def right_edge(s):
            measure.data.body=s;bpy.context.view_layer.update()
            return max(v[0] for v in measure.bound_box)
        bar=right_edge('|')
        for i,ch in enumerate(body):
            if ch==' ':continue
            offset=right_edge(body[:i]+'|')-bar
            data=parent.data.copy();data.body=ch;data.animation_data_clear()
            obj=bpy.data.objects.new(f'TYPE / {parent.name} / {i:02} {ch}',data);scene.collection.objects.link(obj);obj.parent=parent
            color_key='red' if parent==wordmark and i==0 else 'paper' if parent==wordmark or parent.name.startswith(('01','04')) else 'muted'
            mat,opacity=soft_material('TYPE / '+parent.name+str(i),rgb(PALETTE[color_key]))
            obj.data.materials.clear();obj.data.materials.append(mat)
            # Slightly unequal cadence; no flashing cursor or whole-word pop.
            frame=round(start+i*pace+(i%3)*.45)
            for f,v in [(1,0),(frame,0),(frame+3,.42),(frame+7,1)]:opacity.default_value=v;opacity.keyframe_insert('default_value',frame=f)
            for f,y,rz in [(frame,-.028,-.8),(frame+5,.004,.15),(frame+12,0,0)]:
                obj.location=(offset,y,.002);obj.rotation_euler.z=math.radians(rz);obj.keyframe_insert('location',frame=f);obj.keyframe_insert('rotation_euler',frame=f)
            soften(obj);soften(mat.node_tree)
            reveal.append({'object':obj.name,'start':frame,'complete':frame+7})
        bpy.data.objects.remove(measure,do_unlink=True)
    return reveal

def atmosphere(scene):
    # Subtle radial washes use the production's crimson and graphite, not a new palette.
    for name,color,location,scale,level in [('crimson','c0182a',(-3.0,.7,-3.25),(14,10,1),.045),('graphite','1e1b24',(3,-.5,-3.4),(15,11,1),.18)]:
        mat,alpha=soft_material('ENV / '+name,rgb(color),radial=True);obj=quad(scene,'ENV / '+name+' wash',mat)
        for f,x,y,a in [(1,0,0,level*.65),(174,.12,.05,level),(241,.28,.1,level*1.15),(301,.5,.2,level*1.35),(373,.15,.06,level),(450,0,0,level*.85)]:
            obj.location=(location[0]+x,location[1]+y,location[2]);obj.scale=scale;obj.keyframe_insert('location',frame=f);alpha.default_value=a;alpha.keyframe_insert('default_value',frame=f)
        soften(obj);soften(mat.node_tree)
    # Quiet crystalline edge planes echo Threshold's dark faceted object.
    for i,(x,y,s,angle) in enumerate([(-6.5,1.6,2.3,18),(6.4,-1.2,2.5,-23),(-5.8,-3.0,1.7,-12),(5.4,3.2,2.1,29)]):
        mat=emissive('ENV / graphite facet '+str(i),rgb(['101015','0c0c11','16151d','101015'][i]))
        obj=mesh(scene,'ENV / peripheral facet '+str(i),[(-.7,-1,0),(.55,-.7,0),(.7,.65,0),(-.4,1,0)],mat)
        for f,dx,dy,r in [(1,0,0,0),(205+i*4,.025,.02,.15),(277+i*4,.15,.05,1.2),(325+i*4,.25,.09,1.8),(397,.32,.12,2),(450,.34,.13,2.1)]:
            obj.location=(x+dx,y+dy,-2.7);obj.scale=(s,s,1);obj.rotation_euler.z=math.radians(angle+r);obj.keyframe_insert('location',frame=f);obj.keyframe_insert('rotation_euler',frame=f)
        soften(obj)
    rng=random.Random(20260912)
    for layer,count in [('distant',72),('primary',18)]:
        background=layer=='distant'
        for i in range(count):
            warm=(i%5==0)
            color=rgb(PALETTE['warm' if warm else 'red'])
            mat,alpha=soft_material(f'EMBER / {layer} {i:02}',color,radial=True,core=not background)
            obj=quad(scene,f'EMBER / {layer} {i:02}',mat)
            life=rng.randint(310,500) if background else rng.randint(145,240)
            phase=rng.randint(0,life);size=rng.uniform(.045,.095) if background else rng.uniform(.12,.22)
            x0=rng.choice([-1,1])*rng.uniform(3.7,8.4)
            z=rng.uniform(-2.5,-1.4) if background else rng.uniform(.7,1.9)
            angle=rng.uniform(-.55,.55);speed=5.4 if background else 9.2
            turbulence=rng.uniform(.08,.28);seed=rng.random()*6.28
            for cycle in range(-1,4):
                start=cycle*life-phase
                if start>END or start+life<1:continue
                for dt in sorted(set([0,4,life-4,life]+list(range(14,life,14)))):
                    f=start+dt;t=dt/life
                    response=math.exp(-((f-290)/62)**2)
                    x=x0+angle*t+turbulence*math.sin(t*7+seed)+response*.22
                    y=-4.7+t*speed
                    obj.location=(x,y,z+.05*math.sin(t*5+seed));obj.scale=(size,size*(1 if background else 1.35),1)
                    obj.rotation_euler.z=angle+.16*math.sin(t*6+seed)
                    envelope=math.sin(math.pi*t)**.7
                    twinkle=.82+.18*math.sin(t*11+seed)
                    alpha.default_value=envelope*twinkle*(.24 if background else .8)
                    obj.keyframe_insert('location',frame=f);obj.keyframe_insert('rotation_euler',frame=f);alpha.keyframe_insert('default_value',frame=f)
            soften(obj);soften(mat.node_tree)

def configure_video(scene):
    scene.render.image_settings.media_type='VIDEO';scene.render.image_settings.file_format='FFMPEG'
    scene.render.ffmpeg.format='MPEG4';scene.render.ffmpeg.codec='H264';scene.render.ffmpeg.constant_rate_factor='HIGH';scene.render.ffmpeg.ffmpeg_preset='GOOD'
    scene.render.filepath=str(OUT/'landing-to-quick-02.mp4')

def main():
    p=argparse.ArgumentParser();p.add_argument('--stills',action='store_true');p.add_argument('--render-only',action='store_true');args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    OUT.mkdir(parents=True,exist_ok=True)
    if args.render_only:
        scene=bpy.context.scene
        if scene.name!='AURA_MOTION_LAB_02':raise RuntimeError('Only render the Prototype 02 scene')
        configure_video(scene);scene.render.resolution_percentage=75;scene.eevee.taa_render_samples=8
        bpy.ops.render.render(animation=True);return
    source_hash=hashlib.sha256(BASE.read_bytes()).hexdigest()
    bpy.ops.wm.open_mainfile(filepath=str(BASE))
    scene=bpy.context.scene;scene.name='AURA_MOTION_LAB_02'
    originals=preserve_and_shift(scene)
    for name,code in PALETTE.items():
        mat=bpy.data.materials.get('LAB01 / '+name)
        if mat:
            mat.diffuse_color=(*rgb(code),1)
            mat.node_tree.nodes.get('Emission').inputs['Color'].default_value=(*rgb(code),1)
    reveals=typography(scene);atmosphere(scene)
    checked=verify_anchors(originals)
    scene['timing']='15 seconds / 450 frames / 30fps. Original choreography shifted +150 frames, same relative timing.'
    scene['purpose']='Prototype 02 refinement. Never integrated into production.'
    scene['source_sha256']=source_hash
    scene.frame_set(1);configure_video(scene)
    readme=bpy.data.texts.new('READ ME — Motion Lab 02');readme.write('AURA / PROTOTYPE 02\n\n15 seconds, 450 frames, 30 fps.\nSpace: play. Timeline: scrub. 26 stage markers.\nOriginal 01 camera, path morph, anchors and all original transform keys retained with +150 frame opening prelude.\nIdentity uses packed Instrument Serif / IBM Plex Mono fonts and native per-glyph reveal keys.\n72 distant and 18 foreground ember quads. No runtime scripts or simulations.\nCompare transition frame F with Prototype 01 frame F-150.\nRender using --gpu-backend opengl on this computer.\nNo Next.js integration.\n')
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'landing-to-quick-02.blend'),compress=True)
    report={'blender':bpy.app.version_string,'source_sha256':source_hash,'original_key_values_verified':checked,'shift_frames':SHIFT,'frames':END,'fps':FPS,'seconds':END/FPS,'stages':STAGES,'objects':len(scene.objects),'embers':{'distant':72,'primary':18},'glyphs':len(reveals),'reveal_last_frame':max(r['complete'] for r in reveals),'reveal_schedule':reveals,'palette':PALETTE}
    (OUT/'motion-manifest.json').write_text(json.dumps(report,indent=2),encoding='utf8')
    if args.stills:
        scene.render.image_settings.media_type='IMAGE';scene.render.image_settings.file_format='PNG'
        for f in [1,58,102,174,229,277,325,450]:
            scene.frame_set(f);scene.render.filepath=str(OUT/f'frame-{f:03}.png');bpy.ops.render.render(write_still=True,scene=scene.name)
    print('PROTOTYPE 02 VERIFIED',checked,'original keys preserved; source unchanged:',hashlib.sha256(BASE.read_bytes()).hexdigest()==source_hash)

if __name__=='__main__':main()
