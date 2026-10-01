"""Compositions reference asset collections; no shared meshes copied into route exports."""
import math,json
from pathlib import Path

PLACEMENTS={
'garden': [('G01',(0,-.13,-76)),('G03',(-5,0,-7.5)),('G08',(2.8,0,-3)),('G13',(0,0,1)),('G14',(1.6,0,-8)),('G10',(-1.2,.9,4.5),'FAN_00'),('G10',(1.5,.7,4),'FAN_01')],
'person': [('G01',(42,-.14,-40)),('P01',(0,0,-5)),('P02',(-2.2,0,-9)),('P03',(2.8,0,-11)),('G03',(6,0,-10))],
'builder':[('G01',(-28,-.13,-32)),('B01',(0,0,0)),('B02',(0,0,0)),('B03',(0,0,0)),('B04',(0,3.35,-3)),('B05',(0,0,-4.8)),('B06',(0,.94,-4.8))],
'thinker':[('G01',(62,-.13,4)),('G07',(0,-.12,-8)),('T01',(-3.5,0,-5)),('T02',(0,0,0)),('T03',(-2.8,.42,-5.7))],
'leader':[('G01',(6,-.15,2)),('L01',(0,0,-5)),('L02',(0,0,-5)),('L03',(3.3,0,-7))],
'stories':[('G01',(34,-.13,40)),('S01',(0,0,0)),('S03',(0,0,0))]+[('S02',(x+1.2,0,z)) for x,z in [(-1,-2),(2,-6),(-2,-10),(1,-14)]],
'work':[('G01',(-44,-.13,20)),('W01',(0,0,-10)),('W02',(-2.2,0,-2)),('W03',(2.2,0,-7)),('W04',(-2.2,0,-12)),('W05',(2.2,0,-17)),('W06',(-2.2,0,-22))],
'future':[('G01',(-20,-.13,70)),('F01',(0,0,0)),('F02',(0,0,0)),('F03',(1,0,-38))],
'aura':[('G01',(-74,-.13,56)),('A01',(0,0,-6)),('A02',(0,0,0)),('A03',(0,0,0)),('A04',(0,0,-9))],
'contact':[('G01',(74,-.14,66)),('C01',(0,0,-4)),('C02',(3,0,-3)),('G08',(-6,0,-10))]}

def instances(route,contract):
    records=[]
    def add(aid,pos,variant=None,rotation=0):
        records.append({'assetId':aid,'position':list(pos),'rotation':[0,rotation,0],'scale':[1,1,1],
                        'variantNode':f'SA_{aid}_{variant}' if variant else None,
                        'instanceId':f'SA_{route.upper()}_INSTANCE_{len(records):02}'})
    for row in PLACEMENTS[route]:
        if route=='stories' and row[0]=='S02':
            x,y,z=row[1]
            if z==-2:x=1.1
            if z==-10:x=-1.6
            add('S02',(x,y,z))
        else:add(*row)
    origin=contract['routes'][route]['worldOrigin']
    # Future's local terrain is exactly Y=0 at the world skirt overlap.
    # Keep the skirt 1 cm beneath it to avoid coplanar render artifacts.
    add('G09',(-origin[0],-.51 if route=='future' else -.5,-origin[2]))
    # Explicit path segment variants, never display all variants at one origin.
    if route in ('garden','person','contact','work','aura'):
        zs={'garden':[3,-1,-5,-9],'person':[3,-1,-5,-9,-13],'contact':[1,-3,-7,-11],
            'work':[3,-1,-5,-9,-13,-17,-21,-25],'aura':[3,-1,-5,-9]}[route]
        for z in zs:add('G02',(0,.03,z),'STRAIGHT_00')
    if route=='person':add('G02',(0,.03,-3),'BEND_00')
    if route not in ('contact','future'):
        extent=contract['routes'][route]['extent'];edge=3.5 if route in ('garden','person','stories') else extent[0]*.42
        for i in range(8 if route=='stories' else 5):
            z=1-i*3.2
            for s in (-1,1):
                add('G04',(s*edge,0,z),f'BUSH_{i%2:02}')
                add('G05',(s*(edge-.65),0,z-.6),f'TUFT_{i%3:02}')
        if route!='garden':add('G03',(-edge,0,-13))
    # Tree bank stays beyond 28 m from the entire camera rail.
    add('G11',(-13,0,-55));add('G11',(12,0,-59))
    if route=='garden':add('G06',(-1.8,0,2),'STONE_02')
    from senior_placements import additions
    records.extend(additions(route,contract,len(records)))
    grounded=Path(__file__).resolve().parent/'senior-grounded-placements.json'
    if grounded.exists():
        overrides=json.loads(grounded.read_text()).get(route,{})
        for r in records:
            if r['instanceId'] in overrides:r['position']=overrides[r['instanceId']]
    return records

CLIP_BANDS={'BUILD_FOUNDATION':[.10,.18],'BUILD_POSTS':[.20,.30],'BUILD_BEAMS':[.32,.41],
'BUILD_ROOF':[.44,.53],'BUILD_BENCH':[.56,.64],'BUILD_TOKENS':[.68,.79],
'THINKER_SCROLL':[.76,.82],'LEADER_CONVERGE':[.14,.24],'LEADER_RAIL':[.36,.43],
'STORY_SHUTTER':None,'WORK_PLANNER':[.09,.25],'WORK_LOGGER':[.25,.41],'WORK_MUN':[.41,.57],
'WORK_SNRLED':[.57,.75],'WORK_AURA':[.75,.92],'AURA_STRUCTURE':[.24,.49],
'AURA_DOCUMENTS':[.49,.60],'AURA_MODEL':[.74,.85]}
POSTER_PROGRESS={'garden':.55,'person':.6,'builder':.52,'thinker':.58,'leader':.48,'stories':.48,'work':.12,'future':.85,'aura':.9,'contact':.5}
LIGHT={'garden':1,'person':1.05,'builder':.92,'thinker':.88,'leader':1,'stories':.42,'work':.82,'future':1.15,'aura':1,'contact':1.02}

def camera_pose(route,p,contract,mobile=False):
    beats=contract['routes'][route]['knots'];b=next((b for b in beats if p<=b['band'][1]),beats[-1])
    t=max(0,min(1,(p-b['band'][0])/((b['band'][1]-b['band'][0])*.35)))
    t=t*t*(3-2*t)
    pos=[b['start'][i]+(b['end'][i]-b['start'][i])*t for i in range(3)]
    if mobile:pos[0]=0 if route=='work' else pos[0]*.35;pos[2]+=1
    return pos,b['look']
