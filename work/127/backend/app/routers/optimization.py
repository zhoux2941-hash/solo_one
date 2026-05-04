from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from typing import List, Dict, Any, Optional
from neo4j import AsyncSession

from app.database.neo4j_client import get_db_session
from app.services.network_optimizer import network_optimizer
from app.services.supply_chain_service import SupplyChainService
from app.models.schemas import SimulationCreate, SimulationResult
from app.services.risk_simulation_service import RiskSimulationService

router = APIRouter(prefix="/optimization", tags=["optimization"])


@router.get("/networks/{network_id}/suggestions", response_model=Dict[str, Any])
async def get_optimization_suggestions(
    network_id: str,
    max_suggestions: int = Query(10, ge=1, le=50),
    budget_limit: Optional[float] = Query(None, ge=0),
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        nodes, adjacency, reverse_adjacency = await network_optimizer.analyze_network(network_id)
        
        if not nodes:
            return {
                "network_id": network_id,
                "network_name": network.name,
                "suggestions": [],
                "summary": {
                    "total_suggestions": 0,
                    "estimated_total_risk_reduction": 0,
                    "estimated_total_cost": 0
                }
            }
        
        suggestions = network_optimizer.generate_optimized_suggestions(
            nodes=nodes,
            adjacency=adjacency,
            reverse_adjacency=reverse_adjacency,
            max_suggestions=max_suggestions,
            budget_limit=budget_limit
        )
        
        suggestion_dicts = [s.to_dict() for s in suggestions]
        
        total_risk_reduction = sum(s.risk_reduction_estimate for s in suggestions)
        total_cost = sum(s.cost_estimate for s in suggestions)
        
        type_counts = {}
        for s in suggestions:
            if s.suggestion_type not in type_counts:
                type_counts[s.suggestion_type] = 0
            type_counts[s.suggestion_type] += 1
        
        return {
            "network_id": network_id,
            "network_name": network.name,
            "node_count": network.node_count,
            "dependency_count": network.dependency_count,
            "suggestions": suggestion_dicts,
            "summary": {
                "total_suggestions": len(suggestions),
                "estimated_total_risk_reduction": round(total_risk_reduction, 4),
                "estimated_total_cost": round(total_cost, 2),
                "suggestion_type_breakdown": type_counts
            },
            "filters_applied": {
                "max_suggestions": max_suggestions,
                "budget_limit": budget_limit
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/networks/{network_id}/simulate-optimization", response_model=Dict[str, Any])
async def simulate_optimization(
    network_id: str,
    suggestion_ids: List[int] = Query(default=None, description="索引列表，从 get_optimization_suggestions 获取"),
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        nodes, adjacency, reverse_adjacency = await network_optimizer.analyze_network(network_id)
        
        all_suggestions = network_optimizer.generate_optimized_suggestions(
            nodes=nodes,
            adjacency=adjacency,
            reverse_adjacency=reverse_adjacency,
            max_suggestions=50
        )
        
        if suggestion_ids:
            selected_suggestions = [
                all_suggestions[i] for i in suggestion_ids 
                if 0 <= i < len(all_suggestions)
            ]
        else:
            selected_suggestions = all_suggestions
        
        if not selected_suggestions:
            raise HTTPException(
                status_code=400,
                detail="No valid suggestions selected"
            )
        
        simulation_result = await network_optimizer.simulate_with_suggestions(
            network_id=network_id,
            suggestions=selected_suggestions
        )
        
        return {
            "network_id": network_id,
            "network_name": network.name,
            "suggestions_applied": [s.to_dict() for s in selected_suggestions],
            "comparison": simulation_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/networks/{network_id}/compare", response_model=Dict[str, Any])
async def compare_networks(
    network_id: str,
    background_tasks: BackgroundTasks,
    disrupted_node_ids: List[str],
    iterations: int = Query(1000, ge=100, le=10000),
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        nodes = await SupplyChainService.list_nodes(session, network_id)
        node_ids = {node.id for node in nodes}
        
        for disrupted_id in disrupted_node_ids:
            if disrupted_id not in node_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"Disrupted node {disrupted_id} not found in network"
                )
        
        from app.models.schemas import SimulationCreate, SimulationStatus
        import uuid
        from datetime import datetime
        
        original_simulation_data = SimulationCreate(
            network_id=network_id,
            name=f"原始网络风险模拟_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            disrupted_node_ids=disrupted_node_ids,
            iterations=iterations,
            max_propagation_depth=5
        )
        
        original_simulation = await RiskSimulationService.create_simulation(
            session, original_simulation_data
        )
        
        original_result = await RiskSimulationService.run_simulation(
            session, original_simulation.id
        )
        
        all_suggestions_data = await get_optimization_suggestions(
            network_id=network_id,
            max_suggestions=10,
            budget_limit=None,
            session=session
        )
        
        suggestions = all_suggestions_data.get("suggestions", [])
        
        return {
            "network_id": network_id,
            "network_name": network.name,
            "original_simulation": {
                "simulation_id": original_simulation.id,
                "overall_risk_score": original_result.overall_risk_score,
                "most_vulnerable_nodes": original_result.most_vulnerable_nodes,
                "critical_paths": original_result.critical_paths,
                "node_results": {
                    node_id: {
                        "failure_probability": nr.failure_probability,
                        "impact_score": nr.impact_score,
                        "risk_score": nr.risk_score
                    }
                    for node_id, nr in original_result.node_results.items()
                }
            },
            "optimization_suggestions": suggestions,
            "instructions": "使用 simulate-optimization 端点来模拟应用建议后的风险降低效果"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggestion-types", response_model=Dict[str, Any])
async def get_suggestion_types():
    return {
        "types": [
            {
                "type": "single_source_risk",
                "description": "单一供应商风险",
                "suggested_action": "add_alternative_supplier",
                "impact": "高",
                "typical_cost_range": "10,000 - 50,000"
            },
            {
                "type": "high_betweenness",
                "description": "高介数中心性节点（关键瓶颈）",
                "suggested_action": "add_parallel_path",
                "impact": "高",
                "typical_cost_range": "20,000 - 100,000"
            },
            {
                "type": "high_risk_node",
                "description": "高风险节点",
                "suggested_action": "reduce_risk",
                "impact": "中",
                "typical_cost_range": "5,000 - 30,000"
            },
            {
                "type": "high_risk_dependency",
                "description": "高风险依赖关系",
                "suggested_action": "diversify_dependency",
                "impact": "中",
                "typical_cost_range": "8,000 - 40,000"
            },
            {
                "type": "no_supplier",
                "description": "无上游供应商",
                "suggested_action": "add_supplier",
                "impact": "高",
                "typical_cost_range": "15,000 - 80,000"
            }
        ],
        "metrics_used": [
            {
                "name": "betweenness_centrality",
                "description": "介数中心性 - 衡量节点在网络中的桥梁作用"
            },
            {
                "name": "impact_score",
                "description": "影响评分 - 基于下游节点数量计算"
            },
            {
                "name": "risk_score",
                "description": "风险评分 - 节点自身的风险水平"
            },
            {
                "name": "dependency_strength",
                "description": "依赖强度 - 节点对供应商的依赖程度"
            }
        ]
    }
