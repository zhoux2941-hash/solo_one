from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from neo4j import AsyncSession, AsyncGraphDatabase
import uuid
import logging
import numpy as np
from collections import defaultdict, deque
import asyncio

from app.config import settings
from app.models.schemas import (
    Simulation, SimulationStatus,
    SimulationResult, NodeRiskResult
)
from app.services.async_task_manager import (
    task_manager, SimulationTask, TaskStatus
)

logger = logging.getLogger(__name__)

BATCH_WRITE_SIZE = 100


class OptimizedSimulationService:
    @staticmethod
    async def _get_network_graph_batch(
        network_id: str
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            database=settings.NEO4J_DATABASE
        )
        
        try:
            nodes = {}
            adjacency = defaultdict(list)
            
            async with driver.session() as session:
                nodes_query = """
                MATCH (:SupplyChainNetwork {id: $network_id})-[:CONTAINS]->(node:SupplyNode)
                RETURN node.id AS id, node.name AS name, node.risk_score AS risk_score
                """
                
                nodes_result = await session.run(nodes_query, network_id=network_id)
                async for record in nodes_result:
                    node_id = record["id"]
                    nodes[node_id] = {
                        "id": node_id,
                        "name": record["name"],
                        "base_risk": record["risk_score"] or 0.0
                    }
                
                deps_query = """
                MATCH (:SupplyChainNetwork {id: $network_id})-[:CONTAINS]->(source:SupplyNode)
                MATCH (source)-[d:DEPENDS_ON]->(target:SupplyNode)
                RETURN source.id AS source_id, target.id AS target_id,
                       d.dependency_strength AS strength, d.propagation_probability AS propagation_prob
                """
                
                deps_result = await session.run(deps_query, network_id=network_id)
                async for record in deps_result:
                    adjacency[record["source_id"]].append({
                        "target": record["target_id"],
                        "strength": record["strength"] or 0.5,
                        "propagation_prob": record["propagation_prob"] or 0.3
                    })
            
            return nodes, dict(adjacency)
            
        finally:
            await driver.close()
    
    @staticmethod
    def _run_monte_carlo_optimized(
        nodes: Dict[str, Any],
        adjacency: Dict[str, Any],
        disrupted_node_ids: List[str],
        iterations: int,
        max_depth: int,
        task: SimulationTask
    ) -> Dict[str, Any]:
        if not nodes:
            return {
                "node_results": {},
                "overall_risk_score": 0.0,
                "critical_paths": []
            }
        
        all_node_ids = list(nodes.keys())
        node_index = {node_id: i for i, node_id in enumerate(all_node_ids)}
        n_nodes = len(all_node_ids)
        
        failure_counts = np.zeros(n_nodes, dtype=np.int32)
        impact_sums = np.zeros(n_nodes, dtype=np.float32)
        earliest_failures = [[] for _ in range(n_nodes)]
        all_paths = defaultdict(list)
        
        downstream_counts = OptimizedSimulationService._precompute_downstream_counts(
            all_node_ids, adjacency
        )
        
        report_interval = max(1, iterations // 100)
        
        for iteration in range(iterations):
            if task._cancelled:
                raise asyncio.CancelledError()
            
            failed_set = set()
            node_failure_step = {}
            
            for node_id in disrupted_node_ids:
                if node_id in node_index:
                    idx = node_index[node_id]
                    failed_set.add(idx)
                    node_failure_step[idx] = 0
            
            queue = deque()
            for node_id in disrupted_node_ids:
                if node_id in node_index:
                    queue.append((node_index[node_id], 0))
            
            paths_to_failure = defaultdict(list)
            for node_id in disrupted_node_ids:
                if node_id in node_index:
                    idx = node_index[node_id]
                    paths_to_failure[idx] = [[node_id]]
            
            while queue:
                current_idx, depth = queue.popleft()
                
                if depth >= max_depth:
                    continue
                
                current_node_id = all_node_ids[current_idx]
                
                for dep in adjacency.get(current_node_id, []):
                    target_node_id = dep["target"]
                    if target_node_id not in node_index:
                        continue
                    
                    target_idx = node_index[target_node_id]
                    
                    if target_idx in failed_set:
                        continue
                    
                    propagation_prob = dep["propagation_prob"]
                    strength = dep["strength"]
                    base_failure_chance = nodes[target_node_id]["base_risk"]
                    
                    incoming_impact = propagation_prob * strength
                    combined_chance = min(1.0, base_failure_chance + incoming_impact * 0.5)
                    
                    if np.random.random() < combined_chance:
                        failed_set.add(target_idx)
                        node_failure_step[target_idx] = depth + 1
                        
                        for path in paths_to_failure[current_idx]:
                            new_path = path + [target_node_id]
                            if target_idx not in paths_to_failure:
                                paths_to_failure[target_idx] = []
                            paths_to_failure[target_idx].append(new_path)
                            
                            if len(all_paths[target_node_id]) < 5 and new_path not in all_paths[target_node_id]:
                                all_paths[target_node_id].append(new_path)
                        
                        queue.append((target_idx, depth + 1))
            
            for idx in failed_set:
                failure_counts[idx] += 1
                impact_sums[idx] += downstream_counts.get(idx, 0.5)
                if idx in node_failure_step:
                    earliest_failures[idx].append(node_failure_step[idx])
            
            if iteration % report_interval == 0 and iteration > 0:
                task.progress.update(
                    current=iteration,
                    message=f"Completed {iteration}/{iterations} iterations",
                    details={"nodes_analyzed": len(failed_set)}
                )
        
        node_results = {}
        for i, node_id in enumerate(all_node_ids):
            failure_prob = failure_counts[i] / iterations if iterations > 0 else 0.0
            avg_impact = impact_sums[i] / iterations if failure_counts[i] > 0 else 0.0
            risk_score = failure_prob * (avg_impact + 0.1)
            
            earliest_step = None
            if earliest_failures[i]:
                earliest_step = int(min(earliest_failures[i]))
            
            top_paths = all_paths[node_id][:5] if node_id in all_paths else []
            
            node_results[node_id] = {
                "node_id": node_id,
                "failure_probability": round(float(failure_prob), 4),
                "impact_score": round(float(avg_impact), 4),
                "risk_score": round(float(risk_score), 4),
                "earliest_failure_step": earliest_step,
                "propagation_paths": top_paths
            }
        
        total_risk = sum(nr["risk_score"] for nr in node_results.values())
        overall_risk_score = round(total_risk / len(node_results) if node_results else 0.0, 4)
        
        critical_paths = OptimizedSimulationService._find_critical_paths(
            [nid for nid in disrupted_node_ids if nid in node_index],
            adjacency, node_results
        )
        
        return {
            "node_results": node_results,
            "overall_risk_score": overall_risk_score,
            "critical_paths": critical_paths
        }
    
    @staticmethod
    def _precompute_downstream_counts(
        node_ids: List[str],
        adjacency: Dict[str, Any]
    ) -> Dict[int, float]:
        node_index = {node_id: i for i, node_id in enumerate(node_ids)}
        downstream_counts = {}
        
        for i, node_id in enumerate(node_ids):
            count = 0
            visited = set([i])
            queue = deque([node_id])
            
            while queue:
                current = queue.popleft()
                for dep in adjacency.get(current, []):
                    target = dep["target"]
                    if target in node_index:
                        target_idx = node_index[target]
                        if target_idx not in visited:
                            visited.add(target_idx)
                            count += 1
                            queue.append(target)
            
            base_impact = 0.5
            if count > 0:
                base_impact = min(1.0, 0.5 + count * 0.1)
            downstream_counts[i] = base_impact
        
        return downstream_counts
    
    @staticmethod
    def _find_critical_paths(
        disrupted_nodes: List[str],
        adjacency: Dict[str, Any],
        node_results: Dict[str, Any]
    ) -> List[List[str]]:
        paths = []
        
        def dfs(current: str, path: List[str], depth: int, max_depth: int = 5):
            if depth >= max_depth:
                paths.append(path.copy())
                return
            
            has_outgoing = False
            for dep in adjacency.get(current, []):
                target = dep["target"]
                if target not in path:
                    has_outgoing = True
                    path.append(target)
                    dfs(target, path, depth + 1, max_depth)
                    path.pop()
            
            if not has_outgoing and len(path) > 1:
                paths.append(path.copy())
        
        for start in disrupted_nodes:
            dfs(start, [start], 0)
        
        paths_with_risk = []
        for path in paths:
            if len(path) >= 2:
                total_risk = sum(
                    node_results.get(n, {}).get("risk_score", 0.0)
                    for n in path
                )
                paths_with_risk.append((path, total_risk))
        
        paths_with_risk.sort(key=lambda x: x[1], reverse=True)
        
        return [p[0] for p in paths_with_risk[:5]]
    
    @staticmethod
    async def _batch_write_results(
        simulation_id: str,
        network_id: str,
        result: Dict[str, Any],
        task: SimulationTask
    ):
        driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            database=settings.NEO4J_DATABASE
        )
        
        try:
            result_id = str(uuid.uuid4())
            completed_at = datetime.utcnow()
            
            node_results = result["node_results"]
            overall_risk = result["overall_risk_score"]
            critical_paths = result["critical_paths"]
            
            most_vulnerable = sorted(
                node_results.keys(),
                key=lambda n: node_results[n]["risk_score"],
                reverse=True
            )[:10]
            
            async with driver.session() as session:
                create_result_query = """
                MATCH (sim:Simulation {id: $simulation_id})
                CREATE (sim)-[:HAS_RESULT]->(result:SimulationResult {
                    id: $result_id,
                    network_id: $network_id,
                    overall_risk_score: $overall_risk_score,
                    most_vulnerable_nodes: $most_vulnerable_nodes,
                    critical_paths: $critical_paths,
                    created_at: $created_at
                })
                SET sim.status = $status, sim.completed_at = $completed_at
                """
                
                await session.run(
                    create_result_query,
                    simulation_id=simulation_id,
                    result_id=result_id,
                    network_id=network_id,
                    overall_risk_score=overall_risk,
                    most_vulnerable_nodes=most_vulnerable,
                    critical_paths=critical_paths,
                    created_at=completed_at,
                    status=SimulationStatus.COMPLETED.value,
                    completed_at=completed_at
                )
                
                task.progress.update(
                    current=task.progress.total,
                    message="Writing results to database...",
                    details={"total_nodes": len(node_results)}
                )
                
                node_items = list(node_results.items())
                for batch_start in range(0, len(node_items), BATCH_WRITE_SIZE):
                    batch = node_items[batch_start:batch_start + BATCH_WRITE_SIZE]
                    
                    batch_data = []
                    for node_id, nr in batch:
                        batch_data.append({
                            "result_id": result_id,
                            "node_id": node_id,
                            "failure_probability": nr["failure_probability"],
                            "impact_score": nr["impact_score"],
                            "risk_score": nr["risk_score"],
                            "earliest_failure_step": nr["earliest_failure_step"],
                            "propagation_paths": nr["propagation_paths"]
                        })
                    
                    batch_query = """
                    UNWIND $batch_data AS data
                    MATCH (result:SimulationResult {id: data.result_id})
                    MATCH (node:SupplyNode {id: data.node_id})
                    CREATE (result)-[:NODE_RESULT {
                        failure_probability: data.failure_probability,
                        impact_score: data.impact_score,
                        risk_score: data.risk_score,
                        earliest_failure_step: data.earliest_failure_step,
                        propagation_paths: data.propagation_paths
                    }]->(node)
                    """
                    
                    await session.run(batch_query, batch_data=batch_data)
                    
                    written = batch_start + len(batch)
                    task.progress.update(
                        current=task.progress.total,
                        message=f"Written {written}/{len(node_items)} node results",
                        details={"batch": batch_start // BATCH_WRITE_SIZE + 1}
                    )
            
            logger.info(f"Successfully wrote results for simulation {simulation_id}")
            return result_id
            
        except Exception as e:
            logger.error(f"Error writing results: {e}", exc_info=True)
            raise
        finally:
            await driver.close()
    
    @staticmethod
    async def _update_simulation_status(
        simulation_id: str,
        status: SimulationStatus,
        started_at: datetime = None,
        completed_at: datetime = None,
        error: str = None
    ):
        driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            database=settings.NEO4J_DATABASE
        )
        
        try:
            async with driver.session() as session:
                query = """
                MATCH (sim:Simulation {id: $simulation_id})
                SET sim.status = $status
                """
                
                params = {
                    "simulation_id": simulation_id,
                    "status": status.value
                }
                
                if started_at:
                    query += ", sim.started_at = $started_at"
                    params["started_at"] = started_at
                if completed_at:
                    query += ", sim.completed_at = $completed_at"
                    params["completed_at"] = completed_at
                if error:
                    query += ", sim.error = $error"
                    params["error"] = error
                
                await session.run(query, **params)
                
        finally:
            await driver.close()
    
    @staticmethod
    async def run_simulation_async(task: SimulationTask):
        logger.info(f"Starting simulation task: {task.task_id}")
        
        await OptimizedSimulationService._update_simulation_status(
            task.simulation_id,
            SimulationStatus.RUNNING,
            started_at=datetime.utcnow()
        )
        
        try:
            task.progress.update(0, "Loading network graph...")
            nodes, adjacency = await OptimizedSimulationService._get_network_graph_batch(
                task.network_id
            )
            
            if not nodes:
                raise ValueError("No nodes found in network")
            
            task.progress.update(
                0, 
                f"Loaded {len(nodes)} nodes, starting Monte Carlo simulation...",
                details={"node_count": len(nodes)}
            )
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: OptimizedSimulationService._run_monte_carlo_optimized(
                    nodes=nodes,
                    adjacency=adjacency,
                    disrupted_node_ids=task.disrupted_node_ids,
                    iterations=task.iterations,
                    max_depth=task.max_depth,
                    task=task
                )
            )
            
            task.progress.update(
                task.progress.total,
                "Simulation complete, saving results...",
                details={"overall_risk": result["overall_risk_score"]}
            )
            
            result_id = await OptimizedSimulationService._batch_write_results(
                simulation_id=task.simulation_id,
                network_id=task.network_id,
                result=result,
                task=task
            )
            
            await OptimizedSimulationService._update_simulation_status(
                task.simulation_id,
                SimulationStatus.COMPLETED,
                completed_at=datetime.utcnow()
            )
            
            task.progress.update(
                task.progress.total,
                "Simulation completed successfully",
                details={"result_id": result_id}
            )
            
            result["result_id"] = result_id
            return result
            
        except asyncio.CancelledError:
            logger.info(f"Task {task.task_id} was cancelled")
            await OptimizedSimulationService._update_simulation_status(
                task.simulation_id,
                SimulationStatus.FAILED,
                error="Task was cancelled"
            )
            raise
            
        except Exception as e:
            logger.error(f"Simulation task failed: {e}", exc_info=True)
            await OptimizedSimulationService._update_simulation_status(
                task.simulation_id,
                SimulationStatus.FAILED,
                error=str(e)
            )
            raise
    
    @staticmethod
    async def get_paginated_node_results(
        simulation_id: str,
        page: int = 1,
        page_size: int = 100,
        min_risk_score: float = None
    ) -> Dict[str, Any]:
        driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            database=settings.NEO4J_DATABASE
        )
        
        try:
            async with driver.session() as session:
                count_query = """
                MATCH (:Simulation {id: $simulation_id})-[:HAS_RESULT]->(result:SimulationResult)
                MATCH (result)-[nr:NODE_RESULT]->(node:SupplyNode)
                """
                count_params = {"simulation_id": simulation_id}
                
                if min_risk_score is not None:
                    count_query += " WHERE nr.risk_score >= $min_risk_score"
                    count_params["min_risk_score"] = min_risk_score
                
                count_query += " RETURN COUNT(nr) AS total"
                
                count_result = await session.run(count_query, **count_params)
                count_record = await count_result.single()
                total = count_record["total"] if count_record else 0
                
                data_query = """
                MATCH (:Simulation {id: $simulation_id})-[:HAS_RESULT]->(result:SimulationResult)
                MATCH (result)-[nr:NODE_RESULT]->(node:SupplyNode)
                """
                data_params = {
                    "simulation_id": simulation_id,
                    "skip": (page - 1) * page_size,
                    "limit": page_size
                }
                
                if min_risk_score is not None:
                    data_query += " WHERE nr.risk_score >= $min_risk_score"
                    data_params["min_risk_score"] = min_risk_score
                
                data_query += """
                RETURN node.id AS node_id,
                       node.name AS node_name,
                       nr.failure_probability AS failure_probability,
                       nr.impact_score AS impact_score,
                       nr.risk_score AS risk_score,
                       nr.earliest_failure_step AS earliest_failure_step,
                       nr.propagation_paths AS propagation_paths
                ORDER BY nr.risk_score DESC
                SKIP $skip
                LIMIT $limit
                """
                
                data_result = await session.run(data_query, **data_params)
                records = await data_result.fetch()
                
                items = []
                for record in records:
                    items.append({
                        "node_id": record["node_id"],
                        "node_name": record["node_name"],
                        "failure_probability": record["failure_probability"],
                        "impact_score": record["impact_score"],
                        "risk_score": record["risk_score"],
                        "earliest_failure_step": record.get("earliest_failure_step"),
                        "propagation_paths": record.get("propagation_paths", [])
                    })
                
                return {
                    "items": items,
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0
                }
                
        finally:
            await driver.close()
