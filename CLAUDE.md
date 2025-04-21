# RapidTakeoff Project Structure

This document outlines the modular structure of the RapidTakeoff application, which is designed for viewing and working with DXF files.

## Project Architecture

### Frontend Components

The React components are organized into a hierarchical structure:

```
components/
├── Canvas.tsx                # Main wrapper component
├── canvas/
│   ├── CanvasCore.tsx        # Core canvas rendering logic
│   ├── CoordinateDisplay.tsx # Display for current coordinates
│   ├── entities/
│   │   └── EntityRenderer.tsx # Renders all DXF entities
│   ├── grid/
│   │   └── GridLines.tsx     # Renders background grid
│   └── utils/
│       └── canvas-interactions.ts # Utilities for mouse handling
├── entities/                 # Individual entity components
│   ├── ArcEntity.tsx
│   ├── CircleEntity.tsx
│   ├── DxfEntity.tsx
│   ├── EllipseEntity.tsx
│   ├── GenericEntity.tsx
│   ├── HatchEntity.tsx
│   ├── LineEntity.tsx
│   ├── OriginAxes.tsx
│   ├── PointEntity.tsx
│   ├── PolylineEntity.tsx
│   ├── SplineEntity.tsx
│   └── TextEntity.tsx
├── utils/
│   └── wheel-handler.ts      # Mouse wheel handling
└── types.ts                  # Shared TypeScript interfaces
```

### Utilities

Utilities for DXF processing and rendering:

```
utils/
└── dxf/
    ├── bounding-box.ts       # Calculate entity bounds
    ├── coordinate-utils.ts   # Coordinate transformations
    ├── dxf-parser.ts         # DXF parsing interface
    ├── python-executor.ts    # Python process management
    └── svg-renderer.ts       # SVG rendering interface
```

### Python DXF Processing

Python code for parsing DXF files is organized by entity type:

```
python/
└── dxf/
    ├── parser.py             # Main parser entry point
    ├── parsers/
    │   ├── __init__.py
    │   ├── advanced_entities.py
    │   ├── basic_entities.py
    │   ├── complex_entities.py
    │   ├── curve_entities.py
    │   ├── organizational_entities.py
    │   └── text_entities.py
    └── utils/
        ├── __init__.py
        └── encoder.py        # JSON encoding utilities
```

### Main Process

Electron main process files:

```
main.ts               # Original main process file
main-refactored.ts    # Modularized version using utility modules
```

## Key Components

### Canvas System

- **Canvas.tsx**: Simple wrapper that delegates to CanvasCore
- **CanvasCore.tsx**: Manages viewport, zooming, panning, and entity rendering
- **GridLines.tsx**: Renders the background grid with major and minor lines
- **EntityRenderer.tsx**: Renders all visible DXF entities
- **CoordinateDisplay.tsx**: Shows current mouse coordinates in DXF space

### Entity Rendering

- **DxfEntity.tsx**: Factory component that delegates to specific entity renderers
- **Entity type components**: Render specific entity types (Line, Circle, Arc, etc.)

### Utilities

- **bounding-box.ts**: Calculates the bounding box for all entities
- **coordinate-utils.ts**: Converts between screen and DXF coordinates
- **wheel-handler.ts**: Handles mouse wheel zooming with proper focus point
- **canvas-interactions.ts**: Manages panning and other mouse interactions

### Python Integration

- **python-executor.ts**: Finds Python executable and runs scripts
- **dxf-parser.ts**: Parses DXF files and caches results
- **svg-renderer.ts**: Renders DXF to SVG format
- **parser.py**: Main Python parser that delegates to entity-specific parsers

## Development Commands

- **Run development server**: `npm run dev`
- **Build application**: `npm run build`
- **Typescript check**: `npm run typecheck`

## Configuration Files

- **component_renderer_config.json**: Controls rendering parameters