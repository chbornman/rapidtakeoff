"""
Parser for advanced entities (IMAGE, WIPEOUT, ACAD_TABLE, MLINE)
"""
from ..utils.encoder import round_point, format_points

def parse_image(entity, common_attrs):
    """Parse IMAGE entity data"""
    return {
        **common_attrs,
        'insert': round_point(entity.dxf.insert),
        'image_size': [
            round(entity.dxf.image_size_u, 6),
            round(entity.dxf.image_size_v, 6)
        ],
        'image_def_handle': entity.dxf.image_def_handle,
    }

def parse_wipeout(entity, common_attrs):
    """Parse WIPEOUT entity data"""
    return {
        **common_attrs,
        'vertices': format_points(entity.vertices() if hasattr(entity, 'vertices') else []),
    }

def parse_acad_table(entity, common_attrs):
    """Parse ACAD_TABLE entity data"""
    return {
        **common_attrs,
        'insert': round_point(entity.dxf.insert),
        'num_rows': entity.dxf.num_rows if hasattr(entity.dxf, 'num_rows') else 0,
        'num_cols': entity.dxf.num_cols if hasattr(entity.dxf, 'num_cols') else 0,
    }

def parse_mline(entity, common_attrs):
    """Parse MLINE entity data"""
    return {
        **common_attrs,
        'style_name': entity.dxf.style_name if hasattr(entity.dxf, 'style_name') else '',
        'vertices': format_points(entity.vertices()),
    }