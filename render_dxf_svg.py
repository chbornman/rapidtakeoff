#!/usr/bin/env python3
"""
Render DXF to SVG using ezdxf's drawing add-on with extended configuration options
"""
import sys
import json
import argparse
import re

try:
    import ezdxf
    from ezdxf.addons.drawing import RenderContext, Frontend
    from ezdxf.addons.drawing.svg import SVGBackend
except ImportError:
    sys.stderr.write(
        'ezdxf and its drawing add-on dependencies are required.\n'
        'Install via pip install -r requirements.txt (which includes ezdxf, svgwrite, and pillow)\n'
    )
    sys.exit(1)

def render_svg(filepath, config=None):
    """
    Render DXF file to SVG with configurable options
    
    Args:
        filepath: Path to DXF file
        config: Dictionary of configuration options including:
            - line_width: Fixed stroke width for all lines (default: 0.2)
            - text_size_factor: Scale factor for text (default: 1.0)
            - text_color: Text color override (default: None, uses DXF colors)
            - bg_color: Background color (default: None, transparent)
            - line_color: Line color override (default: None, uses DXF colors)
            - show_paper_border: Show/hide paper border (default: False)
            - vector_effect: Apply vector-effect:non-scaling-stroke (default: True)
    """
    # Default configuration
    if config is None:
        config = {}
    
    default_config = {
        'line_width': 0.7,
        'text_size_factor': 1.0,
        'text_color': None,
        'bg_color': None,
        'line_color': None,
        'show_paper_border': False,
        'vector_effect': True
    }
    
    # Apply defaults for missing config values
    for key, value in default_config.items():
        if key not in config:
            config[key] = value
    
    try:
        doc = ezdxf.readfile(filepath)
    except Exception as e:
        sys.stderr.write(str(e) + '\n')
        sys.exit(1)
    
    msp = doc.modelspace()
    ctx = RenderContext(doc)
    
    # Initialize SVG backend
    backend = SVGBackend()
    
    # Configure backend with supported options
    try:
        # Import policies for configuring the renderer
        from ezdxf.addons.drawing.config import (
            LineweightPolicy, 
            TextPolicy,
            ColorPolicy
        )
        
        # Configure line weight
        backend.lineweight_policy = LineweightPolicy.RELATIVE_FIXED
        backend.fixed_stroke_width = config['line_width']
        
        # Configure text rendering if available
        if hasattr(backend, 'text_policy'):
            # Set text size scale factor
            if hasattr(TextPolicy, 'FACTOR'):
                backend.text_policy = TextPolicy.FACTOR
                backend.text_size_factor = config['text_size_factor']
        
        # Override colors directly regardless of attribute availability
        # This ensures maximum compatibility across ezdxf versions
        
        # Configure line color (force override)
        if config['line_color'] is not None:
            backend.override_color = config['line_color']
            # Try different ways to set color policy
            if hasattr(backend, 'color_policy'):
                backend.color_policy = ColorPolicy.OVERRIDE
        
        # Configure text color (force override)
        if config['text_color'] is not None:
            backend.text_color = config['text_color']
        
        # Configure background color (force override)
        if config['bg_color'] is not None:
            backend.bg_color = config['bg_color']
    
    except ImportError:
        # If config import fails, continue with default settings
        pass
    
    frontend = Frontend(ctx, backend)
    frontend.draw_layout(msp)
    
    # Get layout Page class
    try:
        from ezdxf.addons.drawing.layout import Page
    except ImportError:
        from ezdxf.addons.drawing import layout
        Page = layout.Page
    
    # Create page with auto-detect dimensions
    page = Page(0, 0)
    
    # Configure page border visibility if supported
    if hasattr(page, 'show_paper_border'):
        page.show_paper_border = config['show_paper_border']
    
    # Generate SVG string
    svg = backend.get_string(page)
    
    # Add custom style to ensure lines are visible (regardless of line_color setting)
    stroke_color = config['line_color'] or '#000000'  # Default to black if not specified
    text_color = config['text_color'] or '#000000'    # Default to black if not specified
    
    # Force all path elements to have a visible stroke
    color_style = f"""<style>
path, line, polyline, circle, ellipse, rect, polygon {{
  stroke: {stroke_color} !important;
  fill: none;
  stroke-width: {config['line_width']}px;
}}
text {{
  fill: {text_color} !important;
  stroke: none;
}}
</style>"""
    svg = re.sub(r'(<svg[^>]*>)', r'\1' + color_style, svg)
    
    # Add debug markers to make sure elements are visible
    if 'debug_render' in config and config['debug_render']:
        # Add a test rectangle to verify rendering is working
        debug_rect = '<rect x="10" y="10" width="50" height="50" stroke="red" fill="blue" stroke-width="2" />'
        svg = re.sub(r'(<svg[^>]*>)', r'\1' + debug_rect, svg)
    
    # Add vector-effect:non-scaling-stroke to all path and polyline elements if requested
    if config['vector_effect']:
        # Define a css style to apply vector-effect to all stroked elements
        vector_effect_style = """<style>
  path, line, polyline, circle, ellipse, rect, polygon {
    vector-effect: non-scaling-stroke;
  }
</style>"""
        
        # Insert the style tag right after the opening <svg> tag
        svg = re.sub(r'(<svg[^>]*>)', r'\1' + vector_effect_style, svg)
    
    sys.stdout.write(svg)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Render DXF to SVG with configurable options')
    parser.add_argument('file', help='DXF file to convert')
    parser.add_argument('--config', help='JSON configuration string')
    
    args = parser.parse_args()
    
    config = {}
    if args.config:
        try:
            config = json.loads(args.config)
            # Debug print the received config - using both stdout and stderr
            sys.stderr.write(f'PYTHON CONFIG DEBUG: {json.dumps(config, indent=2)}\n')
            print(f'PYTHON CONFIG DEBUG: {json.dumps(config, indent=2)}', file=sys.stderr)
            print(f'PYTHON CONFIG DEBUG: {json.dumps(config, indent=2)}')
        except json.JSONDecodeError:
            sys.stderr.write('Error: Invalid JSON configuration\n')
            sys.exit(1)
    
    render_svg(args.file, config)