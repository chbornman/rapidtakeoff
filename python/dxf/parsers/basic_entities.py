"""
Parser for basic geometric entities (LINE, POINT, CIRCLE, ARC, ELLIPSE)
"""
from ..utils.encoder import round_point

def parse_line(entity, common_attrs):
    """Parse LINE entity data"""
    return {
        **common_attrs,
        'start': round_point(entity.dxf.start),
        'end': round_point(entity.dxf.end),
    }

def parse_point(entity, common_attrs):
    """Parse POINT entity data"""
    return {
        **common_attrs,
        'location': round_point(entity.dxf.location),
    }

def parse_circle(entity, common_attrs):
    """Parse CIRCLE entity data"""
    return {
        **common_attrs,
        'center': round_point(entity.dxf.center),
        'radius': round(entity.dxf.radius, 6),
    }

def parse_arc(entity, common_attrs):
    """Parse ARC entity data"""
    data = {
        **common_attrs,
        'center': round_point(entity.dxf.center),
        'radius': round(entity.dxf.radius, 6),
        'start_angle': round(entity.dxf.start_angle, 6),
        'end_angle': round(entity.dxf.end_angle, 6),
    }
    
    # Add SVG arc flags for easier rendering
    # Arc direction: CCW (counter-clockwise) is the default for DXF
    is_large_arc = abs(entity.dxf.end_angle - entity.dxf.start_angle) > 180
    is_ccw = True  # DXF arcs are CCW by default
    data['large_arc'] = is_large_arc
    data['sweep'] = is_ccw
    
    return data

def parse_ellipse(entity, common_attrs):
    """Parse ELLIPSE entity data"""
    data = {
        **common_attrs,
        'center': round_point(entity.dxf.center),
        'major_axis': round_point(entity.dxf.major_axis),
        'ratio': round(entity.dxf.ratio, 6),
        'start_param': round(entity.dxf.start_param, 6),
        'end_param': round(entity.dxf.end_param, 6),
    }
    
    # Try to calculate actual start and end angles for easier rendering
    try:
        start_angle = entity.start_angle
        end_angle = entity.end_angle
        data['start_angle'] = round(start_angle, 6)
        data['end_angle'] = round(end_angle, 6)
    except Exception:
        pass
    
    return data