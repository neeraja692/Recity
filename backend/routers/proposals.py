from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ConceptProposal, Space, Comment, CommentCreate, VoteRequest
from ..services.cost_estimator import generate_cost_breakdown
from ..services.priority_scorer import calculate_priority_score

router = APIRouter(prefix="/api", tags=["Proposals & Community Participation"])


@router.post("/proposals/{proposal_id}/vote")
def cast_vote(proposal_id: int, request: VoteRequest = None, db: Session = Depends(get_db)):
    proposal = db.query(ConceptProposal).filter(ConceptProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Transformation proposal not found")

    proposal.votes_count += 1
    db.commit()

    # Calculate total votes across all proposals for this space
    space = db.query(Space).filter(Space.id == proposal.space_id).first()
    total_votes = sum(p.votes_count for p in space.proposals)

    # Recalculate priority score with updated community demand
    priority_meta = calculate_priority_score(
        current_condition=space.current_condition,
        area_sqm=space.area_sqm,
        community_votes=total_votes,
        has_constraints=bool(space.constraints),
        primary_need=space.primary_community_need
    )
    space.priority_score = priority_meta["score"]
    space.priority_level = priority_meta["level"]
    db.commit()

    # Calculate percentages for all proposals of this space
    proposals_summary = []
    for p in space.proposals:
        pct = round((p.votes_count / total_votes * 100), 1) if total_votes > 0 else 0
        proposals_summary.append({
            "id": p.id,
            "concept_key": p.concept_key,
            "title": p.title,
            "votes_count": p.votes_count,
            "percentage": pct
        })

    return {
        "success": True,
        "message": f"Vote recorded for {proposal.title}!",
        "proposal_id": proposal.id,
        "new_votes": proposal.votes_count,
        "total_space_votes": total_votes,
        "space_priority_score": space.priority_score,
        "space_priority_level": space.priority_level,
        "all_proposals": proposals_summary
    }


@router.get("/proposals/{proposal_id}/cost-breakdown")
def get_proposal_cost_breakdown(proposal_id: int, db: Session = Depends(get_db)):
    proposal = db.query(ConceptProposal).filter(ConceptProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    space = proposal.space
    cost_data = generate_cost_breakdown(proposal.concept_type, space.area_sqm)
    return {
        "proposal_id": proposal.id,
        "proposal_title": proposal.title,
        "space_area_sqm": space.area_sqm,
        "cost_data": cost_data
    }


@router.get("/spaces/{space_id}/priority-factors")
def get_space_priority_factors(space_id: int, db: Session = Depends(get_db)):
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
    return {
        "space_id": space.id,
        "space_title": space.title,
        "priority_score": priority_meta["score"],
        "priority_level": priority_meta["level"],
        "recommendation": priority_meta["recommendation"],
        "factors": priority_meta["factors"]
    }


@router.post("/spaces/{space_id}/comments")
def add_comment(space_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    
    new_comment = Comment(
        space_id=space_id,
        author_name=comment.author_name or "Local Resident",
        author_role=comment.author_role or "Resident",
        comment_text=comment.comment_text
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


@router.post("/comments/{comment_id}/like")
def like_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.likes += 1
    db.commit()
    return {"id": comment.id, "likes": comment.likes}
