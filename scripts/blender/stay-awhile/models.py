"""Part I asset definitions. Local geometry; placement is owned by layout.py."""
import math
from geometry import move, keys

PI=math.pi
FOOTINGS=[(x,0,z) for z in (0,-3,-6) for x in (-2.5,2.5)]
STONE_POS=[(i-3,0,z) for i,z in enumerate((-10,-10.6,-11,-11.2,-11,-10.6,-10))]
DOC_POS=[(3.6*math.cos(PI*.12+i*PI*.095),1.6,-7-3.6*math.sin(PI*.12+i*PI*.095)) for i in range(9)]

def part(a,role,pos=(0,0,0)):
    return a.node(role,pos)

def table(a,w=2.6,h=1,d=1.4,parent=None):
    a.box((0,h-.06,0),(w,.12,d),parent=parent)
    for x in (-w*.4,w*.4):
        for z in (-d*.35,d*.35):a.box((x,(h-.12)/2,z),(.1,h-.12,.1),parent=parent)
    a.box((0,h*.32,0),(w*.85,.1,.08),parent=parent)

def lantern(a,h=1.15,w=.4,shutter=False):
    a.box((0,.08,0),(w,.16,w),'stone')
    for x in (-w*.4,w*.4):
        for z in (-w*.4,w*.4):a.box((x,h*.52,z),(.045,h-.2,.045))
    a.box((0,h-.04,0),(w*1.16,.08,w*1.16))
    a.box((0,h*.53,0),(w*.55,h*.45,w*.55),'light')
    for x in (-w*.44,w*.44):a.box((x,h*.58,0),(.012,h*.52,w*.76),'paper',bevel=0)
    a.box((0,h*.58,-w*.44),(w*.76,h*.52,.012),'paper',bevel=0)
    if shutter:
        p=part(a,'SHUTTER',(-w*.38,h*.58,w*.44))
        a.box((w*.38,0,0),(w*.76,h*.52,.016),'paper',p,bevel=0)
        keys(p,'STORY_SHUTTER',.6,[(0,(-w*.38,h*.58,w*.44),(0,0,0)),(.6,(-w*.38,h*.58,w*.44),(0,0,math.radians(18)))])
        a.node('HOTSPOT',(0,h*.65,0))

def tree(a,origin=(0,0,0),height=7.2,blossom=False,pivots=False):
    x,y,z=origin; scale=height/7.2
    a.tube([(x,y,z),(x-.18*scale,y+2.1*scale,z+.1),(x+.16,y+4.4*scale,z-.1)], [.25*scale,.18*scale,.10*scale])
    for i,ang in enumerate((.25,2.5,4.5)):
        px,pz=x+math.cos(ang)*.3,z+math.sin(ang)*.3
        p=part(a,('SWAY_'+chr(65+i)) if pivots else 'BRANCH',(px,y+2.8*scale,pz))
        length=(2.5 if i!=1 else 3.0)*scale
        ex,ez=math.cos(ang)*length,math.sin(ang)*length
        a.tube([(0,0,0),(ex*.5,1.3*scale,ez*.5),(ex,2.6*scale,ez)],[.14*scale,.09*scale,.025*scale],parent=p)
        for j in range(3 if a.low else 6):
            q=j/(2 if a.low else 5); ox=ex*(.4+.65*q); oz=ez*(.4+.65*q)
            oy=(1.4+q*1.7)*scale
            a.tube([(ex*.5,1.2*scale,ez*.5),(ox,oy,oz)],[.045*scale,.012*scale],parent=p)
            a.rock((ox,oy,oz),(1.7*scale,.8*scale,1.4*scale),'sakura' if blossom else 'leaf',p,n=6 if a.low else 9,rings=3 if a.low else 4,seed=i*9+j)

def path(a,centers,width=2.2,parent=None):
    for i,(x,y,z) in enumerate(centers):
        a.slab((x,y-.10,z),width,.64,'stone',parent,angle=.07*math.sin(i),thick=.08)

