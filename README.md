
# E-Waste Management Portal

Empowering campuses and communities to recycle electronics responsibly, track e-waste, and drive sustainability with analytics and compliance.

## Features
- User & Vendor authentication
- Dashboard for users and vendors
- Add, track, and manage e-waste items
- Schedule and manage pickups
- Vendor bidding and pickup management
- Analytics dashboard (charts, KPIs, CO₂e impact)
- Compliance reports and CSV export
- Campaigns, drives, and engagement tools
- Modern, responsive UI (Next.js, Tailwind CSS)

## Tech Stack
- Next.js (App Router), React, TypeScript
- Node.js, Express, MongoDB (Mongoose)
- Tailwind CSS, Recharts, Lucide Icons

## Getting Started
1. Install dependencies:
	```bash
	npm install
	# or
	pnpm install
	```
2. Start the dev server:
	```bash
	npm run dev
	```
	Visit [http://localhost:3000](http://localhost:3000)
3. Configure `.env.local` for MongoDB and secrets if needed.

## Key Pages
- `/` Home
- `/login`, `/signup` Auth
- `/dashboard` User dashboard
- `/vendors/dashboard` Vendor dashboard
- `/vendors/items` Vendor items
- `/vendors/scheduling` Vendor pickups
- `/vendors/profile` Vendor profile
- `/dashboard/analytics` Analytics
- `/dashboard/compliance` Compliance
- `/dashboard/campaigns` Campaigns

## Scripts
- `dev` — Start dev server
- `build` — Production build
- `start` — Run production build

## License
MIT — Use, adapt, and extend freely.

Lightweight Next.js + TypeScript demo for managing institutional e‑waste flows with local (in‑browser) persistence. No backend / live tracking code is included now (previous SSE + map features were removed for simplicity).

## Stack
Next.js (App Router) · React · TypeScript · TailwindCSS · Recharts · localStorage (data only in the browser)

## Quick Start
1. Install deps: `npm install`
2. Dev server: `npm run dev` (opens http://localhost:3000)
3. All data is stored in localStorage. Clear browser storage to reset.

## Data Model (Stored under localStorage key `ewaste:data`)
Items, pickups, vendors, (optionally) drives. Saved as one JSON blob; all mutations rewrite it.

### Item Fields (key points)
- id (string)
- name, category (Computer, Projector, Lab Equipment, Mobile Device, Battery, Accessory, Other)
- department (free text)
- condition (New / Good / Fair / Poor)
- createdAt (ISO string)
- status (Reported → Scheduled → Collected → Sorted → Processed → Recycled | Disposed)
- classification: { type: Recyclable | Reusable | Hazardous, reason }
- qr (id encoded to PNG via on‑the‑fly canvas)

### Pickups
- id, date, vendorId, itemIds[]

### Vendors
- id, name, serviceTypes[], certified (boolean), contact

### Drives (recycling drives)
- id, name, startDate, endDate, allowedDepartments[], includeHazardous (boolean)

## Feature Overview & Logic

### 1. Items / Inventory
- Add items with minimal fields; classification auto‑assigned by heuristic.
- Filter/search by text, department, classification.
- Progress statuses manually (simulated workflow) or via scheduling / bulk drive scheduling.
- QR modal enlarges codes (centered & scroll‑safe) for quick scan.

Classification Heuristic (simplified):
1. Hazardous if category includes Battery or name contains keywords like "battery", "acid".
2. Reusable if condition is New or Good and not hazardous.
3. Else Recyclable.

### 2. Scheduling
- Displays only Reported items for selection.
- Requires vendor, pickup date, delivery address.
- On submit: creates pickup, sets each selected item status → Scheduled.
- Multi‑select + Select All convenience.

### 3. Recycling Drives
- Create a drive with date range, target departments and optional inclusion of hazardous items.
- Calculates eligible Reported items (department match + hazardous allowance).
- Bulk schedule eligible items (status → Scheduled) reusing scheduling logic.
- Table placeholder for listing past drives (can be extended later).

### 4. Vendors
- CRUD: add, edit, certify toggle.
- Summary cards: total vendors, certified count, certification rate.
- Certification impacts compliance stats (certified pickup count).

### 5. Campaigns / Engagement
- Personal points: 10 points per item + 5 bonus per item added in last 7 days.
- Department scoreboard weights per item classification:
	- Hazardous: +20
	- Reusable: +15
	- Recyclable: +10
- Sorted descending to show leading departments.

### 6. Compliance Report
- Aggregations: total items, by category, by classification, hazardous count, pickup count, certified pickup count (any pickup whose vendor.certified = true), departments summary.
- CSV export builds rows of category counts + summary metrics in‑memory (no server).

### 7. Analytics Dashboard
Cards & charts currently shown:
1. Monthly Volume (bar) – items created per month of current year, growth vs previous month, peak month, recycled count, average per active month.
2. Category & Impact Breakdown – pie of category distribution + CO₂e impact stats + classification barlets.

Removed (previous versions): recovery timeline line chart, department contributions chart, live map / distance / ETA, backend SSE server.

Impact & Sustainability Metrics (illustrative only):
- Weight Map (kg per category): Computer 7, Projector 3, Lab Equipment 10, Mobile Device 0.2, Battery 0.05, Accessory 0.1, Other 1.
- Emission Factor: 1.8 kg CO₂e avoided per kg properly recycled (placeholder).
- Progress Multipliers by status (fraction of potential impact realized):
	Reported 0, Scheduled 0.15, Collected 0.35, Sorted 0.55, Processed 0.75, Recycled 1.0, Disposed 0.
- For each non‑hazardous, non‑disposed item:
	fullImpact = weight(category) * emissionFactor
	potential += fullImpact
	avoided += fullImpact * progressMultiplier(status)
- Tree‑Year Equivalence (rough): treeYears = avoided / 21.77 (kg CO₂e a mature tree offsets in a year – illustrative ref).

Explicit constants (current code):

```ts
// Approx. average device weights (kg)
const weightMap: Record<string, number> = {
	Computer: 7,
	Projector: 3,
	"Lab Equipment": 10,
	"Mobile Device": 0.2,
	Battery: 0.05,
	Accessory: 0.1,
	Other: 1
}

// Progress multipliers (status → fraction of impact counted as "avoided")
const progressMultiplier: Record<string, number> = {
	Reported: 0,
	Scheduled: 0.15,
	Collected: 0.35,
	Sorted: 0.55,
	Processed: 0.75,
	Recycled: 1.0,
	Disposed: 0
}

const emissionFactorPerKg = 1.8 // kg CO₂e avoided per kg (placeholder)
```

Formulas:
- fullImpact(item) = weightMap[item.category] * emissionFactorPerKg

- potentialKgCO2 = Σ fullImpact(item) for every item where item.classification.type != Hazardous AND item.status != Disposed

- impactKgCO2 ("CO₂e avoided (est.)") = Σ fullImpact(item) * progressMultiplier[item.status] over same filtered items

- treeYearEq = impactKgCO2 / 21.77

Notes:
- Hazardous or Disposed items are skipped entirely in both sums (current design choice – adjust logic if you want to show separate hazardous potential).
- Reported status contributes 0 until an operational step occurs (encourages progressing items).
- Changing multipliers or including hazardous items only requires editing this single dashboard file.
- Rounding in UI: avoided & potential shown with one decimal (toFixed(1)).

### 8. Persistence & State
- Single source: `ewaste:data` localStorage key (serialized object) read on mount; updates rewrite full blob.
- No server sync, no authentication (demo scope). Clearing site data resets everything.

## Extensibility Ideas (Not Implemented Yet)
- Real backend (database, auth, role permissions).
- Accurate LCA emission + material recovery factors per device type & condition.
- Per‑item weight entry & measured disposal outcomes.
- Audit trail / hash chain for compliance (earlier experiment removed).
- Vendor performance metrics & SLA tracking.
- Drive history table & participation analytics.

## Development Notes
- All components are client components for simplicity.
- Avoided external state libraries; React state + localStorage only.
- Recharts used for lightweight visualization; unused charts removed to keep UI focused.

## Scripts
- `dev` – start Next.js dev server
- `build` – production build
- `start` – run production build

## Disclaimer
Emission factors, weights, and tree equivalence are placeholder assumptions for demonstration and must be replaced with validated domain data before real-world use.

## License
MIT (adapt / extend freely – remove placeholder sustainability numbers before production use).
