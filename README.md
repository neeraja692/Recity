# 🏙️ ReCity — AI-Powered Urban Space Revival & Community Planning Platform
### SEVA First Innovation Challenge 2026

**Problem:** Cities contain hundreds of neglected plots, vacant underutilized corners, and dead urban spaces that could provide vital community amenities, green cover, recreation, and cooling. Today, identifying suitable uses, estimating preliminary costs, evaluating local deficits, and mobilizing community consensus is fragmented and slow.

**Solution:** **ReCity** completes the civic decision-making loop:
$$\text{Discover} \longrightarrow \text{Analyse} \longrightarrow \text{Imagine} \longrightarrow \text{Match} \longrightarrow \text{Estimate} \longrightarrow \text{Vote} \longrightarrow \text{Prioritise}$$

---

## 🌟 Key Architecture & Separate-Files Structure

ReCity is engineered with a clean modular architecture separating the high-performance Python FastAPI backend, SQLite database persistence, and a modern responsive frontend:

```
ReCity_Prototype 1/
│
├── backend/                        # Python FastAPI Backend
│   ├── main.py                     # App setup, CORS, static mounts, seed runner
│   ├── database.py                 # SQLAlchemy engine & SQLite session
│   ├── models.py                   # ORM models (Space, Proposal, Comment, AuditLog) & Pydantic schemas
│   ├── services/
│   │   ├── ai_analyzer.py          # AI spatial synthesis & 3 multiple-future generator
│   │   ├── priority_scorer.py      # Transparent 5-factor Redevelopment Priority Score engine
│   │   ├── need_matcher.py         # Community need & ward deficit matching engine
│   │   └── cost_estimator.py       # Unit economics CapEx, OpEx, and Tactical Phase estimator
│   └── routers/
│       ├── spaces.py               # Space registration, photo upload & directory APIs
│       ├── proposals.py            # Multiple futures, voting & resident comments
│       ├── analytics.py            # Ward statistics, carbon offset, and citywide metrics
│       └── admin.py                # Status workflow, audit log & proposal dossier export
│
├── frontend/                       # Interactive Responsive Frontend
│   ├── index.html                  # Single-Page Application interface
│   ├── css/
│   │   └── style.css               # Design system, glassmorphism, slider CSS, print rules
│   ├── js/
│   │   ├── api.js                  # REST API client with resilient offline fallback cache
│   │   ├── map.js                  # Leaflet.js interactive OpenStreetMap & custom pins
│   │   ├── charts.js               # Chart.js radar, bar, and doughnut impact visualizers
│   │   └── app.js                  # SPA router, Before/After image slider, voting logic
│   └── assets/                     # Photorealistic AI-generated transformation imagery
│       ├── before_plot.jpg         # Authentic surveyed urban vacant lot
│       ├── after_garden.jpg        # Concept A: Community Pocket Garden & Pollinator Oasis
│       ├── after_play.jpg          # Concept B: Children's Play Area & Family Recreation
│       └── after_learning.jpg      # Concept C: Open-Air Learning & Skill Pavilion
│
├── uploads/                        # User-submitted site survey photographs
├── run.bat                         # One-click Windows launcher
├── index.html                      # Root entrypoint redirect
└── recity.db                       # Auto-generated SQLite database
```

---

## 🚀 Complete Feature Implementation Matrix

