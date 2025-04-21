"""
Parser for complex entities (HATCH, SOLID, 3DFACE, MESH, 3DSOLID, BODY)
"""
from ..utils.encoder import format_points, round_point

def parse_hatch(entity, common_attrs):
    """Parse HATCH entity data"""
    data = {
        **common_attrs,
        'pattern_name': entity.dxf.pattern_name,
        'solid_fill': entity.dxf.solid_fill,
        'pattern_scale': round(entity.dxf.pattern_scale, 6) if hasattr(entity.dxf, 'pattern_scale') else 1.0,
        'pattern_angle': round(entity.dxf.pattern_angle, 6) if hasattr(entity.dxf, 'pattern_angle') else 0.0,
        'paths': len(entity.paths),
    }
    
    # Extract boundary paths for rendering
    try:
        boundary_paths = []
        for path in entity.paths:
            # Handle different types of paths
            if path.PATH_TYPE == 'EdgePath':
                path_data = {"type": "edge", "edges": []}
                for edge in path.edges:
                    if edge.EDGE_TYPE == 'LineEdge':
                        path_data["edges"].append({
                            "type": "line",
                            "start": round_point(edge.start),
                            "end": round_point(edge.end)
                        })
                    elif edge.EDGE_TYPE == 'ArcEdge':
                        path_data["edges"].append({
                            "type": "arc",
                            "center": round_point(edge.center),
                            "radius": round(edge.radius, 6),
                            "start_angle": round(edge.start_angle, 6),
                            "end_angle": round(edge.end_angle, 6)
                        })
                    elif edge.EDGE_TYPE == 'EllipseEdge':
                        path_data["edges"].append({
                            "type": "ellipse",
                            "center": round_point(edge.center),
                            "major_axis": round_point(edge.major_axis),
                            "ratio": round(edge.ratio, 6),
                            "start_angle": round(edge.start_angle, 6),
                            "end_angle": round(edge.end_angle, 6)
                        })
                    elif edge.EDGE_TYPE == 'SplineEdge':
                        points = []
                        if hasattr(edge, 'control_points'):
                            points = edge.control_points
                        elif hasattr(edge, 'points'):
                            points = edge.points
                        path_data["edges"].append({
                            "type": "spline",
                            "points": format_points(points),
                            "degree": edge.degree
                        })
                boundary_paths.append(path_data)
            elif path.PATH_TYPE == 'PolylinePath':
                path_data = {
                    "type": "polyline",
                    "points": format_points(path.vertices),
                    "closed": path.is_closed
                }
                boundary_paths.append(path_data)
                
        if boundary_paths:
            data['boundary_paths'] = boundary_paths
    except Exception as e:
        data['boundary_error'] = str(e)
    
    return data

def parse_solid(entity, common_attrs):
    """Parse SOLID entity data"""
    points = [
        getattr(entity.dxf, f'vtx{i}', [0, 0, 0]) 
        for i in range(4)
    ]
    return {
        **common_attrs,
        'points': format_points(points),
    }

def parse_3dface(entity, common_attrs):
    """Parse 3DFACE entity data"""
    points = [
        getattr(entity.dxf, f'vtx{i}', [0, 0, 0]) 
        for i in range(4)
    ]
    return {
        **common_attrs,
        'points': format_points(points),
    }

def parse_mesh(entity, common_attrs):
    """Parse MESH entity data"""
    try:
        vertices = format_points([v for v in entity.vertices()])
        faces = [f for f in entity.faces()]
        return {
            **common_attrs,
            'vertex_count': len(vertices),
            'face_count': len(faces),
            'vertices': vertices,
            'faces': faces
        }
    except Exception as ex:
        return {**common_attrs, 'error': str(ex)}

def parse_3dsolid(entity, common_attrs):
    """Parse 3DSOLID/BODY entity data"""
    return {
        **common_attrs,
        'acis_data': "Present" if hasattr(entity, 'acis_data') else "Not available",
    }