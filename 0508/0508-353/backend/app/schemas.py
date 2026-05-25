from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Tuple


class PathMetrics(BaseModel):
    continuity: float
    time_stretch_ratio: float
    time_stretch_factor: float
    path_efficiency: float
    band_width_used: int
    original_template_frames: int
    original_input_frames: int
    normalized_frames: int


class UserCreate(BaseModel):
    username: str


class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


class PracticeRecordResponse(BaseModel):
    id: int
    user_id: int
    word: str
    score: float
    created_at: datetime

    class Config:
        from_attributes = True


class StandardTemplateResponse(BaseModel):
    id: int
    word: str
    description: Optional[str] = None
    video_url: Optional[str] = None

    class Config:
        from_attributes = True


class LandmarkDeviation(BaseModel):
    landmark_index: int
    average_deviation: float
    max_deviation: float
    deviation_per_frame: List[float]


class CompareResult(BaseModel):
    score: float
    word: str
    frame_count: int
    similarity_per_frame: List[float]
    landmark_deviations: List[LandmarkDeviation]
    path_metrics: Optional[PathMetrics] = None
    frame_count_template: Optional[int] = None
    frame_count_input: Optional[int] = None
    warping_path: Optional[List[Tuple[int, int]]] = None


class PracticeHistoryResponse(BaseModel):
    word: str
    records: List[PracticeRecordResponse]
    average_score: float
    best_score: float
    total_attempts: int


class ChallengeCreate(BaseModel):
    word: str
    target_score: Optional[float] = None
    challengee_id: Optional[int] = None
    expires_in_hours: int = 24


class ChallengeResponse(BaseModel):
    id: int
    challenge_code: str
    challenger_id: int
    challengee_id: Optional[int] = None
    word: str
    target_score: float
    challenger_score: Optional[float] = None
    challengee_score: Optional[float] = None
    winner_id: Optional[int] = None
    status: str
    expires_at: datetime
    created_at: datetime
    challenger: Optional[UserResponse] = None
    challengee: Optional[UserResponse] = None
    winner: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class ChallengeAccept(BaseModel):
    challenge_code: str


class ChallengeSubmit(BaseModel):
    challenge_code: str
    score: float


class LeaderboardEntryResponse(BaseModel):
    user_id: int
    username: str
    word: str
    best_score: float
    total_attempts: int
    average_score: float
    updated_at: datetime

    class Config:
        from_attributes = True


class UserStatsResponse(BaseModel):
    user_id: int
    username: str
    total_attempts: int
    best_overall_score: float
    average_score: float
    words_attempted: int
    rank: Optional[int] = None
    challenges_created: int = 0
    challenges_won: int = 0

    class Config:
        from_attributes = True
