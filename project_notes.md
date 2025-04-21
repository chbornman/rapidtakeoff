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

## Licensing type agreement

    Here’s how you can fold hosting into your licensing‑royalty structure so that you not only retain control of the IP, but also get built‑in usage metrics and billing:

        1. Move to a SaaS/Hosted‑Service Model
           • You host the software on your infrastructure (or a cloud provider account you control).
           • Customer accesses it only as a service (no code or binaries are “installed” on their own servers).
           • Since all traffic goes through your servers, you can meter usage, user counts, feature calls, etc.
        2. Add a “Hosting & Service” Section to Your Agreement
           • Hosting Grant
             – “Developer will host and operate the Software in a secure, multi‑tenant (or single‑tenant) environment and make it available to Customer via HTTPS.”
           • Service Levels
             – Define uptime (e.g. 99.5%) and remedies (credits, termination rights).
           • Security & Data
             – Developer keeps Customer Data segregated and backed up.
             – Customer owns its data and can request exports on termination.
           • Monitoring & Reporting
             – Developer will log usage metrics (active users, API calls, job runs, etc.) and provide a monthly usage report.
           • Fees & Invoicing
             – A fixed hosting & maintenance fee (e.g. $X/month).
             – PLUS any royalties owed under your “Commercial Redistribution” clause (20% of net revenue).
             – Or you can convert the royalty into a per‑usage fee you bill to them directly (e.g. $Y per estimate run) and simply remit 20% of their downstream sales as a true‑up.
        3. Usage‑Based Billing vs. Up‑Front Royalty Reporting
           Option A: Quarterly royalties on their downstream revenues (you still host and meter, but they invoice their end‑customers).
           Option B: You bill them monthly for actual usage at your published rate (e.g. $0.10/estimate, $20/user/month), then they mark up/resell to their clients however they like—no later revenue split needed.
           • Option B is simpler: you collect all the money, so no “did you under‑report?” disputes.
           • Option A keeps them in the driver’s seat of client billing, but you’ll need audit rights and clear “Net Revenue” definitions.
        4. Technical Considerations
           • Multi‑Tenant vs. Single‑Tenant
             – Multi‑tenant can be more cost‑effective but requires strict data‑isolation.
             – Single‑tenant (one VM or container per customer) gives stronger isolation if they demand it.
           • Metering & Instrumentation
             – Build usage logs into key business flows (e.g. “create estimate” endpoint).
             – Aggregate those logs to a billing dashboard or simple CSV export.
           • Security & Compliance
             – Encrypted at rest/in‑transit; routine backups; disaster‑recovery plan.
             – If they handle sensitive data (e.g. bids, costs), you may need SOC2, GDPR, etc.
        5. Contractual Clauses to Watch
           • Don’t slip in a “you get a copy of the code” or “we’ll deploy it for you” that feels like a sale of IP. Keep it clearly a service.
           • Have strong audit‑rights if you go the downstream‑royalty route.
           • Limit your liability for “their users’ data” under your SLA.
        6. Sample “Hosting & Metering” Exhibit Outline

        Exhibit B: Hosting & Service
        1. Hosting Services
           • Developer shall host the Software on infrastructure owned or contracted by Developer.
           • Developer will use commercially reasonable efforts to maintain ≥99.5% uptime.

        2. Data and Security
           • Customer retains title to its Data.
           • Developer will implement industry‑standard encryption, backups, and DR.

        3. Usage Metering & Reporting
           • Developer will track: active users, API calls, estimate transactions, etc.
           • Developer to deliver a Usage Report within 10 days of each quarter-end.

        4. Fees & Payment
           • Hosting & Support Fee: $X/month, payable 30 days net.
           • Royalty: 20% of Net Revenue received by Customer from any resale or sublicensing of the Software, payable 30 days after each Usage Report.
           • Audit Rights: Developer may audit Customer’s books once per year upon 30 days’ notice.

        5. Term & Termination
           • The hosted‑service license continues so long as Customer is not in material breach.
           • Upon termination, Developer will export Customer Data in standard CSV/JSON format and delete all copies from its systems within 60 days.

    Bottom line: by offering it “only as a hosted service” you
      – Retain full control of the IP and its distribution
      – Get precise usage data for billing or royalty calculation
      – Eliminate the risk of them reverse‑engineering or self‑hosting to evade royalties

    As always, run your final draft by a qualified attorney, but this approach is how most software‑as‑a‑service licensing deals with built‑in royalties are built.
