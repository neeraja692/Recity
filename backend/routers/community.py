"""
backend/routers/community.py - Community Features Router for ReCity
Features:
1. Citizen Verification ("still vacant?" confirms & flags)
2. Duplicate Detection by Haversine Distance
3. Crowdfunding (Pledges) & Volunteer Sign-ups for Approved Spaces
"""

import math
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from ..database import Base, get_db
from ..models import Space

router = APIRouter(tags=["Community Actions & Verification"])


# ---------------------------------------------------------------------------
# SQLAlchemy Models for Community Extension
# ---------------------------------------------------------------------------
class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, ForeignKey("spaces.id"), nullable=False)
    action = Column(String(20), nullable=False)  # 'confirm' or 'flag'
    reason = Column(Text, nullable=True)
    reporter_id = Column(String(100), default="anonymous")
    created_at = Column(DateTime, default=datetime.utcnow)


class Pledge(Base):
    __tablename__ = "pledges"

    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, ForeignKey("spaces.id"), nullable=False)
    backer_name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, ForeignKey("spaces.id"), nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    skills = Column(Text, nullable=True)
    availability = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_community_models(engine):
    """Safely creates tables if they don't already exist without modifying existing data."""
    Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Haversine Distance Utility for Duplicate Detection
# ---------------------------------------------------------------------------
def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two coordinates in meters."""
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class VerificationCreate(BaseModel):
    action: str = Field(..., description="'confirm' (still vacant) or 'flag' (not vacant/fake)")
    reason: Optional[str] = None
    reporter_id: Optional[str] = "anonymous"


class PledgeCreate(BaseModel):
    backer_name: str
    email: str
    amount: float
    note: Optional[str] = None


class VolunteerCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    skills: Optional[str] = None
    availability: Optional[str] = None


# ---------------------------------------------------------------------------
# 1. Distance-Based Duplicate Detection Endpoint
# ---------------------------------------------------------------------------
@router.get("/api/community/check-duplicates")
def check_duplicates(
    lat: float = Query(..., description="Latitude of candidate report"),
    lng: float = Query(..., description="Longitude of candidate report"),
    radius: float = Query(75.0, description="Detection radius in meters (default 75m)"),
    db: Session = Depends(get_db)
):
    """
    Scans existing spaces to flag potential duplicates within the specified meter radius.
    """
    spaces = db.query(Space).all()
    duplicates = []

    for s in spaces:
        if s.latitude is None or s.longitude is None:
            continue
        try:
            dist = haversine_distance_meters(lat, lng, float(s.latitude), float(s.longitude))
            if dist <= radius:
                duplicates.append({
                    "id": s.id,
                    "title": s.title,
                    "location_name": s.location_name,
                    "ward": s.ward,
                    "status": s.status,
                    "distance_meters": round(dist, 1)
                })
        except (ValueError, TypeError):
            continue

    duplicates.sort(key=lambda d: d["distance_meters"])
    return {
        "candidate_lat": lat,
        "candidate_lng": lng,
        "radius_meters": radius,
        "count": len(duplicates),
        "duplicates": duplicates
    }


# ---------------------------------------------------------------------------
# 2. Citizen Verification Endpoints ("Still Vacant?" / Flag)
# ---------------------------------------------------------------------------
@router.post("/api/spaces/{space_id}/verify")
@router.post("/api/community/spaces/{space_id}/verify")
def submit_verification(space_id: int, payload: VerificationCreate, db: Session = Depends(get_db)):
    if payload.action not in ("confirm", "flag"):
        raise HTTPException(status_code=400, detail="Action must be 'confirm' or 'flag'")

    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    verification = Verification(
        space_id=space_id,
        action=payload.action,
        reason=payload.reason,
        reporter_id=payload.reporter_id or "anonymous"
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)

    confirms = db.query(Verification).filter(Verification.space_id == space_id, Verification.action == "confirm").count()
    flags = db.query(Verification).filter(Verification.space_id == space_id, Verification.action == "flag").count()

    return {
        "status": "success",
        "space_id": space_id,
        "action": payload.action,
        "confirmations": confirms,
        "flags": flags
    }


@router.get("/api/spaces/{space_id}/verifications")
@router.get("/api/community/spaces/{space_id}/verifications")
def get_verifications(space_id: int, db: Session = Depends(get_db)):
    confirms = db.query(Verification).filter(Verification.space_id == space_id, Verification.action == "confirm").count()
    flags = db.query(Verification).filter(Verification.space_id == space_id, Verification.action == "flag").count()

    return {
        "space_id": space_id,
        "confirmations": confirms,
        "flags": flags,
        "is_verified": confirms >= 3 and flags == 0,
        "under_review": flags >= 2
    }


# ---------------------------------------------------------------------------
# 3. Crowdfunding (Pledges) Endpoints
# ---------------------------------------------------------------------------
@router.post("/api/spaces/{space_id}/pledges")
@router.post("/api/community/spaces/{space_id}/pledges")
def submit_pledge(space_id: int, payload: PledgeCreate, db: Session = Depends(get_db)):
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Pledge amount must be greater than zero")

    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    pledge = Pledge(
        space_id=space_id,
        backer_name=payload.backer_name.strip(),
        email=payload.email.strip(),
        amount=float(payload.amount),
        note=payload.note
    )
    db.add(pledge)
    db.commit()
    db.refresh(pledge)

    all_pledges = db.query(Pledge).filter(Pledge.space_id == space_id).all()
    total = sum(p.amount for p in all_pledges)

    return {
        "status": "success",
        "space_id": space_id,
        "pledge_id": pledge.id,
        "total_pledged": total,
        "backer_count": len(all_pledges)
    }


@router.get("/api/spaces/{space_id}/pledges")
@router.get("/api/community/spaces/{space_id}/pledges")
def get_pledges(space_id: int, db: Session = Depends(get_db)):
    all_pledges = db.query(Pledge).filter(Pledge.space_id == space_id).order_by(Pledge.id.desc()).all()
    total = sum(p.amount for p in all_pledges)
    recent = [
        {
            "id": p.id,
            "backer_name": p.backer_name,
            "amount": p.amount,
            "note": p.note,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in all_pledges[:10]
    ]

    return {
        "space_id": space_id,
        "total_pledged": total,
        "backer_count": len(all_pledges),
        "recent_pledges": recent
    }


# ---------------------------------------------------------------------------
# 4. Volunteer Sign-Up Endpoints
# ---------------------------------------------------------------------------
@router.post("/api/spaces/{space_id}/volunteers")
@router.post("/api/community/spaces/{space_id}/volunteers")
def submit_volunteer(space_id: int, payload: VolunteerCreate, db: Session = Depends(get_db)):
    if not payload.name.strip() or not payload.email.strip():
        raise HTTPException(status_code=400, detail="Name and email are required")

    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    volunteer = Volunteer(
        space_id=space_id,
        name=payload.name.strip(),
        email=payload.email.strip(),
        phone=payload.phone.strip() if payload.phone else None,
        skills=payload.skills.strip() if payload.skills else None,
        availability=payload.availability.strip() if payload.availability else None
    )
    db.add(volunteer)
    db.commit()
    db.refresh(volunteer)

    count = db.query(Volunteer).filter(Volunteer.space_id == space_id).count()

    return {
        "status": "success",
        "space_id": space_id,
        "volunteer_id": volunteer.id,
        "volunteer_count": count,
        "message": f"Thank you, {volunteer.name}! You are registered as a community volunteer."
    }


@router.get("/api/spaces/{space_id}/volunteers")
@router.get("/api/community/spaces/{space_id}/volunteers")
def get_volunteers(space_id: int, db: Session = Depends(get_db)):
    vols = db.query(Volunteer).filter(Volunteer.space_id == space_id).order_by(Volunteer.id.desc()).all()
    return {
        "space_id": space_id,
        "count": len(vols),
        "volunteers": [
            {
                "id": v.id,
                "name": v.name,
                "skills": v.skills,
                "availability": v.availability,
                "created_at": v.created_at.isoformat() if v.created_at else None
            }
            for v in vols
        ]
    }
