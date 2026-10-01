"""Deterministic garden planting composition within the existing shared kit."""
import math,random
def additions(route,contract,start):
    rows=[];rng=random.Random(481+list(contract['routes']).index(route)*91)
    def add(aid,x,z,variant=None,angle=0,scale=1):
        rows.append({'assetId':aid,'position':[x,0,z],'rotation':[0,angle,0],'scale':[scale]*3,
                     'variantNode':f'SA_{aid}_{variant}' if variant else None,
                     'instanceId':f'SA_{route.upper()}_INSTANCE_{start+len(rows):02}','seniorPlacement':True})
    if route!='contact':
        z=min(k['end'][2] for k in contract['routes'][route]['knots'])-37
        for i,x in enumerate((-27,-10,10,29)):
            add('G11',x,z-rng.uniform(0,7),angle=[.55,-.4,.18,-.65][i],scale=[1.08,.95,1.17,1.02][i])
        if route not in ('future',):add('G03',8.4 if route!='person' else -8.1,-18 if route!='work' else -26,angle=1.2,scale=.82)
    if route=='thinker':
        points=[(6.3*math.cos(t),-8+5.3*math.sin(t)) for t in [.2,.65,1.2,1.8,2.5,3.5,4.0,4.6,5.1,5.65]]
    elif route=='leader':
        points=[(7*math.cos(t),-5+6.6*math.sin(t)) for t in [.4,1.0,1.7,2.7,3.4,4.1,4.7,5.5]]
    elif route=='contact':points=[(-3,1),(-2.8,-9),(4,-10),(3.8,-4)]
    elif route=='future':points=[(-4.1,1),(4.3,-1),(-4.8,-5),(4.8,-6)]
    else:
        edge=6 if route in ('work','builder','aura') else 3.1 if route=='garden' else 4.1
        points=[(side*(edge+rng.uniform(-.2,.6)),1-i*4.3+rng.uniform(-.4,.4)) for i in range(5) for side in (-1,1)]
    for i,(x,z) in enumerate(points):
        if route!='contact' or i%2==0:add('G10',x,z,f'FAN_{i%3:02}',rng.uniform(-2,2),.55+rng.uniform(0,.35))
        if route not in ('contact','future'):
            add('G06',x+(.5 if x>0 else -.5),z+.3,f'STONE_{i%4:02}',rng.uniform(-2,2),.72+rng.uniform(0,.4))
        if route=='contact':add('G05',x,z,f'TUFT_{i%3:02}',rng.uniform(-2,2),.85)
    return rows
