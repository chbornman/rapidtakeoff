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

# Then install requirements
pip install -r requirements.txt
```

If you prefer not to use a virtualenv, you can install as a user package:

```bash
pip3 install --user --break-system-packages -r requirements.txt
```

Start the app in development mode:

```bash
# Activate the Python virtual environment so Electron can find ezdxf:
source .venv/bin/activate  # or use your preferred venv tool
# Now start development servers:
bun run dev
```

## Build

```bash
bun run build
bun run start
```
## Development

Install dependencies:

```bash
bun install
```

Start the app in development mode:

```bash
bun run dev
```

## Build

```bash
bun run build
bun run start
```