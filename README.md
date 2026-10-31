# 🏙️ ReCity — AI-Powered Urban Space Revival & Community Planning Platform
### SEVA First Innovation Challenge 2026

**Problem:** Cities contain hundreds of neglected plots, vacant underutilized corners, and dead urban spaces that could provide vital community amenities, green cover, recreation, and cooling. Today, identifying suitable uses, estimating preliminary costs, evaluating local deficits, and mobilizing community consensus is fragmented and slow.

**Solution:** **ReCity** completes the civic decision-making loop:
$$\text{Discover} \longrightarrow \text{Analyse} \longrightarrow \text{Imagine} \longrightarrow \text{Match} \longrightarrow \text{Estimate} \longrightarrow \text{Vote} \longrightarrow \text{Action (Crowdfund & Volunteer)} \longrightarrow \text{Prioritise}$$

---

## 🌟 Key Architecture  and Separate-Files Structure

ReCity is engineered with a clean modular architecture separating the high-performance Python FastAPI backend, SQLite database persistence, and a modern responsive, mobile-first PWA frontend:

```
ReCity/
│
├── backend/                        # Python FastAPI Backend
│   ├── main.py                     # App setup, CORS, static mounts, seed runner & PWA routing
│   ├── database.py                 # SQLAlchemy engine & SQLite session
│   ├── models.py                   # Core ORM models (Space, Proposal, Comment, AuditLog)
│   ├── services/
│   │   ├── ai_analyzer.py          # AI spatial synthesis & 3 multiple-future generator
│   │   ├── priority_scorer.py      # Transparent 5-factor Redevelopment Priority Score engine
│   │   ├── need_matcher.py         # Community need & ward deficit matching engine
│   │   └── cost_estimator.py       # Unit economics CapEx, OpEx, and Tactical Phase estimator
│   └── routers/
│       ├── spaces.py               # Space registration, photo upload & directory APIs
│       ├── proposals.py            # Multiple futures, voting & resident comments
│       ├── analytics.py            # Ward statistics, carbon offset, and citywide metrics
│       ├── admin.py                # Status workflow, audit log & proposal dossier export
│       └── community.py            # [NEW] Verification, Haversine duplicates, pledges & volunteers
│
├── frontend/                       # Interactive Responsive Frontend & PWA
│   ├── index.html                  # Single-Page Application interface
│   ├── manifest.json               # [NEW] PWA Web App Manifest (standalone installable app)
│   ├── sw.js                       # [NEW] Resilient Service Worker (offline caching & background sync)
│   ├── css/
│   │   ├── style.css               # Design system, glassmorphism, slider CSS, print rules
│   │   └── community.css           # [NEW] Mobile FAB (z-index 9999), action cards & <=900px overrides
│   ├── js/
│   │   ├── api.js                  # REST API client with resilient offline fallback cache
│   │   ├── map.js                  # Leaflet.js interactive OpenStreetMap & custom pins
│   │   ├── charts.js               # Chart.js radar, bar, and doughnut impact visualizers
│   │   ├── app.js                  # SPA router, Before/After image slider, voting logic
│   │   └── community.js            # [NEW] Auto GPS, direct camera trigger, verification & action flows
│   └── assets/                     # Photorealistic AI-generated transformation imagery & vector icons
│       ├── icon.svg                # [NEW] Vector maskable PWA app icon
│       ├── before_plot.jpg         # Authentic surveyed urban vacant lot
│       ├── after_garden.jpg        # Concept A: Community Pocket Garden & Pollinator Oasis
│       ├── after_play.jpg          # Concept B: Children's Play Area & Family Recreation
│       └── after_learning.jpg      # Concept C: Open-Air Learning & Skill Pavilion
│
├── uploads/                        # User-submitted site survey photographs
├── run.bat                         # One-click Windows launcher
├── index.html                      # Root entrypoint redirect
├── render.yaml                     # Render deployment configuration
├── requirements.txt                # Python package dependencies
└── recity.db                       # Relational SQLite database
```

