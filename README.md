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

## How canvas works

    Here’s a high‐level tour of how the “canvas” is wired up, step by step:

    1. File‑to‑JSON (DXFData)
      – In your Electron main process (main.ts) you hook up an IPC handler, “parse‑dxf‑tree”, which shells out to parse_dxf.py and returns a JSON string.
      – That JSON is parsed into a DXFData object in the renderer.  In components/types.ts you’ll see:
        export interface DXFData {
          [layerName: string]: Entity[]
        }
      – Each Entity carries a type (“LINE”, “CIRCLE”, etc.) plus the params you need (start/end points, radius, control points…).

    2. Home → DxfCanvas
      – In pages/index.tsx, when you pick a file, you call
        window.electron.parseDXFTree(path) → JSON → setDxfData(data)
      – You also build up a layerVisibility map (all on by default) and track one selectedFeature.
      – Finally you render:
        <DxfCanvas
          dxfData={dxfData}
          layerVisibility={layerVisibility}
          selectedFeature={selectedFeature}
          onFeatureSelect={setSelectedFeature}
          rendererConfig={rendererConfig}
        />

    3. DxfCanvas internals (components/DxfCanvas.tsx)
      – State & Refs
        • zoom / offset in React state
        • originalBoundsRef holds the world‑coordinate bounding box of all entities (computed in autoFitContent)
        • svgRef and containerRef to drive transforms and hit‑testing

      – Mouse + Wheel
        The outer <div ref={containerRef}> has listeners for mousedown/move/up (pan) and wheel (zoom in/out) that update offset and zoom.

      – Fitting & Centering
        On first load (or when dxfData changes) a useEffect calls autoFitContent(), which:
          • Walks every entity’s coordinates, updates a minX/minY/maxX/maxY
          • Stores that in originalBoundsRef
          • Computes a “fit” zoom & offset so the drawing is centered in the <svg> viewport

      – Rendering
        You actually render a single <svg> with a CSS transform:
          <style> transform: translate(${offset.x}px,${offset.y}px) scale(${zoom}) </style>

        Inside the <svg>:
         • A <g pointerEvents="none"> before your actual geometry, which:
          – Draws two <line>s (the X‑ and Y‑axes) stretched out to the edges of your world box.  Colors come from rendererConfig.canvas.colors.xAxis / …yAxis or default to red/blue.
         • A second conditional block that, if you have any data, draws your drawing’s bounding box:
          – A semi‑transparent <rect> fill (using canvas.colors.boundingBox)
          – Four little corner markers (short lines)
          – A dashed <rect> outline around the full minX/minY→maxX/maxY

        Then you loop over each layer:
          Object.entries(dxfData).map(([layerName, entities]) => … )
          skip it if layerVisibility[layerName] is false, otherwise:
          render <g data-layer={layerName}> and inside that
          entities.map((entity, idx) => <DxfEntity … />)

    4. DxfEntity → Primitive SVG
      – In components/entities/DxfEntity.tsx you inspect entity.type and switch to the matching component:
        case 'LINE'   → <LineEntity …/>  (renders <line>),
        case 'CIRCLE' → <CircleEntity …/> (renders <circle>),
        case 'ARC'    → <ArcEntity …/>   (renders <path>),
        …falling back to <GenericEntity> for anything else.

      – Each of those components lives in components/entities/*.tsx and just spits out the appropriate SVG tag(s), hooking up onClick to call back up to DxfCanvas so you can highlight/select.

    So—in practice—any DXF file you load becomes a DXFData object, handed to DxfCanvas, which:

    • Computes the union bounding box
    • Auto‑fits & centers the view
    • Applies pan/zoom transforms via CSS
    • Draws helper graphics (axes, bounding box) in front of that
    • Iterates each layer → each entity → renders it as SVG primitives via DxfEntity

    If you want to tweak or add new decorations—say you wanted a grid behind everything—you’d drop another <g> (probably right after the axes layer) and draw whatever <line> or <rect> grid pattern you need, using
    the same coordinate math and originalBoundsRef.