### A. Core Features (All Implemented & Verified)
1. **Smart Space Reporting:** Submit site photograph, approximate area (m²), condition, morphology, neighborhood need, constraints, and GPS coordinates.
2. **AI Space Analysis:** Synthesizes spatial area, surroundings, and condition constraints into structured opportunities and caveats.
3. **Multiple-Future Generator:** Generates 3 distinct actionable transformations (Concept A: Pocket Garden; Concept B: Children's Play Park; Concept C: Community Learning Pavilion).
4. **Community Need Matching Engine:** Evaluates alignment between stated local priorities (heat relief, green space, child play, seniors) and returns transparent fit scores ($0\text{--}100$).
5. **Preliminary Cost Estimator:** Breaks down CapEx by works (site clearance, paving, structures, planting, lighting, contingency) plus tactical temporary pop-up budget ($18\%$) and annual OpEx ($6.5\%/\text{yr}$).
6. **Community Voting & Feedback:** Real-time upvoting for Concept A/B/C, live animated percentage bars, and resident suggestion discussion feed.
7. **Impact Dashboard:** Interactive Chart.js charts detailing ward land vs demand, voting consensus, and multi-dimensional sustainability radar.
8. **Municipal Admin Hub:** Priority queue ranking, workflow status transitions (`Pending Review` $\rightarrow$ `Community Voting` $\rightarrow$ `Feasibility Study` $\rightarrow$ `Approved for Pilot`), and audit trails.

### B. Advanced Differentiators
1. **Interactive Before-and-After AI Visualisation:** Split-screen slider with draggable handle allowing users and city planners to visually compare the neglected plot with each AI-generated transformation concept.
2. **Smart Redevelopment Priority Score:**
   $$\text{PriorityScore} = (S_{\text{neglect}} \times 0.25) + (R_{\text{beneficiaries}} \times 0.25) + (D_{\text{community}} \times 0.20) + (E_{\text{eco}} \times 0.15) + (F_{\text{feasibility}} \times 0.15)$$
   Clearly certified as a decision-support metric.
3. **Phased Temporary-to-Permanent Planning:**
   - **Phase 1 (Tactical Urbanism, Months 1–4):** Movable planters, pallet benches, pop-up shade sails, and community seed days.
   - **Phase 2 (Permanent Capital, Months 5–12):** Permanent pergola, safety rubber flooring, rainwater harvesting, and solar arrays.
4. **Downloadable / Printable Executive Proposal Dossier:** One-click generation of a municipal project brief complete with project code, site summary, priority certificates, financial feasibility, and disclaimer.

---

## 👥 Five-Member Team Responsibilities

| Member | Focus Area | Deliverable in this Codebase |
|---|---|---|
| **Member 1** | Frontend & UI/UX | `frontend/index.html`, `style.css`, interactive Before/After comparison slider, proposal cards, and responsive navigation. |
| **Member 2** | Backend & Database | `backend/database.py`, `models.py`, `main.py`, SQLite relational schema, REST endpoints, and photo uploads. |
| **Member 3** | AI & Spatial Intelligence | `backend/services/ai_analyzer.py`, `need_matcher.py`, 3 multiple futures synthesis, and temporary-to-permanent phased roadmaps. |
| **Member 4** | Maps & Impact Analytics | `frontend/js/map.js`, `frontend/js/charts.js`, Leaflet.js interactive pins, and Chart.js sustainability radar & ward statistics. |
| **Member 5** | Integration, Costs & Feasibility | `backend/services/cost_estimator.py`, `priority_scorer.py`, `backend/routers/admin.py`, dossier export modal, and end-to-end testing. |

---

## 💻 How to Run ReCity Locally

### Option 1: Quick Windows Launcher (Recommended)
Simply double click `run.bat` in the project root. It will start the FastAPI backend and open your browser automatically at `http://127.0.0.1:8000`.

### Option 2: Terminal Execution
```bash
# 1. Start the FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# 2. Open in browser:
http://127.0.0.1:8000
```

### Option 3: Direct Browser Demonstration (Offline Mode)
You can also open `frontend/index.html` directly in Google Chrome or Microsoft Edge. The built-in client (`api.js`) contains an offline demo cache that provides complete interactivity even without an active internet connection.

---

## ⚖️ Ethical & Decision-Support Notice
ReCity provides preliminary decision-support estimates to foster community collaboration and prioritize municipal attention. Prior to any real-world physical construction, site ownership verification, underground utility checks, environmental soil testing, and professional civil engineering certifications must be completed.
