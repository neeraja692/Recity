import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Space, ConceptProposal, Comment, SpaceBase, SpaceCreate
from ..services.ai_analyzer import generate_three_futures
from ..services.priority_scorer import calculate_priority_score

router = APIRouter(prefix="/api/spaces", tags=["Spaces"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=List[SpaceBase])
def get_spaces(
    ward: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    need: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Space)
    if ward:
        query = query.filter(Space.ward == ward)
    if condition:
        query = query.filter(Space.current_condition == condition)
    if need:
        query = query.filter(Space.primary_community_need == need)
    if status:
        query = query.filter(Space.status == status)
    if search:
        s = f"%{search}%"
        query = query.filter((Space.title.ilike(s)) | (Space.location_name.ilike(s)) | (Space.ward.ilike(s)))
    
    return query.order_by(Space.priority_score.desc()).all()


@router.get("/{space_id}", response_model=SpaceBase)
def get_space(space_id: int, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Urban space not found")
    return space


@router.post("", response_model=SpaceBase)
def create_space(
    title: str = Form(...),
    location_name: str = Form(...),
    ward: str = Form("K/W Ward - Andheri West, Mumbai"),
    latitude: float = Form(19.0760),
    longitude: float = Form(72.8777),
    area_sqm: float = Form(...),
    current_condition: str = Form("Neglected Plot"),
    space_type: str = Form("Open Ground"),
    primary_community_need: str = Form("Green Space & Cooling"),
    description: str = Form(""),
    constraints: str = Form(""),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Save uploaded image or use default authentic survey photo
    image_url = "/assets/before_plot.jpg"
    if photo and photo.filename:
        filename = f"space_{os.urandom(4).hex()}_{photo.filename.replace(' ', '_')}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        image_url = f"/uploads/{filename}"

    # Calculate initial priority score
    priority_meta = calculate_priority_score(
        current_condition=current_condition,
        area_sqm=area_sqm,
        community_votes=0,
        has_constraints=bool(constraints),
        primary_need=primary_community_need
    )

    new_space = Space(
        title=title,
        location_name=location_name,
        ward=ward,
        latitude=latitude,
        longitude=longitude,
        area_sqm=area_sqm,
        current_condition=current_condition,
        space_type=space_type,
        primary_community_need=primary_community_need,
        image_url=image_url,
        description=description,
        constraints=constraints or "Verify soil drainage, site ownership, and boundary clearings.",
        status="Community Voting",
        priority_score=priority_meta["score"],
        priority_level=priority_meta["level"]
    )
    db.add(new_space)
    db.commit()
    db.refresh(new_space)

    # Automatically generate 3 AI Multiple Futures
    proposals_data = generate_three_futures(
        space_title=title,
        location_name=location_name,
        ward=ward,
        area_sqm=area_sqm,
        current_condition=current_condition,
        space_type=space_type,
        primary_community_need=primary_community_need,
        description=description,
        constraints=constraints
    )

    for p in proposals_data:
        concept = ConceptProposal(
            space_id=new_space.id,
            concept_key=p["concept_key"],
            title=p["title"],
            concept_type=p["concept_type"],
            tagline=p["tagline"],
            description=p["description"],
            fit_score=p["fit_score"],
            fit_reason=p["fit_reason"],
            estimated_cost_inr=p["estimated_cost_inr"],
            cost_band=p["cost_band"],
            votes_count=0,
            after_image_url=p["after_image_url"],
            environmental_benefit=p["environmental_benefit"],
            community_benefit=p["community_benefit"],
            temporary_phase=p["temporary_phase"],
            permanent_phase=p["permanent_phase"],
            maintenance_estimate=p["maintenance_estimate"]
        )
        db.add(concept)

    # Add welcome initial prompt comment
    seed_comment = Comment(
        space_id=new_space.id,
        author_name="ReCity AI Urban Planner",
        author_role="AI System",
        comment_text=f"Analyzed {area_sqm} m² site in {ward}. Generated 3 alternative futures prioritizing {primary_community_need}. Residents are encouraged to vote for Concept A, B, or C below."
    )
    db.add(seed_comment)

    db.commit()
    db.refresh(new_space)
    return new_space
