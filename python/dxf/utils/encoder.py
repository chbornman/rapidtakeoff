"""
JSON encoder for DXF parsing with support for numpy and custom types
"""
import json
import array
import numpy as np
from ezdxf.math import Vec2, Vec3

class DXFEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle numpy arrays and other special types"""
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