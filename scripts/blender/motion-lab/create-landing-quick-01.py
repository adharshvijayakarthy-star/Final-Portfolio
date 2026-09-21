"""AURA Motion Lab 01 — isolated, deterministic Blender 5.2 motion study.

Run in a separate Blender process (recommended):
  blender --background --factory-startup --python <this file> -- --stills
  blender <generated .blend> --background --python <this file> -- --render-only

No portfolio imports, no GLB export, no modification of the successful POC.
All choreography is stored as editable native keys; no playback handlers.
"""
from pathlib import Path
import argparse
import json
import math
import sys

import bpy
from mathutils import Vector, Matrix
from bpy_extras.anim_utils import action_get_channelbag_for_slot

ROOT = Path(r"C:\Users\Adharsh Vijayakarthy\Desktop\Code\Final_Portfolio")
OUT = ROOT / ".aura-work" / "blender-poc" / "motion-lab-01"
SCENE = "AURA_MOTION_LAB_01"
FPS, END = 30, 300
FRAMES = [1, 37, 55, 79, 103, 127, 151, 175, 199, 223, 247, 271, 300]
STAGES = ["A | Landing", "Anticipation", "Release", "Primary travel", "Secondary response",
          "Spatial reorganization", "Depth crossing", "Quick takes shape", "Hierarchy emerges",
          "Final alignment", "Settling", "C | Quick Discovery", "End hold"]
COLORS = {"ink": (0.008, 0.009, 0.014), "paper": (0.82, 0.81, 0.77),
          "muted": (0.29, 0.31, 0.35), "red": (0.74, 0.025, 0.065),
          "purple": (0.34, 0.10, 0.72), "rail": (0.045, 0.05, 0.068)}


def material(name, color):
    mat = bpy.data.materials.new("LAB01 / " + name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeEmission")
    shader.inputs["Color"].default_value = (*color, 1)
    shader.inputs["Strength"].default_value = 1
    mat.node_tree.links.new(shader.outputs[0], output.inputs["Surface"])
    return mat


def link(scene, name, data, mat=None):
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    if mat:
        data.materials.append(mat)
        obj.color = mat.diffuse_color
    return obj


def text(scene, name, body, size, mat, location, align="LEFT"):
    data = bpy.data.curves.new(name, "FONT")
    data.body, data.size, data.align_x = body, size, align
    data.space_character = 1.08
    data.resolution_u = 8
    obj = link(scene, name, data, mat)
    obj.location = location
    return obj


def rectangle(scene, name, width, height, mat, location):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(-width/2,-height/2,0),(width/2,-height/2,0),(width/2,height/2,0),(-width/2,height/2,0)], [], [(0,1,2,3)])
    obj = link(scene, name, mesh, mat)
    obj.location = location
    return obj


def path(scene, name, points, radius, mat):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.bevel_depth, data.bevel_resolution = radius, 2
    spline = data.splines.new("POLY")
    spline.points.add(len(points)-1)
    for point, co in zip(spline.points, points): point.co = (*co, 1)
    return link(scene, name, data, mat)


def keyed(obj, rows):
    """Rows: frame, xyz, uniform scale, xyz rotation in degrees."""
    for frame, location, scale, rotation in rows:
        obj.location = location
        obj.scale = (scale,) * 3
        obj.rotation_euler = tuple(math.radians(v) for v in rotation)
        for prop in ["location", "scale", "rotation_euler"]: obj.keyframe_insert(prop, frame=frame)


def smooth_keys():
    # Blender 5.x uses slotted actions; the removed action.fcurves API is not used.
    for action in bpy.data.actions:
        for slot in action.slots:
            bag = action_get_channelbag_for_slot(action, slot)
            if not bag: continue
            for curve in bag.fcurves:
                for key in curve.keyframe_points:
                    key.interpolation = "BEZIER"
                    key.handle_left_type = key.handle_right_type = "AUTO_CLAMPED"


