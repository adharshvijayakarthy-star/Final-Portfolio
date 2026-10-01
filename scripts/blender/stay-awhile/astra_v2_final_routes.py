"""In-place art pass for the Work, Future, AURA and Contact masters.

This opens the authored masters. It preserves asset roots, animation pivots,
actions, library collections, guide objects, names and route layouts.
"""
import bpy
import json
import math
import random
import sys
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from beautify_first_four import Sculpt, clear_meshes, original_parent, setup_materials, tune_light
from geometry import B
from bpy_extras.anim_utils import action_get_channelbag_for_slot


def timber_frame(a, center, width, height, depth, foot=True):
    x, y, z = center
    for xx in (x - width / 2, x + width / 2):
        for zz in (z - depth / 2, z + depth / 2):
            a.box((xx, y + height / 2, zz), (.13, height, .13), 'BARK', tone=.78)
            if foot:
                a.stone((xx, y - .09, zz), (.22, .17, .22), 'STONE', seed=int((xx+10)*20+zz))
    for yy in (y + .16, y + height - .09):
        for zz in (z - depth / 2, z + depth / 2):
            a.box((x, yy, zz), (width + .12, .09, .12), 'BARK', tone=.82)
    for xx in (x - width / 2, x + width / 2):
        a.box((xx, y + height - .09, z), (.11, .1, depth + .13), 'BARK', tone=.76)


def work_pavilion(a):
    # Six structural cross frames: the open aisle retains the locked clear width.
    for index, z in enumerate((12, 7, 2, -3, -8, -14)):
        for x in (-4.3, 4.3):
            a.stone((x, -.11, z), (.36, .23, .36), 'STONE', seed=index*7+int(x))
            a.box((x, 2.0, z), (.21, 4.0, .21), 'BARK', tone=.71 + .03 * (index % 3))
            a.box((x, 3.77, z), (.34, .36, .29), 'BARK', tone=.82)
        a.box((0, 4.08, z), (8.95, .22, .27), 'BARK', tone=.77)
        for x in (-3.25, 3.25):
            a.tube([(x, 4.0, z), (x + (-.88 if x < 0 else .88), 3.22, z)],
                   [.13, .035], 'BARK', sides=4 if a.low else 6, seed=index+31)
    for x in (-4.32, 4.32):
        for y in (2.65, 4.16):
            a.box((x, y, -1), (.12, .12, 27.0), 'BARK', tone=.72)
    for i in range(6 if a.low else 11):
        x = -3.7 + i * (7.4 / (5 if a.low else 10))
        a.box((x, 4.18, -1), (.10, .10, 27.0), 'BARK', tone=.78)
    # A narrow perimeter shelf and archive niches make the pavilion a gallery.
    for side in (-1, 1):
        for z in (9.6, 4.6, -.4, -5.4, -10.4):
            x = side * 3.98
            a.box((x, 1.38, z), (.51, .08, 2.4), 'BARK', tone=.67)
            a.box((x, 1.9, z), (.1, 1.1, .1), 'BARK', tone=.64)
            if not a.low:
                for n in range(4):
                    a.box((x-side*.15, 1.48, z-.84+n*.45),
                          (.23, .18+.03*(n%2), .07), 'BARK', tone=.8)


def work_planner(a):
    for x in (-1.12, 1.12):
        for z in (-.54, .54):
            a.box((x, .47, z), (.10, .94, .11), 'BARK', tone=.73)
    a.box((0, .95, 0), (2.57, .12, 1.35), 'BARK', tone=.83)
    a.box((0, 1.018, 0), (2.35, .019, 1.15), 'PAPER', tone=.8)
    for n in range(6):
        a.box((-1.16+n*.465, 1.03, 0), (.012, .01, 1.14), 'ACCENT', tone=.53)
    for n in range(4):
        a.box((0, 1.03, -.55+n*.37), (2.34, .01, .012), 'ACCENT', tone=.53)
    for i in range(12):
        p = original_parent('W02', a.lod, 'TILE', i)
        a.box((0, .011, 0), (.40, .042, .32), 'PAPER', p, tone=.87+.01*(i%3))
        if i % 4 == 0:
            a.box((0, .035, -.1), (.27, .007, .012), 'PAPER', p, tone=.64)
    p = original_parent('W02', a.lod, 'BREAK', 0)
    a.box((0, .01, 0), (.4, .042, .32), 'ACCENT', p, tone=.87)


