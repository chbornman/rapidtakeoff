"""
Parser for curve entities (LWPOLYLINE, POLYLINE, SPLINE, HELIX, LEADER)
"""
from ..utils.encoder import format_points, round_point

def parse_lwpolyline(entity, common_attrs):
    """Parse LWPOLYLINE entity data"""
    points = entity.get_points()
    return {
        **common_attrs,
        'points': format_points(points),
        'closed': entity.closed,
        'const_width': entity.dxf.const_width if hasattr(entity.dxf, 'const_width') else 0,
    }

def parse_polyline(entity, common_attrs):
    """Parse POLYLINE entity data"""
    if hasattr(entity, 'vertices'):
        points = [v.dxf.location for v in entity.vertices]
        return {
            **common_attrs,
            'points': format_points(points),
            'closed': entity.closed if hasattr(entity, 'closed') else False,
        }
    else:
        return {**common_attrs, 'error': 'No vertices found'}

def parse_spline(entity, common_attrs):
    """Parse SPLINE entity data"""
    try:
        data = {
            **common_attrs,
            'degree': entity.dxf.degree,
            'closed': entity.closed,
            'control_points': format_points(entity.control_points),
        }
        
        # Handle knots - in different ezdxf versions this might be a property or a method
        if hasattr(entity, 'knots'):
            if callable(entity.knots):
                data['knots'] = [round(k, 6) for k in entity.knots()]
            else:
                data['knots'] = [round(k, 6) for k in entity.knots]
                
        # Handle weights - in different ezdxf versions this might be a property or a method
        if hasattr(entity, 'weights'):
            if callable(entity.weights):
                data['weights'] = [round(w, 6) for w in entity.weights()]
            else:
                data['weights'] = [round(w, 6) for w in entity.weights]
                
        # Get approximation points for easier rendering
        try:
            if hasattr(entity, 'approximate'):
                segments = min(32, max(8, entity.dxf.degree * 8))  # More segments for higher degree
                points = list(entity.approximate(segments=segments))
                data['points'] = format_points(points)
        except Exception:
            pass
        
        return data
    except Exception as ex:
        return {
            **common_attrs,
            'error': f"Failed to process SPLINE: {str(ex)}",
            'degree': entity.dxf.degree if hasattr(entity.dxf, 'degree') else None,
        }

def parse_helix(entity, common_attrs):
    """Parse HELIX entity data"""
    return {
        **common_attrs,
        'axis_start_point': round_point(entity.dxf.axis_start_point),
        'axis_end_point': round_point(entity.dxf.axis_end_point),
        'radius': round(entity.dxf.radius, 6),
        'turns': round(entity.dxf.turns, 6),
    }

def parse_leader(entity, common_attrs):
    """Parse LEADER entity data"""
    return {
        **common_attrs,
        'vertices': format_points(entity.vertices),
    }