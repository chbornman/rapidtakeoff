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
    """Render DXF file to SVG with minimal configuration"""
    try:
        # Read the DXF file
        doc = ezdxf.readfile(filepath)
        msp = doc.modelspace()
        
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
                cfg = Configuration(**config_dict)
            except Exception as e:
                sys.stderr.write(f"Error loading config JSON: {e}\n")
                sys.exit(1)
        else:
            cfg = Configuration()

        # Create rendering context
        ctx = RenderContext(doc)
        
        # Create SVG backend
        backend = SVGBackend()
        
        # Set up renderer with configuration
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
        
        # Add a test rectangle to verify rendering
        test_rect = '<rect x="10" y="10" width="50" height="50" fill="red" stroke="black" stroke-width="2" />'
        svg = svg.replace('</svg>', test_rect + '</svg>')
        
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