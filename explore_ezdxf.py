#!/usr/bin/env python3
"""
Explore ezdxf configuration options
"""
import sys
try:
    import ezdxf
    from ezdxf.addons.drawing import RenderContext, Frontend
    from ezdxf.addons.drawing.svg import SVGBackend
    from ezdxf.addons.drawing.config import *
except ImportError:
    sys.stderr.write('Could not import ezdxf modules\n')
    sys.exit(1)

# Print available policies
print("Available rendering policies:")

# LineweightPolicy
try:
    print("\nLineweightPolicy options:")
    for attr in dir(LineweightPolicy):
        if not attr.startswith('_'):
            print(f"  - {attr}")
except NameError:
    print("  LineweightPolicy not available")

# TextPolicy
try:
    print("\nTextPolicy options:")
    for attr in dir(TextPolicy):
        if not attr.startswith('_'):
            print(f"  - {attr}")
except NameError:
    print("  TextPolicy not available")

# ColorPolicy
try:
    print("\nColorPolicy options:")
    for attr in dir(ColorPolicy):
        if not attr.startswith('_'):
            print(f"  - {attr}")
except NameError:
    print("  ColorPolicy not available")

# Check SVGBackend properties
print("\nSVGBackend properties:")
backend = SVGBackend()
for attr in dir(backend):
    if not attr.startswith('_') and not callable(getattr(backend, attr)):
        try:
            print(f"  - {attr}: {getattr(backend, attr)}")
        except:
            print(f"  - {attr}: <error accessing value>")