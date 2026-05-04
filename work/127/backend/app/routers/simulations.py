from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from typing import List, Dict, Any, Optional
from neo4j import AsyncSession
import asyncio

from app.database.neo4j_client import get_db_session
from app.models.schemas import (
    SimulationCreate, Simulation, SimulationResult
)
from app.services.risk_simulation_service import RiskSimulationService
from app.services.supply_chain_service import SupplyChainService
from app.services.async_task_manager import (
    task_manager, SimulationTask, TaskStatus
)
from app.services.optimized_simulation_service import OptimizedSimulationService

router = APIRouter(prefix="/simulations", tags=["simulations"])


@router.post("/", response_model=Simulation, status_code=201)
async def create_simulation(
    simulation_data: SimulationCreate,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, simulation_data.network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        nodes = await SupplyChainService.list_nodes(session, simulation_data.network_id)
        node_ids = {node.id for node in nodes}
        
        for disrupted_id in simulation_data.disrupted_node_ids:
            if disrupted_id not in node_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"Disrupted node {disrupted_id} not found in network"
                )
        
        simulation = await RiskSimulationService.create_simulation(session, simulation_data)
        return simulation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/network/{network_id}", response_model=List[Simulation])
async def list_simulations(
    network_id: str,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        simulations = await RiskSimulationService.list_simulations(session, network_id)
        return simulations
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{simulation_id}", response_model=Simulation)
async def get_simulation(
    simulation_id: str,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        simulation = await RiskSimulationService.get_simulation(session, simulation_id)
        if not simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")
        return simulation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{simulation_id}/run", response_model=SimulationResult)
async def run_simulation(
    simulation_id: str,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        simulation = await RiskSimulationService.get_simulation(session, simulation_id)
        if not simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")
        
        result = await RiskSimulationService.run_simulation(session, simulation_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{simulation_id}/async-run", response_model=Dict[str, Any])
async def run_simulation_async(
    simulation_id: str,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        simulation = await RiskSimulationService.get_simulation(session, simulation_id)
        if not simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")
        
        existing_task = task_manager.get_tasks_by_simulation(simulation_id)
        if existing_task and existing_task.status in [TaskStatus.PENDING, TaskStatus.RUNNING]:
            return {
                "task_id": existing_task.task_id,
                "simulation_id": simulation_id,
                "status": existing_task.status.value,
                "message": "Simulation already running",
                "progress": existing_task.progress.to_dict()
            }
        
        task = task_manager.create_task(
            simulation_id=simulation_id,
            network_id=simulation.network_id,
            iterations=simulation.iterations,
            max_depth=simulation.max_propagation_depth,
            disrupted_node_ids=simulation.disrupted_node_ids
        )
        
        async def run_task():
            try:
                await task_manager.run_task_async(
                    task,
                    OptimizedSimulationService.run_simulation_async
                )
            except Exception as e:
                pass
        
        background_tasks.add_task(run_task)
        
        return {
            "task_id": task.task_id,
            "simulation_id": simulation_id,
            "status": task.status.value,
            "message": "Simulation started in background",
            "progress": task.progress.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{task_id}", response_model=Dict[str, Any])
async def get_task_status(task_id: str):
    try:
        task = task_manager.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {
            **task.to_dict(),
            "progress": task.progress.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/{task_id}/cancel", response_model=Dict[str, Any])
async def cancel_task(task_id: str):
    try:
        success = task_manager.cancel_task(task_id)
        if not success:
            raise HTTPException(
                status_code=400,
                detail="Task not found or cannot be cancelled"
            )
        
        task = task_manager.get_task(task_id)
        return {
            "task_id": task_id,
            "status": task.status.value if task else "cancelled",
            "message": "Task cancelled"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/network/{network_id}", response_model=List[Dict[str, Any]])
async def list_network_tasks(network_id: str):
    try:
        tasks = task_manager.get_tasks_by_network(network_id)
        return [task.to_dict() for task in tasks]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{simulation_id}/result", response_model=SimulationResult)
async def get_simulation_result(
    simulation_id: str,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        result = await RiskSimulationService.get_simulation_result(session, simulation_id)
        if not result:
            raise HTTPException(
                status_code=404,
                detail="Simulation result not found. The simulation may not have been run yet."
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{simulation_id}/results/paginated", response_model=Dict[str, Any])
async def get_paginated_results(
    simulation_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
    min_risk_score: Optional[float] = Query(None, ge=0, le=1)
):
    try:
        result = await OptimizedSimulationService.get_paginated_node_results(
            simulation_id=simulation_id,
            page=page,
            page_size=page_size,
            min_risk_score=min_risk_score
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare", response_model=Dict[str, Any])
async def compare_simulations(
    network_id: str,
    simulation_ids: List[str],
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        if len(simulation_ids) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 simulation IDs are required for comparison"
            )
        
        comparison = await RiskSimulationService.compare_simulations(
            session, network_id, simulation_ids
        )
        
        return comparison
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
