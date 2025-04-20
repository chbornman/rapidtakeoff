#!/usr/bin/env python3
"""
Simple DXF parser using ezdxf. Reads LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC entities and outputs JSON geometry.
"""
import sys
import json

try:
    import ezdxf
except ImportError:
    sys.stderr.write('ezdxf library is required. Install via pip install ezdxf\n')
    sys.exit(1)

def parse_dxf(filepath):
    try:
        doc = ezdxf.readfile(filepath)
    except Exception as e:
        sys.stderr.write(str(e) + '\n')
        sys.exit(1)
    msp = doc.modelspace()
    data = []
    for e in msp:
        etype = e.dxftype()
        if etype == 'LINE':
            start = e.dxf.start
            end = e.dxf.end
            data.append({
                'type': 'line',
                'x1': start[0], 'y1': start[1],
                'x2': end[0],   'y2': end[1]
            })
        elif etype in ('LWPOLYLINE', 'POLYLINE'):
            # Extract vertex coordinates for polylines
            points = []
            if etype == 'LWPOLYLINE':
                # get_points yields (x, y, bulge) tuples
                raw_pts = list(e.get_points())
                for pt in raw_pts:
                    points.append((pt[0], pt[1]))
            else:
                # POLYLINE: e.vertices is iterable of vertex objects
                verts = getattr(e, 'vertices', None)
                if verts is None or callable(verts):
                    # e.vertices may be a method in some versions
                    verts = e.vertices()
                for v in verts:
                    # v may be DXFVertex or tuple
                    if hasattr(v, 'dxf') and hasattr(v.dxf, 'location'):
                        loc = v.dxf.location
                        try:
                            x, y = loc.x, loc.y
                        except Exception:
                            x, y = loc[0], loc[1]
                    elif isinstance(v, (tuple, list)):
                        x, y = v[0], v[1]
                    else:
                        continue
                    points.append((x, y))
            # Build line segments
            for i in range(len(points) - 1):
                x1, y1 = points[i]
                x2, y2 = points[i+1]
                data.append({'type': 'line', 'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2})
            # Close polyline if needed
            if hasattr(e, 'closed') and e.closed and points:
                x1, y1 = points[-1]
                x2, y2 = points[0]
                data.append({'type': 'line', 'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2})
        elif etype == 'CIRCLE':
            center = e.dxf.center
            data.append({
                'type': 'circle',
                'cx': center[0], 'cy': center[1],
                'r': e.dxf.radius
            })
        elif etype == 'ARC':
            center = e.dxf.center
            data.append({
                'type': 'arc',
                'cx': center[0], 'cy': center[1],
                'r': e.dxf.radius,
                'start_angle': e.dxf.start_angle,
                'end_angle': e.dxf.end_angle
            })
    sys.stdout.write(json.dumps(data))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.stderr.write('Usage: parse_dxf.py <file.dxf>\n')
        sys.exit(1)
    parse_dxf(sys.argv[1])