def work_logger(a):
    for x in (-1.12, 1.12):
        for z in (-.51, .51):
            a.box((x, .44, z), (.09, .88, .1), 'BARK', tone=.72)
    a.box((0, .91, 0), (2.6, .11, 1.26), 'BARK', tone=.79)
    # Raised slanted folio rails create a different silhouette from the planner.
    for x in (-1.14, 1.14):
        a.tube([(x, .99, -.48), (x, 1.49, .32)], [.06, .06], 'BARK', sides=4, seed=12+int(x*10))
    a.box((0, 1.52, .32), (2.38, .07, .08), 'BARK', tone=.82)
    a.box((0, 1.06, -.47), (2.38, .06, .08), 'BARK', tone=.73)
    for i in range(3):
        p = original_parent('W03', a.lod, 'PAPER', i)
        a.box((0, .002, 0), (.62, .019, .54), 'PAPER', p, tone=.9)
        a.box((0, .012, .19), (.39, .004, .009), 'PAPER', p, tone=.66)


def work_mun(a):
    for x in (-1.25, 1.25):
        a.box((x, .72, -.42), (.12, 1.44, .13), 'BARK', tone=.71)
        a.stone((x, -.12, -.42), (.19, .19, .19), 'STONE', seed=42+int(x*10))
    a.box((0, 1.47, -.42), (2.76, .11, .12), 'BARK', tone=.77)
    a.box((0, .25, -.42), (2.72, .08, .12), 'BARK', tone=.73)
    for i in range(3):
        p = original_parent('W04', a.lod, 'PANEL', i)
        a.box((0, .38, 0), (.75, .82, .035), 'PAPER', p, tone=.92)
        a.box((0, .38, -.018), (.81, .88, .018), 'BARK', p, tone=.66)
    for i in range(5):
        angle = math.pi*.1+i*math.pi*.2
        x, z = math.cos(angle)*1.2, math.sin(angle)*.75
        a.stone((x, -.08, z), (.2, .16, .2), 'STONE', seed=i+82)
        a.box((x, .21, z), (.18, .41, .18), 'BARK', tone=.71)
    p = original_parent('W04', a.lod, 'CYCLE', 0)
    a.box((0, .008, 0), (.18, .018, .18), 'PAPER', p, tone=.82)


def work_snrled(a):
    # A single dark terminal form with a recessed warm display.
    a.box((0, .67, 0), (2.38, 1.34, 1.15), 'METAL', tone=.87)
    a.box((0, 1.34, -.15), (2.2, .09, .85), 'METAL', tone=.7)
    a.box((0, 1.387, -.15), (1.89, .012, .68), 'LIGHT', tone=.72)
    for i in range(3):
        x = -.62+i*.62
        a.box((x, 1.397, -.12), (.47, .008, .44), 'METAL', tone=.64)
        a.box((x, 1.408, .19), (.34, .008, .03), 'ACCENT', tone=.8)
    for x in (-1.0, 1.0):
        a.box((x, .59, -.583), (.035, .94, .012), 'ACCENT', tone=.62)
    p=original_parent('W05', a.lod, 'RECEIPT', 0)
    a.box((0, .014, 0), (.34, .022, .41), 'PAPER', p, tone=.88)


def work_aura(a):
    for x in (-1.22, 1.22):
        a.box((x, .91, 0), (.12, 1.82, 1.17), 'BARK', tone=.7)
    for y in (.09, 1.8):
        a.box((0, y, 0), (2.59, .12, 1.18), 'BARK', tone=.78)
    a.box((0, .91, -.56), (2.4, 1.7, .08), 'BARK', tone=.66)
    for i in range(5):
        y=.28+i*.3
        a.box((0, y, 0), (2.37, .055, 1.14), 'BARK', tone=.78)
        a.box((0, y+.036, .52), (2.34, .028, .035), 'BARK', tone=.62)
        p=original_parent('W06', a.lod, 'SHEET', i)
        a.box((0, .005, 0), (2.13, .018, .78), 'PAPER', p, tone=.92)
        a.box((0, .016, -.26), (1.72, .006, .025), 'PAPER', p, tone=.7)
    for side in (-1,1):
        for y in (.46,1.36):
            a.box((side*1.27, y, .1), (.035,.21,.23), 'ACCENT', tone=.68)


