import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Space, Verification, Pledge, Volunteer, VerificationCreate, PledgeCreate, VolunteerCreate

router = APIRouter(tags=["Community Actions & Verification"])

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates ground distance in meters between two lat/lon coordinates."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


# 1. Duplicate Detection by Distance
@router.get("/api/community/check-duplicates")
def check_duplicates(
    lat: float = Query(..., description="Latitude of candidate report"),
    lng: float = Query(..., description="Longitude of candidate report"),
    radius: float = Query(75.0, description="Detection radius in meters (default 75m)"),
    db: Session = Depends(get_db)
):
    """Scans existing spaces to flag potential duplicates within the specified meter radius."""
    spaces = db.query(Space).all()
    duplicates = []

    for space in spaces:
        if space.latitude is not None and space.longitude is not None:
            dist = haversine_distance(lat, lng, space.latitude, space.longitude)
            if dist <= radius:
                duplicates.append({
                    "id": space.id,
                    "title": space.title,
                    "location_name": space.location_name,
                    "ward": space.ward,
                    "status": space.status,
                    "distance_meters": round(dist, 1)
                })

    duplicates.sort(key=lambda d: d["distance_meters"])
    return {
        "candidate_lat": lat,
        "candidate_lng": lng,
        "radius_meters": radius,
        "count": len(duplicates),
        "duplicates": duplicates
    }


# 2. Citizen Verification (Confirm or Flag)
@router.post("/api/community/spaces/{space_id}/verify")
@router.post("/api/spaces/{space_id}/verify")
def submit_verification(space_id: int, payload: VerificationCreate, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    action_norm = payload.action.strip().lower()
    if action_norm not in ["confirm", "flag"]:
        raise HTTPException(status_code=400, detail="Action must be 'confirm' or 'flag'")

    verif = Verification(
        space_id=space_id,
        action=action_norm,
        reason=payload.reason,
        reporter_id=payload.reporter_id or "anonymous"
    )
    db.add(verif)
    db.commit()
    db.refresh(verif)
    return {"message": "Verification recorded successfully", "id": verif.id, "action": verif.action}


@router.get("/api/community/spaces/{space_id}/verifications")
@router.get("/api/spaces/{space_id}/verifications")
def get_verifications(space_id: int, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    confirms = db.query(Verification).filter(Verification.space_id == space_id, Verification.action == "confirm").count()
    flags = db.query(Verification).filter(Verification.space_id == space_id, Verification.action == "flag").count()

    is_verified = confirms >= 3 and flags == 0
    under_review = flags > 0

    return {
        "space_id": space_id,
        "confirmations": confirms,
        "flags": flags,
        "is_verified": is_verified,
        "under_review": under_review
    }


# 3. Crowdfunding Pledges per Space
@router.post("/api/community/spaces/{space_id}/pledges")
@router.post("/api/spaces/{space_id}/pledges")
def submit_pledge(space_id: int, payload: PledgeCreate, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Pledge amount must be greater than zero")

    pledge = Pledge(
        space_id=space_id,
        backer_name=payload.backer_name.strip(),
        email=payload.email.strip(),
        amount=payload.amount,
        note=payload.note
    )
    db.add(pledge)
    db.commit()
    db.refresh(pledge)
    return {"message": "Pledge received", "id": pledge.id, "amount": pledge.amount}


@router.get("/api/community/spaces/{space_id}/pledges")
@router.get("/api/spaces/{space_id}/pledges")
def get_pledges(space_id: int, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    pledges = db.query(Pledge).filter(Pledge.space_id == space_id).all()
    total = sum(p.amount for p in pledges)

    return {
        "space_id": space_id,
        "total_pledged": total,
        "backer_count": len(pledges),
        "recent_pledges": [
            {"backer_name": p.backer_name, "amount": p.amount, "created_at": p.created_at.isoformat()}
            for p in sorted(pledges, key=lambda x: x.created_at, reverse=True)[:10]
        ]
    }


# 4. Volunteer Sign-up per Space
@router.post("/api/community/spaces/{space_id}/volunteers")
@router.post("/api/spaces/{space_id}/volunteers")
def submit_volunteer(space_id: int, payload: VolunteerCreate, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    vol = Volunteer(
        space_id=space_id,
        name=payload.name.strip(),
        email=payload.email.strip(),
        phone=payload.phone.strip() if payload.phone else None,
        skills=payload.skills.strip() if payload.skills else None,
        availability=payload.availability or "Flexible / As Needed"
    )
    db.add(vol)
    db.commit()
    db.refresh(vol)
    return {"message": "Volunteer registered successfully", "id": vol.id, "name": vol.name}


@router.get("/api/community/spaces/{space_id}/volunteers")
@router.get("/api/spaces/{space_id}/volunteers")
def get_volunteers(space_id: int, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    vols = db.query(Volunteer).filter(Volunteer.space_id == space_id).all()
    return {
        "space_id": space_id,
        "count": len(vols),
        "volunteers": [
            {
                "name": v.name,
                "skills": v.skills,
                "availability": v.availability,
                "created_at": v.created_at.isoformat()
            }
            for v in sorted(vols, key=lambda x: x.created_at, reverse=True)
        ]
    }
