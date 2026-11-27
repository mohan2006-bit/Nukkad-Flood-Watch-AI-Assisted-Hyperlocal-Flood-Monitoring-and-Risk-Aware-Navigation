# Nukkad Flood Watch (சென்னை)

> **DEMO DATA • HACKATHON PROTOTYPE**  
> All neighborhood telemetry, reservoir discharge figures, citizen flood reports, WhatsApp bot chats, and route estimates in this application are **simulated demo data** for Chennai. This prototype is **not** a live emergency-warning or verified evacuation navigation service. Always follow official Greater Chennai Corporation (GCC), IMD, and Tamil Nadu Police advisories during real weather events.

**Nukkad Flood Watch** is a responsive, bilingual (English / தமிழ்) hyperlocal citizen flood-monitoring and street-level safe-corridor prototype built with React, TypeScript, and Tailwind CSS.

---

## Core Features

1. **Resident Flood Dashboard (`ResidentDashboard.tsx`)**
   - Displays ward-level flood risk indicators (`SAFE`, `MODERATE`, `HIGH`, `CRITICAL`), average street water depth gauges, Chembarambakkam/Poondi reservoir discharge telemetry, and relief shelter occupancy.
   - Includes a live trust-scored citizen report stream with interactive trust-score breakdown tooltips, photo origin badges (`Demo Illustration` vs `User Uploaded Photo`), and single-action community confirmation (`I Can Confirm This`).

2. **Interactive Street-Level Flood Map (`StreetFloodMap.tsx`)**
   - Vector map of South & Central Chennai corridors (`Velachery`, `Madipakkam`, `Perumbakkam`, `T. Nagar`, `Pallikaranai`, `Mudichur`, `Adyar`, `Mylapore`).
   - Filterable by inundation depth, vehicle passability, and elevated flyovers, with zoom/reset controls and a street-inspection drawer showing pump/barricade controls and linked citizen reports.

3. **Citizen Flood Report Submission (`ReportForm.tsx`)**
   - Lets residents and field volunteers submit street-level water depth, flow velocity, vehicle passability, power-outage flags, stranded resident counts, and test photo uploads.
   - Submissions flow through shared `FloodContext` state to update dashboard metrics, map vectors, automated alerts, and the warden verification queue immediately.

4. **Offline WhatsApp Bot Simulator (`WhatsAppSimulator.tsx`)**
   - Interactive local simulator (not connected to Meta/WhatsApp servers) with English & Tamil NLP extraction (`parseWhatsAppFloodMessage`) for water depth, street landmark, power cuts, and stranded rescues.
   - Extracted intelligence can be recorded directly onto the shared street flood map.

5. **Dynamic Safe Corridor & Flood-Avoidance Route Planner (`SafeRoutePlanner.tsx`)**
   - Uses a deterministic Dijkstra pathfinder over a 12-hub Chennai demo street network (`DEMO_ROUTE_HUBS` & `DEMO_STREET_NETWORK_EDGES` in `src/utils/floodLogic.ts`).
   - Separately calculates the **Direct Shortest Ground Corridor** vs **Lower-Risk Flood-Avoidance Corridor** using Haversine segment distances, road geometry factors, travel mode speeds (`two_wheeler`, `car`, `suv`, `emergency`), weather scenario scaling, live pump/barricade state, and active non-debunked flood reports.
   - Recalculates distance, base drive time, flood/barricade delay penalties, risk level, and mode compatibility whenever origin, destination, travel mode, weather scenario, or street conditions change.

6. **Automated Location-Specific Alerts (`AlertCenter.tsx`)**
   - Displays reservoir surge notices, warden advisories, and auto-generated alerts triggered by severe citizen reports, alongside Chennai emergency helpline numbers (`GCC: 1913`, `TNEB: 94987 94987`, `SDRF: 1070`).

7. **Warden Verification & Operations Portal (`AdminDashboard.tsx`)**
   - Allows ward officers to **Verify & Seal**, **Mark Debunked / Spam** (excluding flagged reports from flood indices), log simulated `[DEMO ONLY]` NDRF escalations, toggle municipal pumps/barricades, inspect the visible action audit stream, and export demo state as JSON.

8. **Bilingual Switching & Weather Scenario Simulator (`Header.tsx`, `src/locales/translations.ts`)**
   - Instant **English / தமிழ்** switching across navigation, cards, map labels, alerts, and routes.
   - Weather scenario selector (`Monsoonal Cloudburst`, `Steady Rain`, `Receding Waters`) updates telemetry, street depths, and route estimates across the entire app.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons:** `lucide-react`
- **Unit Testing:** Node built-in test runner (`node:test`) via `tsx`

---

## Project Structure

```text
├── index.html
├── metadata.json
├── package.json
├── README.md
├── tsconfig.json
├── vite.config.ts
└── src
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── components
    │   ├── AdminDashboard.tsx
    │   ├── AlertCenter.tsx
    │   ├── Header.tsx
    │   ├── ReportForm.tsx
    │   ├── ResidentDashboard.tsx
    │   ├── SafeRoutePlanner.tsx
    │   ├── StreetFloodMap.tsx
    │   └── WhatsAppSimulator.tsx
    ├── context
    │   └── FloodContext.tsx
    ├── data
    │   └── mockData.ts
    ├── locales
    │   └── translations.ts
    ├── types
    │   └── index.ts
    └── utils
        ├── floodLogic.ts
        └── floodLogic.test.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### Install & Run Locally

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:3000`.

### Scripts

- `npm run dev` — Start Vite dev server on port `3000`
- `npm run build` — Build production bundle into `dist/`
- `npm run preview` — Preview the production build locally
- `npm run lint` — Run TypeScript type checking (`tsc --noEmit`)
- `npx tsx --test src/utils/floodLogic.test.ts` — Run unit tests for trust scoring, passability, WhatsApp NLP parsing, and dynamic route calculations

---

## License

Prototype created for demonstration purposes. Do not deploy as an official emergency-warning or navigation system.
