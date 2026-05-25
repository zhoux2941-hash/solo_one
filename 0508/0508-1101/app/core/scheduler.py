import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.core.config import settings
from app.services.queue_consumer import QueueConsumerService
from app.services.receipt_pull import ReceiptPullService

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def process_queue_job():
    try:
        svc = QueueConsumerService()
        processed = svc.process_next_batch(batch_size=20)
        if processed > 0:
            logger.info(f"Queue consumer processed {processed} items")
    except Exception as e:
        logger.exception(f"Queue consumer job failed: {e}")


def pull_receipts_job():
    try:
        svc = ReceiptPullService()
        pulled = svc.pull_missing_receipts()
        if pulled > 0:
            logger.info(f"Receipt pull job recovered {pulled} receipts")
    except Exception as e:
        logger.exception(f"Receipt pull job failed: {e}")


def start_scheduler():
    scheduler.add_job(
        process_queue_job,
        trigger=IntervalTrigger(seconds=5),
        id="queue_consumer",
        replace_existing=True,
    )
    scheduler.add_job(
        pull_receipts_job,
        trigger=IntervalTrigger(seconds=settings.receipt_pull_interval_seconds),
        id="receipt_puller",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started with queue consumer and receipt puller jobs")


def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped")
