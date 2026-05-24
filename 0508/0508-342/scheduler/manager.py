from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import timedelta
from storage.database import SessionLocal
from scheduler.tasks import AsyncTasks
from config import get_settings
import logging

logger = logging.getLogger(__name__)

settings = get_settings()


class TaskScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self._is_running = False

    def _run_with_db(self, task_func_name: str, *args, **kwargs):
        db = SessionLocal()
        try:
            tasks = AsyncTasks(db)
            task_func = getattr(tasks, task_func_name)
            return task_func(*args, **kwargs)
        finally:
            db.close()

    def start(self):
        if self._is_running:
            logger.warning("Scheduler already running")
            return

        interval_minutes = settings.async_task_interval_minutes

        self.scheduler.add_job(
            lambda: self._run_with_db("process_incoming_data_task"),
            trigger=IntervalTrigger(minutes=interval_minutes),
            id="process_incoming_data",
            name="Process incoming raw data",
            replace_existing=True
        )

        self.scheduler.add_job(
            lambda: self._run_with_db("fill_late_data_task", settings.alert_review_window_hours),
            trigger=IntervalTrigger(minutes=interval_minutes * 2),
            id="fill_late_data",
            name="Fill late arriving data",
            replace_existing=True
        )

        self.scheduler.add_job(
            lambda: self._run_with_db("generate_snapshots_task"),
            trigger=IntervalTrigger(minutes=interval_minutes * 3),
            id="generate_snapshots",
            name="Generate alert snapshots",
            replace_existing=True
        )

        self.scheduler.add_job(
            lambda: self._run_with_db("cleanup_old_snapshots_task", settings.snapshot_retention_days),
            trigger=IntervalTrigger(hours=24),
            id="cleanup_snapshots",
            name="Cleanup old snapshots",
            replace_existing=True
        )

        self.scheduler.start()
        self._is_running = True
        logger.info("Task scheduler started")

    def stop(self):
        if self._is_running:
            self.scheduler.shutdown()
            self._is_running = False
            logger.info("Task scheduler stopped")

    def run_task_now(self, task_func_name: str, *args, **kwargs):
        return self._run_with_db(task_func_name, *args, **kwargs)

    def get_jobs(self):
        return self.scheduler.get_jobs()


_scheduler_instance = None


def get_scheduler() -> TaskScheduler:
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = TaskScheduler()
    return _scheduler_instance
