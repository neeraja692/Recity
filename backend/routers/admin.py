from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Space, ConceptProposal, AuditLog, StatusUpdateRequest
from ..services.cost_estimator import generate_cost_breakdown
from ..services.priority_scorer import calculate_priority_score

router = APIRouter(prefix="/api/admin", tags=["Admin & Urban Governance"])


@router.patch("/spaces/{space_id}/status")
def update_space_status(space_id: int, request: StatusUpdateRequest, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    old_status = space.status
    space.status = request.status
    
    # Record in audit trail
    log = AuditLog(
        space_id=space.id,
        action=f"Status changed from '{old_status}' to '{request.status}'",
        actor=request.actor or "Municipal Planning Officer",
        timestamp=datetime.utcnow(),
        details=request.notes or "Administrative workflow status transition."
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "space_id": space.id,
        "old_status": old_status,
        "new_status": space.status,
        "updated_at": log.timestamp.isoformat()
    }


@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(20).all()
    return [
        {
            "id": l.id,
            "space_id": l.space_id,
            "action": l.action,
            "actor": l.actor,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M"),
            "details": l.details
        }
        for l in logs
    ]


@router.get("/spaces/{space_id}/export-proposal")
def export_redevelopment_proposal(space_id: int, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    total_votes = sum(p.votes_count for p in space.proposals)
    priority_meta = calculate_priority_score(
        current_condition=space.current_condition,
        area_sqm=space.area_sqm,
        community_votes=total_votes,
        has_constraints=bool(space.constraints),
        primary_need=space.primary_community_need
    )

    leading_concept = max(space.proposals, key=lambda x: x.votes_count) if space.proposals else None
    cost_data = generate_cost_breakdown(leading_concept.concept_type if leading_concept else "garden", space.area_sqm)

    dossier = {
        "metadata": {
            "dossier_id": f"RECITY-{space.created_at.year if space.created_at else 2026}-W{space.ward.split()[1] if len(space.ward.split()) > 1 else '0'}-{space.id:03d}",
            "generated_date": datetime.utcnow().strftime("%B %d, %Y"),
            "system": "ReCity AI Urban Revival Platform",
            "challenge": "SEVA First Innovation Challenge 2026"
        },
        "site_summary": {
            "name": space.title,
            "location": space.location_name,
            "ward": space.ward,
            "coordinates": f"{space.latitude:.4f}° N, {space.longitude:.4f}° E",
            "plot_area": f"{space.area_sqm} m²",
            "current_condition": space.current_condition,
            "space_type": space.space_type,
            "identified_need": space.primary_community_need,
            "status": space.status,
            "constraints": space.constraints,
            "before_image": space.image_url
        },
        "priority_decision_support": {
            "score": priority_meta["score"],
            "tier": priority_meta["level"],
            "estimated_beneficiaries": priority_meta["estimated_beneficiaries"],
            "official_recommendation": priority_meta["recommendation"],
            "factor_weights": priority_meta["factors"]
        },
        "leading_community_choice": {
            "concept_key": leading_concept.concept_key if leading_concept else "A",
            "title": leading_concept.title if leading_concept else "N/A",
            "tagline": leading_concept.tagline if leading_concept else "",
            "fit_score": f"{leading_concept.fit_score}/100" if leading_concept else "85/100",
            "community_votes": leading_concept.votes_count if leading_concept else 0,
            "vote_share_pct": round((leading_concept.votes_count / total_votes * 100), 1) if (leading_concept and total_votes > 0) else 0,
            "after_image": leading_concept.after_image_url if leading_concept else "/assets/after_garden.jpg",
            "environmental_impact": leading_concept.environmental_benefit if leading_concept else "",
            "social_dividend": leading_concept.community_benefit if leading_concept else "",
            "temporary_phase_1": leading_concept.temporary_phase if leading_concept else "",
            "permanent_phase_2": leading_concept.permanent_phase if leading_concept else ""
        },
        "financial_feasibility": cost_data,
        "disclaimer": "This document is an AI-assisted community decision-support brief prepared for municipal review. It does not replace structural engineering, land title verification, or environmental clearance."
    }

    return dossier