def make_scene():
    # Only a newly named lab scene is authored. Never clear another open scene.
    scene = bpy.data.scenes.new(SCENE)
    bpy.context.window.scene = scene
    mats = {name: material(name, color) for name, color in COLORS.items()}
    scene.frame_start, scene.frame_end, scene.render.fps = 1, END, FPS
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 16
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    scene.render.resolution_percentage = 100
    scene.render.use_motion_blur = True
    scene.render.motion_blur_shutter = 0.32
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.world = bpy.data.worlds.new("LAB01 / charcoal world")
    scene.world.color = COLORS["ink"]
    scene["purpose"] = "Motion study only. Persistent typography + transforming path. No production assets."
    scene["timing"] = "30fps / 300 frames / 10 seconds. A:1–36. Transition:37–270. C:271–300."
    for frame, label in zip(FRAMES, STAGES): scene.timeline_markers.new(label, frame=frame)

    camera = link(scene, "00 CAMERA / lateral arc + depth + roll", bpy.data.cameras.new("LAB01 Camera"))
    camera.data.lens = 50
    camera.data.clip_end = 150
    scene.camera = camera
    camera_keys = [
        (1,(0,0,22.22),(0,0,0),0),(37,(0,0,22.22),(0,0,0),0),
        (55,(-.10,-.05,22.38),(-.02,0,0),-.2),(79,(-.62,.12,21.9),(-.13,.04,0),-1.2),
        (103,(-.35,.36,21.05),(.05,.1,0),-2.2),(127,(.45,.5,20.6),(.27,.15,0),-1.0),
        (151,(1.0,.36,20.95),(.3,.12,0),.7),(175,(.8,.18,21.55),(.24,.06,0),.8),
        (199,(.35,.02,22.5),(.12,0,0),.2),(223,(.12,-.04,22.38),(.03,0,0),-.12),
        (247,(.02,0,22.24),(0,0,0),.03),(271,(0,0,22.22),(0,0,0),0),(300,(0,0,22.22),(0,0,0),0)]
    for frame, position, target, roll in camera_keys:
        camera.location = position
        # Explicit page-up vector avoids the track quaternion's roll singularity
        # when a camera looks almost straight down world Z at a 2D composition.
        forward = (Vector(target)-camera.location).normalized()
        right = forward.cross(Vector((0,1,0))).normalized()
        up = right.cross(forward).normalized()
        camera.rotation_euler = Matrix((right,up,-forward)).transposed().to_euler()
        camera.rotation_euler.z += math.radians(roll)
        camera.keyframe_insert("location",frame=frame); camera.keyframe_insert("rotation_euler",frame=frame)
    light = link(scene, "LAB / soft area light", bpy.data.lights.new("LAB softbox", "AREA"))
    light.location = (1, 3, 8); light.data.energy = 250; light.data.size = 8
    rectangle(scene,"ENV / uninterrupted charcoal ground",70,40,mats["ink"],(0,0,-4))

    # Persistent wordmark; deliberately plain typography, not a final identity.
    text(scene,"IDENTITY / AURA placeholder","AURA",.24,mats["paper"],(-6.7,3.58,.4))
    text(scene,"LAB / edition","MOTION LAB  /  01",.12,mats["muted"],(6.65,3.62,.4),"RIGHT")
    text(scene,"LAB / footer","LANDING  >  QUICK DISCOVERY     /     MOTION STUDY",.105,mats["muted"],(-6.7,-3.72,.4))
    text(scene,"LAB / note","PLACEHOLDER TYPE + GEOMETRY",.105,mats["muted"],(6.65,-3.72,.4),"RIGHT")

    name = text(scene,"01 IDENTITY / persistent name","ADHARSH",.88,mats["paper"],(-3.55,.70,.30))
    keyed(name,[
        (1,(-3.55,.70,.30),1,(0,0,0)),(37,(-3.55,.70,.30),1,(0,0,0)),
        (55,(-3.60,.68,.28),.985,(0,0,-.3)),(79,(-3.76,.87,.48),1.03,(0,-4,1.0)),
        (103,(-4.10,1.35,.78),.91,(0,-6,2)),(127,(-4.78,1.94,.42),.68,(0,-3,1.3)),
        (151,(-5.28,2.40,.12),.43,(0,2,-.7)),(175,(-5.58,2.65,.2),.32,(0,1,-.5)),
        (199,(-5.53,2.61,.25),.335,(0,0,.15)),(223,(-5.50,2.60,.25),.33,(0,0,0)),
        (247,(-5.50,2.60,.25),.33,(0,0,0)),(271,(-5.50,2.60,.25),.33,(0,0,0)),(300,(-5.50,2.60,.25),.33,(0,0,0))])
    surname = text(scene,"02 IDENTITY / surname","VIJAYAKARTHY",.30,mats["muted"],(-3.50,.27,.28))
    keyed(surname,[(f,(x,y-.43*s,z-.01),s,(0,ry,rz)) for f,(x,y,z),s,(_,ry,rz) in [
        (1,(-3.5,.70,.3),1,(0,0,0)),(45,(-3.5,.70,.3),1,(0,0,0)),
        (79,(-3.7,.88,.25),1.03,(0,-3,1)),(103,(-3.97,1.35,.6),.94,(0,-5,2)),
        (127,(-4.63,1.95,.3),.80,(0,-2,1)),(151,(-5.24,2.42,.15),.71,(0,2,-.5)),
        (175,(-5.57,2.65,.24),.64,(0,0,-.3)),(199,(-5.52,2.61,.25),.66,(0,0,.1)),
        (223,(-5.5,2.60,.25),.65,(0,0,0)),(271,(-5.5,2.60,.25),.65,(0,0,0)),(300,(-5.5,2.60,.25),.65,(0,0,0))]])
    intro = text(scene,"03 COPY / persistent introduction","I build software and experiment with intelligent systems.",.16,mats["muted"],(-3.5,-.10,.22))
    keyed(intro,[(1,(-3.5,-.10,.22),1,(0,0,0)),(55,(-3.5,-.10,.22),1,(0,0,0)),
        (85,(-3.10,-.32,-.05),1,(0,4,1)),(115,(-1.9,-1.1,-.5),.98,(0,8,2)),
        (145,(-2.7,-2.4,-.4),1,(0,5,-1)),(175,(-4.8,-2.55,.05),1,(0,1,-.5)),
        (205,(-5.58,-2.26,.22),1,(0,0,0)),(239,(-5.5,-2.30,.22),1,(0,0,0)),(271,(-5.5,-2.30,.22),1,(0,0,0)),(300,(-5.5,-2.30,.22),1,(0,0,0))])

    # Same three small landing labels become Quick's large stacked hierarchy.
    for i, (body, x) in enumerate([("RESEARCHER.",-3.5),("BUILDER.",-1.8),("LEADER.",-.5)]):
        role = text(scene,f"04 ROLE {i+1} / {body}",body,.72,mats["paper"],(x,-.63,.35))
        d = i*7; finalY = 1.0 - i*.93
        keyed(role,[(1,(x,-.63,.35),.22,(0,0,0)),(55+d,(x,-.63,.35),.22,(0,0,0)),
            (79+d,(x+.18,-.53+i*.12,.65+i*.14),.28,(0,-8,2-i)),
            (103+d,(-2.6+i*2.05,.22-i*.72,1.05-i*.18),.46,(0,-12+i*6,5-i*3)),
            (127+d,(-3.20+i*1.25,.6-i*.85,.72-i*.3),.68,(0,9-i*4,2-i*2)),
            (151+d,(-4.15+i*.5,finalY-.20,.4-i*.12),.89,(0,4,-1)),
            (175+d,(-5.18+i*.12,finalY+.08,.32),1.02,(0,-1,.6)),
            (207+d,(-5.57,finalY-.025,.32),1.008,(0,0,-.2)),
            (239+d,(-5.50,finalY,.32),1,(0,0,0)),(271,(-5.50,finalY,.32),1,(0,0,0)),(300,(-5.50,finalY,.32),1,(0,0,0))])

    entry = text(scene,"05 ENTRY / label becomes breadcrumb","QUICK DISCOVERY",.16,mats["paper"],(-.98,-1.61,.42))
    keyed(entry,[(1,(-.98,-1.61,.42),1,(0,0,0)),(37,(-.98,-1.61,.42),1,(0,0,0)),
        (55,(-1.02,-1.65,.42),.96,(0,0,0)),(79,(-.82,-1.26,.7),1,(0,-8,4)),
        (103,(.55,-.3,.8),1,(0,5,8)),(127,(.2,1.35,.5),1,(0,9,3)),
        (151,(-2.5,2.55,.35),1,(0,2,-1)),(175,(-5.55,3.04,.4),1,(0,0,-.5)),
        (211,(-5.50,3.0,.4),1,(0,0,0)),(247,(-5.50,3.0,.4),1,(0,0,0)),(300,(-5.50,3.0,.4),1,(0,0,0))])

    # Two continuous paths share the CTA outline, expand into spatial arcs and
    # finish as the current-section indicator and navigation spine. Every point
    # has authored intermediate coordinates; not a two-key endpoint morph.
    for side, color in enumerate(["red","purple"]):
        count=65
        obj=path(scene,f"06 THREAD / {color} CTA > arc > nav",[(0,0,0)]*count,.018,mats[color])
        for j, frame in enumerate(FRAMES):
            for k, point in enumerate(obj.data.splines[0].points):
                t=k/(count-1); angle=(t+side)*math.pi
                # Squircle halves, so the entry control is recognisable.
                a=(math.copysign(abs(math.cos(angle))**.30, math.cos(angle))*1.5,
                   -1.54+math.copysign(abs(math.sin(angle))**.55,math.sin(angle))*.34,.34)
                states=[a,a,(a[0]*.96,a[1]-.035,a[2]),
                    (math.cos(angle)*2.25,-.75+math.sin(angle)*.95,.3+math.sin(angle)*.6),
                    (.45+math.cos(angle+.27)*3.3,.10+math.sin(angle+.27)*1.68,.1+math.sin(angle)*1.15),
                    (.35+math.cos(angle+.72)*4.6,.3+math.sin(angle+.72)*2.15,-.6+math.cos(angle)*.65),
                    (1.0+math.cos(angle+1.12)*4.75,.35+math.sin(angle+1.12)*2.30,-.5+math.sin(angle)*.6),
                    (3.1+math.cos(angle+1.35)*2.75,.30+math.sin(angle+1.35)*2.0,-.20),
                    (5.77+math.sin(t*math.pi)*(.42 if side==0 else -.28),2.10-t*(.43 if side==0 else 3.4),.22),
                    (5.80+math.sin(t*math.pi)*(-.06 if side==0 else .05),2.10-t*(.43 if side==0 else 3.4),.25),
                    (5.80,2.10-t*(.43 if side==0 else 3.4),.25),
                    (5.80,2.10-t*(.43 if side==0 else 3.4),.25),
                    (5.80,2.10-t*(.43 if side==0 else 3.4),.25)]
                point.co=(*states[j],1);point.keyframe_insert("co",frame=frame)

    # Six quiet geometric anchors: supporting elements travel later and farther.
    nav=["01 WHO","02 BUILD","03 WORK","04 BEYOND","05 FUTURE","06 CONTACT"]
    for i,label in enumerate(nav):
        px=-2.5+i*.64; py=1.86-i*.61; d=i*4
        pin=rectangle(scene,f"07 ANCHOR {i+1}",.075,.075,mats["red" if i==0 else "purple"],(px,-2.35,.2))
        keyed(pin,[(1,(px,-2.35,.2),.55,(0,0,45)),(65+d,(px,-2.35,.2),.55,(0,0,45)),
            (100+d,(px+.55,-1.9+i*.12,-.4),.8,(0,15,60)),
            (135+d,(1.3+i*.45,-.8+i*.36,-.3),.9,(0,8,90)),
            (170+d,(4.8+i*.17,py-.2,.2),1.1,(0,-6,55)),
            (205+d,(5.79,py+.035,.3),1,(0,0,0)),(245+d,(5.80,py,.3),1,(0,0,0)),(300,(5.8,py,.3),1,(0,0,0))])
        tag=text(scene,f"08 NAV {i+1}",label,.115,mats["paper" if i==0 else "muted"],(8.6,py,-.5))
        keyed(tag,[(1,(8.6,py,-.5),1,(0,82,0)),(155+d,(8.6,py,-.5),1,(0,82,0)),
            (179+d,(6.85,py+.04,-.05),1,(0,36,0)),(215+d,(6.02,py-.02,.3),1,(0,-2,0)),
            (249+d,(6.05,py,.3),1,(0,0,0)),(300,(6.05,py,.3),1,(0,0,0))])

    # Fine depth planes: finite geometry, not a particle effect.
    for i in range(5):
        y=-2.92-i*.12
        rail=path(scene,f"09 DEPTH / rail {i+1}",[(-6.6,y,-.7),(6.6,y,-.7)],.005,mats["rail"])
        keyed(rail,[(1,(0,0,0),1,(0,0,0)),(55+i*4,(0,0,0),1,(0,0,0)),
            (103+i*5,(.4,.5,-i*.15),1,(0,-3,4+i*2)),(151+i*3,(.9,.7,-.8),1,(0,3,-3)),
            (199+i*4,(0,.15,-.2),1,(0,0,0)),(247,(0,0,0),1,(0,0,0)),(300,(0,0,0),1,(0,0,0))])

    smooth_keys()
    scene.frame_set(1)
    # Store useful camera/timeline views in the saved project.
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=="VIEW_3D":
                area.spaces.active.region_3d.view_perspective="CAMERA"
                area.spaces.active.overlay.show_overlays=False
                area.spaces.active.shading.type="MATERIAL"
    notes=bpy.data.texts.new("READ ME — Motion Lab 01")
    notes.write("AURA / LANDING TO QUICK\n\nMotion study only, no final typography or website integration.\n"
        "Press Space to play. Drag the Timeline playhead to scrub.\nMarkers describe all 13 authored checkpoints.\n"
        "Camera and objects use native editable keys. Red/purple curve control points are animated.\n"
        "The same name, introduction, role words and entry outline survive the transition.\n"
        "1–36: Landing hold. 37–270: transformation. 271–300: Quick hold. 30 fps.\n"
        "No external assets, no scripts required for playback.\n")
    return scene


