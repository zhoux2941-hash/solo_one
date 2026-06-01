import asyncio
import os
import uuid
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from .worker import WorkerNode, WorkerConfig


class StartWorkerRequest(BaseModel):
    test_id: str
    target_url: str
    api_key: Optional[str] = None
    worker_id: Optional[str] = None
    request_timeout: float = 120.0
    max_retries: int = 3
    metrics_port: Optional[int] = None
    orchestrator_url: Optional[str] = None


class WorkerStatusResponse(BaseModel):
    worker_id: str
    test_id: str
    status: str
    total_requests: int
    success_requests: int
    failed_requests: int
    error_rate: float
    queue_size: int


class SubmitTaskRequest(BaseModel):
    request_log: Dict[str, Any]


class BatchSubmitRequest(BaseModel):
    request_logs: List[Dict[str, Any]]


class HealthResponse(BaseModel):
    status: str
    workers: List[str]


workers: Dict[str, WorkerNode] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    for worker in workers.values():
        await worker.stop()


app = FastAPI(title="LLM Load Test Worker", lifespan=lifespan)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        workers=list(workers.keys()),
    )


@app.post("/workers", status_code=201)
async def start_worker(request: StartWorkerRequest, background_tasks: BackgroundTasks):
    worker_id = request.worker_id or f"worker-{uuid.uuid4().hex[:8]}"

    if worker_id in workers:
        raise HTTPException(status_code=400, detail=f"Worker {worker_id} already exists")

    config = WorkerConfig(
        worker_id=worker_id,
        test_id=request.test_id,
        target_url=request.target_url,
        api_key=request.api_key,
        request_timeout=request.request_timeout,
        max_retries=request.max_retries,
        metrics_server_port=request.metrics_port,
        orchestrator_url=request.orchestrator_url,
    )

    worker = WorkerNode(config)
    workers[worker_id] = worker

    background_tasks.add_task(worker.start)

    return {"worker_id": worker_id, "status": "starting"}


@app.delete("/workers/{worker_id}", status_code=200)
async def stop_worker(worker_id: str):
    if worker_id not in workers:
        raise HTTPException(status_code=404, detail=f"Worker {worker_id} not found")

    worker = workers.pop(worker_id)
    await worker.stop()

    return {"worker_id": worker_id, "status": "stopped"}


@app.get("/workers/{worker_id}", response_model=WorkerStatusResponse)
async def get_worker_status(worker_id: str):
    if worker_id not in workers:
        raise HTTPException(status_code=404, detail=f"Worker {worker_id} not found")

    stats = workers[worker_id].get_statistics()
    return WorkerStatusResponse(
        worker_id=stats["worker_id"],
        test_id=stats["test_id"],
        status="running",
        total_requests=stats["total_requests"],
        success_requests=stats["success_requests"],
        failed_requests=stats["failed_requests"],
        error_rate=stats["error_rate"],
        queue_size=stats["queue_size"],
    )


@app.get("/workers", response_model=List[WorkerStatusResponse])
async def list_workers():
    response = []
    for worker_id, worker in workers.items():
        stats = worker.get_statistics()
        response.append(WorkerStatusResponse(
            worker_id=stats["worker_id"],
            test_id=stats["test_id"],
            status="running",
            total_requests=stats["total_requests"],
            success_requests=stats["success_requests"],
            failed_requests=stats["failed_requests"],
            error_rate=stats["error_rate"],
            queue_size=stats["queue_size"],
        ))
    return response


@app.post("/workers/{worker_id}/tasks", status_code=202)
async def submit_task(worker_id: str, request: SubmitTaskRequest):
    if worker_id not in workers:
        raise HTTPException(status_code=404, detail=f"Worker {worker_id} not found")

    try:
        await workers[worker_id].submit_task(request.request_log)
        return {"status": "accepted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/workers/{worker_id}/tasks/batch", status_code=202)
async def batch_submit_tasks(worker_id: str, request: BatchSubmitRequest):
    if worker_id not in workers:
        raise HTTPException(status_code=404, detail=f"Worker {worker_id} not found")

    try:
        for log in request.request_logs:
            await workers[worker_id].submit_task(log)
        return {"status": "accepted", "count": len(request.request_logs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def main():
    import uvicorn
    port = int(os.environ.get("WORKER_PORT", "8001"))
    uvicorn.run(
        "worker.server:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )


if __name__ == "__main__":
    main()
