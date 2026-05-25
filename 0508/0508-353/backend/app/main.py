import os
import json
import time
import tempfile
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import engine, SessionLocal, get_db, Base
from app.models import User, PracticeRecord, StandardTemplate, Challenge, ChallengeStatus, LeaderboardEntry
from app.schemas import (
    UserCreate,
    UserResponse,
    PracticeRecordResponse,
    StandardTemplateResponse,
    CompareResult,
    PracticeHistoryResponse,
    ChallengeCreate,
    ChallengeResponse,
    LeaderboardEntryResponse,
    UserStatsResponse
)
from app.hand_landmark import HandLandmarkExtractor
from app.dtw_comparator import DTWComparator
from app.templates import TemplateGenerator, load_template_from_file, landmarks_to_array, SIGN_WORDS

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="手语教学系统 API",
    description="手语视频录制、关键点提取、DTW比对评分系统",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

template_generator = TemplateGenerator()
dtw_comparator = DTWComparator()


def init_database():
    db = SessionLocal()
    try:
        existing_templates = db.query(StandardTemplate).count()
        if existing_templates == 0:
            templates_dir = "./data/templates"
            os.makedirs(templates_dir, exist_ok=True)

            templates = template_generator.generate_all_templates(templates_dir)

            for word_id, template_data in templates.items():
                template = StandardTemplate(
                    word=template_data["word"],
                    landmarks_data=json.dumps(template_data["landmarks"], ensure_ascii=False),
                    description=template_data["description"],
                    video_url=template_data["video_url"]
                )
                db.add(template)

            db.commit()
            print(f"已初始化 {len(templates)} 个标准模板")
    finally:
        db.close()


init_database()


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "手语教学系统API运行正常"}


@app.get("/api/words", response_model=List[dict])
async def get_sign_words():
    return template_generator.get_sign_words_list()


@app.get("/api/templates/{word_id}", response_model=StandardTemplateResponse)
async def get_template(word_id: str, db: Session = Depends(get_db)):
    word_name = None
    for sign in SIGN_WORDS:
        if sign["id"] == word_id:
            word_name = sign["word"]
            break

    if not word_name:
        raise HTTPException(status_code=404, detail="词汇不存在")

    template = db.query(StandardTemplate).filter(StandardTemplate.word == word_name).first()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")

    return template


@app.post("/api/users", response_model=UserResponse)
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        return existing_user

    user = User(username=user_data.username)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


