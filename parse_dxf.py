#!/usr/bin/env python3
"""
Extract components (lines, arcs, text) from a DXF file grouped by layer,
and output a JSON structure to stdout.
"""
import sys
import json

try:
    import ezdxf
except ImportError:
    sys.stderr.write('Error: ezdxf is required. Install via pip install ezdxf\n')
    sys.exit(1)

def parse_dxf(filepath):
    try:
        doc = ezdxf.readfile(filepath)
    except Exception as e:
        sys.stderr.write(f'Error reading DXF file: {e}\n')
        sys.exit(1)
    msp = doc.modelspace()
    tree = {}
    for e in msp:
        etype = e.dxftype()
        layer = e.dxf.layer
        data = None
        if etype == 'LINE':
            data = {
                'type': 'LINE',
                'start': [round(e.dxf.start[0], 6), round(e.dxf.start[1], 6)],
                'end': [round(e.dxf.end[0], 6), round(e.dxf.end[1], 6)],
            }
        elif etype == 'ARC':
            data = {
                'type': 'ARC',
                'center': [round(e.dxf.center[0], 6), round(e.dxf.center[1], 6)],
                'radius': round(e.dxf.radius, 6),
                'start_angle': round(e.dxf.start_angle, 6),
                'end_angle': round(e.dxf.end_angle, 6),
            }
        elif etype == 'TEXT':
            data = {
                'type': 'TEXT',
                'text': e.dxf.text,
                'insert': [round(e.dxf.insert[0], 6), round(e.dxf.insert[1], 6)],
                'height': round(e.dxf.height, 6),
                'rotation': round(e.dxf.rotation, 6),
            }
        else:
            continue
        tree.setdefault(layer, []).append(data)
    json.dump(tree, sys.stdout)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.stderr.write('Usage: parse_dxf.py <file.dxf>\n')
        sys.exit(1)
    parse_dxf(sys.argv[1])