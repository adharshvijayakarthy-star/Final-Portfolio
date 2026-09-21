"""AURA animated visual world, Blender 5.2. No external assets.

Generate: blender --background --python create-master.py
Inspect/play the saved master in Blender BEFORE exporting:
blender --background --python create-master.py -- --export

The 112-second authoring timeline is scrubbed by normalized website scroll;
it is not a video or a mandatory 112-second navigation transition.
"""
import bpy
import math
import random
import json
import sys
import hashlib
from pathlib import Path
from mathutils import Vector
from bpy_extras.anim_utils import action_get_channelbag_for_slot

HERE = Path(__file__).resolve().parent
MASTER = HERE / 'quick-discovery-master.blend'
OUT = HERE / 'exported'
FPS, STRIDE, END = 30, 240, 3361
LEGACY_STAGES = ['entry', 'who', 'build', 'workcard', 'plan', 'papers', 'mun', 'snrled', 'aura', 'beyond', 'future', 'contact']
STAGES = LEGACY_STAGES[:3] + ['think', 'lead'] + LEGACY_STAGES[3:]
COLLECTIONS = ['00_ENVIRONMENT', '01_ATMOSPHERE', '02_CONTINUITY_OBJECT', '03_STUDY_PLANNER', '04_PAST_PAPER', '05_MUN', '06_SNRLED', '07_AURA', '08_LIGHTING', '09_CAMERA']
R = random.Random(240917)

def frame(stage, p=0):
    return max(1, round(1 + STRIDE * (stage + (2 if stage >= 3 else 0) + p)))

def rgb(hexcode):
    values = [int(hexcode[i:i+2], 16)/255 for i in (0, 2, 4)]
    return tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in values)

def material(name, color, emission=0, metallic=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb(color), 1)
    m.use_nodes = True
    shader = m.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = m.diffuse_color
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = .38
    shader.inputs['Emission Color'].default_value = m.diffuse_color
    shader.inputs['Emission Strength'].default_value = emission
    return m

def link(obj, col, parent=None):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)
    obj.parent = parent
    return obj

def mesh(name, verts, faces, mat, col, parent=None):
    data = bpy.data.meshes.new(name + '_Mesh')
    data.from_pydata(verts, [], faces)
    data.materials.append(mat)
    obj = bpy.data.objects.new(name, data)
    col.objects.link(obj)
    obj.parent = parent
    return obj

