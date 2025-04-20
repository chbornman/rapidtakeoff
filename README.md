# rapidtakeoff
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