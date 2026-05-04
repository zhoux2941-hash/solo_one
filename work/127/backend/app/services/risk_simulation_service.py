from datetime import datetime
from typing import List, Dict, Any, Optional
from neo4j import AsyncSession
import uuid
import logging
import numpy as np
from collections import defaultdict, deque

from app.models.schemas import (
    SimulationCreate, Simulation, SimulationStatus,
    SimulationResult, NodeRiskResult
)

logger = logging.getLogger(__name__)


class RiskSimulationService:
    @staticmethod
    async def create_simulation(
        session: AsyncSession,
        simulation_data: SimulationCreate
    ) -> Simulation:
        simulation_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        query = """
        MATCH (network:SupplyChainNetwork {id: $network_id})
        CREATE (network)-[:HAS_SIMULATION]->(sim:Simulation {
            id: $simulation_id,
            name: $name,
            description: $description,
            status: $status,
            disrupted_node_ids: $disrupted_node_ids,
            iterations: $iterations,
            max_propagation_depth: $max_propagation_depth,
            created_at: $created_at
        })
        RETURN sim
        """
        
        result = await session.run(
            query,
            network_id=simulation_data.network_id,
            simulation_id=simulation_id,
            name=simulation_data.name,
            description=simulation_data.description,
            status=SimulationStatus.PENDING.value,
            disrupted_node_ids=simulation_data.disrupted_node_ids,
            iterations=simulation_data.iterations,
            max_propagation_depth=simulation_data.max_propagation_depth,
            created_at=now
        )
        
        record = await result.single()
        if not record:
            raise Exception("Failed to create simulation")
        
        sim = record["sim"]
        return Simulation(
            id=sim["id"],
            network_id=simulation_data.network_id,
            name=sim["name"],
            description=sim.get("description"),
            status=SimulationStatus(sim["status"]),
            disrupted_node_ids=sim["disrupted_node_ids"],
            iterations=sim["iterations"],
            max_propagation_depth=sim["max_propagation_depth"],
            created_at=sim["created_at"]
        )
    
    @staticmethod
    async def get_simulation(
        session: AsyncSession,
        simulation_id: str
    ) -> Optional[Simulation]:
        query = """
        MATCH (network:SupplyChainNetwork)-[:HAS_SIMULATION]->(sim:Simulation {id: $simulation_id})
        RETURN sim, network.id AS network_id
        """
        
        result = await session.run(query, simulation_id=simulation_id)
        record = await result.single()
        
        if not record:
            return None
        
        sim = record["sim"]
        return Simulation(
            id=sim["id"],
            network_id=record["network_id"],
            name=sim["name"],
            description=sim.get("description"),
            status=SimulationStatus(sim["status"]),
            disrupted_node_ids=sim["disrupted_node_ids"],
            iterations=sim["iterations"],
            max_propagation_depth=sim["max_propagation_depth"],
            created_at=sim["created_at"],
            started_at=sim.get("started_at"),
            completed_at=sim.get("completed_at")
        )
    
    @staticmethod
    async def list_simulations(
        session: AsyncSession,
        network_id: str
    ) -> List[Simulation]:
        query = """
        MATCH (network:SupplyChainNetwork {id: $network_id})-[:HAS_SIMULATION]->(sim:Simulation)
        RETURN sim, network.id AS network_id
        ORDER BY sim.created_at DESC
        """
        
        result = await session.run(query, network_id=network_id)
        records = await result.fetch()
        
        simulations = []
        for record in records:
            sim = record["sim"]
            simulations.append(Simulation(
                id=sim["id"],
                network_id=record["network_id"],
                name=sim["name"],
                description=sim.get("description"),
                status=SimulationStatus(sim["status"]),
                disrupted_node_ids=sim["disrupted_node_ids"],
                iterations=sim["iterations"],
                max_propagation_depth=sim["max_propagation_depth"],
                created_at=sim["created_at"],
                started_at=sim.get("started_at"),
                completed_at=sim.get("completed_at")
            ))
        
        return simulations
    
    @staticmethod
    async def run_simulation(
        session: AsyncSession,
        simulation_id: str
    ) -> SimulationResult:
        simulation = await RiskSimulationService.get_simulation(session, simulation_id)
        if not simulation:
            raise Exception(f"Simulation {simulation_id} not found")
        
        now = datetime.utcnow()
        
        update_query = """
        MATCH (sim:Simulation {id: $simulation_id})
        SET sim.status = $status, sim.started_at = $started_at
        """
        
        await session.run(
            update_query,
            simulation_id=simulation_id,
            status=SimulationStatus.RUNNING.value,
            started_at=now
        )
        
        try:
            graph = await RiskSimulationService._get_network_graph(
                session, simulation.network_id
            )
            
            result = RiskSimulationService._run_monte_carlo_simulation(
                graph=graph,
                disrupted_node_ids=simulation.disrupted_node_ids,
                iterations=simulation.iterations,
                max_depth=simulation.max_propagation_depth
            )
            
            completed_at = datetime.utcnow()
            
            result_id = str(uuid.uuid4())
            save_query = """
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
            RETURN result
            """
            
            most_vulnerable = sorted(
                result["node_results"].keys(),
                key=lambda n: result["node_results"][n]["risk_score"],
                reverse=True
            )[:10]
            
            await session.run(
                save_query,
                simulation_id=simulation_id,
                result_id=result_id,
                network_id=simulation.network_id,
                overall_risk_score=result["overall_risk_score"],
                most_vulnerable_nodes=most_vulnerable,
                critical_paths=result["critical_paths"],
                status=SimulationStatus.COMPLETED.value,
                completed_at=completed_at,
                created_at=completed_at
            )
            
            for node_id, node_result in result["node_results"].items():
                node_result_query = """
                MATCH (result:SimulationResult {id: $result_id})
                CREATE (result)-[:NODE_RESULT {
                    failure_probability: $failure_probability,
                    impact_score: $impact_score,
                    risk_score: $risk_score,
                    earliest_failure_step: $earliest_failure_step,
                    propagation_paths: $propagation_paths
                }]->(:SupplyNode {id: $node_id})
                """
                
                await session.run(
                    node_result_query,
                    result_id=result_id,
                    node_id=node_id,
                    failure_probability=node_result["failure_probability"],
                    impact_score=node_result["impact_score"],
                    risk_score=node_result["risk_score"],
                    earliest_failure_step=node_result["earliest_failure_step"],
                    propagation_paths=node_result["propagation_paths"]
                )
            
            node_results = {
                node_id: NodeRiskResult(
                    node_id=node_id,
                    failure_probability=nr["failure_probability"],
                    impact_score=nr["impact_score"],
                    risk_score=nr["risk_score"],
                    propagation_paths=nr["propagation_paths"],
                    earliest_failure_step=nr["earliest_failure_step"]
                )
                for node_id, nr in result["node_results"].items()
            }
            
            return SimulationResult(
                id=result_id,
                simulation_id=simulation_id,
                network_id=simulation.network_id,
                node_results=node_results,
                overall_risk_score=result["overall_risk_score"],
                most_vulnerable_nodes=most_vulnerable,
                critical_paths=result["critical_paths"],
                created_at=completed_at
            )
            
        except Exception as e:
            error_query = """
            MATCH (sim:Simulation {id: $simulation_id})
            SET sim.status = $status
            """
            await session.run(
                error_query,
                simulation_id=simulation_id,
                status=SimulationStatus.FAILED.value
            )
            raise e
    
    @staticmethod
    async def _get_network_graph(
        session: AsyncSession,
        network_id: str
    ) -> Dict[str, Any]:
        query = """
        MATCH (:SupplyChainNetwork {id: $network_id})-[:CONTAINS]->(node:SupplyNode)
        OPTIONAL MATCH (node)-[d:DEPENDS_ON]->(target:SupplyNode)
        WITH node, collect({
            target_id: target.id,
            strength: d.dependency_strength,
            propagation_prob: d.propagation_probability
        }) AS outgoing
        RETURN collect({
            id: node.id,
            name: node.name,
            risk_score: node.risk_score,
            outgoing: outgoing
        }) AS nodes
        """
        
        result = await session.run(query, network_id=network_id)
        record = await result.single()
        
        if not record:
            return {"nodes": {}, "adjacency": {}}
        
        nodes = {}
        adjacency = defaultdict(list)
        
        for node_data in record["nodes"] or []:
            node_id = node_data["id"]
            nodes[node_id] = {
                "id": node_id,
                "name": node_data["name"],
                "base_risk": node_data["risk_score"] or 0.0
            }
            
            for dep in node_data["outgoing"] or []:
                if dep.get("target_id"):
                    adjacency[node_id].append({
                        "target": dep["target_id"],
                        "strength": dep["strength"] or 0.5,
                        "propagation_prob": dep["propagation_prob"] or 0.3
                    })
        
        return {"nodes": nodes, "adjacency": dict(adjacency)}
    
    @staticmethod
    def _run_monte_carlo_simulation(
        graph: Dict[str, Any],
        disrupted_node_ids: List[str],
        iterations: int,
        max_depth: int
    ) -> Dict[str, Any]:
        nodes = graph.get("nodes", {})
        adjacency = graph.get("adjacency", {})
        
        if not nodes:
            return {
                "node_results": {},
                "overall_risk_score": 0.0,
                "critical_paths": []
            }
        
        all_node_ids = list(nodes.keys())
        
        failure_counts = defaultdict(int)
        impact_sums = defaultdict(float)
        earliest_failures = defaultdict(list)
        all_paths = defaultdict(list)
        
        for iteration in range(iterations):
            failed_nodes = set(disrupted_node_ids)
            node_failure_step = {}
            
            for node_id in disrupted_node_ids:
                node_failure_step[node_id] = 0
            
            paths_to_failure = defaultdict(list)
            for node_id in disrupted_node_ids:
                paths_to_failure[node_id] = [[node_id]]
            
            queue = deque()
            for node_id in disrupted_node_ids:
                queue.append((node_id, 0))
            
            while queue:
                current_node, depth = queue.popleft()
                
                if depth >= max_depth:
                    continue
                
                for dep in adjacency.get(current_node, []):
                    target = dep["target"]
                    propagation_prob = dep["propagation_prob"]
                    strength = dep["strength"]
                    
                    if target in failed_nodes:
                        continue
                    
                    base_failure_chance = nodes.get(target, {}).get("base_risk", 0.0)
                    incoming_impact = propagation_prob * strength
                    combined_chance = min(1.0, base_failure_chance + incoming_impact * 0.5)
                    
                    if np.random.random() < combined_chance:
                        failed_nodes.add(target)
                        node_failure_step[target] = depth + 1
                        
                        for path in paths_to_failure[current_node]:
                            new_path = path + [target]
                            paths_to_failure[target].append(new_path)
                            if new_path not in all_paths[target]:
                                all_paths[target].append(new_path)
                        
                        queue.append((target, depth + 1))
            
            for node_id in failed_nodes:
                failure_counts[node_id] += 1
                impact_sums[node_id] += RiskSimulationService._calculate_impact(
                    node_id, nodes, adjacency
                )
                if node_id in node_failure_step:
                    earliest_failures[node_id].append(node_failure_step[node_id])
        
        node_results = {}
        for node_id in all_node_ids:
            failure_prob = failure_counts[node_id] / iterations if iterations > 0 else 0.0
            avg_impact = impact_sums[node_id] / iterations if failure_counts[node_id] > 0 else 0.0
            risk_score = failure_prob * (avg_impact + 0.1)
            
            earliest_step = None
            if earliest_failures[node_id]:
                earliest_step = int(min(earliest_failures[node_id]))
            
            top_paths = all_paths[node_id][:5] if node_id in all_paths else []
            
            node_results[node_id] = {
                "node_id": node_id,
                "failure_probability": round(failure_prob, 4),
                "impact_score": round(avg_impact, 4),
                "risk_score": round(risk_score, 4),
                "earliest_failure_step": earliest_step,
                "propagation_paths": top_paths
            }
        
        total_risk = sum(nr["risk_score"] for nr in node_results.values())
        overall_risk_score = round(total_risk / len(node_results) if node_results else 0.0, 4)
        
        critical_paths = RiskSimulationService._find_critical_paths(
            disrupted_node_ids, adjacency, node_results
        )
        
        return {
            "node_results": node_results,
            "overall_risk_score": overall_risk_score,
            "critical_paths": critical_paths
        }
    
    @staticmethod
    def _calculate_impact(
        node_id: str,
        nodes: Dict[str, Any],
        adjacency: Dict[str, Any]
    ) -> float:
        downstream_count = 0
        visited = set([node_id])
        queue = deque([node_id])
        
        while queue:
            current = queue.popleft()
            for dep in adjacency.get(current, []):
                if dep["target"] not in visited:
                    visited.add(dep["target"])
                    downstream_count += 1
                    queue.append(dep["target"])
        
        base_impact = 0.5
        if downstream_count > 0:
            base_impact = min(1.0, 0.5 + downstream_count * 0.1)
        
        return base_impact
    
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
    async def get_simulation_result(
        session: AsyncSession,
        simulation_id: str
    ) -> Optional[SimulationResult]:
        query = """
        MATCH (sim:Simulation {id: $simulation_id})-[:HAS_RESULT]->(result:SimulationResult)
        OPTIONAL MATCH (result)-[nr:NODE_RESULT]->(node:SupplyNode)
        RETURN result, 
               collect({
                   node_id: node.id,
                   failure_probability: nr.failure_probability,
                   impact_score: nr.impact_score,
                   risk_score: nr.risk_score,
                   earliest_failure_step: nr.earliest_failure_step,
                   propagation_paths: nr.propagation_paths
               }) AS node_results_data
        """
        
        result = await session.run(query, simulation_id=simulation_id)
        record = await result.single()
        
        if not record:
            return None
        
        res = record["result"]
        
        node_results = {}
        for nr_data in record.get("node_results_data", []):
            if nr_data.get("node_id"):
                node_results[nr_data["node_id"]] = NodeRiskResult(
                    node_id=nr_data["node_id"],
                    failure_probability=nr_data["failure_probability"],
                    impact_score=nr_data["impact_score"],
                    risk_score=nr_data["risk_score"],
                    propagation_paths=nr_data.get("propagation_paths", []),
                    earliest_failure_step=nr_data.get("earliest_failure_step")
                )
        
        return SimulationResult(
            id=res["id"],
            simulation_id=simulation_id,
            network_id=res["network_id"],
            node_results=node_results,
            overall_risk_score=res["overall_risk_score"],
            most_vulnerable_nodes=res.get("most_vulnerable_nodes", []),
            critical_paths=res.get("critical_paths", []),
            created_at=res["created_at"]
        )
    
    @staticmethod
    async def compare_simulations(
        session: AsyncSession,
        network_id: str,
        simulation_ids: List[str]
    ) -> Dict[str, Any]:
        all_results = {}
        for sim_id in simulation_ids:
            result = await RiskSimulationService.get_simulation_result(session, sim_id)
            if result:
                all_results[sim_id] = result
        
        if not all_results:
            return {"error": "No valid simulation results found"}
        
        all_nodes = set()
        for result in all_results.values():
            all_nodes.update(result.node_results.keys())
        
        node_risk_comparison = {}
        for node_id in all_nodes:
            node_risk_comparison[node_id] = {}
            for sim_id, result in all_results.items():
                node_result = result.node_results.get(node_id)
                node_risk_comparison[node_id][sim_id] = (
                    node_result.risk_score if node_result else 0.0
                )
        
        overall_risk_comparison = {
            sim_id: result.overall_risk_score
            for sim_id, result in all_results.items()
        }
        
        return {
            "network_id": network_id,
            "simulation_ids": simulation_ids,
            "node_risk_comparison": node_risk_comparison,
            "overall_risk_comparison": overall_risk_comparison,
            "created_at": datetime.utcnow()
        }