def configure_video(scene):
    scene.render.image_settings.media_type="VIDEO"
    scene.render.image_settings.file_format="FFMPEG"
    scene.render.ffmpeg.format="MPEG4"
    scene.render.ffmpeg.codec="H264"
    scene.render.ffmpeg.constant_rate_factor="HIGH"
    scene.render.ffmpeg.ffmpeg_preset="GOOD"
    scene.render.filepath=str(OUT/"landing-to-quick-01.mp4")


def main():
    args=argparse.ArgumentParser()
    args.add_argument("--stills",action="store_true")
    args.add_argument("--render-only",action="store_true")
    options=args.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    OUT.mkdir(parents=True,exist_ok=True)
    scene=bpy.context.scene if options.render_only else make_scene()
    if options.render_only:
        if scene.name!=SCENE: raise RuntimeError("Render-only requires the isolated Motion Lab scene")
        configure_video(scene)
        # Review-quality preview on this integrated GPU, still a full 30 fps.
        scene.render.resolution_percentage = 75
        scene.eevee.taa_render_samples = 8
        bpy.ops.render.render(animation=True,scene=scene.name)
        return
    configure_video(scene)
    # A dedicated background process saves the ordinary, directly openable .blend.
    if bpy.app.background:
        bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"landing-to-quick-01.blend"),compress=True)
    else:
        bpy.data.libraries.write(str(OUT/"landing-to-quick-01.blend"),{scene},fake_user=True,compress=True)
    report={"blender":bpy.app.version_string,"scene":scene.name,"fps":FPS,"frames":END,"seconds":END/FPS,
            "objects":len(scene.objects),"stages":dict(zip(FRAMES,STAGES)),"preview":"landing-to-quick-01.mp4"}
    (OUT/"motion-manifest.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
    if options.stills:
        scene.render.image_settings.media_type="IMAGE"
        scene.render.image_settings.file_format="PNG"
        for frame in [1,79,127,175,223,300]:
            scene.frame_set(frame);scene.render.filepath=str(OUT/f"frame-{frame:03}.png")
            bpy.ops.render.render(write_still=True,scene=scene.name)
    print("AURA MOTION LAB READY",json.dumps(report))


if __name__=="__main__":main()
