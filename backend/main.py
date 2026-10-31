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
from .routers import spaces, proposals, analytics, admin

# Database Initialization & Seeding
def seed_demo_data():
    db = SessionLocal()
    try:
        if db.query(Space).count() == 0:
            print("[INFO] Seeding ReCity database with realistic urban revitalization spaces...")
            
            demo_spaces = [
                {
                    "title": "Carlton Corner Neglected Lot",
                    "location_name": "Corner of 4th Cross & 8th Main, Carlton Apts",
                    "ward": "Ward 12 - Central",
                    "latitude": 12.9716,
                    "longitude": 77.5946,
                    "area_sqm": 520.0,
                    "current_condition": "Neglected Plot",
                    "space_type": "Corner Lot",
                    "primary_community_need": "Green Space & Cooling",
                    "image_url": "/assets/before_plot.jpg",
                    "description": "Unused rectangular plot with broken concrete, accumulated litter, and weeds. High footfall from neighboring residential buildings.",
                    "constraints": "Check underground municipal drainage line along northern border; preserve mature roadside tree.",
                    "status": "Community Voting"
                },
                {
                    "title": "Indira Market Underutilized Paved Plaza",
                    "location_name": "Beside Sector 3 Vegetable Market Gate",
                    "ward": "Ward 7 - South",
                    "latitude": 12.9352,
                    "longitude": 77.6245,
                    "area_sqm": 340.0,
                    "current_condition": "Underused Paved Area",
                    "space_type": "Paved Plaza",
                    "primary_community_need": "Public Seating & Seniors",
                    "image_url": "/assets/before_plot.jpg",
                    "description": "Concrete paved dead-space currently occupied by parked handcarts and temporary debris. Close to senior residential colonies.",
                    "constraints": "Maintain 3m emergency vehicle clear corridor to market rear entrance.",
                    "status": "Feasibility Study"
                },
                {
                    "title": "Eastside Storm Canal Strip",
                    "location_name": "Adjacent to Stormwater Drain culvert, Ward 19",
                    "ward": "Ward 19 - East",
                    "latitude": 12.9784,
                    "longitude": 77.6408,
                    "area_sqm": 260.0,
                    "current_condition": "Illegal Dumping Ground",
                    "space_type": "Roadside Strip",
                    "primary_community_need": "Rainwater Retention",
                    "image_url": "/assets/before_plot.jpg",
                    "description": "Chronic roadside dumping stretch that causes monsoon waterlogging and foul odor. Potential bioswale candidate.",
                    "constraints": "Requires soil testing for heavy metals and culvert edge safety rail.",
                    "status": "Under Review"
                },
                {
                    "title": "Greenwood School Community Corner",
                    "location_name": "Opposite Primary Govt School Gate 2",
                    "ward": "Ward 4 - North",
                    "latitude": 13.0125,
                    "longitude": 77.5512,
                    "area_sqm": 480.0,
                    "current_condition": "Vacant Lot",
                    "space_type": "Open Ground",
                    "primary_community_need": "Children Play Area",
                    "image_url": "/assets/before_plot.jpg",
                    "description": "Fenced empty government-allocated reserve plot. Lacks grass or amenities; children currently play on the busy road.",
                    "constraints": "Require child safety buffer setback and night-time lockable perimeter.",
                    "status": "Approved for Pilot"
                },
                {
                    "title": "Metro Flyover Pillar 142 Plaza",
                    "location_name": "Underpass between Outer Ring Rd & Station",
                    "ward": "Ward 12 - Central",
                    "latitude": 12.9820,
                    "longitude": 77.6080,
                    "area_sqm": 620.0,
                    "current_condition": "Underused Paved Area",
                    "space_type": "Under-Flyover",
                    "primary_community_need": "Community Learning & Skill Center",
                    "image_url": "/assets/before_plot.jpg",
                    "description": "Shaded concrete space below elevated metro track. Well-protected from rain but poorly lit and neglected at night.",
                    "constraints": "Adhere to Metro Rail transit safety clearance; non-combustible materials only.",
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

@app.get("/")
def serve_index():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "ReCity Backend API is online. Access documentation at /docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
