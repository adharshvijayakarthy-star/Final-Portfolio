"""Deterministic, metre-scale modeling helpers. Public coordinates are glTF Y-up."""
import bpy, math, random
from mathutils import Vector
from collections import defaultdict

PALETTE={'moss':('35493A',.95,0),'leaf':('5C6650',.88,0),'bark':('4A423A',.86,0),'stone':('AAA18D',.92,0),'sakura':('E8A6B4',.78,0),'paper':('F2EFE6',.9,0),'water':('61796C',.32,0),'metal':('353C38',.55,.25),'clay':('8F7762',.93,0),'accent':('B0904F',.58,.1),'light':('EBCF9F',.75,0),'distant':('8D997B',1,0)}
def B(v): return (v[0],-v[2],v[1])
def G(v): return (v[0],v[2],-v[1])
def linear(v): return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def materials():
    result={}
    for key,(h,r,m) in PALETTE.items():
        mat=bpy.data.materials.new('SA_M_'+key.upper()); mat.use_nodes=True
        col=tuple(linear(int(h[i:i+2],16)/255) for i in (0,2,4))+(1,)
        mat.diffuse_color=col; p=mat.node_tree.nodes.get('Principled BSDF')
        p.inputs['Base Color'].default_value=col; p.inputs['Roughness'].default_value=r; p.inputs['Metallic'].default_value=m
        if key=='light':
            p.inputs['Emission Color'].default_value=col; p.inputs['Emission Strength'].default_value=.55
        result[key]=mat
    return result