def future_tree(a, x, z, height, lean, seed):
    rng=random.Random(seed)
    base=Vector((x,0,z))
    top=base+Vector((lean,height*.71,-.22))
    a.tube([base+Vector((0,-.06,0)),base+Vector((lean*.15,height*.22,0)),
            base+Vector((lean*.64,height*.5,-.1)),top],
           [.34,.27,.17,.025],'BARK',seed=seed)
    for branch in range(3 if a.low else 5):
        theta=branch*2.399+seed*.17
        spread=1.1+.35*(branch%2)
        start=base+Vector((lean*.4,height*(.42+.06*branch),-.05))
        tip=start+Vector((math.cos(theta)*spread,.55+.13*branch,math.sin(theta)*spread*.7))
        a.tube([start,start.lerp(tip,.55)+Vector((0,.15,0)),tip],
               [.13,.07,.01],'BARK',seed=seed+branch)
        for lobe in range(2 if a.low else 3):
            dx=rng.uniform(-.45,.45); dz=rng.uniform(-.38,.38)
            c=tip+Vector((dx,rng.uniform(-.17,.27),dz))
            a.crown(c,(.83,.58,.72),'LEAF',seed=seed*10+branch*3+lobe,
                    sides=5 if a.low else 7)


def future_canopy(a):
    for side in (-1,1):
        for index,z in enumerate((0,-5,-10)):
            x=side*(4.9+index*.62)+(.2 if side<0 else -.1)
            future_tree(a,x,z,7.0+.62*((index+int(side>0))%3),
                        side*(.25+.17*index),100+index*10+int(side>0))


def future_path(a):
    # Continuously widening aggregate ribbon; faceted borders soften into moss.
    rng=random.Random(75)
    stations=11 if a.low else 31
    for i in range(stations):
        t0=i/stations; t1=(i+1)/stations
        z0=2-17*t0; z1=2-17*t1
        w0=1.2+1.8*t0; w1=1.2+1.8*t1
        c0=.08*math.sin(i*.7); c1=.08*math.sin((i+1)*.7)
        vertices=[(-w0+c0,-.026,z0),(w0+c0,-.026,z0),
                  (w1+c1,-.026,z1),(-w1+c1,-.026,z1)]
        fade=1-.45*max(0,(t0-.69)/.31)
        tones=[(fade,fade*.97,fade*.89,1)]*4
        a.add(vertices,[(0,1,2,3)],'STONE',tones=tones)
        if i < (5 if a.low else 19):
            for side in (-1,1):
                if i%2==0:
                    x=side*(w0+.32+rng.uniform(0,.3))
                    a.stone((x,-.08,z0-.22),(.18,.09,.16),'MOSS',seed=200+i*3+side,sides=5)


def future_marker(a):
    a.stone((0,-.07,0),(.37,.13,.29),'STONE',seed=208,sides=6 if a.low else 9)
    a.stone((0,.07,0),(.31,1.73,.23),'STONE',seed=211,sides=6 if a.low else 9)
    # A thin socket line gives scale without turning it into a trophy.
    a.box((0,1.32,-.24),(.045,.11,.013),'ACCENT',tone=.56)


