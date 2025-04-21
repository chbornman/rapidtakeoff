#!/usr/bin/env python3
"""
Enhanced DXF parser that extracts entities from a DXF file grouped by layer,
and outputs a JSON structure to stdout. Uses ezdxf for optimal DXF support.
"""
import sys
import json
import array
import argparse
import numpy as np
from typing import Dict, List, Any, Union, Optional

try:
    import ezdxf
    from ezdxf.math import Vec2, Vec3
    from ezdxf.addons.drawing import Frontend, RenderContext
    from ezdxf.addons.drawing.properties import LayoutProperties
except ImportError:
    sys.stderr.write('Error: ezdxf is required. Install via pip install ezdxf\n')
    sys.exit(1)

# Custom JSON encoder to handle numpy arrays and other special types
class DXFEncoder(json.JSONEncoder):
    def default(self, obj):
        # Handle numpy arrays
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        # Handle array.array objects
        elif isinstance(obj, array.array):
            return list(obj)
        # Handle vectors
        elif isinstance(obj, (Vec2, Vec3)):
            if hasattr(obj, 'z'):
                return [obj.x, obj.y, obj.z]
            return [obj.x, obj.y]
        # Handle other numpy types
        elif isinstance(obj, (np.int_, np.intc, np.intp, np.int8, np.int16, np.int32, np.int64, 
                             np.uint8, np.uint16, np.uint32, np.uint64)):
            return int(obj)
        elif isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, (np.bool_)):
            return bool(obj)
        # Let the base encoder handle the rest
        return super().default(obj)

def round_point(point, precision=6):
    """Round coordinates in a point to specified precision"""
    if isinstance(point, (list, tuple)):
        return [round(v, precision) for v in point]
    elif isinstance(point, np.ndarray):
        return [round(float(v), precision) for v in point]
    elif isinstance(point, (Vec2, Vec3)):
        if hasattr(point, 'z'):
            return [round(point.x, precision), round(point.y, precision), round(point.z, precision)]
        return [round(point.x, precision), round(point.y, precision)]
    elif hasattr(point, 'x') and hasattr(point, 'y'):
        return [round(point.x, precision), round(point.y, precision)]
    return point

def format_points(points, precision=6):
    """Format a list of points to specified precision"""
    return [round_point(p, precision) for p in points]

