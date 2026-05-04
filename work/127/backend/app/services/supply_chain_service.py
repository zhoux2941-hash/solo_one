from datetime import datetime
from typing import List, Optional, Dict, Any
from neo4j import AsyncSession
from neo4j.exceptions import Neo4jError
import uuid
import logging

from app.models.schemas import (
    SupplyNodeCreate, SupplyNode,
    DependencyCreate, Dependency,
    SupplyChainNetworkCreate, SupplyChainNetwork,
    NodeType
)

logger = logging.getLogger(__name__)


class SupplyChainService:
    @staticmethod
    async def create_network(
        session: AsyncSession,
        network_data: SupplyChainNetworkCreate
    ) -> SupplyChainNetwork:
        network_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        query = """
        CREATE (n:SupplyChainNetwork {
            id: $network_id,
            name: $name,
            description: $description,
            created_at: $created_at,
            updated_at: $updated_at
        })
        RETURN n
        """
        
        result = await session.run(
            query,
            network_id=network_id,
            name=network_data.name,
            description=network_data.description,
            created_at=now,
            updated_at=now
        )
        
        record = await result.single()
        if not record:
            raise Exception("Failed to create network")
        
        node = record["n"]
        return SupplyChainNetwork(
            id=node["id"],
            name=node["name"],
            description=node.get("description"),
            created_at=node["created_at"],
            updated_at=node["updated_at"],
            node_count=0,
            dependency_count=0
        )
    
    @staticmethod
    async def get_network(
        session: AsyncSession,
        network_id: str
    ) -> Optional[SupplyChainNetwork]:
        query = """
        MATCH (n:SupplyChainNetwork {id: $network_id})
        OPTIONAL MATCH (n)-[:CONTAINS]->(node:SupplyNode)
        OPTIONAL MATCH (node)-[d:DEPENDS_ON]->(:SupplyNode)
        RETURN n, COUNT(DISTINCT node) AS node_count, COUNT(DISTINCT d) AS dependency_count
        """
        
        result = await session.run(query, network_id=network_id)
        record = await result.single()
        
        if not record:
            return None
        
        network_node = record["n"]
        return SupplyChainNetwork(
            id=network_node["id"],
            name=network_node["name"],
            description=network_node.get("description"),
            created_at=network_node["created_at"],
            updated_at=network_node["updated_at"],
            node_count=record["node_count"] or 0,
            dependency_count=record["dependency_count"] or 0
        )
    
    @staticmethod
    async def list_networks(
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[SupplyChainNetwork]:
        query = """
        MATCH (n:SupplyChainNetwork)
        OPTIONAL MATCH (n)-[:CONTAINS]->(node:SupplyNode)
        OPTIONAL MATCH (node)-[d:DEPENDS_ON]->(:SupplyNode)
        RETURN n, COUNT(DISTINCT node) AS node_count, COUNT(DISTINCT d) AS dependency_count
        ORDER BY n.created_at DESC
        SKIP $skip
        LIMIT $limit
        """
        
        result = await session.run(query, skip=skip, limit=limit)
        records = await result.fetch()
        
        networks = []
        for record in records:
            network_node = record["n"]
            networks.append(SupplyChainNetwork(
                id=network_node["id"],
                name=network_node["name"],
                description=network_node.get("description"),
                created_at=network_node["created_at"],
                updated_at=network_node["updated_at"],
                node_count=record["node_count"] or 0,
                dependency_count=record["dependency_count"] or 0
            ))
        
        return networks
    
    @staticmethod
    async def create_node(
        session: AsyncSession,
        network_id: str,
        node_data: SupplyNodeCreate
    ) -> SupplyNode:
        node_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        query = """
        MATCH (network:SupplyChainNetwork {id: $network_id})
        CREATE (network)-[:CONTAINS]->(node:SupplyNode {
            id: $node_id,
            name: $name,
            node_type: $node_type,
            description: $description,
            risk_score: $risk_score,
            latitude: $latitude,
            longitude: $longitude,
            attributes: $attributes,
            created_at: $created_at,
            updated_at: $updated_at
        })
        SET network.updated_at = $updated_at
        RETURN node
        """
        
        result = await session.run(
            query,
            network_id=network_id,
            node_id=node_id,
            name=node_data.name,
            node_type=node_data.node_type.value,
            description=node_data.description,
            risk_score=node_data.risk_score,
            latitude=node_data.latitude,
            longitude=node_data.longitude,
            attributes=node_data.attributes or {},
            created_at=now,
            updated_at=now
        )
        
        record = await result.single()
        if not record:
            raise Exception(f"Failed to create node in network {network_id}")
        
        node = record["node"]
        return SupplyNode(
            id=node["id"],
            name=node["name"],
            node_type=NodeType(node["node_type"]),
            description=node.get("description"),
            risk_score=node["risk_score"],
            latitude=node.get("latitude"),
            longitude=node.get("longitude"),
            attributes=node.get("attributes", {}),
            created_at=node["created_at"],
            updated_at=node["updated_at"]
        )
    
    @staticmethod
    async def get_node(
        session: AsyncSession,
        network_id: str,
        node_id: str
    ) -> Optional[SupplyNode]:
        query = """
        MATCH (:SupplyChainNetwork {id: $network_id})-[:CONTAINS]->(node:SupplyNode {id: $node_id})
        RETURN node
        """
        
        result = await session.run(query, network_id=network_id, node_id=node_id)
        record = await result.single()
        
        if not record:
            return None
        
        node = record["node"]
        return SupplyNode(
            id=node["id"],
            name=node["name"],
            node_type=NodeType(node["node_type"]),
            description=node.get("description"),
            risk_score=node["risk_score"],
            latitude=node.get("latitude"),
            longitude=node.get("longitude"),
            attributes=node.get("attributes", {}),
            created_at=node["created_at"],
            updated_at=node["updated_at"]
        )
    
    @staticmethod
    async def list_nodes(
        session: AsyncSession,
        network_id: str
    ) -> List[SupplyNode]:
        query = """
        MATCH (:SupplyChainNetwork {id: $network_id})-[:CONTAINS]->(node:SupplyNode)
        RETURN node
        ORDER BY node.name
        """
        
        result = await session.run(query, network_id=network_id)
        records = await result.fetch()
        
        nodes = []
        for record in records:
            node = record["node"]
            nodes.append(SupplyNode(
                id=node["id"],
                name=node["name"],
                node_type=NodeType(node["node_type"]),
                description=node.get("description"),
                risk_score=node["risk_score"],
                latitude=node.get("latitude"),
                longitude=node.get("longitude"),
                attributes=node.get("attributes", {}),
                created_at=node["created_at"],
                updated_at=node["updated_at"]
            ))
        
        return nodes
    
    @staticmethod
    async def create_dependency(
        session: AsyncSession,
        network_id: str,
        dependency_data: DependencyCreate
    ) -> Dependency:
        dependency_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        query = """
        MATCH (:SupplyChainNetwork {id: $network_id})-[:CONTAINS]->(source:SupplyNode {id: $source_id})
        MATCH (:SupplyChainNetwork {id: $network_id})-[:CONTAINS]->(target:SupplyNode {id: $target_id})
        CREATE (source)-[d:DEPENDS_ON {
            id: $dependency_id,
            dependency_strength: $dependency_strength,
            propagation_probability: $propagation_probability,
            lead_time_days: $lead_time_days,
            volume_percentage: $volume_percentage,
            created_at: $created_at,
            updated_at: $updated_at
        }]->(target)
        RETURN d
        """
        
        result = await session.run(
            query,
            network_id=network_id,
            source_id=dependency_data.source_node_id,
            target_id=dependency_data.target_node_id,
            dependency_id=dependency_id,
            dependency_strength=dependency_data.dependency_strength,
            propagation_probability=dependency_data.propagation_probability,
            lead_time_days=dependency_data.lead_time_days,
            volume_percentage=dependency_data.volume_percentage,
            created_at=now,
            updated_at=now
        )
        
        record = await result.single()
        if not record:
            raise Exception(f"Failed to create dependency between nodes")
        
        dep = record["d"]
        return Dependency(
            id=dep["id"],
            source_node_id=dependency_data.source_node_id,
            target_node_id=dependency_data.target_node_id,
            dependency_strength=dep["dependency_strength"],
            propagation_probability=dep["propagation_probability"],
            lead_time_days=dep.get("lead_time_days"),
            volume_percentage=dep.get("volume_percentage"),
            created_at=dep["created_at"],
            updated_at=dep["updated_at"]
        )
    
    @staticmethod
    async def list_dependencies(
        session: AsyncSession,
        network_id: str
    ) -> List[Dependency]:
        query = """
        MATCH (:SupplyChainNetwork {id: $network_id})-[:CONTAINS]->(source:SupplyNode)
        MATCH (source)-[d:DEPENDS_ON]->(target:SupplyNode)
        RETURN d, source.id AS source_id, target.id AS target_id
        """
        
        result = await session.run(query, network_id=network_id)
        records = await result.fetch()
        
        dependencies = []
        for record in records:
            dep = record["d"]
            dependencies.append(Dependency(
                id=dep["id"],
                source_node_id=record["source_id"],
                target_node_id=record["target_id"],
                dependency_strength=dep["dependency_strength"],
                propagation_probability=dep["propagation_probability"],
                lead_time_days=dep.get("lead_time_days"),
                volume_percentage=dep.get("volume_percentage"),
                created_at=dep["created_at"],
                updated_at=dep["updated_at"]
            ))
        
        return dependencies
    
    @staticmethod
    async def get_network_graph(
        session: AsyncSession,
        network_id: str
    ) -> Dict[str, Any]:
        nodes_query = """
        MATCH (network:SupplyChainNetwork {id: $network_id})-[:CONTAINS]->(node:SupplyNode)
        RETURN collect({
            id: node.id,
            name: node.name,
            type: node.node_type,
            risk_score: node.risk_score,
            description: node.description,
            attributes: node.attributes
        }) AS nodes
        """
        
        nodes_result = await session.run(nodes_query, network_id=network_id)
        nodes_record = await nodes_result.single()
        
        nodes = nodes_record["nodes"] if nodes_record else []
        
        links_query = """
        MATCH (:SupplyChainNetwork {id: $network_id})-[:CONTAINS]->(source:SupplyNode)
        MATCH (source)-[d:DEPENDS_ON]->(target:SupplyNode)
        RETURN d.id AS id, source.id AS source, target.id AS target,
               d.dependency_strength AS strength, d.propagation_probability AS propagation_prob
        """
        
        links_result = await session.run(links_query, network_id=network_id)
        links_records = await links_result.fetch()
        
        links = []
        for rec in links_records:
            links.append({
                "id": rec["id"],
                "source": rec["source"],
                "target": rec["target"],
                "strength": rec["strength"],
                "propagation_prob": rec["propagation_prob"]
            })
        
        return {"nodes": nodes, "links": links}