def aura_frame(a):
    for i in range(9):
        p=original_parent('A01',a.lod,'BAY',i)
        for z in (-.74,.74):
            a.stone((0,-.1,z),(.33,.16,.27),'STONE',p,seed=310+i*4+int(z*10),sides=5)
            a.box((0,2.45,z),(.16,4.9,.17),'BARK',p,tone=.75)
            a.box((0,3.94,z),(.28,.35,.28),'BARK',p,tone=.83)
        for y in (.28,1.57,3.03,4.86):
            a.box((0,y,0),(.8,.11,1.68),'BARK',p,tone=.78)
            if y < 4.5:
                a.box((0,y+.069,-.48),(.58,.012,.61),'BARK',p,tone=.62)
        if not a.low:
            for y in (1.57,3.03):
                for z in (-.63,.63):
                    a.box((0,y+.12,z),(.06,.19,.055),'BARK',p,tone=.68)
        a.box((0,4.9,0),(.22,.16,1.73),'BARK',p,tone=.67)


def aura_documents(a):
    for i in range(9):
        p=original_parent('A02',a.lod,'DOCUMENT',i)
        width=.6-.045*(i%3==1)
        a.box((0,.425,0),(width,.85,.011),'PAPER',p,tone=.92+.01*(i%3))
        if i%3==0:
            a.box((width*.42,.8,.013),(.09,.09,.008),'PAPER',p,tone=.72)
        if i%3==1:
            a.box((-width*.38,.43,.014),(.034,.67,.008),'PAPER',p,tone=.75)
        for j in range(3):
            yy=.23+j*.18
            length=.39-.05*((j+i)%3)
            a.box((-.06,yy,.014),(length,.013,.006),'PAPER',p,tone=.69+.04*j)
        a.box((0,.81,.018),(.04,.04,.012),'PAPER',p,tone=.65)


def aura_filaments(a):
    # Existing STRAND nodes define the twelve stable relation IDs.
    from models import DOC_POS
    edges=[(i,i+1) for i in range(8)]+[(0,3),(2,5),(4,7),(6,8)]
    for i,(start,end) in enumerate(edges):
        p=original_parent('A03',a.lod,'STRAND',i)
        s,e=Vector(DOC_POS[start]),Vector(DOC_POS[end])
        pts=[]
        for j in range(5 if a.low else 8):
            t=j/(4 if a.low else 7)
            pt=s.lerp(e,t)+Vector((0,.16*math.sin(math.pi*t),0))
            pts.append(pt)
        a.tube(pts,[.012]*len(pts),'ACCENT',p,sides=4 if a.low else 5,seed=91+i)
        if not a.low:
            for pt in (s,e):
                a.stone(pt+Vector((0,-.047,0)),(.055,.07,.055),'ACCENT',p,
                        seed=470+i,sides=5)
    if a.low:
        for pt in DOC_POS:
            a.box((pt[0],pt[1],pt[2]),(.08,.05,.08),'ACCENT',tone=.68)


def aura_spine(a):
    a.stone((0,-.11,0),(.43,.23,.36),'BARK',seed=620,sides=6)
    a.box((0,2.05,0),(.2,4.1,.22),'BARK',tone=.62)
    for i in range(5):
        p=original_parent('A04',a.lod,'SHELF',i)
        a.box((0,0,0),(3.42,.1,.51),'BARK',p,tone=.74)
        for x in (-1.63,1.63):
            a.box((x,-.08,0),(.07,.16,.08),'BARK',p,tone=.64)
        a.box((0,.055,0),(.64,.015,.31),'ACCENT',p,tone=.65)
        a.box((0,.078,-.1),(.11,.045,.05),'ACCENT',p,tone=.76)


def contact_ground(a):
    rng=random.Random(109)
    # Shared terrain provides the continuous floor. The Contact-owned kit is
    # a barely perceptible perimeter planting; a separate disk made a hard
    # circular seam and competed with the quiet exit composition.
    count=14 if a.low else 36
    for i in range(count):
        theta=2*math.pi*i/count
        radius=9.1+.25*math.sin(theta*5)
        x=math.cos(theta)*radius
        z=math.sin(theta)*radius
        if abs(x)<1.3 and z < -5:
            continue
        for blade in range(2 if a.low else 4):
            bend=theta+(blade-1)*.4
            start=(x+rng.uniform(-.08,.08),-.06,z+rng.uniform(-.07,.07))
            end=(start[0]+.14*math.cos(bend),.16+.1*rng.random(),
                 start[2]+.14*math.sin(bend))
            a.leaf(start,end,.044 if a.low else .052,'MOSS',tone=.79+.15*rng.random(),
                   seed=i*5+blade)


