from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional, Set
from collections import defaultdict, deque
import logging
import numpy as np
from neo4j import AsyncGraphDatabase, AsyncSession

from app.config import settings

logger = logging.getLogger(__name__)


class OptimizationSuggestion:
    def __init__(
        self,
        suggestion_type: str,
        target_node_id: str,
        target_node_name: str,
        suggested_action: str,
        risk_reduction_estimate: float,
        cost_estimate: float,
        description: str,
        details: Dict[str, Any] = None
    ):
        self.suggestion_type = suggestion_type
        self.target_node_id = target_node_id
        self.target_node_name = target_node_name
        self.suggested_action = suggested_action
        self.risk_reduction_estimate = risk_reduction_estimate
        self.cost_estimate = cost_estimate
        self.description = description
        self.details = details or {}
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "suggestion_type": self.suggestion_type,
            "target_node_id": self.target_node_id,
            "target_node_name": self.target_node_name,
            "suggested_action": self.suggested_action,
            "risk_reduction_estimate": round(self.risk_reduction_estimate, 4),
            "cost_estimate": round(self.cost_estimate, 2),
            "cost_effectiveness": round(self.risk_reduction_estimate / max(self.cost_estimate, 0.1), 4),
            "description": self.description,
            "details": self.details
        }


class RiskReductionEstimator:
    @staticmethod
    def calculate_node_centrality(
        nodes: List[Dict[str, Any]],
        adjacency: Dict[str, List[Dict[str, Any]]],
        reverse_adjacency: Dict[str, List[Dict[str, Any]]]
    ) -> Dict[str, Dict[str, float]]:
        node_ids = [n["id"] for n in nodes]
        centrality = {}
        
        for node_id in node_ids:
            in_degree = len(reverse_adjacency.get(node_id, []))
            out_degree = len(adjacency.get(node_id, []))
            
            centrality[node_id] = {
                "in_degree": in_degree,
                "out_degree": out_degree,
                "degree": in_degree + out_degree
            }
        
        for node_id in node_ids:
            betweenness = RiskReductionEstimator._calculate_betweenness(
                node_id, node_ids, adjacency, reverse_adjacency
            )
            centrality[node_id]["betweenness"] = betweenness
        
        for node_id in node_ids:
            downstream_count = RiskReductionEstimator._count_downstream(
                node_id, adjacency
            )
            upstream_count = RiskReductionEstimator._count_upstream(
                node_id, reverse_adjacency
            )
            centrality[node_id]["downstream_count"] = downstream_count
            centrality[node_id]["upstream_count"] = upstream_count
            centrality[node_id]["impact_score"] = downstream_count / max(len(node_ids), 1)
        
        return centrality
    
    @staticmethod
    def _calculate_betweenness(
        target_node: str,
        all_nodes: List[str],
        adjacency: Dict[str, List[Dict[str, Any]]],
        reverse_adjacency: Dict[str, List[Dict[str, Any]]]
    ) -> float:
        betweenness = 0.0
        n = len(all_nodes)
        
        if n < 3:
            return 0.0
        
        for i, source in enumerate(all_nodes):
            if source == target_node:
                continue
            for j, target in enumerate(all_nodes):
                if target == target_node or target == source:
                    continue
                
                all_paths = RiskReductionEstimator._find_all_paths(
                    source, target, adjacency, max_depth=10
                )
                
                if not all_paths:
                    continue
                
                total_paths = len(all_paths)
                paths_through_target = sum(
                    1 for path in all_paths if target_node in path
                )
                
                betweenness += paths_through_target / total_paths
        
        max_possible = (n - 1) * (n - 2)
        return betweenness / max_possible if max_possible > 0 else 0.0
    
    @staticmethod
    def _find_all_paths(
        start: str,
        end: str,
        adjacency: Dict[str, List[Dict[str, Any]]],
        max_depth: int
    ) -> List[List[str]]:
        paths = []
        queue = deque([(start, [start])])
        
        while queue:
            node, path = queue.popleft()
            
            if node == end:
                paths.append(path)
                continue
            
            if len(path) > max_depth:
                continue
            
            for dep in adjacency.get(node, []):
                neighbor = dep["target"]
                if neighbor not in path:
                    queue.append((neighbor, path + [neighbor]))
        
        return paths
    
    @staticmethod
    def _count_downstream(
        start: str,
        adjacency: Dict[str, List[Dict[str, Any]]]
    ) -> int:
        visited = set()
        queue = deque([start])
        
        while queue:
            node = queue.popleft()
            for dep in adjacency.get(node, []):
                neighbor = dep["target"]
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        
        return len(visited)
    
    @staticmethod
    def _count_upstream(
        start: str,
        reverse_adjacency: Dict[str, List[Dict[str, Any]]]
    ) -> int:
        visited = set()
        queue = deque([start])
        
        while queue:
            node = queue.popleft()
            for dep in reverse_adjacency.get(node, []):
                neighbor = dep["source"]
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        
        return len(visited)


