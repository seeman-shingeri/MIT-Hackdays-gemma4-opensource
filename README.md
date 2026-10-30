# REPAIR.AI — Civic Infrastructure Intelligence
### Multimodal Community Infrastructure & Accessibility Issue Resolution Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Track](https://img.shields.io/badge/Hackathon-Best_Use_of_Gemma_4-amber.svg)](https://ai.google.dev/gemma)
[![Track](https://img.shields.io/badge/Hackathon-Best_Open--Source_AI_Project-cyan.svg)](https://github.com/seeman-shingeri/MIT-Hackdays-gemma4-opensource)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

> **Built for Hacktoberfest × MOSS Hack Day**  
> Tracks: **Best Open-Source AI Project** & **Best Use of Gemma 4**  
> GitHub Repository: [seeman-shingeri/MIT-Hackdays-gemma4-opensource](https://github.com/seeman-shingeri/MIT-Hackdays-gemma4-opensource)

---

## 1. Problem Statement

Municipalities, university campuses, and public transit facilities struggle with fragmented, chaotic hazard reporting. When an ADA wheelchair ramp fractures, a high-voltage conduit is exposed, or tactile paving is blocked by construction pallets:
1. **Duplicate Report Avalanche:** Multiple citizens submit disjointed photos and descriptions from varying angles, overwhelming dispatchers with duplicate tickets.
2. **Lack of Structured Triage:** Raw photos do not translate automatically into ADA severity classifications, safety zone routing, or contractor work orders.
3. **Epistemic Uncertainty Overlooked:** Traditional AI systems often hallucinate certainty on unverified structural details (e.g. subsurface voiding, anchor bolt stability) that cannot be certified visually.
4. **Verification Gap:** Once repairs are claimed by contractors, facilities teams lack a systematic method to compare before-and-after photographic evidence and verify physical hazard remediation before reopening.

---

## 2. Solution: REPAIR.AI

**REPAIR.AI** transforms raw citizen reality capture into verified, evidence-backed civic repair cases through a 5-stage automated pipeline powered by **Gemma** via the Google Gemini API.

```
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│ STAGE 1:        │ ──► │ STAGE 2:              │ ──► │ STAGE 3:               │
│ Capture Reality │     │ Gemma Multimodal AI   │     │ Explainable Clustering │
│ Photo + Zone    │     │ Structured Triage + ? │     │ Score = 40+35+25       │
└─────────────────┘     └───────────────────────┘     └────────────────────────┘
                                                                   │
                                                                   ▼
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│ STAGE 5:        │ ◄── │ STAGE 4:              │ ◄───┘ Master Civic Case      │
│ Verification    │     │ Actionable Work Order │     │ Consolidated Evidence  │
│ Split Slider AI │     │ Markdown / Print PDF  │     │ Preserved Timestamps   │
└─────────────────┘     └───────────────────────┘     └────────────────────────┘
```

---

## 3. Key Features

- **Stage 1 — Reality Capture:**
  - Interactive incident reporting with instant validation for file formats and sizes.
  - 4 offline bundled SVG evidence presets:
    1. *Broken Wheelchair Ramp* (cracked concrete, vertical lip > 1/4" ADA violation)
    2. *Exposed Electrical Conduit* (480V weatherbox detached, bare conductors)
    3. *Blocked Tactile Pathway* (construction pallet obstructing truncated domes)
    4. *Overhead Water Leakage* (interior pedestrian slip and fall hazard)

- **Stage 2 — Multimodal Gemma Analysis & Epistemic Uncertainty:**
  - Typed integration with `gemma-4-27b-it` (Google Gemini REST API).
  - Runtime response schema validation (converts raw output into validated TypeScript objects).
  - **Epistemic Uncertainty Division:**
    - *What the AI can infer:* Observed visual hazards, ADA disruption, severity rating, containment action.
    - *What still needs confirmation:* Subsurface concrete voiding, handrail bolt embedment, energization state.
    - *Interactive Clarification Questions:* On-site reviewers can answer clarifying prompts; responses dynamically enrich the dossier.

- **Stage 3 — Deterministic Duplicate Detection & Clustering:**
  - Transparent, explainable formula:
    $$\text{Duplicate Score} = \text{Zone Match (40\%)} + \text{Category Match (35\%)} + \text{Keyword Overlap (25\%)}$$
  - $\ge 70\%$ score triggers duplicate warning banner.
  - 1-click evidence merging: Preserves original report IDs, timestamps, photos, and descriptions into a single Master Case.

- **Stage 4 — Actionable Maintenance Dossiers:**
  - Instant work orders with priority scoring, assigned unit, and non-binding response SLA.
  - **Copy Markdown Ticket:** 1-click clipboard export for Jira, GitHub Issues, or facilities dispatchers.
  - **Export / Print Dossier:** Clean print-optimized CSS layout for paper work orders or browser print-to-PDF.

- **Stage 5 — Visual Repair Verification:**
  - Interactive Before/After Split Comparison Slider (draggable handle with percentage display).
  - Side-by-side comparison mode.
  - Multimodal AI inspection compares before/after photos and flags observed changes and curing cautions.
  - **Mandatory Statutory Disclaimer:** Visual verification confirms surface changes only and does NOT certify structural or building code compliance.

- **★ Community Problem Replay (The Definitive 5-Minute Demo):**
  - Controlled, repeatable, 100% offline demonstration accessible from the main command bar.
  - Auto-play with timer progress bar, pause, previous/next, and restart controls.
  - Simulates 3 independent student reports converging into Case `CIV-8492-A`, followed by contractor repair upload and multimodal AI verification.

---

## 4. Model Architecture & Track Eligibility

### Model Selection
1. **Target Model (`gemma-4-27b-it`):**
   - Google's next-generation open model family for structured civic extraction and reasoning.
   - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-27b-it:generateContent`
2. **Configurable Alternatives:**
   - `gemma-3-27b-it`: Prior-generation open-weights model fallback.
   - `gemini-2.5-flash`: High-speed multimodal fallback for high-resolution photo comparison.
   - `gemini-2.0-flash`: Standard Gemini model.

### No Silent Substitution Policy
If `gemma-4-27b-it` is not provisioned on the user's API key tier:
- The application displays a clear configuration warning banner.
- Users can choose to switch to Gemini 2.5 Flash as a fallback or run the offline Demo Simulator.
- The app explicitly distinguishes the Gemma 4 hackathon track requirement from fallback options.

---

## 5. Security & Persistence Architecture

- **Session-Only API Keys:** API keys are stored in browser `sessionStorage` and cleared when the session closes. Keys are **never** committed to Git, logged to console, or written to `localStorage`.
- **LocalStorage Persistence:** Cases, evidence clusters, clarification logs, and verification records are stored with versioning in `localStorage`.
- **Zero Heavy Dependencies:** Zero bulky PDF libraries; native browser paged media (`window.print()`) is utilized for clean dossier generation.

---

## 6. Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/seeman-shingeri/MIT-Hackdays-gemma4-opensource.git
cd MIT-Hackdays-gemma4-opensource

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be live at `http://localhost:5173`.

### Running Tests & Typecheck

```bash
# Run Vitest test suite (15 test suites, 65 tests)
npm test

# Run Oxlint (0 errors, 0 warnings)
npm run lint

# Run production build & TypeScript validation
npm run build
```

---

## 7. Production Engineering Upgrades

REPAIR.AI features 10 independently testable civic infrastructure and accessibility engineering improvements:

1. **WCAG 2.1 AA Keyboard Shortcuts & Navigation:**
   - Global hotkeys (`1` Reports, `2` Inspect, `3` Leaderboard, `4` About), skip-to-content accessibility link, and full ARIA `role="tablist"` / `role="tab"` attributes.
2. **Municipal Archival & Open Data Export:**
   - RFC 4180 compliant CSV export and indented JSON dataset export for municipal transparency, public records, and civic open data portals.
3. **Multi-Criteria Filtering & Deterministic Sorting:**
   - Live category pills (Accessibility, Pedestrian Safety, Electrical, Plumbing, Structural), segmented status filters (All, Active, Resolved, My Reports), and deterministic priority and chronological sorting.
4. **Client-Side Image Optimization & Aspect-Ratio Preservation:**
   - Safe client-side image downscaling preventing browser tab crashes on 12-48MP smartphone cameras; calculates compression ratios and byte savings metrics.
5. **Persistent Offline Mutation Queue & Auto-Reconnect Sync:**
   - Queues incident submissions, status updates, and peer ratings when `navigator.onLine === false`; automatically flushes and synchronizes upon network reconnection.
6. **Official Municipal Work Order Print Layout:**
   - Standalone printable work order layout (`@media print`) complete with hazard checklists and signature lines for field inspector and municipal supervisor sign-off.
7. **Milestone Badge Progress Tracking:**
   - Visual progress bars tracking milestone badge criteria (*First Valid Report*, *Evidence Expert*, *Five Verified Reports*, *First Confirmed Repair*, *Community Helper*) based on real user activity.
8. **Municipal SLA Countdown & Overdue Risk Metrics:**
   - Automated SLA countdown based on severity (Critical: 4h, High: 12h, Medium: 24h, Low: 72h) with `ON_TRACK`, `AT_RISK`, `BREACHED`, and `MET` indicators.
9. **Real-Time Inference Telemetry & Latency Logger:**
   - Tracks round-trip latency (ms), timestamp, model used, and response status for all live Gemma / Gemini multimodal API calls; displayed directly in Model Settings.
10. **Comprehensive Verification & Test Suite:**
    - 15 automated test suites with 65 unit and integration tests covering duplicate matching, reputation, permissions, offline queue, SLA calculation, and AI validation.

---

## 8. How to Operate the 5-Minute Demo

1. Click **"Community Replay"** in the command bar.
2. Watch or step through the 5-step sequence:
   - **Step 1 (09:14 AM):** Student Reporter 1 logs cracked accessibility ramp at Main Library. Gemma extracts ADA hazard and uncertainty flags.
   - **Step 2 (10:02 AM):** Student Reporter 2 uploads second photo showing exposed rebar. Duplicate engine calculates 88% match; reports merge.
   - **Step 3 (10:45 AM):** Student Reporter 3 uploads photo of rain puddling. 3 corroborating reports converge into one master work order.
   - **Step 4 (15:30 PM):** Facilities contractor submits smooth cured concrete repair photo.
   - **Step 5 (16:00 PM):** Visual comparison slider highlights difference; AI confirms surface repair with statutory disclaimer.
3. Test the interactive split comparison slider by dragging the handle.
4. Click **"Copy MD"** or **"Export / Print"** on the work order tab.
5. Click **"Rubric"** in the top bar to inspect live runtime metrics and architecture details.

---

## 9. Mobile PWA Installation & Field Usage

REPAIR.AI is an installable Progressive Web Application (PWA) with native-style mobile responsiveness, client-side camera downscaling, and offline application shell caching.

### Android Installation (Chrome / Edge / Firefox)
1. Open the application URL in **Chrome** or your preferred Android browser.
2. An **"Install App"** prompt banner will appear automatically at the top of the screen.
3. Tap **"Install App"** (or tap browser menu `⋮` $\rightarrow$ **"Add to Home screen"** / **"Install application"**).
4. REPAIR.AI will install with a standalone launcher icon and launch without browser chrome.

### iOS Installation (Safari)
1. Open the application URL in **Apple Safari**.
2. Tap the **Share** button (box with upward arrow $\uparrow$) in the bottom toolbar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Confirm the name **REPAIR.AI** and tap **"Add"**.
5. Launch from your Home Screen in standalone mode.

### Offline Resilience & Security Guarantees
- **Cached Shell:** Application UI, local SVG evidence assets, and case database load instantly even with zero network connectivity.
- **Offline Demonstration:** The full 5-stage **Community Problem Replay** operates 100% offline without needing API calls or internet access.
- **Privacy & Security:** Service worker strictly excludes external API calls (`generativelanguage.googleapis.com` and remote databases). **API keys and private user photos are never cached indiscriminately in the service worker.**
- **Network Transparency:** When offline, an explicit warning badge communicates that live multimodal AI analysis requires an active connection, preventing false assumptions of offline ML execution.

---

## 10. Open Source & Attribution

- **License:** [MIT License](LICENSE)
- **Model Terms:** [Google Gemma Terms of Use](https://ai.google.dev/gemma/terms) and [Gemini API Terms](https://ai.google.dev/gemini-api/terms)
- **Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Vitest, Happy-DOM.
- **AI Tool Attribution:** Built with assistance from Antigravity (Google DeepMind Advanced Agentic Coding) for pair programming, test design, and vector asset generation.