def parse_dxf(filepath: str, config: Optional[Dict[str, Any]] = None) -> Dict[str, List[Dict[str, Any]]]:
    """
    Parse DXF file using ezdxf and extract entity data.
    
    Args:
        filepath: Path to the DXF file
        config: Optional configuration parameters
        
    Returns:
        Dict mapping layer names to lists of entity data
    """
    try:
        doc = ezdxf.readfile(filepath)
    except Exception as e:
        sys.stderr.write(f'Error reading DXF file: {e}\n')
        sys.exit(1)
    
    msp = doc.modelspace()
    tree = {}
    
    # Create a RenderContext to get access to the drawing properties
    # This helps with colors, line types, and other graphical properties
    # Setup rendering context
    render_context = None
    frontend = None
    try:
        render_context = RenderContext(doc)
        layout_properties = LayoutProperties.from_layout(msp)
        frontend = Frontend(render_context, layout_properties)
    except Exception as e:
        sys.stderr.write(f'Warning: Could not create render context: {e}\n')
    
    # Process each entity in the model space
    for e in msp:
        etype = e.dxftype()
        layer = e.dxf.layer
        
        # Common attributes for all entities
        common_attrs = {
            'type': etype,
            'handle': e.dxf.handle,
            'layer': layer
        }
        
        # Add color information if available
        try:
            if hasattr(e.dxf, 'color'):
                color_value = e.dxf.color
                common_attrs['color'] = color_value
                # Try to get the actual RGB color
                if render_context:
                    try:
                        rgb = render_context.colors.get_color(e)
                        if rgb:
                            common_attrs['rgb'] = rgb.hex_rgb()
                    except:
                        pass
        except Exception:
            pass
            
        # Add linetype information if available
        try:
            if hasattr(e.dxf, 'linetype'):
                common_attrs['linetype'] = e.dxf.linetype
        except Exception:
            pass
        
        # Entity-specific attributes
        data = None
        
        # --------- BASIC GEOMETRIC ENTITIES ---------
        if etype == 'LINE':
            data = {
                **common_attrs,
                'start': round_point(e.dxf.start),
                'end': round_point(e.dxf.end),
            }
        
        elif etype == 'POINT':
            data = {
                **common_attrs,
                'location': round_point(e.dxf.location),
            }
        
        elif etype == 'CIRCLE':
            data = {
                **common_attrs,
                'center': round_point(e.dxf.center),
                'radius': round(e.dxf.radius, 6),
            }
        
        elif etype == 'ARC':
            data = {
                **common_attrs,
                'center': round_point(e.dxf.center),
                'radius': round(e.dxf.radius, 6),
                'start_angle': round(e.dxf.start_angle, 6),
                'end_angle': round(e.dxf.end_angle, 6),
            }
            
            # Add SVG arc flags for easier rendering
            # Arc direction: CCW (counter-clockwise) is the default for DXF
            is_large_arc = abs(e.dxf.end_angle - e.dxf.start_angle) > 180
            is_ccw = True  # DXF arcs are CCW by default
            data['large_arc'] = is_large_arc
            data['sweep'] = is_ccw
        
        elif etype == 'ELLIPSE':
            data = {
                **common_attrs,
                'center': round_point(e.dxf.center),
                'major_axis': round_point(e.dxf.major_axis),
                'ratio': round(e.dxf.ratio, 6),
                'start_param': round(e.dxf.start_param, 6),
                'end_param': round(e.dxf.end_param, 6),
            }
            
            # Try to calculate actual start and end angles for easier rendering
            try:
                start_angle = e.start_angle
                end_angle = e.end_angle
                data['start_angle'] = round(start_angle, 6)
                data['end_angle'] = round(end_angle, 6)
            except Exception:
                pass
        
        # --------- CURVE ENTITIES ---------
        elif etype == 'LWPOLYLINE':
            points = e.get_points()
            data = {
                **common_attrs,
                'points': format_points(points),
                'closed': e.closed,
                'const_width': e.dxf.const_width if hasattr(e.dxf, 'const_width') else 0,
            }
        
        elif etype == 'POLYLINE':
            if hasattr(e, 'vertices'):
                points = [v.dxf.location for v in e.vertices]
                data = {
                    **common_attrs,
                    'points': format_points(points),
                    'closed': e.closed if hasattr(e, 'closed') else False,
                }
            else:
                data = {**common_attrs, 'error': 'No vertices found'}
        
        elif etype == 'SPLINE':
            try:
                data = {
                    **common_attrs,
                    'degree': e.dxf.degree,
                    'closed': e.closed,
                    'control_points': format_points(e.control_points),
                }
                
                # Handle knots - in different ezdxf versions this might be a property or a method
                if hasattr(e, 'knots'):
                    if callable(e.knots):
                        data['knots'] = [round(k, 6) for k in e.knots()]
                    else:
                        data['knots'] = [round(k, 6) for k in e.knots]
                        
                # Handle weights - in different ezdxf versions this might be a property or a method
                if hasattr(e, 'weights'):
                    if callable(e.weights):
                        data['weights'] = [round(w, 6) for w in e.weights()]
                    else:
                        data['weights'] = [round(w, 6) for w in e.weights]
                        
                # Get approximation points for easier rendering
                try:
                    if hasattr(e, 'approximate'):
                        segments = min(32, max(8, e.dxf.degree * 8))  # More segments for higher degree
                        points = list(e.approximate(segments=segments))
                        data['points'] = format_points(points)
                except Exception:
                    pass
            except Exception as ex:
                data = {
                    **common_attrs,
                    'error': f"Failed to process SPLINE: {str(ex)}",
                    'degree': e.dxf.degree if hasattr(e.dxf, 'degree') else None,
                }
        
        elif etype == 'HELIX':
            data = {
                **common_attrs,
                'axis_start_point': round_point(e.dxf.axis_start_point),
                'axis_end_point': round_point(e.dxf.axis_end_point),
                'radius': round(e.dxf.radius, 6),
                'turns': round(e.dxf.turns, 6),
            }
        
        elif etype == 'LEADER':
            data = {
                **common_attrs,
                'vertices': format_points(e.vertices),
            }
        
        # --------- COMPLEX ENTITIES ---------
        elif etype == 'HATCH':
            data = {
                **common_attrs,
                'pattern_name': e.dxf.pattern_name,
                'solid_fill': e.dxf.solid_fill,
                'pattern_scale': round(e.dxf.pattern_scale, 6) if hasattr(e.dxf, 'pattern_scale') else 1.0,
                'pattern_angle': round(e.dxf.pattern_angle, 6) if hasattr(e.dxf, 'pattern_angle') else 0.0,
                'paths': len(e.paths),
            }
            
            # Extract boundary paths for rendering
            try:
                boundary_paths = []
                for path in e.paths:
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
        
        elif etype == 'SOLID':
            points = [
                getattr(e.dxf, f'vtx{i}', [0, 0, 0]) 
                for i in range(4)
            ]
            data = {
                **common_attrs,
                'points': format_points(points),
            }
        
        elif etype == '3DFACE':
            points = [
                getattr(e.dxf, f'vtx{i}', [0, 0, 0]) 
                for i in range(4)
            ]
            data = {
                **common_attrs,
                'points': format_points(points),
            }
        
        elif etype == 'MESH':
            try:
                vertices = format_points([v for v in e.vertices()])
                faces = [f for f in e.faces()]
                data = {
                    **common_attrs,
                    'vertex_count': len(vertices),
                    'face_count': len(faces),
                    'vertices': vertices,
                    'faces': faces
                }
            except Exception as ex:
                data = {**common_attrs, 'error': str(ex)}
        
        elif etype == '3DSOLID' or etype == 'BODY':
            data = {
                **common_attrs,
                'acis_data': "Present" if hasattr(e, 'acis_data') else "Not available",
            }
        
        # --------- DIMENSION ENTITIES ---------
        elif etype == 'DIMENSION':
            data = {
                **common_attrs,
                'dimtype': e.dimtype if hasattr(e, 'dimtype') else None,
                'defpoint': round_point(e.dxf.defpoint),
                'text_midpoint': round_point(e.dxf.text_midpoint) if hasattr(e.dxf, 'text_midpoint') else None,
                'actual_measurement': round(e.measurement, 6) if hasattr(e, 'measurement') else None,
            }
        
        elif etype == 'MTEXT' or etype == 'TEXT':
            data = {
                **common_attrs,
                'text': e.dxf.text if hasattr(e.dxf, 'text') else '',
                'insert': round_point(e.dxf.insert if hasattr(e.dxf, 'insert') else (0, 0)),
                'height': round(e.dxf.height, 6) if hasattr(e.dxf, 'height') else 1.0,
                'rotation': round(e.dxf.rotation, 6) if hasattr(e.dxf, 'rotation') else 0.0,
            }
        
        # --------- ORGANIZATIONAL ENTITIES ---------
        elif etype == 'INSERT':
            data = {
                **common_attrs,
                'name': e.dxf.name,
                'insert': round_point(e.dxf.insert),
                'rotation': round(e.dxf.rotation, 6),
                'scale': [
                    round(getattr(e.dxf, 'xscale', 1.0), 6),
                    round(getattr(e.dxf, 'yscale', 1.0), 6),
                    round(getattr(e.dxf, 'zscale', 1.0), 6)
                ],
            }
            
            # Try to expand block references for better rendering
            try:
                if hasattr(e, 'virtual_entities'):
                    blockname = e.dxf.name
                    data['entities'] = []
                    
                    for virtual_entity in e.virtual_entities():
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
        
        # --------- ADVANCED ENTITIES ---------
        elif etype == 'IMAGE':
            data = {
                **common_attrs,
                'insert': round_point(e.dxf.insert),
                'image_size': [
                    round(e.dxf.image_size_u, 6),
                    round(e.dxf.image_size_v, 6)
                ],
                'image_def_handle': e.dxf.image_def_handle,
            }
        
        elif etype == 'WIPEOUT':
            data = {
                **common_attrs,
                'vertices': format_points(e.vertices() if hasattr(e, 'vertices') else []),
            }
        
        elif etype == 'ACAD_TABLE':
            data = {
                **common_attrs,
                'insert': round_point(e.dxf.insert),
                'num_rows': e.dxf.num_rows if hasattr(e.dxf, 'num_rows') else 0,
                'num_cols': e.dxf.num_cols if hasattr(e.dxf, 'num_cols') else 0,
            }
        
        elif etype == 'MLINE':
            data = {
                **common_attrs,
                'style_name': e.dxf.style_name if hasattr(e.dxf, 'style_name') else '',
                'vertices': format_points(e.vertices()),
            }
        
        elif etype == 'ATTDEF' or etype == 'ATTRIB':
            data = {
                **common_attrs,
                'tag': e.dxf.tag if hasattr(e.dxf, 'tag') else '',
                'text': e.dxf.text if hasattr(e.dxf, 'text') else '',
                'insert': round_point(e.dxf.insert if hasattr(e.dxf, 'insert') else (0, 0)),
            }
        
        # --------- CATCH-ALL FOR OTHER ENTITIES ---------
        else:
            # Include basic information for unsupported entity types
            data = {
                **common_attrs,
                'unsupported': True,
            }
        
        # Add the entity data to the tree, grouped by layer
        if data:
            tree.setdefault(layer, []).append(data)
    
    return tree

def main():
    parser = argparse.ArgumentParser(description='Parse DXF file and output JSON data')
    parser.add_argument('file', help='Path to DXF file')
    parser.add_argument('--config', help='JSON configuration string')
    args = parser.parse_args()
    
    config = None
    if args.config:
        try:
            config = json.loads(args.config)
        except json.JSONDecodeError:
            sys.stderr.write('Error: Invalid JSON configuration\n')
            sys.exit(1)
    
    try:
        tree = parse_dxf(args.file, config)
        json.dump(tree, sys.stdout, cls=DXFEncoder)
    except Exception as e:
        sys.stderr.write(f'Error: {str(e)}\n')
        sys.exit(1)

if __name__ == '__main__':
    main()