from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Space, ConceptProposal, Comment

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Impact"])


@router.get("/city-stats")
def get_city_stats(db: Session = Depends(get_db)):
    spaces = db.query(Space).all()
    proposals = db.query(ConceptProposal).all()
    comments = db.query(Comment).all()

    total_spaces = len(spaces)
    total_area_sqm = sum(s.area_sqm for s in spaces)
    total_votes = sum(p.votes_count for p in proposals)
    total_comments = len(comments)

    # Environmental and Social Projections
    total_beneficiaries = sum(round(s.area_sqm * 2.8) for s in spaces)
    green_canopy_sqm = sum(round(s.area_sqm * 0.60) for s in spaces if "Green" in s.primary_community_need or "Neglected" in s.current_condition)
    co2_offset_tonnes = round((green_canopy_sqm * 0.95) / 1000.0, 2)
    avg_fit_score = round(sum(p.fit_score for p in proposals) / len(proposals), 1) if proposals else 82.0

    # Ward Breakdown
    ward_counts = {}
    for s in spaces:
        if s.ward not in ward_counts:
            ward_counts[s.ward] = {"ward": s.ward, "spaces": 0, "area_sqm": 0, "votes": 0}
        ward_counts[s.ward]["spaces"] += 1
        ward_counts[s.ward]["area_sqm"] += s.area_sqm
        ward_counts[s.ward]["votes"] += sum(p.votes_count for p in s.proposals)

    # Condition Breakdown
    condition_counts = {}
    for s in spaces:
        condition_counts[s.current_condition] = condition_counts.get(s.current_condition, 0) + 1

    # Need Breakdown
    need_counts = {}
    for s in spaces:
        need_counts[s.primary_community_need] = need_counts.get(s.primary_community_need, 0) + 1

    return {
        "overview": {
            "total_spaces": total_spaces,
            "total_area_sqm": round(total_area_sqm, 1),
            "total_proposals": len(proposals),
            "total_votes": total_votes,
            "total_comments": total_comments,
            "total_beneficiaries": total_beneficiaries,
            "green_canopy_sqm": green_canopy_sqm,
            "co2_offset_tonnes_yr": co2_offset_tonnes,
            "avg_fit_score": avg_fit_score
        },
        "wards": list(ward_counts.values()),
        "conditions": [{"label": k, "count": v} for k, v in condition_counts.items()],
        "needs": [{"label": k, "count": v} for k, v in need_counts.items()]
    }


@router.get("/priority-ranking")
def get_priority_ranking(db: Session = Depends(get_db)):
    spaces = db.query(Space).order_by(Space.priority_score.desc()).all()
    ranking = []
    for rank, s in enumerate(spaces, start=1):
        total_votes = sum(p.votes_count for p in s.proposals)
        leading_proposal = max(s.proposals, key=lambda x: x.votes_count) if s.proposals else None
        ranking.append({
            "rank": rank,
            "id": s.id,
            "title": s.title,
            "location": s.location_name,
            "ward": s.ward,
            "area_sqm": s.area_sqm,
            "priority_score": s.priority_score,
            "priority_level": s.priority_level,
            "status": s.status,
            "total_votes": total_votes,
            "leading_proposal": leading_proposal.title if leading_proposal else "Pending",
            "leading_votes": leading_proposal.votes_count if leading_proposal else 0
        })
    return ranking
