import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .database import engine, Base, SessionLocal
from .models import Space, ConceptProposal, Comment, AuditLog
from .services.ai_analyzer import generate_three_futures
from .services.priority_scorer import calculate_priority_score
from .routers import spaces, proposals, analytics, admin, community

# Database Initialization & Seeding
def seed_demo_data():
    db = SessionLocal()
    try:
        if db.query(Space).count() == 0:
            print("[INFO] Seeding ReCity database with realistic Maharashtra urban revitalization spaces...")
            
            demo_spaces = [
                {
                    "title": "Andheri Link Road Under-Metro Dead Space",
                    "location_name": "Below Metro Line 2A Pillars 180-184, Near D.N. Nagar",
                    "ward": "K/W Ward - Andheri West, Mumbai",
                    "latitude": 19.1254,
                    "longitude": 72.8362,
                    "area_sqm": 620.0,
                    "current_condition": "Underused Paved Area",
                    "space_type": "Under-Flyover",
                    "primary_community_need": "Community Learning & Skill Center",
                    "image_url": "/assets/before_plot.jpg",
                    "description": "Shaded concrete stretch beneath the elevated Metro 2A viaduct in Andheri West. High evening commuter footfall, sheltered from monsoon downpours, but presently unlit and occupied by stray vehicle parking.",
                    "constraints": "Strict compliance with MMRDA elevated metro clearance guidelines; non-combustible materials only; preserve 3m utility buffer.",
                    "status": "Community Voting"
                },
                {
                    "title": "FC Road Deccan Gymkhana Neglected Municipal Corner",
                    "location_name": "Corner of Fergusson College Road & Goodluck Chowk Lane",
                    "ward": "Zone 3 (Ghole Road) - Deccan Gymkhana, Pune",
                    "latitude": 18.5186,
                    "longitude": 73.8415,
                    "area_sqm": 480.0,
                    "current_condition": "Neglected Plot",
                    "space_type": "Corner Lot",
                    "primary_community_need": "Green Space & Cooling",
                    "image_url": "/assets/before_plot.jpg",
                    "description": "Fenced vacant municipal plot near bustling student cafes and heritage colleges. Overgrown with invasive weeds and broken pavers; high heat island effect during summer months.",
                    "constraints": "Preserve 3 mature banyan & neem shade trees; integrate with PMC heritage precinct pedestrian guidelines.",
                    "status": "Community Voting"
                },
                {
                    "title": "Dharavi Mithi Riverbank Buffer Strip",
                    "location_name": "Adjacent to 90ft Road Culvert, Dharavi",
                    "ward": "G/N Ward - Dharavi, Mumbai",
                    "latitude": 19.0435,
                    "longitude": 72.8567,
                    "area_sqm": 350.0,
                    "current_condition": "Illegal Dumping Ground",
                    "space_type": "Roadside Strip",
                    "primary_community_need": "Rainwater Retention",
                    "image_url": "/assets/before_plot.jpg",
                    "description": "Chronic dumping stretch on the Mithi riverbank periphery that clogs stormwater culverts during monsoon high tides. Prime site for nature-based bio-swales and mangrove-edge remediation.",
                    "constraints": "Coastal regulation zone CRZ safety buffer; continuous monsoon stormwater runoff channel clearance required.",
                    "status": "Under Review"
                },
                {
                    "title": "Sitabuldi Market Underutilized Civic Plaza",
                    "location_name": "Behind Sitabuldi Main Road Wholesale Market Gate 3",
                    "ward": "Dharampeth Zone - Sitabuldi, Nagpur",
                    "latitude": 21.1466,
                    "longitude": 79.0882,
                    "area_sqm": 380.0,
                    "current_condition": "Underused Paved Area",
                    "space_type": "Paved Plaza",
                    "primary_community_need": "Public Seating & Seniors",
                    "image_url": "/assets/before_plot.jpg",
                    "description": "Paved public dead-space behind central Sitabuldi market currently filled with discarded wooden crates and construction debris. Densely populated historic center with high senior citizen footfall.",
                    "constraints": "Maintain 3.5m emergency access lane for NMC fire engines; provide shaded senior resting zones with drinking water.",
                    "status": "Feasibility Study"
                },
                {
                    "title": "Panchavati Godavari Ghat Community Reserve Ground",
                    "location_name": "Near Ramkund Approach Road, Panchavati",
                    "ward": "Panchavati Division - Nashik",
                    "latitude": 19.9975,
                    "longitude": 73.7898,
                    "area_sqm": 540.0,
                    "current_condition": "Vacant Lot",
                    "space_type": "Open Ground",
                    "primary_community_need": "Children Play Area",
                    "image_url": "/assets/before_plot.jpg",
                    "description": "Unutilized civic reserve ground opposite local primary schools in pilgrimage heritage corridor. Neighborhood children presently play along congested vehicular roads.",
                    "constraints": "Flood line demarcation during Godavari peak monsoon discharge; require child-safe non-toxic play equipment and protective fencing.",
                    "status": "Approved for Pilot"
                },
                {
                    "title": "Thane Ghodbunder Road Waterfront Pocket",
                    "location_name": "Near Kasarvadavali Creek Promenade Junction",
                    "ward": "Majiwada-Manpada Ward - Thane",
                    "latitude": 19.2618,
                    "longitude": 72.9642,
                    "area_sqm": 420.0,
                    "current_condition": "Neglected Plot",
                    "space_type": "Corner Lot",
                    "primary_community_need": "Green Space & Cooling",
                    "image_url": "/assets/before_plot.jpg",
                    "description": "Vacant creek-view pocket along Ghodbunder transit corridor. Offers immense potential for community urban forest, micro-climate cooling, and resident seating.",
                    "constraints": "TMC wetland buffer guidelines; use salt-tolerant coastal native plants.",
                    "status": "Community Voting"
                }
            ]

            for s in demo_spaces:
                # Priority Score
                p_meta = calculate_priority_score(
                    current_condition=s["current_condition"],
                    area_sqm=s["area_sqm"],
                    community_votes=28,
                    has_constraints=bool(s["constraints"]),
                    primary_need=s["primary_community_need"]
                )

                new_space = Space(
                    title=s["title"],
                    location_name=s["location_name"],
                    ward=s["ward"],
                    latitude=s["latitude"],
                    longitude=s["longitude"],
                    area_sqm=s["area_sqm"],
                    current_condition=s["current_condition"],
                    space_type=s["space_type"],
                    primary_community_need=s["primary_community_need"],
                    image_url=s["image_url"],
                    description=s["description"],
                    constraints=s["constraints"],
                    status=s["status"],
                    priority_score=p_meta["score"],
                    priority_level=p_meta["level"]
                )
                db.add(new_space)
                db.commit()
                db.refresh(new_space)

                # Generate 3 futures
                futures = generate_three_futures(
                    space_title=s["title"],
                    location_name=s["location_name"],
                    ward=s["ward"],
                    area_sqm=s["area_sqm"],
                    current_condition=s["current_condition"],
                    space_type=s["space_type"],
                    primary_community_need=s["primary_community_need"],
                    description=s["description"],
                    constraints=s["constraints"]
                )

                for f in futures:
                    concept = ConceptProposal(
                        space_id=new_space.id,
                        concept_key=f["concept_key"],
                        title=f["title"],
                        concept_type=f["concept_type"],
                        tagline=f["tagline"],
                        description=f["description"],
                        fit_score=f["fit_score"],
                        fit_reason=f["fit_reason"],
                        estimated_cost_inr=f["estimated_cost_inr"],
                        cost_band=f["cost_band"],
                        votes_count=f["votes_count"],
                        after_image_url=f["after_image_url"],
                        environmental_benefit=f["environmental_benefit"],
                        community_benefit=f["community_benefit"],
                        temporary_phase=f["temporary_phase"],
                        permanent_phase=f["permanent_phase"],
                        maintenance_estimate=f["maintenance_estimate"]
                    )
                    db.add(concept)

                # Comments
                c1 = Comment(
                    space_id=new_space.id,
                    author_name="Priya Sharma",
                    author_role="Local Resident",
                    comment_text="Our children desperately need Concept B play area! Right now there is no safe spot away from traffic.",
                    likes=14
                )
                c2 = Comment(
                    space_id=new_space.id,
                    author_name="Ramesh Kulkarni",
                    author_role="Senior Citizen Committee",
                    comment_text="Concept A pocket garden with benches would be a blessing for morning walks. Please ensure good lighting.",
                    likes=9
                )
                db.add(c1)
                db.add(c2)

            # Audit log
            log = AuditLog(
                space_id=1,
                action="Space registered and AI transformation concepts generated",
                actor="System AI Agent",
                details="Initial spatial classification and multi-future generation complete."
            )
            db.add(log)
            db.commit()
            print("[INFO] Seeding completed successfully.")
    finally:
        db.close()


# Initialize database tables immediately
Base.metadata.create_all(bind=engine)
seed_demo_data()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist and seeded
    Base.metadata.create_all(bind=engine)
    seed_demo_data()
    yield

# FastAPI App
app = FastAPI(
    title="ReCity API — AI-Powered Urban Space Revival Platform",
    description="Backend microservice for urban space reporting, AI multiple-future generation, priority scoring, and community voting.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(spaces.router)
app.include_router(proposals.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(community.router)

# Mount directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
ASSETS_DIR = os.path.join(FRONTEND_DIR, "assets")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")), name="js")

@app.get("/manifest.json")
def serve_manifest():
    manifest_path = os.path.join(FRONTEND_DIR, "manifest.json")
    if os.path.exists(manifest_path):
        return FileResponse(manifest_path, media_type="application/manifest+json")
    return FileResponse(os.path.join(FRONTEND_DIR, "manifest.json"))

@app.get("/sw.js")
def serve_sw():
    sw_path = os.path.join(FRONTEND_DIR, "sw.js")
    if os.path.exists(sw_path):
        return FileResponse(sw_path, media_type="application/javascript")
    return {"message": "Service worker not found"}

@app.get("/")
def serve_index():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "ReCity Backend API is online. Access documentation at /docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
