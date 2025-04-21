"""
Parser for text entities (TEXT, MTEXT, DIMENSION)
"""
from ..utils.encoder import round_point

def parse_text(entity, common_attrs):
    """Parse TEXT/MTEXT entity data"""
    return {
        **common_attrs,
        'text': entity.dxf.text if hasattr(entity.dxf, 'text') else '',
        'insert': round_point(entity.dxf.insert if hasattr(entity.dxf, 'insert') else (0, 0)),
        'height': round(entity.dxf.height, 6) if hasattr(entity.dxf, 'height') else 1.0,
        'rotation': round(entity.dxf.rotation, 6) if hasattr(entity.dxf, 'rotation') else 0.0,
    }

def parse_dimension(entity, common_attrs):
    """Parse DIMENSION entity data"""
    return {
        **common_attrs,
        'dimtype': entity.dimtype if hasattr(entity, 'dimtype') else None,
        'defpoint': round_point(entity.dxf.defpoint),
        'text_midpoint': round_point(entity.dxf.text_midpoint) if hasattr(entity.dxf, 'text_midpoint') else None,
        'actual_measurement': round(entity.measurement, 6) if hasattr(entity, 'measurement') else None,
    }