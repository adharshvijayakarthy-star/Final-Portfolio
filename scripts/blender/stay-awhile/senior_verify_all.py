"""Refresh offline evidence after the last source save; does not edit masters."""
import sys,runpy
from pathlib import Path
H=Path(__file__).resolve().parent;sys.path.insert(0,str(H));R=H.parents[2]
for name,args in [('senior_integrity.py',[]),('audit_masters.py',[]),('verify_final_inclusion.py',[]),('senior_check_rails.py',[]),('validate.py',['--',str(R)]),('verify_motion.py',['--',str(R)])]:
    print('CHECK_BEGIN',name,flush=True);sys.argv=[str(H/name),*args];runpy.run_path(str(H/name),run_name='__main__')
    print('CHECK_END',name,flush=True)