def build(a):
    k=a.id
    if k=='G01':
        a.ground(180,180,steps=36 if a.low else 70)
        # Three quiet elevation bands with a level, recessed local path corridor.
    elif k=='G02':
        for variant in range(3):
            p=part(a,('STRAIGHT','BEND','JUNCTION')[variant])
            for i in range(6):
                t=(i+.5)/6
                if variant==0: pos=(0,0,2-t*4)
                elif variant==1: pos=(4*(1-math.cos(t*PI/6)),0,2-8*math.sin(t*PI/6))
                else:
                    ang=(-PI/2,PI/6,5*PI/6)[i//2]; r=.6+(i%2)*1.15
                    pos=(math.cos(ang)*r,0,math.sin(ang)*r)
                a.slab((pos[0],-.10,pos[2]),2.4,.64,'stone',p,thick=.08)
            p['variant']=('straight','bend','junction')[variant]
    elif k=='G03':tree(a,blossom=True,pivots=True)
    elif k=='G04':
        for v in range(2):
            p=part(a,'BUSH');p['variant']=v
            for j in range(3 if a.low else 5):
                an=j*2.4; a.rock((math.cos(an)*.22,0,math.sin(an)*.17),(.7,.55+.15*(j%2),.5),'leaf',p,n=5 if a.low else 7,rings=3,seed=j+v*5)
    elif k=='G05':
        for v in range(3):
            p=part(a,'TUFT');p['variant']=v
            for j in range(6 if a.low else 18):
                ang=j*2.4+v; r=.1*(j%3)/2
                a.leaf((math.cos(ang)*r,0,math.sin(ang)*r),(math.cos(ang)*.16,.23+.12*(j%3)/2,math.sin(ang)*.16),.027,parent=p)
    elif k=='G06':
        for v in range(4):
            p=part(a,'STONE');p['variant']=v
            a.rock((0,0,0),(.4+v*.23,.2+v*.09,.3+v*.14),parent=p,n=6 if a.low else 11,rings=3 if a.low else 5,seed=v)
    elif k=='G07':
        a.slab((0,0,0),12,10,'water',thick=.04)
    elif k=='G08':lantern(a)
    elif k=='G09':
        for i in range(8):
            ang=i*PI/4; c=(180*math.cos(ang),0,180*math.sin(ang))
            a.rock(c,(150,15+(i%3)*4.5,115),'distant',n=7 if a.low else 12,rings=3 if a.low else 5,seed=i)
    elif k=='G10':
        for v in range(3):
            p=part(a,'FAN');p['variant']=v
            for i in range(5 if a.low else 9):
                ang=-1.2+i/(4 if a.low else 8)*2.4
                a.leaf((0,0,0),(math.sin(ang)*.85,.65+.5*math.cos(ang),-.2-.25*math.cos(ang)),.21,parent=p)
    elif k=='G11':
        for i in range(5):
            x=-7.2+i*3.6;h=5+(i%3)*1.5
            a.tube([(x,0,0),(x,h*.65,0)],[.2,.07],'distant')
            a.rock((x,h*.4,-.2),(4,h*.6,3.8),'distant',n=6 if a.low else 9,rings=3,seed=i)
    elif k=='G12':
        for i in range(2):
            p=part(a,'PETAL');p['variant']=i
            a.leaf((0,0,0),(.025+i*.03,.004,0),.018+i*.012,'sakura',p)
    elif k=='G13':
        for x in (-1.5,1.5):
            a.box((x,1.55,0),(.22,3.1,.22));a.rock((x-.11,0,0),(.4,.25,.45),'moss',n=7,rings=3)
        a.box((0,3.2,0),(3.2,.2,.28))
    elif k=='G14':
        a.rock((0,0,0),(1.1,.75,.7),n=8 if a.low else 16,rings=4 if a.low else 7)
        # Recessed abstract incisions represented by narrow inset dark channels.
        for i in range(9):
            x=(i-4)*.085
            a.tube([(x,.57,.22),(x*.7,.65,.12),(x*.3,.69,.0)],[.008]*3,'bark',sides=3)
    elif k in ('P01','C01'):
        a.ground(18 if k=='P01' else 20,24 if k=='P01' else 20,oval=True,steps=16 if a.low else 32)
        if k=='P01':
            for s in (-1,1):a.tube([(s*7,0,7),(s*6,.06,2),(s*7.5,.04,-4),(s*5.8,0,-10)],[.12,.1,.07,.01])
    elif k=='P02':
        for x in (-.9,.9):a.rock((x,0,0),(.55,.45,.7),n=7 if a.low else 12,rings=3 if a.low else 5)
        a.box((0,.50,0),(2.7,.10,.8))
    elif k=='P03':
        for s in (-1,1):a.tube([(s*1.7,0,1.2),(s*.9,.35,.4),(s*.22,.60,-.4),(0,.1,-1.2)],[.18,.22,.12,.025])
    elif k=='B01':
        for i,pos in enumerate(FOOTINGS):
            p=part(a,'FOOTING');a.box((0,.175,0),(.6,.35,.6),'stone',p)
            a.box((0,.352,0),(.26,.004,.26),'metal',p,bevel=0)
            move(p,'BUILD_FOUNDATION',1.2,pos,(0,-.35,0),i*.12,.5)
    elif k=='B02':
        for i,pos in enumerate(FOOTINGS):
            p=part(a,'POST');a.box((0,1.5,0),(.22,3,.22),parent=p)
            for x in (-.08,.08):a.box((x,3.05,0),(.06,.1,.22),parent=p,bevel=0)
            move(p,'BUILD_POSTS',1.44,pos,(0,-3.1,0),i*.12,.8)
    elif k=='B03':
        pieces=[((0,3.1,z),(5.2,.2,.2)) for z in (0,-1.5,-3,-4.5,-6)]+[((x,3.1,-3),(.2,.2,6.2)) for x in (-2.5,2.5)]
        for i,(pos,dims) in enumerate(pieces):
            p=part(a,'BEAM');a.box((0,0,0),dims,parent=p)
            move(p,'BUILD_BEAMS',1.6,pos,(0,.8,0),i*.1,.8,math.radians(4))
    elif k=='B04':
        for i in range(12):
            p=part(a,'SLAT');a.box((0,0,0),(.275,.12,7),parent=p)
            move(p,'BUILD_ROOF',1.5,(-2.75+i*.5,0,0),(0,.5,0),i*.06,.7)
    elif k=='B05':
        p=part(a,'BENCH');table(a,4.2,.9,1.05,p)
        for i in range(5):a.box((-1.6+i*.8,.901,0),(.52,.005,.52),'metal',p,bevel=0)
        move(p,'BUILD_BENCH',1.2,(0,0,0),(1.2,0,0))
    elif k=='B06':
        for i in range(5):
            p=part(a,'TOKEN');p['stationId']=['study-planner','past-paper-logger','mun-club','snrled','project-aura'][i]
            if i==0:
                for x in range(3):
                    for z in range(2):a.box((x*.12-.12,.035,z*.16-.08),(.1,.07,.13),'stone',p)
            elif i==1:
                for j in range(3):a.box((j*.02,.025+j*.04,0),(.35,.025,.4),'paper',p)
            elif i==2:
                for j in range(5):a.box((math.cos(j*PI/4)*.18,.07,-math.sin(j*PI/4)*.18),(.06,.14,.06),'bark',p)
            elif i==3:
                a.box((0,.08,0),(.4,.16,.34),'metal',p);a.box((0,.164,0),(.32,.006,.25),'light',p)
            else:
                a.box((0,.065,0),(.36,.13,.4),'bark',p);a.box((.005,.07,.01),(.35,.075,.39),'paper',p)
            move(p,'BUILD_TOKENS',1.8,(-1.6+i*.8,0,0),delay=i*.14,travel=.9,bounce=True)
            a.node('HOTSPOT',(-1.6+i*.8,.1,0))
    elif k=='T01':
        for i in range(12):a.box((-1.84+i*.335,.25,0),(.31,.1,4))
        for x in (-1.5,1.5):a.box((x,.1,0),(.16,.2,3.8))
        for j in range(2):a.box((0,.05+j*.06,2.15+j*.28),(2,.1,.28))
        for x in (-1.8,1.8):a.box((x,1.5,-1.8),(.14,3,.14))
        a.box((0,3,-1.8),(4.1,.14,.18))
    elif k=='T02':
        for i,pos in enumerate(STONE_POS):
            p=part(a,'FREEDOM',pos);a.rock((0,0,0),(.56+.04*(i%2),.18,.5),parent=p,n=6 if a.low else 10,rings=3,seed=i)
            h=a.node('HOTSPOT',pos);h['freedomIndex']=i;p['freedomIndex']=i
    elif k=='T03':
        n=12 if a.low else 24;vs=[]
        for radius,y in ((.035,0),(.09,.07),(.078,.072),(.025,.012)):
            vs += [(math.cos(i*2*PI/n)*radius,y,math.sin(i*2*PI/n)*radius) for i in range(n)]
        fs=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(3) for i in range(n)]
        fs.append(tuple(3*n+i for i in range(n)));a.add(vs,fs,'clay',smooth=True)
        p=part(a,'SCROLL',(.18,0,0));a.box((.25,.007,0),(.5,.008,.25),'paper',p,bevel=0)
        q=part(a,'CURL',(.68,.01,0));a.tube([(0,0,-.125),(0,0,.125)],[.035,.035],'paper',q)
        keys(q,'THINKER_SCROLL',2,[(0,(.68,.01,0),(0,math.radians(12),0)),(2,(.68,.01,0),(0,0,0))])
    elif k=='L01':
        a.ground(12,12,'clay',oval=True,steps=12 if a.low else 24)
        for j,angle in enumerate((PI/2,PI*7/6,PI*11/6)):
            p=part(a,'APPROACH');p['approachIndex']=j
            path(a,[(math.cos(angle)*r,0,math.sin(angle)*r) for r in (1,2,3,4,5,6,7,8)],parent=p)
    elif k=='L02':
        for i in range(5):
            ang=PI*.1+i*PI*.2;pos=(3.2*math.cos(ang),0,-3.2*math.sin(ang));p=part(a,'MARKER')
            a.box((0,.425,0),(.16,.85,.16),parent=p);a.box((0,.70,.084),(.12,.18,.008),'paper',p,bevel=0)
            keys(p,'LEADER_CONVERGE',1.8,[(0,pos,(0,0,ang+math.radians(8))),(1.8,pos,(0,0,ang))])
    elif k=='L03':
        for x in (-1.25,1.25):a.box((x,.65,0),(.1,1.3,.1))
        a.box((0,1.25,0),(2.8,.12,.12))
        for i in range(3):
            p=part(a,'HOLDER');a.box((0,0,0),(.7,.4,.045),'bark',p);a.box((0,0,.027),(.63,.33,.008),'paper',p,bevel=0)
            move(p,'LEADER_RAIL',1.2,(-.9+i*.9,1.28,0),(0,-.12,0),i*.16,.7)
    elif k=='S01':
        bays=[(-1,0,-2),(2,0,-6),(-2,0,-10),(1,0,-14)]
        for i,c in enumerate(bays):
            p=part(a,'BAY',c);a.slab((0,-.10,0),3,3,'stone',p,thick=.08)
        points=[(0,0,4)]+bays+[(0,0,-19)]
        for j in range(len(points)-1):
            s,e=points[j:j+2]
            path(a,[(s[0]+(e[0]-s[0])*q/6,0,s[2]+(e[2]-s[2])*q/6) for q in range(1,6)])
    elif k=='S02':lantern(a,1.6,.45,True)
    elif k=='S03':
        for j,z in enumerate((-4,-8,-12)):
            p=part(a,'SCREEN',((1 if j%2 else -1)*3.1,0,z))
            for x in (-.92,.92):a.box((x,1.1,0),(.12,2.2,.12),parent=p)
            for i in range(6):a.box((-.8+i*.32,1.1,0),(.10,2,.1),parent=p)
            for x in (-.7,.7):a.rock((x,.2,-.05),(.7,1.6,.25),'leaf',p,n=5 if a.low else 7,rings=3)
    elif k=='W01':
        for z in (12,7,2,-3,-8,-14):
            for x in (-4.3,4.3):a.box((x,2.05,z),(.18,4.1,.18))
            a.box((0,4.1,z),(9,.2,.22))
        for x in (-4.3,4.3):a.box((x,4.1,-1),(.2,.2,28))
        for i in range(7):a.box((-4.05+i*1.35,4.2,-1),(.3,.08,28))
    elif k=='W02':
        table(a)
        for i in range(6):a.box((-1.2+i*.48,1.006,0),(.012,.008,1.2),'metal',bevel=0)
        for j in range(4):a.box((0,1.006,-.6+j*.4),(2.4,.008,.012),'metal',bevel=0)
        for i in range(12):
            p=part(a,'TILE');a.box((0,0,0),(.40,.045,.32),'paper',p)
            start=(-.96+(i%4)*.48,1.05,-.4+(i//4)*.4);end=(-.96+(i%5)*.48,1.05,-.4+(i//5)*.4)
            if i==6:end=(end[0]+.48,end[1],end[2])
            if i==7:end=(end[0]-.48,end[1],end[2])
            keys(p,'WORK_PLANNER',6,[(0,start,None),(1.5,start,None),(2.5,(start[0],1.15,start[2]),None),(4,end,None),(6,end,None)])
        p=part(a,'BREAK');a.box((0,0,0),(.4,.045,.32),'accent',p)
        move(p,'WORK_PLANNER',6,(.96,1.05,.4),(0,0,.8),delay=3,travel=1.5)
    elif k=='W03':
        table(a,2.6,.95,1.3)
        for x in (-1.15,1.15):a.box((x,1.2,-.45),(.055,.6,.055),'metal')
        a.box((0,1.5,-.45),(2.35,.055,.055),'metal')
        for i in range(3):
            p=part(a,'PAPER');a.box((0,0,0),(.6,.012,.55),'paper',p,bevel=0)
            move(p,'WORK_LOGGER',5,(-.7+i*.7,1.2,-.35),(.7-i*.7,-.2,.7),delay=i*.3,travel=2.5,rotation=0)
    elif k=='W04':
        a.box((0,.9,-.4),(2.8,.08,.1))
        for x in (-1.25,1.25):a.box((x,.65,-.4),(.1,1.3,.1))
        for i in range(3):
            p=part(a,'PANEL');a.box((0,0,0),(.75,.8,.06),'paper',p)
            pos=(-.9+i*.9,1.35,-.4)
            keys(p,'WORK_MUN',4,[(0,pos,(0,0,math.radians(12))),(1+i*.5,pos,(0,0,0)),(4,pos,(0,0,0))])
        for i in range(5):
            ang=PI*.1+i*PI*.2;a.box((math.cos(ang)*1.2,.25,math.sin(ang)*.75),(.24,.5,.24),'stone')
        p=part(a,'CYCLE');a.slab((0,0,0),.17,.17,'accent',p)
        move(p,'WORK_MUN',4,(1.1,1.75,-.4),(0,.12,0),delay=2.5,travel=1)
    elif k=='W05':
        a.box((0,.65,0),(2.4,1.3,1.2),'metal');a.box((0,1.32,-.15),(2,.035,.7),'light')
        for i in range(3):a.box((-.7+i*.7,1.344,-.15),(.43,.007,.5),'bark',bevel=0)
        p=part(a,'RECEIPT');a.box((0,0,0),(.35,.025,.42),'paper',p,bevel=0)
        keys(p,'WORK_SNRLED',6,[(0,(-.7,1.38,-.15),None),(1,(-.7,1.38,-.15),None),(2.5,(0,1.38,-.15),None),(3.5,(0,1.38,-.15),None),(5,(.7,1.38,-.15),None),(6,(.7,1.38,-.15),None)])
    elif k=='W06':
        for x in (-1.25,1.25):a.box((x,.9,0),(.1,1.8,1.2))
        a.box((0,.9,-.55),(2.6,1.8,.1))
        for i in range(6):a.box((0,.1+i*.32,0),(2.6,.055,1.2))
        for i in range(5):
            p=part(a,'SHEET');a.box((0,0,0),(2.15,.015,.8),'paper',p,bevel=0)
            move(p,'WORK_AURA',5,(0,.18+i*.32,.03),((i%2-.5)*.3,0,.35+i*.04),delay=i*.18,travel=2.5)
    elif k=='F01':
        for x in (-5,5):
            for j,z in enumerate((0,-5,-10)):tree(a,(x,0,z),height=7.2+(j%2)*.8)
    elif k=='F02':
        n=12 if a.low else 30;vs=[];colors=[]
        for i in range(n+1):
            t=i/n; w=1.2+1.8*t
            for s in (-1,1):vs.append((s*w,-.02,2-17*t));colors.append((1-.55*max(0,(t-.72)/.28),)*3+(1,))
        a.add(vs,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(n)],'stone',colors=colors)
    elif k=='F03':a.rock((0,0,0),(.4,1.8,.3),n=6 if a.low else 10,rings=3 if a.low else 5)
    elif k=='A01':
        for i in range(9):
            # Side bays keep the center camera corridor open throughout assembly.
            x=(-4.2 if i<5 else 4.2);z=4.5-(i if i<5 else i-5)*2.5
            p=part(a,'BAY')
            for q in (-.75,.75):a.box((0,2.5,q),(.16,5,.16),parent=p)
            for y in (.3,1.6,3,4.9):a.box((0,y,0),(.65,.1,1.7),parent=p)
            a.box((0,.08,0),(.8,.16,1.9),'stone',p)
            move(p,'AURA_STRUCTURE',3,(x,0,z),(0,-2.5,0),delay=i*.1,travel=1.8,rotation=math.radians(12 if i%2 else -12))
    elif k=='A02':
        for i,pos in enumerate(DOC_POS):
            p=part(a,'DOCUMENT');a.box((0,.425,0),(.6,.85,.008),'paper',p,bevel=0)
            for j in range(3):a.box((0,.25+j*.17,.006),(.42,.025,.004),'paper',p,bevel=0)
            move(p,'AURA_DOCUMENTS',4,pos,((i%3-1)*.6,.3*(i%2),.6),delay=i*.08,travel=2.7,rotation=math.radians((i%2*2-1)*22))
    elif k=='A03':
        edges=[(i,i+1) for i in range(8)]+[(0,3),(2,5),(4,7),(6,8)]
        for i,(u,v) in enumerate(edges):
            p=part(a,'STRAND');p['fromDocument']=u;p['toDocument']=v
            s,e=DOC_POS[u],DOC_POS[v];n=4 if a.low else 8
            points=[tuple(s[j]+(e[j]-s[j])*q/n+(math.sin(q/n*PI)*.16 if j==1 else 0) for j in range(3)) for q in range(n+1)]
            a.tube(points,[.012]*(n+1),'accent',p,sides=4 if a.low else 6)
    elif k=='A04':
        a.box((0,2,0),(.18,4,.18))
        for i in range(5):
            p=part(a,'SHELF');a.box((0,0,0),(3.5,.1,.55),parent=p)
            a.box((0,.057,0),(.65,.015,.35),'accent',p,bevel=0)
            move(p,'AURA_MODEL',3,(0,.55+i*.72,0),(0,-.6,0),delay=i*.14,travel=1.8)
    elif k=='C02':a.rock((0,0,0),(1.2,.45,.8),n=7 if a.low else 16,rings=4 if a.low else 8)
    else:raise ValueError(k)
    if k.startswith('W') and k!='W01':a.node('HOTSPOT',(0,1.2,0))
    return a.finalize()
