from datetime import datetime
from typing import Dict, Any, Optional, List
from enum import Enum
import asyncio
import uuid
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskProgress:
    def __init__(self, total: int = 0):
        self.current: int = 0
        self.total: int = total
        self.message: str = ""
        self.details: Dict[str, Any] = {}
        
    def update(self, current: int, message: str = "", details: Dict[str, Any] = None):
        self.current = current
        self.message = message
        if details:
            self.details.update(details)
            
    def to_dict(self) -> Dict[str, Any]:
        return {
            "current": self.current,
            "total": self.total,
            "percentage": (self.current / self.total * 100) if self.total > 0 else 0,
            "message": self.message,
            "details": self.details
        }


class SimulationTask:
    def __init__(
        self,
        task_id: str,
        simulation_id: str,
        network_id: str,
        iterations: int,
        max_depth: int,
        disrupted_node_ids: List[str]
    ):
        self.task_id = task_id
        self.simulation_id = simulation_id
        self.network_id = network_id
        self.iterations = iterations
        self.max_depth = max_depth
        self.disrupted_node_ids = disrupted_node_ids
        
        self.status: TaskStatus = TaskStatus.PENDING
        self.progress: TaskProgress = TaskProgress(total=iterations)
        self.created_at: datetime = datetime.utcnow()
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.error: Optional[str] = None
        self.result: Optional[Dict[str, Any]] = None
        
        self._task: Optional[asyncio.Task] = None
        self._cancelled: bool = False
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "simulation_id": self.simulation_id,
            "network_id": self.network_id,
            "status": self.status.value,
            "progress": self.progress.to_dict(),
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error": self.error,
            "has_result": self.result is not None
        }


class AsyncTaskManager:
    _instance: Optional['AsyncTaskManager'] = None
    _tasks: Dict[str, SimulationTask] = {}
    _cleanup_interval: int = 3600  # 1 hour
    _max_task_age: int = 86400  # 24 hours
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @classmethod
    def get_instance(cls) -> 'AsyncTaskManager':
        if cls._instance is None:
            cls._instance = AsyncTaskManager()
        return cls._instance
    
    def create_task(
        self,
        simulation_id: str,
        network_id: str,
        iterations: int,
        max_depth: int,
        disrupted_node_ids: List[str]
    ) -> SimulationTask:
        task_id = str(uuid.uuid4())
        task = SimulationTask(
            task_id=task_id,
            simulation_id=simulation_id,
            network_id=network_id,
            iterations=iterations,
            max_depth=max_depth,
            disrupted_node_ids=disrupted_node_ids
        )
        self._tasks[task_id] = task
        logger.info(f"Created simulation task: {task_id} for simulation: {simulation_id}")
        return task
    
    def get_task(self, task_id: str) -> Optional[SimulationTask]:
        return self._tasks.get(task_id)
    
    def get_tasks_by_network(self, network_id: str) -> List[SimulationTask]:
        return [
            task for task in self._tasks.values()
            if task.network_id == network_id
        ]
    
    def get_tasks_by_simulation(self, simulation_id: str) -> Optional[SimulationTask]:
        for task in self._tasks.values():
            if task.simulation_id == simulation_id:
                return task
        return None
    
    def cancel_task(self, task_id: str) -> bool:
        task = self._tasks.get(task_id)
        if task and task.status in [TaskStatus.PENDING, TaskStatus.RUNNING]:
            task._cancelled = True
            if task._task:
                task._task.cancel()
            task.status = TaskStatus.CANCELLED
            logger.info(f"Cancelled task: {task_id}")
            return True
        return False
    
    def cleanup_old_tasks(self):
        now = datetime.utcnow()
        tasks_to_remove = []
        
        for task_id, task in self._tasks.items():
            if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
                if task.completed_at:
                    age = (now - task.completed_at).total_seconds()
                    if age > self._max_task_age:
                        tasks_to_remove.append(task_id)
        
        for task_id in tasks_to_remove:
            del self._tasks[task_id]
            logger.info(f"Removed old task: {task_id}")
    
    async def run_task_async(
        self,
        task: SimulationTask,
        run_fn,
        *args,
        **kwargs
    ):
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.utcnow()
        
        try:
            result = await run_fn(task, *args, **kwargs)
            task.status = TaskStatus.COMPLETED
            task.result = result
            task.progress.update(task.progress.total, "Simulation completed")
            
        except asyncio.CancelledError:
            task.status = TaskStatus.CANCELLED
            task.error = "Task was cancelled"
            logger.info(f"Task {task.task_id} was cancelled")
            
        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error = str(e)
            logger.error(f"Task {task.task_id} failed: {e}", exc_info=True)
            
        finally:
            task.completed_at = datetime.utcnow()
            
        return task


task_manager = AsyncTaskManager.get_instance()
