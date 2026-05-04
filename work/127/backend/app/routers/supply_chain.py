from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any
from neo4j import AsyncSession

from app.database.neo4j_client import get_db_session
from app.models.schemas import (
    SupplyChainNetworkCreate, SupplyChainNetwork,
    SupplyNodeCreate, SupplyNode,
    DependencyCreate, Dependency
)
from app.services.supply_chain_service import SupplyChainService

router = APIRouter(prefix="/networks", tags=["supply_chain"])


@router.post("/", response_model=SupplyChainNetwork, status_code=201)
async def create_network(
    network_data: SupplyChainNetworkCreate,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.create_network(session, network_data)
        return network
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[SupplyChainNetwork])
async def list_networks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    session: AsyncSession = Depends(get_db_session)
):
    try:
        networks = await SupplyChainService.list_networks(session, skip, limit)
        return networks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{network_id}", response_model=SupplyChainNetwork)
async def get_network(
    network_id: str,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        return network
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{network_id}/nodes", response_model=SupplyNode, status_code=201)
async def create_node(
    network_id: str,
    node_data: SupplyNodeCreate,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        node = await SupplyChainService.create_node(session, network_id, node_data)
        return node
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{network_id}/nodes", response_model=List[SupplyNode])
async def list_nodes(
    network_id: str,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        nodes = await SupplyChainService.list_nodes(session, network_id)
        return nodes
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{network_id}/nodes/{node_id}", response_model=SupplyNode)
async def get_node(
    network_id: str,
    node_id: str,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        node = await SupplyChainService.get_node(session, network_id, node_id)
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
        return node
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{network_id}/dependencies", response_model=Dependency, status_code=201)
async def create_dependency(
    network_id: str,
    dependency_data: DependencyCreate,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        source_node = await SupplyChainService.get_node(
            session, network_id, dependency_data.source_node_id
        )
        if not source_node:
            raise HTTPException(status_code=404, detail="Source node not found")
        
        target_node = await SupplyChainService.get_node(
            session, network_id, dependency_data.target_node_id
        )
        if not target_node:
            raise HTTPException(status_code=404, detail="Target node not found")
        
        dependency = await SupplyChainService.create_dependency(
            session, network_id, dependency_data
        )
        return dependency
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{network_id}/dependencies", response_model=List[Dependency])
async def list_dependencies(
    network_id: str,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        dependencies = await SupplyChainService.list_dependencies(session, network_id)
        return dependencies
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{network_id}/graph", response_model=Dict[str, Any])
async def get_network_graph(
    network_id: str,
    session: AsyncSession = Depends(get_db_session)
):
    try:
        network = await SupplyChainService.get_network(session, network_id)
        if not network:
            raise HTTPException(status_code=404, detail="Network not found")
        
        graph = await SupplyChainService.get_network_graph(session, network_id)
        return graph
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