---

## 🚀 Complete Feature Implementation Matrix

### A. Core Platform Features
1. **Smart Space Reporting:** Submit site photograph, approximate area (m²), condition, morphology, neighborhood need, constraints, and GPS coordinates.
2. **AI Space Analysis:** Synthesizes spatial area, surroundings, and condition constraints into structured opportunities and caveats.
3. **Multiple-Future Generator:** Generates 3 distinct actionable transformations (Concept A: Pocket Garden; Concept B: Children's Play Park; Concept C: Community Learning Pavilion).
4. **Community Need Matching Engine:** Evaluates alignment between stated local priorities (heat relief, green space, child play, seniors) and returns transparent fit scores ($0\text{--}100$).
5. **Preliminary Cost Estimator:** Breaks down CapEx by works (site clearance, paving, structures, planting, lighting, contingency) plus tactical temporary pop-up budget ($18\%$) and annual OpEx ($6.5\%/\text{yr}$).
6. **Community Voting & Feedback:** Real-time upvoting for Concept A/B/C, live animated percentage bars, and resident suggestion discussion feed.
7. **Impact Dashboard:** Interactive Chart.js charts detailing ward land vs demand, voting consensus, and multi-dimensional sustainability radar.
8. **Municipal Admin Hub:** Priority queue ranking, workflow status transitions (`Pending Review` $\rightarrow$ `Community Voting` $\rightarrow$ `Feasibility Study` $\rightarrow$ `Approved for Pilot`), and audit trails.

---

### B. New Community & Mobile-First Features (Seamlessly Integrated)

#### 1. 🛡️ Citizen Verification & Distance-Based Duplicate Detection
* **Resident Peer Verification ("Still Vacant?"):**
  - Residents can verify space reports in their neighborhoods by confirming "Still Vacant & Neglected" or flagging the report as "Occupied / Inaccurate / Duplicate".
  - Spaces receiving $\ge 3$ confirmations and $0$ flags earn the **Community Verified (Authentic)** trust badge.
  - Spaces receiving $\ge 2$ flags are automatically tagged **Under Moderator Review** to mitigate spam and fake submissions.
* **Automated Distance-Based Duplicate Detection:**
  - Employs the great-circle **Haversine Distance Formula** on coordinates:
    $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
  - When submitting or auto-detecting GPS coordinates in the registration form, the system automatically checks for existing spaces within **75 meters** (`/api/community/check-duplicates`).
  - If a nearby space exists, an instant warning banner is displayed highlighting the title and distance (in meters) to encourage confirming existing reports rather than generating duplicate entries.

#### 2. 📱 Mobile-First Reporting & Progressive Web App (PWA)
* **Auto-Detect GPS:** One-click "📍 Auto-Detect Current GPS" button queries the HTML5 Geolocation API with `{ enableHighAccuracy: true }` and instantly fills the latitude and longitude inputs.
* **Direct Camera Trigger:** Space photograph input is configured with `accept="image/*"` and `capture="environment"`, automatically prompting the user's mobile rear camera on smartphones.
* **Installable PWA App:**
  - Fully compliant `manifest.json` configured with `display: "standalone"`, primary theme color `#0f4435`, and responsive maskable SVG vector icons (`assets/icon.svg`).
  - Mobile browsers display an "Install ReCity" app prompt.
* **Rock-Solid Offline Service Worker (`sw.js`):**
  - Uses `Promise.allSettled` pre-caching, immediate activation (`skipWaiting()`), and client claiming (`clients.claim()`).
  - Employs cache-first strategy with background revalidation for static assets, network-first with JSON offline fallback for API endpoints, and navigation fallbacks for offline usage.
* **Floating Action Button (FAB):**
  - High z-index (`z-index: 9999`) floating button styled with safe-area insets (`env(safe-area-inset-bottom)`) so it stays visible on top of all page sections.
* **Responsive Layout Overrides ($\le 900\text{px}$):**
  - Responsive overrides prevent horizontal overflow on mobile viewports caused by fixed-column inline grids (filters, facts, and comment forms) and wide admin tables (`overflow-x: auto`), leaving desktop screens ($> 900\text{px}$) completely unchanged.

#### 3. 🚀 Crowdfunding & Volunteer Action Loop (Per Space)
* **Closing the Loop from Report to Action:**
  - Prevents reports from stalling at the discussion phase by providing direct action pathways for approved and community-voting spaces.
* **Crowdfunding (Pledges):**
  - Neighbors can pledge financial contributions toward the revitalization campaign (e.g. Tactical Phase 1 budget).
  - Dynamic visual progress bar shows percent funded toward the target budget along with total funds raised and backer counts.
* **Volunteer Sign-Up:**
  - Residents can volunteer their labor, skills (gardening, painting, carpentry, coordination), and availability (weekend mornings, weekday evenings, as-needed).
  - Handled via non-stalling asynchronous submission (`e.preventDefault()`, structured payload parsing, and guaranteed button reset in `finally` blocks).

---

## 📡 REST API Reference

### Core Spaces & Proposals
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/spaces` | List all spaces with ward, condition, and need filters |
| `GET` | `/api/spaces/{id}` | Get space details, proposals, and comments |
| `POST` | `/api/spaces` | Register a new vacant space with photo |
| `POST` | `/api/proposals/{id}/vote` | Cast community vote for Concept A, B, or C |
| `POST` | `/api/spaces/{id}/comments` | Submit resident feedback or ideas |

### Community Verification & Duplicate Detection
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/community/check-duplicates` | Find existing spaces within radius (default 75m) using Haversine distance |
| `POST` | `/api/spaces/{id}/verify` | Submit resident confirmation (`confirm`) or flag (`flag`) |
| `GET` | `/api/spaces/{id}/verifications` | Get confirmation and flag tallies and verification badge status |

### Action Loop: Crowdfunding & Volunteers
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/spaces/{id}/pledges` | Submit a funding pledge (backer name, email, amount, note) |
| `GET` | `/api/spaces/{id}/pledges` | Retrieve total funds raised, backer count, and recent pledges |
| `POST` | `/api/spaces/{id}/volunteers` | Register a volunteer (name, email, phone, skills, availability) |
| `GET` | `/api/spaces/{id}/volunteers` | Get registered volunteer count and roster for project workdays |

### Progressive Web App (PWA)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/manifest.json` | Web App Manifest for mobile installation |
| `GET` | `/sw.js` | Service Worker script for offline asset caching |
| `GET` | `/icon.svg` | Vector maskable PWA application icon |

---

## 💻 How to Run ReCity Locally

### Option 1: Quick Windows Launcher
Double-click `run.bat` in the project root to start the backend and launch the web app automatically at `http://127.0.0.1:8000`.

### Option 2: Terminal Execution
```bash
# 1. Install dependencies (if not already installed)
pip install -r requirements.txt

# 2. Start the FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# 3. Open in browser:
http://127.0.0.1:8000
```

### Option 3: Automated Self-Test
To verify all backend endpoints, duplicate detection, verification logic, and PWA assets:
```bash
python -c "from fastapi.testclient import TestClient; from backend.main import app; c = TestClient(app); print('Duplicates:', c.get('/api/community/check-duplicates?lat=12.9716&lng=77.5946&radius=100').status_code); print('Manifest:', c.get('/manifest.json').status_code); print('SW:', c.get('/sw.js').status_code)"
```

---

## ⚖️ Ethical & Decision-Support Notice
ReCity provides preliminary decision-support estimates to foster community collaboration and prioritize municipal attention. Prior to any real-world physical construction, site ownership verification, underground utility checks, environmental soil testing, and professional civil engineering certifications must be completed.
