# RapidTakeoff DXF Support

This document details the DXF entities supported by RapidTakeoff and explains how they are processed for visualization and selection in the application.

## DXF Parser Implementation

RapidTakeoff uses the `ezdxf` Python library to parse DXF (Drawing Exchange Format) files. The parser extracts entity information and converts it into a structured JSON format that the application can use for:

1. Displaying the component tree in the left sidebar
2. Enabling feature selection
3. Rendering SVG visualization on the canvas
4. Supporting selection highlighting

## Supported Entity Types

### Basic Geometric Entities

| Entity Type | Properties Extracted | Description |
|-------------|---------------------|-------------|
| **LINE** | `handle`, `layer`, `start`, `end` | Simple straight line segment between two points |
| **POINT** | `handle`, `layer`, `location` | Single point in space |
| **CIRCLE** | `handle`, `layer`, `center`, `radius` | Perfect circle defined by center point and radius |
| **ARC** | `handle`, `layer`, `center`, `radius`, `start_angle`, `end_angle` | Portion of a circle |
| **ELLIPSE** | `handle`, `layer`, `center`, `major_axis`, `ratio`, `start_param`, `end_param` | Oval shape defined by center, major axis, and ratio |

### Curve Entities

| Entity Type | Properties Extracted | Description |
|-------------|---------------------|-------------|
| **SPLINE** | `handle`, `layer`, `degree`, `closed`, `control_points`, `knots`, `weights` | Curved line defined by control points (NURBS) |
| **POLYLINE** | `handle`, `layer`, `points`, `closed` | Connected line segments (legacy format) |
| **LWPOLYLINE** | `handle`, `layer`, `points`, `closed`, `const_width` | Lightweight polyline (more efficient version) |
| **HELIX** | `handle`, `layer`, `axis_start_point`, `axis_end_point`, `radius`, `turns` | 3D spiral shape |
| **LEADER** | `handle`, `layer`, `vertices` | Line with arrow pointing to annotation |

### Complex Entities

| Entity Type | Properties Extracted | Description |
|-------------|---------------------|-------------|
| **HATCH** | `handle`, `layer`, `pattern_name`, `solid_fill`, `pattern_scale`, `pattern_angle`, `paths` | Filled area with pattern |
| **SOLID** | `handle`, `layer`, `points` | Filled triangles or quadrilaterals |
| **3DFACE** | `handle`, `layer`, `points` | 3D triangular or quadrilateral face |
| **MESH** | `handle`, `layer`, `vertex_count`, `face_count` | 3D surface mesh |
| **BODY, 3DSOLID** | `handle`, `layer`, `acis_data` | 3D volumetric objects |

### Dimension Entities

| Entity Type | Properties Extracted | Description |
|-------------|---------------------|-------------|
| **DIMENSION** | `handle`, `layer`, `dimtype`, `defpoint`, `text_midpoint`, `actual_measurement` | Linear, angular, radial dimensions |
| **MTEXT, TEXT** | `handle`, `layer`, `text`, `insert`, `height`, `rotation` | Text elements for annotations |

### Organizational Entities

| Entity Type | Properties Extracted | Description |
|-------------|---------------------|-------------|
| **INSERT** | `handle`, `layer`, `name`, `insert`, `rotation`, `scale` | Block insertion (instance of a block) |

### Advanced Entities

| Entity Type | Properties Extracted | Description |
|-------------|---------------------|-------------|
| **IMAGE** | `handle`, `layer`, `insert`, `image_size`, `image_def_handle` | Raster image reference |
| **WIPEOUT** | `handle`, `layer`, `vertices` | Masked area |
| **ACAD_TABLE** | `handle`, `layer`, `insert`, `num_rows`, `num_cols` | Table object |
| **MLINE** | `handle`, `layer`, `style_name`, `vertices` | Multi-line (parallel lines) |
| **ATTDEF, ATTRIB** | `handle`, `layer`, `tag`, `text`, `insert` | Block attribute definition/instance |

## Feature Selection Process

When a user selects a feature in the component tree:

1. The corresponding entity data is captured in a `SelectedFeature` object
2. This object includes:
   - `layerName`: The layer the entity belongs to
   - `entityType`: The DXF entity type (e.g., LINE, CIRCLE, SPLINE)
   - `entityIndex`: Index of the entity within its type group
   - `entity`: Complete entity data with all properties

3. The Canvas component uses this information to highlight the corresponding SVG element(s) by:
   - Applying a red stroke color
   - Increasing stroke width
   - Adding a CSS class for styling

## Technical Implementation Notes

### Coordinate Rounding

All coordinates are rounded to 6 decimal places for consistency and to minimize floating-point comparison issues.

### Complex Entity Handling

For complex entities like SPLINE, MESH, and 3DSOLID, additional processing may be needed to correctly visualize all aspects of the entity.

### Attributes and Metadata

When available, the parser extracts and preserves additional metadata like:
- Layer information
- Block references
- Entity handles (unique identifiers)
- Text content
- Dimension measurements

### Fallback Handling

For unsupported or unknown entity types, a minimal representation is still provided to ensure visibility in the component tree.

## Known Limitations

1. **Entity Explorer Only**: The current implementation focuses on entity exploration and visualization. Editing capabilities may be added in future versions.

2. **3D Visualization**: While 3D entities are parsed and represented in the component tree, visualization is currently limited to 2D projections in the SVG canvas.

3. **Custom Objects**: AutoCAD custom objects or proxy entities may have limited representation.

4. **Block Decomposition**: Block instances (INSERTs) are extracted but not automatically decomposed to their constituent entities.