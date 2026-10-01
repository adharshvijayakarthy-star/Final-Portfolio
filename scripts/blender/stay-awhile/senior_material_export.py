"""Resolve supported constant/image/vertex-color multiply graphs for glTF parity."""
def describe(materials):
    out={}
    def socket(sock,depth=0):
        assert depth<20
        if not sock.is_linked:
            val=sock.default_value
            return (list(val) if hasattr(val,'__len__') else [val]*4),False
        node=sock.links[0].from_node
        if node.type=='TEX_IMAGE':return [1,1,1,1],False
        if node.type in ('VERTEX_COLOR','ATTRIBUTE'):return [1,1,1,1],True
        if node.type=='RGB':return list(node.outputs[0].default_value),False
        if node.type=='MIX_RGB' and node.blend_type=='MULTIPLY' and node.inputs[0].default_value==1:
            a,av=socket(node.inputs[1],depth+1);b,bv=socket(node.inputs[2],depth+1)
            return [x*y for x,y in zip(a,b)],av or bv
        raise ValueError(('Unsupported base color graph',node.name,node.type))
    for m in materials:
        if not m or not m.use_nodes:continue
        p=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
        if not p:continue
        factor,vertex=socket(p.inputs['Base Color'])
        out[m.name]={'baseColorFactor':factor,'usesVertexColor':vertex}
    return out
