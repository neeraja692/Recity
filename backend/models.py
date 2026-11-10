from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict
from .database import Base

# SQLAlchemy Models
class Space(Base):
    __tablename__ = "spaces"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    location_name = Column(String(200), nullable=False)
    ward = Column(String(100), default="K/W Ward - Andheri West, Mumbai")
    latitude = Column(Float, default=19.0760)
    longitude = Column(Float, default=72.8777)
    area_sqm = Column(Float, nullable=False)
    current_condition = Column(String(100), default="Neglected Plot")
    space_type = Column(String(100), default="Open Ground")
    primary_community_need = Column(String(100), default="Green Space & Cooling")
    image_url = Column(String(500), default="/assets/before_plot.jpg")
    description = Column(Text, default="")
    constraints = Column(Text, default="Check soil quality, underground drainage, and clear access road.")
    status = Column(String(50), default="Community Voting")
    created_at = Column(DateTime, default=datetime.utcnow)
    priority_score = Column(Float, default=78.5)
    priority_level = Column(String(20), default="High")

    proposals = relationship("ConceptProposal", back_populates="space", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="space", cascade="all, delete-orphan")


class ConceptProposal(Base):
    __tablename__ = "concept_proposals"

    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, ForeignKey("spaces.id"), nullable=False)
    concept_key = Column(String(5), default="A") # "A", "B", "C"
    title = Column(String(200), nullable=False)
    concept_type = Column(String(50), default="garden") # garden, play, learning, rain_garden, etc.
    tagline = Column(String(250), default="")
    description = Column(Text, default="")
    fit_score = Column(Integer, default=85)
    fit_reason = Column(Text, default="")
    estimated_cost_inr = Column(Integer, default=250000)
    cost_band = Column(String(20), default="Medium")
    votes_count = Column(Integer, default=0)
    after_image_url = Column(String(500), default="/assets/after_garden.jpg")
    environmental_benefit = Column(Text, default="")
    community_benefit = Column(Text, default="")
    temporary_phase = Column(Text, default="")
    permanent_phase = Column(Text, default="")
    maintenance_estimate = Column(Text, default="")

    space = relationship("Space", back_populates="proposals")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, ForeignKey("spaces.id"), nullable=False)
    author_name = Column(String(100), default="Local Resident")
    author_role = Column(String(100), default="Resident")
    comment_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    likes = Column(Integer, default=0)

    space = relationship("Space", back_populates="comments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, nullable=True)
    action = Column(String(100), nullable=False)
    actor = Column(String(100), default="Ward Planning Admin")
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, default="")


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, ForeignKey("spaces.id"), nullable=False)
    action = Column(String(50), nullable=False)  # 'confirm' or 'flag'
    reason = Column(Text, nullable=True)
    reporter_id = Column(String(100), default="anonymous")
    created_at = Column(DateTime, default=datetime.utcnow)


class Pledge(Base):
    __tablename__ = "pledges"

    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, ForeignKey("spaces.id"), nullable=False)
    backer_name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, ForeignKey("spaces.id"), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    skills = Column(String(200), nullable=True)
    availability = Column(String(100), default="Flexible / As Needed")
    created_at = Column(DateTime, default=datetime.utcnow)


# Pydantic Schemas for API serialization
class VerificationCreate(BaseModel):
    action: str  # 'confirm' or 'flag'
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
class ConceptProposalBase(BaseModel):
    id: Optional[int] = None
    concept_key: str
    title: str
    concept_type: str
    tagline: str
    description: str
    fit_score: int
    fit_reason: str
    estimated_cost_inr: int
    cost_band: str
    votes_count: int = 0
    after_image_url: str
    environmental_benefit: str
    community_benefit: str
    temporary_phase: str
    permanent_phase: str
    maintenance_estimate: str

    model_config = ConfigDict(from_attributes=True)


class CommentBase(BaseModel):
    id: Optional[int] = None
    space_id: int
    author_name: str
    author_role: str
    comment_text: str
    created_at: Optional[datetime] = None
    likes: int = 0

    model_config = ConfigDict(from_attributes=True)


class CommentCreate(BaseModel):
    author_name: str
    author_role: Optional[str] = "Local Resident"
    comment_text: str


class SpaceBase(BaseModel):
    id: Optional[int] = None
    title: str
    location_name: str
    ward: str
    latitude: float
    longitude: float
    area_sqm: float
    current_condition: str
    space_type: str
    primary_community_need: str
    image_url: str
    description: str
    constraints: str
    status: str
    created_at: Optional[datetime] = None
    priority_score: float
    priority_level: str
    proposals: List[ConceptProposalBase] = []
    comments: List[CommentBase] = []

    model_config = ConfigDict(from_attributes=True)


class SpaceCreate(BaseModel):
    title: str
    location_name: str
    ward: str = "K/W Ward - Andheri West, Mumbai"
    latitude: Optional[float] = 19.0760
    longitude: Optional[float] = 72.8777
    area_sqm: float
    current_condition: str
    space_type: str
    primary_community_need: str
    description: Optional[str] = ""
    constraints: Optional[str] = ""


class VoteRequest(BaseModel):
    voter_type: Optional[str] = "Resident"


class StatusUpdateRequest(BaseModel):
    status: str
    actor: Optional[str] = "Admin / City Planner"
    notes: Optional[str] = ""
