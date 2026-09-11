"""Run manually in Blender's Scripting workspace. No external assets required.

Open this file in the Text Editor, then Run Script. Only the dedicated
AURA_POC scene is cleared. Other open scenes are never exported or saved.
"""
from pathlib import Path
import json
import math
import random

import bpy
from mathutils import Vector


# Blender's Text Editor execution need not provide the on-disk script path
# through __file__. Use this checkout's explicit path, not a parent index.
ROOT = Path(r"C:\Users\Adharsh Vijayakarthy\Desktop\Code\Final_Portfolio")
if not (ROOT / "package.json").is_file() or not (ROOT / "scripts" / "blender").is_dir():
    raise RuntimeError(f"AURA project directory is missing or invalid: {ROOT}")
SOURCE_DIR = ROOT / ".aura-work" / "blender-poc"
EXPORT_DIR = ROOT / "public" / "models" / "aura-poc"
SCENE_NAME = "AURA_POC"
RNG = random.Random(42)


def material(name, color, roughness=0.8, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    if emission:
        shader.inputs["Emission Color"].default_value = (*color, 1)
        shader.inputs["Emission Strength"].default_value = emission
    return mat


def finish(name, mat, scale=(1, 1, 1)):
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def cube(name, location, dimensions, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    return finish(name, mat, dimensions)


def branch(name, start, end, radius, mat):
    direction = Vector(end) - Vector(start)
    bpy.ops.mesh.primitive_cone_add(
        vertices=8, radius1=radius, radius2=radius * 0.6,
        depth=direction.length, location=(Vector(start) + Vector(end)) / 2,
    )
    obj = finish(name, mat)
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return obj


def rock(name, location, scale, mat):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=location)
    return finish(name, mat, scale)


def main():
    # A dedicated test scene makes reruns safe for unrelated Blender work.
    scene = bpy.data.scenes.get(SCENE_NAME) or bpy.data.scenes.new(SCENE_NAME)
    bpy.context.window.scene = scene
    collections = {scene.collection, *scene.collection.children_recursive}
    for obj in list(scene.objects):
        for collection in list(obj.users_collection):
            if collection in collections:
                collection.objects.unlink(obj)
        if obj.users == 0:
            bpy.data.objects.remove(obj)
    # Objects created below are directly linked to the test scene collection.
    bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection
    earth = material("POC_Ground", (0.16, 0.24, 0.12))
    stone = material("POC_Stone", (0.39, 0.43, 0.45))
    bark = material("POC_Bark", (0.22, 0.11, 0.055))
    leaves = material("POC_Leaves", (0.10, 0.35, 0.14))
    grass = material("POC_Grass", (0.28, 0.48, 0.12))
    lantern = material("POC_Lantern", (0.16, 0.18, 0.19))
    glow = material("POC_LanternPane", (1.0, 0.57, 0.16), emission=0.8)

    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
    finish("Ground", earth, (9, 7, 1))
    for i in range(7):
        x = 0.25 * math.sin(i * 0.8)
        obj = cube(f"Path_{i:02}", (x, -2.8 + i * 0.85, 0.09), (0.95, 0.65, 0.18), stone)
        obj.rotation_euler.z = RNG.uniform(-0.12, 0.12)

    base = (-2.1, 0.6, 0)
    branch("Tree_Trunk", base, (-2.1, 0.6, 2.7), 0.22, bark)
    for i, end in enumerate([(-3.0, 0.6, 2.9), (-1.25, 0.7, 3.25), (-2.1, 1.5, 3.0)]):
        branch(f"Tree_Branch_{i}", (-2.1, 0.6, 1.7 + i * 0.2), end, 0.11, bark)
        rock(f"Tree_Canopy_{i}", end, (0.85, 0.7, 0.7), leaves)

    for i in range(12):
        x, y = RNG.choice([-1, 1]) * RNG.uniform(1.0, 3.6), RNG.uniform(-2.7, 2.7)
        for j in range(3):
            bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.07, radius2=0,
                depth=0.35 + j * 0.08, location=(x + j * 0.1, y, 0.2))
            finish(f"Grass_{i:02}_{j}", grass)
    rock("Stone", (2.4, 1.7, 0.42), (0.85, 0.65, 0.55), stone)

    cube("Lantern_Base", (1.7, -0.6, 0.12), (0.7, 0.7, 0.24), stone)
    cube("Lantern_Post", (1.7, -0.6, 0.62), (0.17, 0.17, 0.8), lantern)
    cube("Lantern_Pane", (1.7, -0.6, 1.23), (0.42, 0.42, 0.48), glow)
    for x in [-0.25, 0.25]:
        for y in [-0.25, 0.25]:
            cube(f"Lantern_Frame_{x}_{y}", (1.7+x, -0.6+y, 1.23), (0.065, 0.065, 0.6), lantern)
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.57, radius2=0.12,
                                  depth=0.3, location=(1.7, -0.6, 1.68), rotation=(0, 0, math.pi/4))
    finish("Lantern_Roof", lantern)

    bpy.ops.object.camera_add(location=(10, -13, 10))
    camera = bpy.context.object
    camera.name = "POC_Camera"
    target = Vector((0, 0, 0.8))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 42
    scene.camera = camera
    bpy.ops.object.light_add(type="SUN", location=(4, -5, 8))
    light = bpy.context.object
    light.name = "POC_Sun"
    light.data.energy = 3
    light.rotation_euler = (math.radians(25), math.radians(-20), math.radians(-30))
    scene.render.resolution_x, scene.render.resolution_y = 1200, 800
    scene.render.resolution_percentage = 100
    scene["aura_pipeline"] = "Blender manual POC v1"

    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    blend_path = SOURCE_DIR / "aura-garden-poc.blend"
    glb_path = EXPORT_DIR / "aura-garden-poc.glb"
    # Save only this scene and its dependencies, never unrelated open scenes.
    bpy.data.libraries.write(str(blend_path), {scene}, fake_user=True, compress=True)
    bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format="GLB",
        use_active_scene=True, export_cameras=True, export_lights=True,
        export_animations=False, export_materials="EXPORT", export_extras=True,
        export_yup=True, check_existing=False)
    report = {"blender": bpy.app.version_string, "meshes": sum(o.type == "MESH" for o in scene.objects),
              "glb_bytes": glb_path.stat().st_size, "blend": str(blend_path), "glb": str(glb_path)}
    (SOURCE_DIR / "export-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print("AURA POC EXPORT COMPLETE", json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