@app.post("/api/compare/{word_id}", response_model=CompareResult)
async def compare_sign(
    word_id: str,
    user_id: int = Query(...),
    video: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    start_time = time.time()

    word_name = None
    for sign in SIGN_WORDS:
        if sign["id"] == word_id:
            word_name = sign["word"]
            break

    if not word_name:
        raise HTTPException(status_code=404, detail="词汇不存在")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    template = db.query(StandardTemplate).filter(StandardTemplate.word == word_name).first()
    if not template:
        raise HTTPException(status_code=404, detail="标准模板不存在")

    temp_file_path = None
    try:
        suffix = os.path.splitext(video.filename)[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await video.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        extractor = HandLandmarkExtractor()
        input_landmarks_list = extractor.extract_landmarks_from_video(temp_file_path)
        extractor.close()

        if not input_landmarks_list:
            raise HTTPException(status_code=400, detail="无法从视频中提取手部关键点")

        input_landmarks_array = landmarks_to_array(input_landmarks_list)
        if len(input_landmarks_array) == 0:
            raise HTTPException(status_code=400, detail="视频中未检测到手部")

        template_landmarks_list = json.loads(template.landmarks_data)
        template_landmarks_array = landmarks_to_array(template_landmarks_list)

        if len(template_landmarks_array) == 0:
            raise HTTPException(status_code=500, detail="标准模板数据异常")

        result = dtw_comparator.compare_with_heatmap(
            template_landmarks_array,
            input_landmarks_array
        )

        record = PracticeRecord(
            user_id=user_id,
            word=word_name,
            score=result["score"],
            landmarks_data=json.dumps(input_landmarks_list, ensure_ascii=False)
        )
        db.add(record)
        db.commit()

        update_leaderboard(db, user_id, word_name, result["score"])

        elapsed = time.time() - start_time
        print(f"比对耗时: {elapsed:.2f}秒")

        return CompareResult(
            score=result["score"],
            word=word_name,
            frame_count=len(input_landmarks_array),
            similarity_per_frame=result["similarity_per_frame"],
            landmark_deviations=result["landmark_deviations"],
            path_metrics=result.get("path_metrics"),
            frame_count_template=result.get("frame_count_template"),
            frame_count_input=result.get("frame_count_input"),
            warping_path=result.get("warping_path")
        )

    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)


@app.get("/api/history/{user_id}", response_model=List[PracticeHistoryResponse])
async def get_practice_history(
    user_id: int,
    word_id: Optional[str] = Query(None, description="可选：按词汇筛选"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    query = db.query(PracticeRecord).filter(PracticeRecord.user_id == user_id)

    if word_id:
        word_name = None
        for sign in SIGN_WORDS:
            if sign["id"] == word_id:
                word_name = sign["word"]
                break
        if word_name:
            query = query.filter(PracticeRecord.word == word_name)

    records = query.order_by(PracticeRecord.created_at.desc()).all()

    word_groups = {}
    for record in records:
        if record.word not in word_groups:
            word_groups[record.word] = []
        word_groups[record.word].append(record)

    history = []
    for word, word_records in word_groups.items():
        scores = [r.score for r in word_records]
        history.append(PracticeHistoryResponse(
            word=word,
            records=word_records,
            average_score=round(sum(scores) / len(scores), 2),
            best_score=round(max(scores), 2),
            total_attempts=len(word_records)
        ))

    return history


@app.get("/api/history/{user_id}/records", response_model=List[PracticeRecordResponse])
async def get_practice_records(
    user_id: int,
    word_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    query = db.query(PracticeRecord).filter(PracticeRecord.user_id == user_id)

    if word_id:
        word_name = None
        for sign in SIGN_WORDS:
            if sign["id"] == word_id:
                word_name = sign["word"]
                break
        if word_name:
            query = query.filter(PracticeRecord.word == word_name)

    records = query.order_by(PracticeRecord.created_at.desc()).limit(limit).all()
    return records


@app.delete("/api/records/{record_id}")
async def delete_practice_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(PracticeRecord).filter(PracticeRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")

    db.delete(record)
    db.commit()
    return {"message": "记录已删除"}


def generate_challenge_code() -> str:
    code = str(uuid.uuid4().hex[:8]).upper()
    return f"SL-{code}"


def update_leaderboard(db: Session, user_id: int, word: str, score: float):
    entry = db.query(LeaderboardEntry).filter(
        LeaderboardEntry.user_id == user_id,
        LeaderboardEntry.word == word
    ).first()

    if entry:
        if score > entry.best_score:
            entry.best_score = score
        entry.total_attempts += 1
        entry.total_score += score
    else:
        entry = LeaderboardEntry(
            user_id=user_id,
            word=word,
            best_score=score,
            total_attempts=1,
            total_score=score
        )
        db.add(entry)

    db.commit()


def check_expired_challenges(db: Session):
    now = datetime.utcnow()
    expired_challenges = db.query(Challenge).filter(
        Challenge.status.in_([ChallengeStatus.PENDING, ChallengeStatus.ACCEPTED]),
        Challenge.expires_at < now
    ).all()

    for challenge in expired_challenges:
        challenge.status = ChallengeStatus.EXPIRED
        if challenge.challenger_score and challenge.challengee_score:
            if challenge.challenger_score > challenge.challengee_score:
                challenge.winner_id = challenge.challenger_id
            elif challenge.challengee_score > challenge.challenger_score:
                challenge.winner_id = challenge.challengee_id
    db.commit()


@app.post("/api/challenges", response_model=ChallengeResponse)
async def create_challenge(
    challenge_data: ChallengeCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    word_name = None
    for sign in SIGN_WORDS:
        if sign["id"] == challenge_data.word:
            word_name = sign["word"]
            break

    if not word_name:
        raise HTTPException(status_code=404, detail="词汇不存在")

    target_score = challenge_data.target_score
    if target_score is None:
        best_record = db.query(PracticeRecord).filter(
            PracticeRecord.user_id == user_id,
            PracticeRecord.word == word_name
        ).order_by(PracticeRecord.score.desc()).first()
        target_score = best_record.score if best_record else 80.0

    challenge_code = generate_challenge_code()
    while db.query(Challenge).filter(Challenge.challenge_code == challenge_code).first():
        challenge_code = generate_challenge_code()

    challenge = Challenge(
        challenge_code=challenge_code,
        challenger_id=user_id,
        challengee_id=challenge_data.challengee_id,
        word=word_name,
        target_score=target_score,
        status=ChallengeStatus.PENDING,
        expires_at=datetime.utcnow() + timedelta(hours=challenge_data.expires_in_hours)
    )

    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    return ChallengeResponse(
        id=challenge.id,
        challenge_code=challenge.challenge_code,
        challenger_id=challenge.challenger_id,
        challengee_id=challenge.challengee_id,
        word=challenge.word,
        target_score=challenge.target_score,
        challenger_score=challenge.challenger_score,
        challengee_score=challenge.challengee_score,
        winner_id=challenge.winner_id,
        status=challenge.status,
        expires_at=challenge.expires_at,
        created_at=challenge.created_at,
        challenger=user
    )


@app.post("/api/challenges/accept", response_model=ChallengeResponse)
async def accept_challenge(
    challenge_code: str,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    check_expired_challenges(db)

    challenge = db.query(Challenge).filter(Challenge.challenge_code == challenge_code).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="挑战不存在")

    if challenge.status != ChallengeStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"挑战状态为{challenge.status}，无法接受")

    if challenge.challengee_id and challenge.challengee_id != user_id:
        raise HTTPException(status_code=403, detail="此挑战指定了其他用户")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    challenge.challengee_id = user_id
    challenge.status = ChallengeStatus.ACCEPTED
    db.commit()
    db.refresh(challenge)

    return ChallengeResponse(
        id=challenge.id,
        challenge_code=challenge.challenge_code,
        challenger_id=challenge.challenger_id,
        challengee_id=challenge.challengee_id,
        word=challenge.word,
        target_score=challenge.target_score,
        challenger_score=challenge.challenger_score,
        challengee_score=challenge.challengee_score,
        winner_id=challenge.winner_id,
        status=challenge.status,
        expires_at=challenge.expires_at,
        created_at=challenge.created_at,
        challenger=challenge.challenger,
        challengee=user
    )


@app.post("/api/compare/{word_id}/challenge/{challenge_code}", response_model=CompareResult)
async def compare_sign_with_challenge(
    word_id: str,
    challenge_code: str,
    user_id: int = Query(...),
    video: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    check_expired_challenges(db)

    challenge = db.query(Challenge).filter(Challenge.challenge_code == challenge_code).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="挑战不存在")

    if challenge.status not in [ChallengeStatus.PENDING, ChallengeStatus.ACCEPTED]:
        raise HTTPException(status_code=400, detail=f"挑战状态为{challenge.status}，无法提交")

    word_name = None
    for sign in SIGN_WORDS:
        if sign["id"] == word_id:
            word_name = sign["word"]
            break

    if word_name != challenge.word:
        raise HTTPException(status_code=400, detail=f"挑战词汇为{challenge.word}，与提交词汇不符")

    result = await compare_sign(word_id, user_id, video, db)

    if user_id == challenge.challenger_id:
        challenge.challenger_score = result.score
    elif user_id == challenge.challengee_id:
        challenge.challengee_score = result.score
    else:
        raise HTTPException(status_code=403, detail="您不是此挑战的参与者")

    if challenge.challenger_score is not None and challenge.challengee_score is not None:
        challenge.status = ChallengeStatus.COMPLETED
        if challenge.challenger_score > challenge.challengee_score:
            challenge.winner_id = challenge.challenger_id
        elif challenge.challengee_score > challenge.challenger_score:
            challenge.winner_id = challenge.challengee_id

    db.commit()
    update_leaderboard(db, user_id, word_name, result.score)

    return result


@app.get("/api/challenges/{challenge_code}", response_model=ChallengeResponse)
async def get_challenge(challenge_code: str, db: Session = Depends(get_db)):
    check_expired_challenges(db)

    challenge = db.query(Challenge).filter(Challenge.challenge_code == challenge_code).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="挑战不存在")

    return ChallengeResponse(
        id=challenge.id,
        challenge_code=challenge.challenge_code,
        challenger_id=challenge.challenger_id,
        challengee_id=challenge.challengee_id,
        word=challenge.word,
        target_score=challenge.target_score,
        challenger_score=challenge.challenger_score,
        challengee_score=challenge.challengee_score,
        winner_id=challenge.winner_id,
        status=challenge.status,
        expires_at=challenge.expires_at,
        created_at=challenge.created_at,
        challenger=challenge.challenger,
        challengee=challenge.challengee,
        winner=challenge.winner
    )


@app.get("/api/users/{user_id}/challenges", response_model=List[ChallengeResponse])
async def get_user_challenges(
    user_id: int,
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    check_expired_challenges(db)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    query = db.query(Challenge).filter(
        (Challenge.challenger_id == user_id) | (Challenge.challengee_id == user_id)
    )

    if status:
        query = query.filter(Challenge.status == status)

    challenges = query.order_by(Challenge.created_at.desc()).all()

    return [
        ChallengeResponse(
            id=c.id,
            challenge_code=c.challenge_code,
            challenger_id=c.challenger_id,
            challengee_id=c.challengee_id,
            word=c.word,
            target_score=c.target_score,
            challenger_score=c.challenger_score,
            challengee_score=c.challengee_score,
            winner_id=c.winner_id,
            status=c.status,
            expires_at=c.expires_at,
            created_at=c.created_at,
            challenger=c.challenger,
            challengee=c.challengee,
            winner=c.winner
        )
        for c in challenges
    ]


@app.get("/api/leaderboard", response_model=List[LeaderboardEntryResponse])
async def get_leaderboard(
    word_id: Optional[str] = Query(None, description="按词汇筛选"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(LeaderboardEntry)

    if word_id:
        word_name = None
        for sign in SIGN_WORDS:
            if sign["id"] == word_id:
                word_name = sign["word"]
                break
        if word_name:
            query = query.filter(LeaderboardEntry.word == word_name)

    entries = query.order_by(LeaderboardEntry.best_score.desc()).limit(limit).all()

    result = []
    for entry in entries:
        avg_score = entry.total_score / entry.total_attempts if entry.total_attempts > 0 else 0
        result.append(LeaderboardEntryResponse(
            user_id=entry.user_id,
            username=entry.user.username,
            word=entry.word,
            best_score=entry.best_score,
            total_attempts=entry.total_attempts,
            average_score=round(avg_score, 2),
            updated_at=entry.updated_at
        ))

    return result


@app.get("/api/leaderboard/global", response_model=List[LeaderboardEntryResponse])
async def get_global_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    subquery = db.query(
        LeaderboardEntry.user_id,
        func.max(LeaderboardEntry.best_score).label('max_score')
    ).group_by(LeaderboardEntry.user_id).subquery()

    entries = db.query(LeaderboardEntry).join(
        subquery,
        (LeaderboardEntry.user_id == subquery.c.user_id) &
        (LeaderboardEntry.best_score == subquery.c.max_score)
    ).order_by(LeaderboardEntry.best_score.desc()).limit(limit).all()

    result = []
    seen_users = set()
    for entry in entries:
        if entry.user_id in seen_users:
            continue
        seen_users.add(entry.user_id)

        avg_score = entry.total_score / entry.total_attempts if entry.total_attempts > 0 else 0
        result.append(LeaderboardEntryResponse(
            user_id=entry.user_id,
            username=entry.user.username,
            word=entry.word,
            best_score=entry.best_score,
            total_attempts=entry.total_attempts,
            average_score=round(avg_score, 2),
            updated_at=entry.updated_at
        ))

    return result


@app.get("/api/users/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    records = db.query(PracticeRecord).filter(PracticeRecord.user_id == user_id).all()
    leaderboard_entries = db.query(LeaderboardEntry).filter(LeaderboardEntry.user_id == user_id).all()

    if not records:
        return UserStatsResponse(
            user_id=user_id,
            username=user.username,
            total_attempts=0,
            best_overall_score=0,
            average_score=0,
            words_attempted=0
        )

    scores = [r.score for r in records]
    words_attempted = len(set(r.word for r in records))
    best_overall_score = max(scores) if scores else 0
    average_score = sum(scores) / len(scores) if scores else 0

    global_ranking = None
    global_leaderboard = await get_global_leaderboard(limit=1000, db=db)
    for i, entry in enumerate(global_leaderboard):
        if entry.user_id == user_id:
            global_ranking = i + 1
            break

    challenges_created = db.query(Challenge).filter(Challenge.challenger_id == user_id).count()
    challenges_won = db.query(Challenge).filter(Challenge.winner_id == user_id).count()

    return UserStatsResponse(
        user_id=user_id,
        username=user.username,
        total_attempts=len(records),
        best_overall_score=round(best_overall_score, 2),
        average_score=round(average_score, 2),
        words_attempted=words_attempted,
        rank=global_ranking,
        challenges_created=challenges_created,
        challenges_won=challenges_won
    )


@app.post("/api/challenges/{challenge_code}/resign")
async def resign_challenge(
    challenge_code: str,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    check_expired_challenges(db)

    challenge = db.query(Challenge).filter(Challenge.challenge_code == challenge_code).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="挑战不存在")

    if challenge.status == ChallengeStatus.COMPLETED or challenge.status == ChallengeStatus.EXPIRED:
        raise HTTPException(status_code=400, detail="挑战已结束")

    if user_id == challenge.challenger_id and challenge.challenger_score is None:
        challenge.challenger_score = 0
    elif user_id == challenge.challengee_id and challenge.challengee_score is None:
        challenge.challengee_score = 0
    else:
        raise HTTPException(status_code=400, detail="您已提交成绩，无法认输")

    if challenge.challenger_score is not None and challenge.challengee_score is not None:
        challenge.status = ChallengeStatus.COMPLETED
        if challenge.challenger_score > challenge.challengee_score:
            challenge.winner_id = challenge.challenger_id
        elif challenge.challengee_score > challenge.challenger_score:
            challenge.winner_id = challenge.challengee_id

    db.commit()

    return {"message": "已认输", "winner": challenge.winner.username if challenge.winner else None}