def box(name, size, mat, col, parent=None, pos=(0, 0, 0)):
    x,y,z = [v/2 for v in size]
    verts = [(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
    obj = mesh(name, verts, [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)], mat, col, parent)
    obj.location = pos
    bevel = obj.modifiers.new('Restrained edge highlight', 'BEVEL')
    bevel.width = min(.025, min(size)/4)
    bevel.segments = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    return obj

def line(name, points, mat, col, parent=None, width=.012):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth, curve.bevel_resolution = width, 0
    s = curve.splines.new('POLY')
    s.points.add(len(points)-1)
    for p, co in zip(s.points, points): p.co = (*co, 1)
    obj = bpy.data.objects.new(name, curve)
    col.objects.link(obj)
    curve.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    obj.parent = parent
    return obj

def key(obj, f, pos=None, scale=None, rot=None):
    if pos is not None:
        obj.location = pos
        obj.keyframe_insert(data_path='location', frame=f)
    if scale is not None:
        obj.scale = (scale,)*3 if isinstance(scale, (int, float)) else scale
        obj.keyframe_insert(data_path='scale', frame=f)
    if rot is not None:
        obj.rotation_euler = [math.radians(v) for v in rot]
        obj.keyframe_insert(data_path='rotation_euler', frame=f)

def group(name, stage, col):
    obj = bpy.data.objects.new(name, None)
    col.objects.link(obj)
    for p, pos, scale, rot in [(-1,(11,-.15,-24),.2,(0,-35,-4)),(-.24,(9.7,-.15,-18),.3,(0,-30,-4)),(-.08,(5,-.15,-5),.83,(0,-12,-2)),(.12,(2.64,-.09,.06),1.012,(0,0,.2)),(.25,(2.7,-.15,0),1,(0,0,0)),(.73,(2.62,-.115,.03),1,(0,0,-.3)),(.9,(1.6,-.15,-1.5),.91,(0,15,1)),(1.12,(-4.8,-.15,-19),.27,(0,50,4))]:
        key(obj, 1 if p == -1 else frame(stage,p), pos, scale, rot)
    key(obj, END, (-7,-.15,-24), .2, (0,55,5))
    return obj

def appear(obj, f, pos=None, delay=0):
    target = Vector(pos if pos is not None else obj.location)
    f += delay
    key(obj, 1, target + Vector((0,.08,-.7)), .001)
    key(obj, f, target + Vector((0,.08,-.7)), .001)
    key(obj, f+22, target + Vector((0,0,.025)), 1.025)
    key(obj, f+38, target, 1)

def camera_and_lights(cols):
    scene = bpy.context.scene
    data = bpy.data.cameras.new('Journey_Lens')
    cam = bpy.data.objects.new('Journey_Camera', data)
    cols['09_CAMERA'].objects.link(cam)
    data.lens, data.clip_end = 50, 150
    scene.camera = cam
    poses = [(0,0,22.22,0),(.38,.12,22.5,.4),(-.3,.2,22,-.7),(.4,.15,22.7,.3),(-.32,.42,21.8,-1.8),(.5,.1,21.1,1.1),(-.55,.48,22.3,-1.1),(.32,-.16,21.4,.7),(-.3,.3,21.65,-1.5),(.3,.12,23,.3),(-.3,.35,24.3,-.3),(0,0,23,0)]
    for i,(x,y,z,roll) in enumerate(poses):
        for p,dx,dy,dz in [(0,0,0,0),(.34,.07,.02,-.1),(.7,-.04,.045,.04)]:
            key(cam, frame(i,p), (x+dx,y+dy,z+dz), rot=(0,0,roll))
    key(cam, END, (0,0,23), rot=(0,0,0))
    levels = [.45,.5,.6,.55,.95,.65,.9,1.15,1.25,.65,.4,.32]
    for name,color,power,pos in [('Key','e2dbd0',1250,(0,4,7)),('Crimson','c0182a',900,(5,-1,5)),('Fill','b8aaa0',500,(-4,0,4))]:
        data = bpy.data.lights.new('Light_'+name, 'POINT')
        data.color, data.energy, data.shadow_soft_size = rgb(color), power, 3
        obj = bpy.data.objects.new('Light_'+name, data)
        cols['08_LIGHTING'].objects.link(obj)
        for i,l in enumerate(levels):
            data.energy = power*l
            data.keyframe_insert(data_path='energy', frame=frame(i,.2))
            key(obj, frame(i,.2), (pos[0]+math.sin(i)*.5,pos[1],pos[2]))
        obj['base_power'] = power

def continuity(col, red):
    def point(stage,t):
        a = t*math.tau
        if stage in (4,7,9):
            corners=[(-.15,-2.3),(5.55,-2.3),(5.55,2.25),(-.15,2.25),(-.15,-2.3)]
            u=t*4; k=min(3,int(u)); v=u-k
            return Vector((corners[k][0]*(1-v)+corners[k+1][0]*v,corners[k][1]*(1-v)+corners[k+1][1]*v,.06))
        if stage == 10: return Vector((-6+t*12,-1.2+math.sin(a)*.07,-2))
        if stage == 11: return Vector((2.7+math.cos(a)*1.5,math.sin(a)*1.5,-1))
        cx=0 if stage == 0 else 2.7
        rx,ry,depth={0:(2.15,2.7,0),1:(2.45,2.5,0),2:(2.5,2.25,.4),3:(3.1,2.6,.4),5:(2.75,.65,.7),6:(2.55,1.75,.25),8:(2.6,2.5,.8)}.get(stage,(2.5,2.5,0))
        return Vector((cx+math.cos(a)*rx,math.sin(a)*ry,math.sin(a*2)*depth))
    def ribbon(stage):
        result=[]
        for i in range(81):
            t=i/80; p=point(stage,t); tangent=point(stage,min(1,t+.001))-point(stage,max(0,t-.001))
            n=Vector((-tangent.y,tangent.x,0)).normalized()*.019
            result.extend([p-n,p+n])
        return result
    obj=mesh('Continuity_Frame',ribbon(0),[(i*2,i*2+1,i*2+3,i*2+2) for i in range(80)],red,col)
    obj.shape_key_add(name='Basis_Entry')
    for s in range(1,12):
        shape=obj.shape_key_add(name='Resolve_'+LEGACY_STAGES[s])
        for p,co in zip(shape.data,ribbon(s)): p.co=co
        for f,value in [(1,0),(frame(s,-.24),0),(frame(s,.17),1),(frame(s,.73),1),(frame(s+1,.17) if s<11 else END,0 if s<11 else 1)]:
            shape.value=value; shape.keyframe_insert(data_path='value',frame=f)
    obj['role']='The entry aperture becomes schedule boundary, scanning ellipse, debate table, capacity gate, inquiry frame and horizon.'

def projects(cols,m):
    dark,paper,doc,red,muted,warm=m
    c=cols['03_STUDY_PLANNER']; g=group('Planner_World',4,c)
    for i in range(15):
        target=Vector(((i%5-2)*1.05,1.25-(i//5)*1.17,0))
        obj=box(f'Planner_Task_{i:02}',(.94,.96,.1),paper if i in (4,9,14) else dark,c,g)
        scatter=target+Vector((R.uniform(-2.3,2.3),R.uniform(-2,2),R.uniform(-4,3)))
        key(obj,1,scatter,1,(R.uniform(-30,30),R.uniform(-40,40),R.uniform(-28,28)))
        key(obj,frame(4,.1)+i*2,scatter,1,(-15,25,-12+i*2))
        key(obj,frame(4,.43)+i*2,target+Vector((0,0,.04)),1,(0,0,.4))
        key(obj,frame(4,.54)+i,target,1,(0,0,0))
        if i in (6,7):
            key(obj,frame(4,.58),target+Vector((.38 if i==6 else -.38,0,.2)),1,(0,0,5 if i==6 else -5))
            key(obj,frame(4,.72),target,1,(0,0,0))
        box(f'Planner_Priority_{i:02}',(.52,.045,.022),red,c,obj,(-.08,.28,.07))
    lock=line('Planner_Week_Lock',[(-2.77,-2.4,.03),(2.77,-2.4,.03),(2.77,2,.03),(-2.77,2,.03),(-2.77,-2.4,.03)],warm,c,g)
    appear(lock,frame(4,.64))
    c=cols['04_PAST_PAPER'];g=group('Papers_World',5,c)
    points=[Vector(((-2.5+i*.235)*1.4,(-1.6+i*.135+math.sin(i*1.8)*.34)*1.4,.12)) for i in range(18)]
    for i in range(7):
        obj=box(f'Logged_Paper_{i:02}',(1.28,1.8,.035),paper,c,g)
        key(obj,1,(-.3+i*.09,i*.05,i*.14),1,(0,0,-4+i))
        key(obj,frame(5,.14),(-.3+i*.09,i*.05,i*.14),1,(0,0,-4+i))
        key(obj,frame(5,.31)+i*2,(-2.4+i*.72,.5+math.sin(i)*.25,i*.08),.73,(0,12,-12+i*4))
        key(obj,frame(5,.47)+i*2,points[i*2],.055,(0,0,0))
        for j in range(4):box(f'Paper_Index_{i}_{j}',(.82-j*.08,.022,.008),doc,c,obj,(0,.4-j*.24,.023))
    for i,p in enumerate(points):
        obj=box(f'Score_Point_{i:02}',(.075,.075,.065),warm,c,g,pos=p);appear(obj,frame(5,.35),delay=i*3)
        if i:
            obj=line(f'Observed_Score_{i:02}',[points[i-1],p],muted,c,g,width=.008);appear(obj,frame(5,.39),delay=i*3)
    for i in range(12):
        a=((-2.5+i*.35)*1.4,(-1.48+i*.185)*1.4,.17);b=((-2.5+(i+1)*.35)*1.4,(-1.48+(i+1)*.185)*1.4,.17)
        obj=line(f'Analysis_Trend_{i:02}',[a,b],red,c,g,width=.018);appear(obj,frame(5,.52),delay=i*2)
    for i in range(6):
        x=(1.7+i*.19)*1.4;y=(.74+i*.09)*1.4
        obj=line(f'Forecast_Dash_{i:02}',[(x,y,.18),(x+.1,y+.05,.18)],warm,c,g);appear(obj,frame(5,.67),delay=i*3)
    c=cols['05_MUN'];g=group('MUN_World',6,c)
    room=line('MUN_Room',[ (math.cos(i*math.tau/60)*2.95,math.sin(i*math.tau/60)*2.2,-.25) for i in range(61)],muted,c,g)
    appear(room,frame(6,.04))
    for i in range(12):
        a=i*math.tau/12;pos=Vector((math.cos(a)*2.12,math.sin(a)*1.47,.12))
        obj=box(f'Delegate_Desk_{i:02}',(.64,.36,.12),dark,c,g,pos=pos);appear(obj,frame(6,.1),delay=i*3)
        badge=box(f'Delegate_Speaking_{i:02}',(.3,.12,.055),paper,c,obj,pos=(0,.07,.13))
        key(badge,1,(0,.07,.13));key(badge,frame(6,.34)+i*4,(0,.07,.13));key(badge,frame(6,.4)+i*4,(0,.07,.43));key(badge,frame(6,.49)+i*4,(0,.07,.13))
        if i%2==0:
            path=[tuple(pos*(1-t/20)+Vector((0,0,math.sin(t/20*math.pi)*.55))) for t in range(21)]
            obj=line(f'Debate_Path_{i:02}',path,red,c,g,width=.015);appear(obj,frame(6,.43),delay=i*3)
    obj=box('Simulation_Podium',(.62,.75,.19),red,c,g);appear(obj,frame(6,.57))
    c=cols['06_SNRLED'];g=group('SNRLED_World',7,c)
    for i in range(9):
        pos=(-.45,1.63-i*.41,0)
        row=box(f'Registration_Record_{i:02}',(3.1,.31,.055),dark,c,g,pos);appear(row,frame(7,.07),delay=i*7)
        tick=line(f'Payment_Verified_{i:02}',[(-1.25,-.015,.06),(-1.18,-.085,.06),(-1.02,.085,.06)],red,c,row,width=.025);appear(tick,frame(7,.2),delay=i*7)
        box(f'Record_Fields_{i:02}',(1.2,.018,.015),muted,c,row,(.1,0,.05))
    for i in range(12):
        bar=box(f'Capacity_{i:02}',(.4,.22,.08),red,c,g,(1.85,-1.75+i*.29,.08));appear(bar,frame(7,.14),delay=i*8)
    gate=line('Price_Threshold',[(-2.6,0,0),(2.6,0,0)],warm,c,g,width=.025)
    key(gate,1,(0,-2,.2));key(gate,frame(7,.29),(0,-2,.2));key(gate,frame(7,.63),(0,.2,.8));key(gate,frame(7,.75),(0,2.15,.15))
    c=cols['07_AURA'];g=group('AURA_World',8,c)
    for i in range(18):
        side=-1 if i<9 else 1;u=(i%9)/8;target=Vector((side*(2.05-u*1.9),-1.75+u*3.7,0))
        scatter=Vector((R.uniform(-3.8,3.8),R.uniform(-3,3),R.uniform(-2.8,2)))
        obj=box(f'Inquiry_Fragment_{i:02}',(.37,.52,.15),red if i%3==0 else doc,c,g)
        key(obj,1,scatter,1,(30,25,i*19))
        key(obj,frame(8,.18),scatter,1,(30,25,i*19))
        key(obj,frame(8,.42)+i,scatter*.6+target*.4,1,(12,10,side*18))
        key(obj,frame(8,.69)+i,target+Vector((0,.025,.02)),1,(0,0,-side*25))
        key(obj,frame(8,.79)+i,target,1,(0,0,-side*25))
    for i in range(8):
        a=i*math.tau/8;pos=Vector((math.cos(a)*3,math.sin(a)*2.6,-.6))
        docobj=box(f'Evidence_Document_{i:02}',(.66,.9,.028),paper,c,g)
        key(docobj,1,pos,1,(0,20,i*8))
        key(docobj,frame(8,.31),pos,1,(0,0,i*3))
        key(docobj,frame(8,.64),pos*.72,.55,(0,0,0))
        key(docobj,frame(8,.84),pos*.37,.12,(0,0,0))
        obj=line(f'Evidence_Relationship_{i:02}',[pos,(pos.x*.2,pos.y*.2,0)],muted,c,g);appear(obj,frame(8,.3),delay=i*4)
    obj=box('Understanding_Crossbar',(2.5,.16,.2),red,c,g,pos=(0,-.6,.03));appear(obj,frame(8,.67))

def spatial_handoffs(cols,m):
    """Authored environments persist across chapter boundaries, sampled by scroll.
    This adds camera travel without changing the five project performances.
    Coordinates are in the existing front-facing Blender world (camera +Z).
    """
    c=cols['00_ENVIRONMENT']; dark,paper,doc,red,muted,warm=m
    cam=bpy.context.scene.camera
    # WHO -> BUILD: back through foreground ribs, then into the architecture.
    # BUILD -> THINK: orbit out through separating beams into negative space.
    # THINK -> LEAD: lateral travel following an illuminated path.
    # LEAD -> WORK: converge, then settle into the preserved project framing.
    poses=[(1,.72,(.1,.1,22.5),(0,0,0)),(1,.94,(-.8,.5,33),(1,-2,-1)),
           (2,.08,(.7,.15,27),(0,2,.4)),(2,.28,(-.3,.2,22),(0,0,-.7)),
           (2,.78,(-.3,.2,22),(0,0,-.7)),(2,.98,(3.4,.7,25),(1,7,-1)),
           (2,1.22,(1.4,.4,27),(0,3,0)),(2,1.72,(1.4,.4,27),(0,3,0)),
           (2,1.98,(-3.8,.1,24),(0,-6,.6)),(2,2.24,(-.5,0,22),(0,0,0)),
           (2,2.72,(-.5,0,22),(0,0,0)),(2,2.98,(.1,-.4,29),(0,0,0)),
           (3,.24,(.4,.15,22.7),(0,0,.3)),
           # WORK -> BEYOND: leave the workshop, pull up into the archive.
           (8,.8,(-.3,.3,21.65),(0,0,-1.5)),(8,.98,(.2,2.4,34),(-3,0,-.5)),
           (9,.13,(.3,3.8,29),(-5,0,0)),(9,.3,(.3,.12,23),(0,0,.3)),
           # BEYOND -> FUTURE: pass the archive; an open horizon lies beyond.
           (9,.74,(.3,.12,23),(0,0,.3)),(9,.98,(0,.8,17),(0,0,0)),
           (10,.16,(0,1,13),(0,0,0)),(10,.38,(0,1.1,12.5),(0,0,0)),
           (10,.7,(0,1.1,12.3),(0,0,0))]
    # Remove default camera keys only inside the authored handoff/quiet intervals.
    intervals=[(frame(1,.71),frame(2,.3)),(frame(2,.77),frame(3,.3)),
               (frame(8,.79),frame(9,.31)),(frame(9,.73),frame(10,.71))]
    for slot in cam.animation_data.action.slots:
        bag=action_get_channelbag_for_slot(cam.animation_data.action,slot)
        for curve in bag.fcurves:
            for k in list(curve.keyframe_points):
                if any(a<=k.co.x<=b for a,b in intervals):curve.keyframe_points.remove(k,fast=True)
    for st,p,pos,rot in poses:key(cam,frame(st,p),pos,rot=rot)
    # Architecture exists before arrival and breaks apart as reflection begins.
    for i in range(7):
        z=-10+i*3.6
        rib=line(f'Build_Rib_{i:02}',[(-4,-3,z),(-4,3,z),(5.8,3,z),(5.8,-3,z)],doc,c,width=.035)
        key(rib,1,(0,0,-35),.001)
        key(rib,frame(1,.67),(0,0,-10),.75)
        key(rib,frame(2,.2),(0,0,0),1)
        key(rib,frame(2,.74),(0,0,0),1)
        key(rib,frame(2,1.18),((i-3)*2.4,(i%2-.5)*2,-8),1,(0,(i-3)*9,0))
        key(rib,frame(2,1.75),((i-3)*3,0,-24),.8)
        key(rib,frame(3,.2),(0,0,-50),.001)
        # Frames in the periphery create near-field occlusion on the pull back.
    for i in range(5):
        z=-18+i*5
        path=line(f'Action_Path_{i:02}',[(-6,-2,z),(0,-1.2,z-4),(5,-1.2,z-9)],red,c,width=.023)
        key(path,1,scale=.001)
        key(path,frame(2,1.68),scale=.001)
        key(path,frame(2,2.14),scale=1)
        key(path,frame(2,2.78),scale=1)
        key(path,frame(3,.22),pos=(0,0,-8),scale=.001)
    # Workshop perimeter and stations stay visible during the upward departure.
    workshop=bpy.data.objects.new('Workshop_Surround',None);c.objects.link(workshop)
    for i in range(5):
        x=(i-2)*3.2
        line(f'Workshop_Station_{i}',[(x-1,-2,-5),(x+1,-2,-5),(x+1,1,-5),(x-1,1,-5),(x-1,-2,-5)],muted,c,workshop,width=.018)
        line(f'Workshop_Guide_{i}',[(x,-2,-5),(0,-3,9)],doc,c,workshop,width=.012)
    for st,p,pos,sc in [(0,0,(0,0,-40),.001),(2,2.72,(0,0,-15),.3),(3,.2,(0,0,0),1),(8,.78,(0,0,0),1),(9,.22,(0,-7,-12),.85),(9,.48,(0,-12,-25),.001)]:key(workshop,frame(st,p),pos,sc)
    # Physical archive silhouettes extend beyond the interactive HTML evidence.
    for i in range(9):
        side=-1 if i%2 else 1
        x=side*(5.8+(i%3)*1.4);y=(i%3-1)*3.2;z=-9+(i%4)*5
        obj=box(f'Archive_Sheet_{i:02}',(1.25,1.8,.045),doc,c,pos=(x,y,z))
        key(obj,1,(x,y,-35),.001)
        key(obj,frame(8,.83),(x,y,-22),.2,(0,side*18,side*4))
        key(obj,frame(9,.25),(x,y,z),1,(0,side*12,side*3))
        key(obj,frame(9,.72),(x-side*.25,y+.15,z+.4),1,(0,side*9,side*2))
        key(obj,frame(10,.16),(x*1.8,y*1.5,29),1,(0,side*22,side*4))
        key(obj,frame(10,.32),(x*2,y,35),.001)
    # Quiet, genuinely wider terrain; the camera advances while lines barely move.
    horizon=bpy.data.objects.new('Future_Horizon',None);c.objects.link(horizon)
    for i in range(5):
        z=-8-i*5
        line(f'Horizon_Contour_{i}',[(-45,-2.7,z),(-18,-2.2-i*.12,z),(0,-2.5,z),(20,-2.1,z),(45,-2.8,z)],warm if i==0 else doc,c,horizon,width=.018 if i==0 else .012)
    key(horizon,1,scale=.001);key(horizon,frame(9,.73),scale=.001)
    key(horizon,frame(10,.12),scale=1);key(horizon,frame(10,.88),scale=1)
    key(horizon,frame(11,.22),pos=(0,-4,-12),scale=.001)


def atmosphere(col):
    image=bpy.data.images.new('Generated_Soft_Ember',32,32,alpha=True)
    pixels=[]
    for y in range(32):
        for x in range(32):
            d=math.sqrt(((x-15.5)/15.5)**2+((y-15.5)/15.5)**2)
            a=max(0,1-d)**2.6
            pixels.extend([1,1,1,a])
    image.pixels=pixels;image.pack()
    mats=[]
    for name,power,opacity in [('Far',.65,.24),('Near',2.2,.8)]:
        mat=material('Ember_'+name,'c83e3b',power)
        mat.surface_render_method='BLENDED'
        shader=mat.node_tree.nodes.get('Principled BSDF')
        tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
        mul=mat.node_tree.nodes.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=opacity
        mat.node_tree.links.new(tex.outputs['Alpha'],mul.inputs[0]);mat.node_tree.links.new(mul.outputs[0],shader.inputs['Alpha'])
        mats.append(mat)
    for i in range(70):
        near=i>=54;size=R.uniform(.045,.085) if not near else R.uniform(.11,.21)
        obj=mesh(f'Ember_{"Near" if near else "Far"}_{i:02}',[(-size,-size,0),(size,-size,0),(size,size,0),(-size,size,0)],[(0,1,2,3)],mats[int(near)],col)
        uv=obj.data.uv_layers.new()
        for loop,co in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=co
        period=360 if near else 720;offset=R.randrange(period);x=R.uniform(-8,8);z=R.uniform(.4,2.4) if near else R.uniform(-6,-2);drift=R.uniform(-1,1)
        frames=set(range(1,722,8))|{721}
        for wrap in range(1+period-offset,722,period):frames.update([max(1,wrap-1),wrap])
        for f in sorted(frames):
            t=((f-1+offset)%period)/period
            envelope=math.sin(math.pi*t)**1.4
            key(obj,f,(x+drift*t+.2*math.sin(t*math.tau+i),-5+t*10,z+math.sin(t*math.tau)*.25),envelope*(.9+.1*math.sin(f*.13+i)))
        for slot in obj.animation_data.action.slots:
            bag=action_get_channelbag_for_slot(obj.animation_data.action,slot)
            if bag:
                for curve in bag.fcurves:curve.modifiers.new('CYCLES')

def soften():
    for action in bpy.data.actions:
        for slot in action.slots:
            bag=action_get_channelbag_for_slot(action,slot)
            if bag:
                for curve in bag.fcurves:
                    for k in curve.keyframe_points:
                        k.interpolation='BEZIER';k.handle_left_type='AUTO_CLAMPED';k.handle_right_type='AUTO_CLAMPED'

def generate():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene;scene.name='AURA_QUICK_DISCOVERY_MASTER'
    cols={}
    for name in COLLECTIONS:
        col=bpy.data.collections.new(name);scene.collection.children.link(col);cols[name]=col
    m=[material('Graphite','363033',.03,.48),material('Warm_Paper','c5b9a8',.18),material('Document_Edge','665c57',.1,.25),material('Crimson','c0182a',1.15,.2),material('Muted_Line','766860',.3),material('Warm_Highlight','e2dbd0',.7)]
    camera_and_lights(cols);continuity(cols['02_CONTINUITY_OBJECT'],m[3]);projects(cols,m);spatial_handoffs(cols,m);atmosphere(cols['01_ATMOSPHERE'])
    for i in range(10):
        side=-1 if i%2 else 1;x=side*R.uniform(6.7,9.5);y=R.uniform(-4,4);z=R.uniform(-10,-6)
        obj=mesh(f'Peripheral_Facet_{i:02}',[(-.6,-3,0),(.5,-2,.3),(.2,2.7,0),(-.45,3,-.4),(-.7,.3,.5)],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],m[0],cols['00_ENVIRONMENT'])
        for s in range(13):key(obj, min(END,frame(s)),(x+math.sin(s*.8+i)*.35,y+math.cos(s*.5+i)*.2,z),(1,1,1),(0,side*12,s*.6+side*8))
    soften()
    scene.world=bpy.data.worlds.new('AURA_Obsidian');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(*rgb('06060a'),1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.3
    scene.render.engine='BLENDER_EEVEE';scene.render.fps=FPS;scene.frame_start=1;scene.frame_end=END
    scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX'
    for i,name in enumerate(LEGACY_STAGES):
        for p,label in [(0,'ARRIVE'),(.2,'REVEAL'),(.4,'TRANSFORM'),(.64,'RESOLVE'),(.78,'HANDOFF')]:scene.timeline_markers.new(name.upper()+' / '+label,frame=frame(i,p))
    text=bpy.data.texts.new('READ_ME')
    text.write('AURA Quick Discovery\n14 stages x 240 frames at 30fps.\nScrub markers or play. Typography remains accessible HTML.\nProject geometry, camera transforms and continuity morphs are real animation.\nEmbers loop independently in browser. Point-light energy curves export to JSON.\nAll demonstration counts/graphs are illustrative, not user performance data.\nGenerate and export commands are in create-master.py.\n')
    scene['stage_order']=','.join(STAGES)
    scene.frame_set(1)
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.region_3d.view_perspective='CAMERA'
                # Solid material colors keep inspection independent of GPU-driver
                # material-preview compilation. Render/export materials are intact.
                area.spaces.active.shading.type='SOLID'
                area.spaces.active.shading.color_type='MATERIAL'
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER),compress=True)
    print('MASTER_READY',MASTER,'objects',len(scene.objects),'actions',len(bpy.data.actions))

def export():
    bpy.ops.wm.open_mainfile(filepath=str(MASTER))
    scene=bpy.context.scene;OUT.mkdir(parents=True,exist_ok=True)
    lights={obj.name:[] for obj in scene.objects if obj.type=='LIGHT'}
    for f in range(1,END+1,8):
        scene.frame_set(f)
        for name,samples in lights.items():samples.append(round(bpy.data.objects[name].data.energy,5))
    for name,atmos in [('quick-world',False),('quick-embers',True)]:
        scene.frame_set(1);scene.frame_end=721 if atmos else END
        bpy.ops.object.select_all(action='DESELECT')
        for obj in scene.objects:
            if obj.name.startswith('Ember_') == atmos:obj.select_set(True)
        bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=True,export_animation_mode='SCENE',export_anim_scene_split_object=False,export_force_sampling=True,export_frame_step=4,export_frame_range=True,export_cameras=not atmos,export_lights=not atmos,export_morph=True,export_morph_animation=True,export_extras=True,check_existing=False)
    report={'source':str(MASTER),'sourceSHA256':hashlib.sha256(MASTER.read_bytes()).hexdigest(),'blender':bpy.app.version_string,'fps':FPS,'stride':STRIDE,'duration':(END-1)/FPS,'stages':STAGES,'collections':COLLECTIONS,'objects':len(scene.objects),'actions':len(bpy.data.actions),'lightingSampleFrames':8,'lighting':lights,'assets':{p.name:p.stat().st_size for p in OUT.glob('*.glb')}}
    (OUT/'motion-manifest.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k!='lighting'},indent=2))

if __name__=='__main__':
    export() if '--export' in sys.argv else generate()
