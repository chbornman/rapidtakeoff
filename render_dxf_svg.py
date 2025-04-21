#!/usr/bin/env python3
"""
Minimal DXF to SVG renderer using ezdxf
"""
import sys
import json
import argparse
from ezdxf.addons.drawing.config import Configuration

try:
    import ezdxf
    from ezdxf.addons.drawing import RenderContext, Frontend
    from ezdxf.addons.drawing.svg import SVGBackend
except ImportError:
    sys.stderr.write('ezdxf is required. Install via pip install ezdxf\n')
    sys.exit(1)

def render_svg(filepath, config_str=None):
    """Render DXF file to SVG with configuration"""
    try:
        # Read the DXF file
        doc = ezdxf.readfile(filepath)
        msp = doc.modelspace()
        
        # Default to component-based rendering (wireframe)
        use_drawing_addon = False
        
        # Load renderer configuration
        if config_str:
            try:
                # Print available Configuration parameters for debugging
                import inspect
                config_params = inspect.signature(Configuration.__init__).parameters
                sys.stderr.write(f"Available configuration parameters: {list(config_params.keys())[1:]}\n")
                
                # Load configuration from JSON
                config_dict = json.loads(config_str)
                sys.stderr.write(f"Attempting to load config with: {config_dict}\n")
                
                # Check if we should use the Drawing add-on
                if 'use_drawing_addon' in config_dict and config_dict['use_drawing_addon']:
                    use_drawing_addon = True
                    # Remove our custom parameter before passing to Configuration
                    del config_dict['use_drawing_addon']
                    
                # Create configuration object
                cfg = Configuration(**config_dict)
            except Exception as e:
                sys.stderr.write(f"Error loading config JSON: {e}\n")
                sys.exit(1)
        else:
            # Use defaults with fill set to none for wireframe look
            cfg = Configuration()
            # Ensure all entities render as wireframes by default
            cfg.fill_policy = "NONE"
            cfg.lwpolyline_fill = False
            cfg.polyline_fill = False
            cfg.hatch_policy = "OUTLINE"  # Only show hatch outlines

        # Create rendering context
        ctx = RenderContext(doc)
        
        # Create SVG backend
        backend = SVGBackend()
        
        # Set up renderer with configuration
        # Create Frontend directly with backend and config, without passing layout properties
        # This is needed for compatibility with newer ezdxf versions
        frontend = Frontend(ctx, backend, config=cfg)
        
        # Render the model space
        frontend.draw_layout(msp)
        
        # Get Page class
        try:
            from ezdxf.addons.drawing.layout import Page
        except ImportError:
            from ezdxf.addons.drawing import layout
            Page = layout.Page
        
        # Create a page with auto-detected dimensions
        page = Page(0, 0)
        
        # Get the SVG as a string
        svg = backend.get_string(page)
        
        # Add metadata about which renderer mode was used
        svg = svg.replace('<svg ', f'<svg data-renderer-mode="{("ezdxf" if use_drawing_addon else "component")}" ')
        
        # If not using Drawing add-on, modify SVG for wireframe rendering
        if not use_drawing_addon:
            # Brute force approach: Force SVG to use wireframe mode by directly modifying SVG XML
            # Replace any fill declarations with none
            svg = svg.replace('fill="#', 'fill="none" data-original-fill="#')
            svg = svg.replace('fill="rgb', 'fill="none" data-original-fill="rgb')
            
            # Handle single quotes too
            svg = svg.replace("fill='#", "fill='none' data-original-fill='#")
            svg = svg.replace("fill='rgb", "fill='none' data-original-fill='rgb")
            
            # Force fill-opacity to 0
            svg = svg.replace('fill-opacity="', 'fill-opacity="0" data-original-opacity="')
            svg = svg.replace("fill-opacity='", "fill-opacity='0' data-original-opacity='")
        
        # Output the SVG to stdout
        sys.stdout.write(svg)
        
    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Simple DXF to SVG converter')
    parser.add_argument('file', help='DXF file to convert')
    parser.add_argument(
        '--config',
        help='Renderer configuration as JSON string',
        default=None,
    )
    args = parser.parse_args()
    
    # Pass config JSON to renderer
    render_svg(args.file, args.config)