class NetworkOptimizer:
    def __init__(self):
        pass
    
    async def analyze_network(
        self,
        network_id: str
    ) -> Tuple[List[Dict[str, Any]], Dict[str, List[Dict[str, Any]]], Dict[str, List[Dict[str, Any]]]]:
        driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            database=settings.NEO4J_DATABASE
        )
        
        try:
            async with driver.session() as session:
                nodes_query = """
                MATCH (:SupplyChainNetwork {id: $network_id})-[:CONTAINS]->(node:SupplyNode)
                RETURN node.id AS id, node.name AS name, 
                       node.node_type AS type, node.risk_score AS risk_score
                """
                
                nodes_result = await session.run(nodes_query, network_id=network_id)
                nodes = []
                async for record in nodes_result:
                    nodes.append({
                        "id": record["id"],
                        "name": record["name"],
                        "type": record["type"],
                        "risk_score": record["risk_score"] or 0.0
                    })
                
                adjacency_query = """
                MATCH (:SupplyChainNetwork {id: $network_id})-[:CONTAINS]->(source:SupplyNode)
                MATCH (source)-[d:DEPENDS_ON]->(target:SupplyNode)
                RETURN source.id AS source_id, target.id AS target_id,
                       d.dependency_strength AS strength, d.propagation_probability AS propagation_prob
                """
                
                adjacency = defaultdict(list)
                reverse_adjacency = defaultdict(list)
                
                adj_result = await session.run(adjacency_query, network_id=network_id)
                async for record in adj_result:
                    source = record["source_id"]
                    target = record["target_id"]
                    dep_data = {
                        "source": source,
                        "target": target,
                        "strength": record["strength"] or 0.5,
                        "propagation_prob": record["propagation_prob"] or 0.3
                    }
                    adjacency[source].append(dep_data)
                    reverse_adjacency[target].append(dep_data)
                
                return nodes, dict(adjacency), dict(reverse_adjacency)
                
        finally:
            await driver.close()
    
    def identify_single_source_vulnerabilities(
        self,
        nodes: List[Dict[str, Any]],
        adjacency: Dict[str, List[Dict[str, Any]]],
        reverse_adjacency: Dict[str, List[Dict[str, Any]]],
        centrality: Dict[str, Dict[str, float]]
    ) -> List[OptimizationSuggestion]:
        suggestions = []
        
        for node in nodes:
            node_id = node["id"]
            node_name = node["name"]
            
            suppliers = reverse_adjacency.get(node_id, [])
            
            if len(suppliers) == 1:
                supplier = suppliers[0]
                supplier_id = supplier["source"]
                
                impact_score = centrality[node_id]["impact_score"]
                base_risk = node["risk_score"]
                single_source_risk = (1 - supplier["strength"] * 0.5) * (supplier["propagation_prob"] * 0.8)
                
                estimated_risk_reduction = min(0.8, base_risk + single_source_risk * 0.6)
                
                cost_estimate = 10000 + impact_score * 5000
                
                suggestions.append(OptimizationSuggestion(
                    suggestion_type="single_source_risk",
                    target_node_id=node_id,
                    target_node_name=node_name,
                    suggested_action="add_alternative_supplier",
                    risk_reduction_estimate=estimated_risk_reduction,
                    cost_estimate=cost_estimate,
                    description=f"节点 {node_name} 依赖单一供应商 {supplier_id}，建议添加备选供应商",
                    details={
                        "current_supplier": supplier_id,
                        "dependency_strength": supplier["strength"],
                        "impact_score": impact_score,
                        "estimated_risk_without_redundancy": round(base_risk + single_source_risk, 4),
                        "estimated_risk_with_redundancy": round(base_risk * 0.3, 4)
                    }
                ))
            
            elif len(suppliers) == 0 and node_id not in [n["id"] for n in nodes if n["type"] == "supplier"]:
                if node["type"] not in ["supplier"]:
                    impact_score = centrality[node_id]["impact_score"]
                    
                    suggestions.append(OptimizationSuggestion(
                        suggestion_type="no_supplier",
                        target_node_id=node_id,
                        target_node_name=node_name,
                        suggested_action="add_supplier",
                        risk_reduction_estimate=min(0.9, impact_score * 0.7),
                        cost_estimate=15000 + impact_score * 8000,
                        description=f"节点 {node_name} 没有供应商，建议添加上游供应商",
                        details={
                            "impact_score": impact_score,
                            "downstream_nodes": centrality[node_id]["downstream_count"]
                        }
                    ))
        
        return suggestions
    
    def identify_high_risk_choke_points(
        self,
        nodes: List[Dict[str, Any]],
        adjacency: Dict[str, List[Dict[str, Any]]],
        reverse_adjacency: Dict[str, List[Dict[str, Any]]],
        centrality: Dict[str, Dict[str, float]]
    ) -> List[OptimizationSuggestion]:
        suggestions = []
        
        for node in nodes:
            node_id = node["id"]
            node_name = node["name"]
            
            betweenness = centrality[node_id]["betweenness"]
            downstream_count = centrality[node_id]["downstream_count"]
            impact_score = centrality[node_id]["impact_score"]
            
            if betweenness > 0.3 or (impact_score > 0.5 and downstream_count > 0):
                if betweenness > 0.3:
                    suggestions.append(OptimizationSuggestion(
                        suggestion_type="high_betweenness",
                        target_node_id=node_id,
                        target_node_name=node_name,
                        suggested_action="add_parallel_path",
                        risk_reduction_estimate=betweenness * 0.8,
                        cost_estimate=20000 + impact_score * 10000,
                        description=f"节点 {node_name} 是关键瓶颈点（介数中心性 {round(betweenness, 4)}），建议添加平行路径",
                        details={
                            "betweenness_centrality": round(betweenness, 4),
                            "impact_score": impact_score,
                            "downstream_nodes": downstream_count,
                            "suggested_approach": "添加绕过此节点的备用路径，或增加此节点的冗余"
                        }
                    ))
                
                if node["risk_score"] > 0.5:
                    suggestions.append(OptimizationSuggestion(
                        suggestion_type="high_risk_node",
                        target_node_id=node_id,
                        target_node_name=node_name,
                        suggested_action="reduce_risk",
                        risk_reduction_estimate=node["risk_score"] * 0.6,
                        cost_estimate=5000 + impact_score * 5000,
                        description=f"节点 {node_name} 风险评分较高（{node['risk_score']}），且影响多个下游节点",
                        details={
                            "current_risk_score": node["risk_score"],
                            "impact_score": impact_score,
                            "suggested_approach": "降低此节点的基础风险，或增加冗余备份"
                        }
                    ))
        
        return suggestions
    
    def identify_weak_dependency_links(
        self,
        nodes: List[Dict[str, Any]],
        adjacency: Dict[str, List[Dict[str, Any]]],
        reverse_adjacency: Dict[str, List[Dict[str, Any]]],
        centrality: Dict[str, Dict[str, float]]
    ) -> List[OptimizationSuggestion]:
        suggestions = []
        
        for source_id, deps in adjacency.items():
            for dep in deps:
                target_id = dep["target"]
                
                if dep["strength"] > 0.7 or dep["propagation_prob"] > 0.6:
                    source_node = next((n for n in nodes if n["id"] == source_id), None)
                    target_node = next((n for n in nodes if n["id"] == target_id), None)
                    
                    if source_node and target_node:
                        target_impact = centrality[target_id]["impact_score"]
                        risk = dep["strength"] * dep["propagation_prob"] * target_impact
                        
                        if risk > 0.3:
                            suggestions.append(OptimizationSuggestion(
                                suggestion_type="high_risk_dependency",
                                target_node_id=target_id,
                                target_node_name=target_node["name"],
                                suggested_action="diversify_dependency",
                                risk_reduction_estimate=risk * 0.7,
                                cost_estimate=8000 + target_impact * 4000,
                                description=f"从 {source_node['name']} 到 {target_node['name']} 的依赖关系风险较高",
                                details={
                                    "source_node": source_id,
                                    "source_node_name": source_node["name"],
                                    "dependency_strength": dep["strength"],
                                    "propagation_probability": dep["propagation_prob"],
                                    "combined_risk": round(risk, 4),
                                    "suggested_approach": "分散对该依赖的集中度，或增加冗余供应商"
                                }
                            ))
        
        return suggestions
    
    def generate_optimized_suggestions(
        self,
        nodes: List[Dict[str, Any]],
        adjacency: Dict[str, List[Dict[str, Any]]],
        reverse_adjacency: Dict[str, List[Dict[str, Any]]],
        max_suggestions: int = 10,
        budget_limit: float = None
    ) -> List[OptimizationSuggestion]:
        centrality = RiskReductionEstimator.calculate_node_centrality(
            nodes, adjacency, reverse_adjacency
        )
        
        all_suggestions: List[OptimizationSuggestion] = []
        
        all_suggestions.extend(
            self.identify_single_source_vulnerabilities(
                nodes, adjacency, reverse_adjacency, centrality
            )
        )
        
        all_suggestions.extend(
            self.identify_high_risk_choke_points(
                nodes, adjacency, reverse_adjacency, centrality
            )
        )
        
        all_suggestions.extend(
            self.identify_weak_dependency_links(
                nodes, adjacency, reverse_adjacency, centrality
            )
        )
        
        all_suggestions.sort(
            key=lambda s: s.risk_reduction_estimate / max(s.cost_estimate, 0.1),
            reverse=True
        )
        
        if budget_limit:
            selected = []
            total_cost = 0
            for suggestion in all_suggestions:
                if total_cost + suggestion.cost_estimate <= budget_limit:
                    selected.append(suggestion)
                    total_cost += suggestion.cost_estimate
            return selected
        
        return all_suggestions[:max_suggestions]
    
    async def simulate_with_suggestions(
        self,
        network_id: str,
        suggestions: List[OptimizationSuggestion]
    ) -> Dict[str, Any]:
        nodes, adjacency, reverse_adjacency = await self.analyze_network(network_id)
        
        simulated_adjacency = {k: v.copy() for k, v in adjacency.items()}
        simulated_reverse = {k: v.copy() for k, v in reverse_adjacency.items()}
        simulated_nodes = [n.copy() for n in nodes]
        
        for suggestion in suggestions:
            if suggestion.suggested_action in ["add_alternative_supplier", "add_supplier"]:
                target_id = suggestion.target_node_id
                
                if suggestion.details.get("current_supplier"):
                    current_supplier_id = suggestion.details["current_supplier"]
                    
                    existing_deps = simulated_reverse.get(target_id, [])
                    for dep in existing_deps:
                        if dep["source"] == current_supplier_id:
                            dep["strength"] = dep["strength"] * 0.6
                            dep["propagation_prob"] = dep["propagation_prob"] * 0.5
                            
                            for adj_dep in simulated_adjacency.get(current_supplier_id, []):
                                if adj_dep["target"] == target_id:
                                    adj_dep["strength"] = dep["strength"]
                                    adj_dep["propagation_prob"] = dep["propagation_prob"]
                
                alternative_id = f"alt_{suggestion.target_node_id}"
                alternative_name = f"{suggestion.target_node_name}_备选供应商"
                
                simulated_nodes.append({
                    "id": alternative_id,
                    "name": alternative_name,
                    "type": "supplier",
                    "risk_score": 0.1
                })
                
                new_dep = {
                    "source": alternative_id,
                    "target": target_id,
                    "strength": 0.7,
                    "propagation_prob": 0.3
                }
                
                if alternative_id not in simulated_adjacency:
                    simulated_adjacency[alternative_id] = []
                simulated_adjacency[alternative_id].append(new_dep)
                
                if target_id not in simulated_reverse:
                    simulated_reverse[target_id] = []
                simulated_reverse[target_id].append(new_dep)
            
            elif suggestion.suggested_action == "reduce_risk":
                for node in simulated_nodes:
                    if node["id"] == suggestion.target_node_id:
                        node["risk_score"] = node["risk_score"] * 0.4
        
        centrality_original = RiskReductionEstimator.calculate_node_centrality(
            nodes, adjacency, reverse_adjacency
        )
        
        centrality_simulated = RiskReductionEstimator.calculate_node_centrality(
            simulated_nodes, simulated_adjacency, simulated_reverse
        )
        
        original_risk = sum(
            n["risk_score"] * centrality_original.get(n["id"], {}).get("impact_score", 0)
            for n in nodes
        ) / max(len(nodes), 1)
        
        simulated_risk = sum(
            n["risk_score"] * centrality_simulated.get(n["id"], {}).get("impact_score", 0)
            for n in simulated_nodes
        ) / max(len(simulated_nodes), 1)
        
        risk_reduction = max(0, original_risk - simulated_risk)
        
        return {
            "original_network": {
                "node_count": len(nodes),
                "link_count": sum(len(v) for v in adjacency.values()),
                "estimated_aggregate_risk": round(original_risk, 4)
            },
            "optimized_network": {
                "node_count": len(simulated_nodes),
                "link_count": sum(len(v) for v in simulated_adjacency.values()),
                "estimated_aggregate_risk": round(simulated_risk, 4),
                "nodes_added": len(simulated_nodes) - len(nodes),
                "links_modified": sum(
                    1 for suggestion in suggestions
                    if suggestion.suggested_action in ["add_alternative_supplier", "add_supplier"]
                )
            },
            "risk_analysis": {
                "risk_reduction_percentage": round(risk_reduction / max(original_risk, 0.01) * 100, 2),
                "absolute_risk_reduction": round(risk_reduction, 4),
                "suggestions_applied": len(suggestions)
            },
            "node_risk_comparison": [
                {
                    "node_id": node["id"],
                    "node_name": node["name"],
                    "original_risk": node["risk_score"],
                    "simulated_risk": next(
                        (n["risk_score"] for n in simulated_nodes if n["id"] == node["id"]),
                        node["risk_score"]
                    )
                }
                for node in nodes
            ]
        }


network_optimizer = NetworkOptimizer()