def contact_stone(a):
    a.stone((0,-.11,0),(.62,.42,.43),'STONE',seed=455,
            sides=9 if a.low else 18)


ART={
    'work':('06-work.blend',[('W01',work_pavilion),('W02',work_planner),
        ('W03',work_logger),('W04',work_mun),('W05',work_snrled),('W06',work_aura)]),
    'future':('07-future.blend',[('F01',future_canopy),('F02',future_path),('F03',future_marker)]),
    'aura':('08-aura.blend',[('A01',aura_frame),('A02',aura_documents),
        ('A03',aura_filaments),('A04',aura_spine)]),
    'contact':('09-contact.blend',[('C01',contact_ground),('C02',contact_stone)]),
}


def lift_aura_shelf_start():
    # The original first AURA shelf began 5 cm below its root. At frame one
    # it intersected the garden floor and produced a black rectangular bar.
    # Lift only its start key; the final socket pose and 3 s clip stay intact.
    for lod in ('desktop','mobile'):
        shelf=original_parent('A04',lod,'SHELF',0)
        strip=shelf.animation_data.nla_tracks[0].strips[0]
        bag=action_get_channelbag_for_slot(strip.action,strip.action_slot)
        for curve in bag.fcurves:
            if curve.data_path!='location' or curve.array_index!=2:
                continue
            for key in curve.keyframe_points:
                if abs(key.co.x-1)<.01:
                    key.co.y=.15
                    key.handle_left.y=.15
                    key.handle_right.y=.15
            curve.update()


def save_route(route):
    source,definitions=ART[route]
    path=HERE/source
    bpy.ops.wm.open_mainfile(filepath=str(path),load_ui=False)
    setup_materials(); tune_light(route)
    scene=bpy.context.scene
    if route=='work':
        scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.68,.75,.72,1)
        scene.world.node_tree.nodes['Background'].inputs[1].default_value=.82
    elif route=='future':
        scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.73,.83,.82,1)
        scene.world.node_tree.nodes['Background'].inputs[1].default_value=.9
    elif route=='aura':
        scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.58,.65,.63,1)
        scene.world.node_tree.nodes['Background'].inputs[1].default_value=.8
        fill=bpy.data.objects.get('SA_AURA_FILL_00')
        if fill is None:
            data=bpy.data.lights.new('SA_AURA_FILL','AREA')
            fill=bpy.data.objects.new('SA_AURA_FILL_00',data)
            bpy.data.collections['07_LIGHT_GUIDES'].objects.link(fill)
        fill.location=B((2.0,8.0,-5.5))
        fill.rotation_euler=(Vector(B((0,1.3,-7)))-fill.location).to_track_quat('-Z','Y').to_euler()
        fill.data.energy=460
        fill.data.shape='DISK'
        fill.data.size=8.0
        fill.data.color=(.82,.9,1.0)
    for aid,author in definitions:
        for lod in ('desktop','mobile'):
            clear_meshes(aid,lod)
            sculpt=Sculpt(aid,lod)
            author(sculpt)
            sculpt.flush()
            if aid == 'C01':
                for obj in sculpt.col.objects:
                    if obj.type == 'MESH' and not obj.library:
                        obj.visible_shadow = False
            print('ASTRA_ROUTE_ASSET',route,aid,lod,flush=True)
    if route=='aura':
        lift_aura_shelf_start()
    info=json.loads(bpy.data.texts['READ_ME'].as_string())
    note='2026-09-25 Astra v2: in-place physical asset refinement, shaped silhouettes and camera-checked materials. No third-party models or private text.'
    if note not in info['artistNotes']:
        info['artistNotes'].append(note)
    txt=bpy.data.texts['READ_ME']; txt.clear(); txt.write(json.dumps(info,indent=2))
    scene['astraVersion']=2
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)
    print('ASTRA_ROUTE_SAVED',route,flush=True)


if __name__=='__main__':
    only=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ART.keys()
    for route in only: save_route(route)
