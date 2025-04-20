# Project Notes: RapidTakeoff - CAD-to-Estimate Software

## 1. Core Concept & Value Proposition

- **Idea:** Develop software (App Name: **RapidTakeoff**) containing tools (Initial Tool: **Estimator**) to automate Quantity Takeoff (QTO) directly from architectural CAD files for a construction client.
- **Target User:** Estimators at [Client Name] in the [Specific Industry/Trade] sector.
- **Value:** Increase speed, accuracy, and consistency of estimating; reduce manual labor; bridge the gap between design data and estimating data.

## 2. Key Features (Version 1 - Estimator Tool)

- Load/Parse DXF files.
- Extract geometry: Lines, Polylines (Length, Area), Blocks (Count).
- Extract associated data: Layer, Block Name, Block Attributes.
- User Interface (UI) for mapping CAD data (Layer, Block Name, Attribute Values) to client-defined Estimate Items.
- Calculate and aggregate quantities based on mapping rules.
- Display results in a clear table format.
- Implement a warning/flagging system for unmapped or incompletely tagged geometry.
- Provide a mechanism for manual assignment/classification of flagged items within the tool.
- Export results (e.g., CSV/Excel).

## 3. Technical Approach & Decisions (Version 1)

- **Application Shell:** Electron.
  - **Pros:** Cross-platform (Win/Mac/Linux) builds from single codebase, uses web tech (HTML/CSS/JS) for UI, good file system access via Node.js.
  - **Cons:** Larger bundle size, potential resource usage, performance limitations for _extreme_ computation (less relevant here initially).
- **CAD Parsing:** Python backend script using `ezdxf` library.
  - **Reasoning:** DXF is an accessible starting point, `ezdxf` is robust for DXF parsing (including attributes), Python is good for data handling. Avoids initial complexity/cost of DWG SDKs (ODA Teigha, Autodesk Platform Services).
- **Python Packaging:** Use **PyInstaller** (or similar like cx_Freeze) to bundle the Python script, interpreter, and dependencies (`ezdxf`) into a standalone executable.
  - **Reasoning:** Avoids requiring end-users to install/manage Python. Makes distribution seamless within Electron.
  - **Process:** Run PyInstaller during Electron build process, include executable in app resources, call executable from Electron's Node.js using `child_process.spawn`. Pass file path via args, get results (JSON) via stdout.
  - **Cons:** Increases app size, adds build step complexity, minor process startup overhead, potential (low) risk of AV flags.
- **Alternative Considered (Wasm):** Writing parser in Rust/C++ -> Wasm.
  - **Pros:** Performance, portability of core logic for future web/cloud use.
  - **Cons:** Steeper learning curve (Rust/C++/Wasm), browser file access limitations (if used client-side web), potential difficulty compiling complex C++ SDKs to Wasm. Decided against for V1 complexity.

## 4. Data Handling & Architect Collaboration

- **Challenge:** Raw geometry lacks meaning. Need semantic data (tags).
- **Solution:** Leverage Layers, Block Names, and **Block Attributes**.
- **Requirement:** Client needs to work with architects to establish and enforce a CAD standard.
  - Define required layers for specific elements.
  - Define required blocks and necessary attributes (e.g., `WallTypeID`, `FixtureModel`, `Voltage`).
- **Software Role:**
  - Parser must read attributes/layers/block names.
  - Mapping UI must allow rules based on these multiple criteria.
  - Fallback mechanism (warnings + manual assignment) is crucial for handling non-compliant or incomplete files.
- **File Format Strategy:** Request architects provide **DXF** as a standard deliverable alongside native formats. This simplifies V1 development significantly.

## 5. Charging Model & IP Ownership

- **Charging Recommendation:**
  - Option A (Preferred): **Hourly Rate (Time & Materials)** due to potential unknowns in CAD quality and scope refinement. Requires clear communication and time tracking.
  - Option B (Compromise): **Phased Fixed Price**. Fixed price for initial Discovery/Planning, then fixed price for V1 MVP based on refined scope.
- **Time Estimate (V1, Single Engineer):** Realistic range **4-6 months**. Break down into phases (Setup/Parsing: 4-8w, Mapping/UI: 4-8w, Warnings/Refinement: 4-8w).
- **IP Ownership:** Standard "Work Made For Hire". **Client owns the final custom code** for RapidTakeoff upon full payment. Developer retains rights to pre-existing IP and general knowledge/skills. Must be clearly stated in the contract.

## 6. Naming

- **App Name:** RapidTakeoff
- **Initial Tool Name:** Estimator (or similar, e.g., Estimator Tool)
- _(Other ideas considered: CadLink Estimate, EstimateLink, AutoQuantify, PlanSight, SpecLink Estimator, ConstructCore, etc.)_

## 7. Industry Terminology

- **Core Term:** Takeoff / Quantity Takeoff (QTO)
- **Action:** Doing the takeoff / Running the takeoff
- **Related:** On-Screen Takeoff (OST), Digital Takeoff, Measuring, Counting, Estimating (broader process)

## 8. Future Considerations (Beyond V1)

- Direct DWG support (ODA Teigha / Autodesk Platform Services integration).
- Revit integration (potentially via Revit API or IFC format).
- Cloud-based version (Web UI, server-side processing - Wasm parser would be beneficial here).
- Deeper integration with client's estimating database/software (API?).
- More advanced visualization within the app.
- Tools for validating incoming CAD files against the client's standard.
- Additional tools within the RapidTakeoff suite (e.g., change order comparison).

## 9. Open Questions / Areas for Discovery Phase

- Detailed review of client's current estimating items and workflow.
- Analysis of sample CAD files from typical architects (quality, consistency, use of layers/blocks/attributes).
- Specific requirements for mapping rule complexity.
- Desired export formats and structure.
- Detailed UI/UX preferences.
- Feasibility assessment of architect collaboration on standards/DXF delivery.
