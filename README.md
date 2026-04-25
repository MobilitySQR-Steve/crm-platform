# CRM Platform — TaxSQR & MobilitySQR

A unified React CRM for two modules: **TaxSQR** (D2C tax client management) and **MobilitySQR** (B2B enterprise sales pipeline).

---

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 — you'll land on the TaxSQR dashboard.

---

## What's Built

| Screen | Path | Status |
|--------|------|--------|
| TaxSQR Dashboard | `/taxsqr/dashboard` | ✅ Live |
| Client List | `/taxsqr/clients` | ✅ Live |
| Client Profile | `/taxsqr/clients/:id` | ✅ Live |
| Tax Cases Kanban | `/taxsqr/cases/kanban` | ✅ Live |
| Cases List View | `/taxsqr/cases/list` | 🔲 Placeholder |
| Documents | `/taxsqr/documents` | 🔲 Placeholder |
| My Tasks | `/taxsqr/tasks` | 🔲 Placeholder |
| Reports | `/taxsqr/reports` | 🔲 Placeholder |
| MobilitySQR Dashboard | `/mobility/dashboard` | ✅ Live |
| Account List | `/mobility/accounts` | ✅ Live |
| Contacts | `/mobility/contacts` | 🔲 Placeholder |
| Pipeline Kanban | `/mobility/pipeline/kanban` | ✅ Live |
| Pipeline List | `/mobility/pipeline/list` | 🔲 Placeholder |
| Workflows | `/mobility/workflows` | 🔲 Placeholder |
| My Tasks (B2B) | `/mobility/tasks` | 🔲 Placeholder |
| Reports (B2B) | `/mobility/reports` | 🔲 Placeholder |

---

## Project Structure

```
src/
├── App.jsx                          # Root router (React Router v6)
├── main.jsx                         # Entry point
├── index.css                        # CSS reset + brand tokens
│
├── constants/
│   └── brand.js                     # Module configs, nav, brand colours
│
├── components/
│   └── shell/
│       └── AppShell.jsx             # Sidebar + TopBar + <Outlet />
│
└── pages/
    ├── shared/
    │   └── Placeholder.jsx          # "Coming soon" for unbuilt screens
    │
    ├── taxsqr/
    │   ├── TaxDashboard.jsx         # KPIs, stage bars, recent cases
    │   ├── ClientList.jsx           # Searchable client table
    │   ├── ClientProfile.jsx        # 5-tab client detail page
    │   └── TaxKanban.jsx            # 7-stage drag-and-drop kanban
    │
    └── mobility/
        ├── MobilityDashboard.jsx    # Pipeline KPIs, stage bars, opps table
        ├── AccountList.jsx          # Searchable accounts table
        └── PipelineKanban.jsx       # 10-stage opportunity kanban
```

---

## Key Architecture Decisions

### Shell + Outlet pattern
`AppShell.jsx` renders the sidebar and top bar, then uses React Router's `<Outlet />` for page content. The content area uses `overflow: hidden; min-height: 0` so:
- **Kanban pages** set `height: 100%` and manage their own horizontal scroll
- **Normal pages** wrap content in `height: 100%; overflow-y: auto`

### Module switching
The active module (taxsqr / mobility) is derived from `useLocation().pathname` — no extra state needed. Switching modules navigates to that module's dashboard.

### Brand tokens
All colours are defined in `src/constants/brand.js` and `src/index.css` as CSS variables. TaxSQR accent = `#38AC87`, MobilitySQR accent = `#8D3B9D`.

---

## Adding a New Screen

1. Create `src/pages/taxsqr/MyNewPage.jsx`
2. Wrap content: `<div style={{ height:'100%', overflowY:'auto', background:'#EFECF7' }}>`
3. Add the route in `src/App.jsx`
4. Add nav item in `src/constants/brand.js` under the right module

---

## Connecting to a Real API

All mock data is currently inline in each page component. Replace it with:
- **TanStack Query** (`npm install @tanstack/react-query`) for server state + caching
- **Axios** for HTTP calls
- **Prisma** on the backend, targeting the PostgreSQL schema already designed

Recommended next: set up a Node/Fastify API in `../api/` pointing at the PostgreSQL schema.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Icons | lucide-react |
| Styling | Inline styles + CSS variables |
| State (future) | TanStack Query + Zustand |
| Backend (future) | Node.js + Prisma + PostgreSQL |

---

## Roadmap Phases

- **Phase 1** (Weeks 1–4): Foundation ✅ App shell, auth, CRUD  
- **Phase 2** (Weeks 5–8): Core CRM — activities, notes, documents, tasks  
- **Phase 3** (Weeks 9–12): Service delivery — workflows, global search, audit log  
- **Phase 4** (Weeks 13–16): Intelligence — dashboards, reports, AI layer (Claude API)
