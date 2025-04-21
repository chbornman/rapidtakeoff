"""
Parser for organizational entities (INSERT, ATTDEF, ATTRIB)
"""
from ..utils.encoder import round_point

def parse_insert(entity, common_attrs):
    """Parse INSERT entity data"""
    data = {
        **common_attrs,
        'name': entity.dxf.name,
        'insert': round_point(entity.dxf.insert),
        'rotation': round(entity.dxf.rotation, 6),
        'scale': [
            round(getattr(entity.dxf, 'xscale', 1.0), 6),
            round(getattr(entity.dxf, 'yscale', 1.0), 6),
            round(getattr(entity.dxf, 'zscale', 1.0), 6)
        ],
    }
    
    # Try to expand block references for better rendering
    try:
        if hasattr(entity, 'virtual_entities'):
            blockname = entity.dxf.name
            data['entities'] = []
            
            for virtual_entity in entity.virtual_entities():
                ve_type = virtual_entity.dxftype()
                ve_data = {
                    'type': ve_type,
                    'handle': virtual_entity.dxf.handle,
                    'block': blockname
                }
                
                # Handle specific entity types
                if ve_type == 'LINE':
                    ve_data.update({
                        'start': round_point(virtual_entity.dxf.start),
                        'end': round_point(virtual_entity.dxf.end)
                    })
                elif ve_type == 'CIRCLE':
                    ve_data.update({
                        'center': round_point(virtual_entity.dxf.center),
                        'radius': round(virtual_entity.dxf.radius, 6)
                    })
                elif ve_type == 'ARC':
                    ve_data.update({
                        'center': round_point(virtual_entity.dxf.center),
                        'radius': round(virtual_entity.dxf.radius, 6),
                        'start_angle': round(virtual_entity.dxf.start_angle, 6),
                        'end_angle': round(virtual_entity.dxf.end_angle, 6)
                    })
                elif ve_type == 'TEXT' or ve_type == 'MTEXT':
                    ve_data.update({
                        'text': virtual_entity.dxf.text if hasattr(virtual_entity.dxf, 'text') else '',
                        'insert': round_point(virtual_entity.dxf.insert if hasattr(virtual_entity.dxf, 'insert') else (0, 0)),
                        'height': round(virtual_entity.dxf.height, 6) if hasattr(virtual_entity.dxf, 'height') else 1.0
                    })
                
                data['entities'].append(ve_data)
    except Exception as ex:
        data['block_error'] = str(ex)
        
    return data

def parse_attribute(entity, common_attrs):
    """Parse ATTDEF/ATTRIB entity data"""
    return {
        **common_attrs,
        'tag': entity.dxf.tag if hasattr(entity.dxf, 'tag') else '',
        'text': entity.dxf.text if hasattr(entity.dxf, 'text') else '',
        'insert': round_point(entity.dxf.insert if hasattr(entity.dxf, 'insert') else (0, 0)),
    }