class Asset:
    def __init__(self,aid,lod,mats,export_col):
        self.id,self.lod,self.mats=aid,lod,mats; self.low=lod=='mobile'; self.r=random.Random(aid)
        self.col=bpy.data.collections.new(f'SA_{aid}_{lod.upper()}'); export_col.children.link(self.col)
        self.count=defaultdict(int); self.parts=[]; self.groups={}; self.root=self.node('ROOT'); self.root['assetId']=aid
        self.root['lod']=lod; self.root['coordinateConvention']='metres; Blender (x,-z,y); glTF (x,y,z)'
    def name(self,role):
        i=self.count[role]; self.count[role]+=1
        assert i<100,(self.id,role,i)
        return f'SA_{self.id}_{"MOBILE" if self.low else ""}{role}_{i:02}'
    def node(self,role='PART',pos=(0,0,0),parent=None):
        o=bpy.data.objects.new(self.name(role),None); self.col.objects.link(o); o.location=B(pos)
        o.empty_display_size=.13; o.parent=parent or getattr(self,'root',None); self.parts.append(o); return o
    def add(self,verts,faces,mat,parent=None,smooth=False,colors=None):
        par=parent or self.root; key=(par.name,mat,smooth)
        if key not in self.groups:self.groups[key]=[par,[],[],[],mat,smooth]
        group=self.groups[key]; n=len(group[1]); group[1].extend([B(v) for v in verts]); group[2].extend([tuple(n+i for i in f) for f in faces])
        group[3].extend(colors or [(1,1,1,1)]*len(verts))
    def box(self,c,d,mat='bark',parent=None,bevel=.014):
        x,y,z=c; a,b,k=[v/2 for v in d]
        verts=[(x+sx*a,y+sy*b,z+sz*k) for sx,sy,sz in [(-1,-1,-1),(-1,-1,1),(1,-1,1),(1,-1,-1),(-1,1,-1),(-1,1,1),(1,1,1),(1,1,-1)]]
        # Winding is repaired once on final mesh, including authored curved surfaces.
        faces=[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
        if not self.low and bevel>0:
            # Chamfered blocks authored as real geometry with clean corner triangles.
            import bmesh
            bm=bmesh.new(); vs=[bm.verts.new(B(v)) for v in verts]
            for f in faces: bm.faces.new([vs[i] for i in f])
            bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
            bmesh.ops.bevel(bm,geom=list(bm.edges),offset=min(bevel,min(d)*.2),segments=1,affect='EDGES')
            bm.verts.ensure_lookup_table(); bm.verts.index_update()
            self.add([G(v.co) for v in bm.verts],[[v.index for v in f.verts] for f in bm.faces],mat,parent)
            bm.free()
        else:self.add(verts,faces,mat,parent)
    def rock(self,c,d,mat='stone',parent=None,n=None,rings=None,seed=0):
        n=n or (7 if self.low else 11); rings=rings or (3 if self.low else 5)
        r=random.Random(f'{self.id}-{seed}'); verts=[]
        for j in range(rings):
            t=j/(rings-1); lat=-math.pi/2+.13+t*(math.pi-.2)
            for i in range(n):
                ang=2*math.pi*i/n; rad=math.cos(lat)*(1+r.uniform(-.09,.09))
                verts.append((c[0]+d[0]*.5*math.cos(ang)*rad,c[1]+d[1]*(.5+.5*math.sin(lat)),c[2]+d[2]*.5*math.sin(ang)*rad))
        faces=[tuple(range(n-1,-1,-1))]
        for j in range(rings-1):
            for i in range(n): faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
        faces.append(tuple((rings-1)*n+i for i in range(n)))
        # Sculpted ground-contact base; organic smooth shading, no floating point.
        for i in range(n): verts[i]=(verts[i][0],c[1],verts[i][2])
        self.add(verts,faces,mat,parent,True)
    def tube(self,points,radii,mat='bark',parent=None,sides=None):
        sides=sides or (5 if self.low else 8); vs=[]
        for j,p in enumerate(points):
            tangent=Vector(points[min(j+1,len(points)-1)])-Vector(points[max(0,j-1)])
            tangent.normalize(); ref=Vector((0,1,0)) if abs(tangent.y)<.95 else Vector((1,0,0))
            u=tangent.cross(ref).normalized(); v=tangent.cross(u).normalized()
            for i in range(sides):
                a=i*2*math.pi/sides; vs.append(Vector(p)+radii[j]*(math.cos(a)*u+math.sin(a)*v))
        fs=[tuple(range(sides-1,-1,-1))]
        for j in range(len(points)-1):
            for i in range(sides):fs.append((j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i))
        fs.append(tuple((len(points)-1)*sides+i for i in range(sides))); self.add(vs,fs,mat,parent,True)
    def slab(self,c,width,length,mat='stone',parent=None,angle=0,thick=.08):
        n=6 if self.low else 8; points=[]
        for i in range(n):
            a=2*math.pi*i/n; xx=width*.5*math.cos(a)*(1+.08*math.sin(i*8.2)); zz=length*.5*math.sin(a)
            points.append((c[0]+xx*math.cos(angle)-zz*math.sin(angle),c[2]+xx*math.sin(angle)+zz*math.cos(angle)))
        vs=[(x,c[1]+h,z) for h in (0,thick) for x,z in points]; fs=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
        for i in range(n):fs.append((i,(i+1)%n,(i+1)%n+n,i+n))
        self.add(vs,fs,mat,parent)
    def leaf(self,start,end,width,mat='leaf',parent=None):
        s,e=Vector(start),Vector(end); d=e-s; side=d.cross(Vector((0,1,.1))).normalized()*width
        mid=s+d*.53+Vector((0,width*.6,0)); vs=[s,mid-side*.5,mid+Vector((0,width*.12,0)),mid+side*.5,e]
        self.add(vs,[(0,1,2),(0,2,3),(1,4,2),(2,4,3)],mat,parent,True)
    def ground(self,width,length,mat='moss',center=(0,0,0),steps=None,oval=False):
        n=steps or (14 if self.low else 30); vs=[]; cols=[]
        for j in range(n+1):
            for i in range(n+1):
                x=(i/n-.5)*width; z=(j/n-.5)*length
                if oval:
                    u,v=x/(width*.5),z/(length*.5); x*=math.sqrt(1-v*v*.5); z*=math.sqrt(1-u*u*.5)
                shoulder=min(1,max(0,(abs(x)-1.25)/2)); y=.10*shoulder*(.6+.4*math.sin(x*.7+z*.24))
                if width>100: y=.36*(.5+.5*math.sin(x*.025+z*.015))+.42*shoulder*(.5+.5*math.sin(x*.12)*math.cos(z*.08))
                vs.append((center[0]+x,center[1]+y,center[2]+z)); shade=.94+.12*(.5+.5*math.sin(x*1.7+z*2.4)); cols.append((shade,shade,shade,1))
        fs=[]
        for j in range(n):
            for i in range(n):
                k=j*(n+1)+i;fs.extend([(k,k+1,k+n+2),(k,k+n+2,k+n+1)])
        self.add(vs,fs,mat,colors=cols,smooth=True)
    def finalize(self):
        import bmesh
        for par,verts,faces,colors,mat,smooth in self.groups.values():
            mesh=bpy.data.meshes.new(self.name('GEOMETRY')); mesh.from_pydata(verts,[],faces); mesh.update()
            bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
            for f in mesh.polygons:f.use_smooth=smooth
            attr=mesh.color_attributes.new(name='COLOR_0',type='FLOAT_COLOR',domain='POINT')
            for i,col in enumerate(colors): attr.data[i].color=tuple(max(0,min(1,v)) for v in col)
            o=bpy.data.objects.new(self.name('MESH'),mesh);self.col.objects.link(o);o.parent=par;mesh.materials.append(self.mats[mat]);self.parts.append(o)
        return self

def keys(obj,clip,duration,poses):
    """poses = (seconds, local position glTF, Euler radians Blender) tuples."""
    # One multi-slot Action per authored clip, shared by its independent parts
    # and both LODs. NLA track names preserve that same clip in each GLB.
    action=bpy.data.actions.get(clip) or bpy.data.actions.new(clip)
    obj.animation_data_create();obj.animation_data.action=action
    obj.animation_data.action_slot=action.slots.new('OBJECT',obj.name)
    for t,pos,rot in poses:
        if pos is not None:
            obj.location=B(pos);obj.keyframe_insert('location',frame=1+t*30,group=clip)
        if rot is not None:
            obj.rotation_euler=rot;obj.keyframe_insert('rotation_euler',frame=1+t*30,group=clip)
    action=obj.animation_data.action
    from bpy_extras.anim_utils import action_get_channelbag_for_slot
    bag=action_get_channelbag_for_slot(action,obj.animation_data.action_slot)
    for fc in bag.fcurves:
        for k in fc.keyframe_points:k.interpolation='BEZIER';k.handle_left_type='AUTO_CLAMPED';k.handle_right_type='AUTO_CLAMPED'
    slot=obj.animation_data.action_slot;obj.animation_data.action=None
    track=obj.animation_data.nla_tracks.new();track.name=clip
    strip=track.strips.new(clip,1,action);strip.action_slot=slot;strip.extrapolation='HOLD';strip.blend_type='REPLACE'
    strip.action_frame_start=1;strip.action_frame_end=1+duration*30
    strip.frame_start=1;strip.frame_end=1+duration*30
    obj['clip']=clip;obj['clipDuration']=duration

def move(obj,clip,D,final,delta=(0,0,0),delay=0,travel=None,rotation=0,bounce=False):
    end=min(D,delay+(travel or (D-delay))); start=tuple(final[i]+delta[i] for i in range(3))
    poses=[(0,start,(0,0,rotation)),(delay,start,(0,0,rotation))] if delay else [(0,start,(0,0,rotation))]
    if bounce: poses.append((delay+(end-delay)*.48,tuple(final[i]+(0,.08,0)[i] for i in range(3)),(0,0,0)))
    poses.extend([(end,final,(0,0,0)),(D,final,(0,0,0))]); keys(obj,clip,D,poses)
