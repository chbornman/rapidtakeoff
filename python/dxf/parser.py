"""
Main parser module for DXF files
"""
import sys
from typing import Dict, List, Any, Optional

try:
    import ezdxf
    from ezdxf.math import Vec2, Vec3
    from ezdxf.addons.drawing import Frontend, RenderContext
    from ezdxf.addons.drawing.properties import LayoutProperties
except ImportError:
    sys.stderr.write('Error: ezdxf is required. Install via pip install ezdxf\n')
    sys.exit(1)

from .utils.encoder import DXFEncoder, format_points, round_point
from .parsers import (
    basic_entities,
    curve_entities,
    complex_entities,
    text_entities,
    organizational_entities,
    advanced_entities
)

def parse_dxf(filepath: str, config: Optional[Dict[str, Any]] = None) -> Dict[str, List[Dict[str, Any]]]:
    """
    Parse DXF file using ezdxf and extract entity data.
    
    Args:
        filepath: Path to the DXF file
        config: Optional configuration parameters
        
    Returns:
        Dict mapping layer names to lists of entity data
    """
    sys.stderr.write(f'[PYTHON] Starting to parse DXF file: {filepath}\n')
    if config:
        sys.stderr.write(f'[PYTHON] Using config\n')
        # Extract SVG-specific config if available
        svg_config = config.get('svg', {}) if isinstance(config, dict) else {}
        if svg_config:
            sys.stderr.write(f'[PYTHON] Found SVG config section with {len(svg_config)} parameters\n')
    
    try:
        sys.stderr.write('[PYTHON] Reading DXF file with ezdxf\n')
        doc = ezdxf.readfile(filepath)
        sys.stderr.write(f'[PYTHON] Successfully loaded DXF file. Version: {doc.dxfversion}\n')
    except Exception as e:
        sys.stderr.write(f'[PYTHON] Error reading DXF file: {e}\n')
        sys.exit(1)
    
    sys.stderr.write('[PYTHON] Accessing modelspace\n')
    msp = doc.modelspace()
    sys.stderr.write(f'[PYTHON] DXF modelspace accessed. Found layers: {[layer.dxf.name for layer in doc.layers]}\n')
    tree = {}
    
    # Create a RenderContext to get access to the drawing properties
    render_context = None
    frontend = None
    try:
        sys.stderr.write('[PYTHON] Creating render context\n')
        render_context = RenderContext(doc)
        layout_properties = LayoutProperties.from_layout(msp)
        frontend = Frontend(render_context, layout_properties)
        sys.stderr.write('[PYTHON] Render context created successfully\n')
    except Exception as e:
        sys.stderr.write(f'[PYTHON] Warning: Could not create render context: {e}\n')
    
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
            data = basic_entities.parse_line(e, common_attrs)
        elif etype == 'POINT':
            data = basic_entities.parse_point(e, common_attrs)
        elif etype == 'CIRCLE':
            data = basic_entities.parse_circle(e, common_attrs)
        elif etype == 'ARC':
            data = basic_entities.parse_arc(e, common_attrs)
        elif etype == 'ELLIPSE':
            data = basic_entities.parse_ellipse(e, common_attrs)
        
        # --------- CURVE ENTITIES ---------
        elif etype == 'LWPOLYLINE':
            data = curve_entities.parse_lwpolyline(e, common_attrs)
        elif etype == 'POLYLINE':
            data = curve_entities.parse_polyline(e, common_attrs)
        elif etype == 'SPLINE':
            data = curve_entities.parse_spline(e, common_attrs)
        elif etype == 'HELIX':
            data = curve_entities.parse_helix(e, common_attrs)
        elif etype == 'LEADER':
            data = curve_entities.parse_leader(e, common_attrs)
        
        # --------- COMPLEX ENTITIES ---------
        elif etype == 'HATCH':
            data = complex_entities.parse_hatch(e, common_attrs)
        elif etype == 'SOLID':
            data = complex_entities.parse_solid(e, common_attrs)
        elif etype == '3DFACE':
            data = complex_entities.parse_3dface(e, common_attrs)
        elif etype == 'MESH':
            data = complex_entities.parse_mesh(e, common_attrs)
        elif etype == '3DSOLID' or etype == 'BODY':
            data = complex_entities.parse_3dsolid(e, common_attrs)
        
        # --------- DIMENSION ENTITIES ---------
        elif etype == 'DIMENSION':
            data = text_entities.parse_dimension(e, common_attrs)
        elif etype == 'MTEXT' or etype == 'TEXT':
            data = text_entities.parse_text(e, common_attrs)
        
        # --------- ORGANIZATIONAL ENTITIES ---------
        elif etype == 'INSERT':
            data = organizational_entities.parse_insert(e, common_attrs)
        elif etype == 'ATTDEF' or etype == 'ATTRIB':
            data = organizational_entities.parse_attribute(e, common_attrs)
        
        # --------- ADVANCED ENTITIES ---------
        elif etype == 'IMAGE':
            data = advanced_entities.parse_image(e, common_attrs)
        elif etype == 'WIPEOUT':
            data = advanced_entities.parse_wipeout(e, common_attrs)
        elif etype == 'ACAD_TABLE':
            data = advanced_entities.parse_acad_table(e, common_attrs)
        elif etype == 'MLINE':
            data = advanced_entities.parse_mline(e, common_attrs)
        
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