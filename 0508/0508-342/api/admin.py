from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from storage.database import get_db
from scheduler.manager import get_scheduler
from storage.repository import PipeSegmentRepository
from storage.models import PipeSegment

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/scheduler/status")
def get_scheduler_status():
    scheduler = get_scheduler()
    jobs = scheduler.get_jobs()
    return {
        "scheduler_running": scheduler._is_running,
        "job_count": len(jobs),
        "jobs": [{"id": job.id, "name": job.name, "next_run_time": str(job.next_run_time)} for job in jobs]
    }


@router.post("/scheduler/start")
def start_scheduler():
    scheduler = get_scheduler()
    if scheduler._is_running:
        return {"message": "Scheduler already running"}
    scheduler.start()
    return {"message": "Scheduler started"}


@router.post("/scheduler/stop")
def stop_scheduler():
    scheduler = get_scheduler()
    if not scheduler._is_running:
        return {"message": "Scheduler not running"}
    scheduler.stop()
    return {"message": "Scheduler stopped"}


@router.post("/task/run/{task_name}")
def run_task_now(task_name: str):
    scheduler = get_scheduler()
    valid_tasks = [
        "process_incoming_data_task",
        "fill_late_data_task",
        "generate_snapshots_task",
        "cleanup_old_snapshots_task"
    ]
    if task_name not in valid_tasks:
        return {"message": f"Invalid task. Valid tasks: {valid_tasks}"}

    result = scheduler.run_task_now(task_name)
    return {"task": task_name, "result": result}


@router.post("/segments")
def create_pipe_segment(
    segment_id: str,
    name: str,
    location: str,
    description: str = None,
    db: Session = Depends(get_db)
):
    existing = PipeSegmentRepository.get_by_id(db, segment_id)
    if existing:
        return {"message": "Segment already exists", "segment_id": segment_id}

    segment = PipeSegment(
        segment_id=segment_id,
        name=name,
        description=description,
        location=location
    )
    PipeSegmentRepository.create(db, segment)
    return {"message": "Segment created", "segment_id": segment_id}


@router.get("/segments")
def get_all_segments(db: Session = Depends(get_db)):
    segments = PipeSegmentRepository.get_all_active(db)
    return [
        {
            "segment_id": s.segment_id,
            "name": s.name,
            "location": s.location,
            "last_recalculated_at": s.last_recalculated_at
        }
        for s in segments
    ]


@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    scheduler = get_scheduler()

    return {
        "status": "ok",
        "database": db_status,
        "scheduler_running": scheduler._is_running,
        "timestamp": __import__("datetime").datetime.now().isoformat()
    }
