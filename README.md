# RapidTakeoff

RapidTakeoff is a CAD-to-Estimate application that helps automate Quantity Takeoff (QTO) directly from architectural CAD files.

## Supported DXF Features

RapidTakeoff supports a comprehensive set of DXF entity types for visualization and selection:

### Basic Geometric Entities
- **LINE**: Simple straight line segments
- **CIRCLE**: Perfect circles defined by center point and radius
- **ARC**: Portion of a circle defined by center, radius, and angles
- **POINT**: Single point with optional display characteristics
- **ELLIPSE**: Oval shapes defined by center, major axis, and ratio

### Curve Entities
- **SPLINE**: Curved lines defined by control points (NURBS)
- **POLYLINE**: Connected line segments (legacy format)
- **LWPOLYLINE**: Lightweight polyline (more efficient version)
- **HELIX**: 3D spiral shapes
- **LEADER**: Lines with arrows pointing to annotations

### Complex Entities
- **HATCH**: Filled areas with patterns
- **SOLID**: Filled triangles or quadrilaterals
- **3DFACE**: 3D triangular or quadrilateral faces
- **MESH**: 3D surface meshes
- **BODY, 3DSOLID**: 3D volumetric objects

### Dimension Entities
- **DIMENSION**: Linear, angular, radial dimensions
- **MTEXT**: Multi-line text
- **TEXT**: Single-line text
- **MLEADER**: Multi-leader annotations

### Organizational Entities
- **INSERT**: Block insertions (instances of blocks)
- **BLOCK**: Reusable groups of entities
- **LAYER**: Organizational layers

### Advanced Entities
- **IMAGE**: Raster image references
- **WIPEOUT**: Masked areas
- **ACAD_TABLE**: Table objects
- **MLINE**: Multi-line (parallel lines)
- **ATTDEF/ATTRIB**: Block attribute definitions/instances

## Development

Install JavaScript dependencies:

```bash
bun install
```

Install Python dependencies (for DXF parsing). To avoid system Python issues, use a virtual environment:

```bash
# Create and activate a venv (one-time setup)
python3 -m venv .venv
source .venv/bin/activate

# Then install requirements (includes ezdxf, svgwrite, and pillow for the drawing add-on)
pip install -r requirements.txt
```

If you prefer not to use a virtualenv, you can install as a user package:

```bash
pip3 install --user --break-system-packages -r requirements.txt
```

Start the app in development mode:

```bash
# Using the development launcher script (recommended)
chmod +x dev.sh
./dev.sh

# Or manual steps:
# Activate the Python virtual environment so Electron can find ezdxf:
source .venv/bin/activate
# Then start development servers:
bun run dev
```

## Build

```bash
bun run build
bun run start
```