from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum as SqlEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from app.database import Base


class ChallengeStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    COMPLETED = "completed"
    EXPIRED = "expired"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    practice_records = relationship("PracticeRecord", back_populates="user")
    created_challenges = relationship("Challenge", foreign_keys="Challenge.challenger_id", back_populates="challenger")
    received_challenges = relationship("Challenge", foreign_keys="Challenge.challengee_id", back_populates="challengee")


class PracticeRecord(Base):
    __tablename__ = "practice_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word = Column(String(50), nullable=False, index=True)
    score = Column(Float, nullable=False)
    landmarks_data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="practice_records")


class StandardTemplate(Base):
    __tablename__ = "standard_templates"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(50), unique=True, nullable=False, index=True)
    landmarks_data = Column(Text, nullable=False)
    description = Column(String(200), nullable=True)
    video_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    challenge_code = Column(String(20), unique=True, index=True, nullable=False)
    challenger_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    challengee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    word = Column(String(50), nullable=False, index=True)
    target_score = Column(Float, nullable=False)
    challenger_score = Column(Float, nullable=True)
    challengee_score = Column(Float, nullable=True)
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(SqlEnum(ChallengeStatus), default=ChallengeStatus.PENDING, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    challenger = relationship("User", foreign_keys=[challenger_id], back_populates="created_challenges")
    challengee = relationship("User", foreign_keys=[challengee_id], back_populates="received_challenges")
    winner = relationship("User", foreign_keys=[winner_id])


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word = Column(String(50), nullable=False, index=True)
    best_score = Column(Float, nullable=False)
    total_attempts = Column(Integer, default=0)
    total_score = Column(Float, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
