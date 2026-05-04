from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class NodeType(str, Enum):
    SUPPLIER = "supplier"
    MANUFACTURER = "manufacturer"
    WAREHOUSE = "warehouse"
    DISTRIBUTOR = "distributor"
    RETAILER = "retailer"
    CUSTOMER = "customer"


class NodeStatus(str, Enum):
    ACTIVE = "active"
    DISRUPTED = "disrupted"
    AT_RISK = "at_risk"
    FAILED = "failed"


class SupplyNodeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    node_type: NodeType
    description: Optional[str] = None
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)


class SupplyNode(BaseModel):
    id: str
    name: str
    node_type: NodeType
    description: Optional[str] = None
    risk_score: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class DependencyCreate(BaseModel):
    source_node_id: str
    target_node_id: str
    dependency_strength: float = Field(default=0.5, ge=0.0, le=1.0)
    propagation_probability: float = Field(default=0.3, ge=0.0, le=1.0)
    lead_time_days: Optional[int] = None
    volume_percentage: Optional[float] = None


class Dependency(BaseModel):
    id: str
    source_node_id: str
    target_node_id: str
    dependency_strength: float
    propagation_probability: float
    lead_time_days: Optional[int] = None
    volume_percentage: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class SupplyChainNetworkCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None


class SupplyChainNetwork(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    node_count: int = 0
    dependency_count: int = 0


class SimulationStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SimulationCreate(BaseModel):
    network_id: str
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    disrupted_node_ids: List[str] = Field(default_factory=list)
    iterations: int = Field(default=1000, ge=100, le=10000)
    max_propagation_depth: int = Field(default=5, ge=1, le=20)


class Simulation(BaseModel):
    id: str
    network_id: str
    name: str
    description: Optional[str] = None
    status: SimulationStatus
    disrupted_node_ids: List[str]
    iterations: int
    max_propagation_depth: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class NodeRiskResult(BaseModel):
    node_id: str
    failure_probability: float
    impact_score: float
    risk_score: float
    propagation_paths: List[List[str]]
    earliest_failure_step: Optional[int] = None


class SimulationResult(BaseModel):
    id: str
    simulation_id: str
    network_id: str
    node_results: Dict[str, NodeRiskResult]
    overall_risk_score: float
    most_vulnerable_nodes: List[str]
    critical_paths: List[List[str]]
    created_at: datetime


class ExcelImportResult(BaseModel):
    nodes_created: int
    nodes_updated: int
    dependencies_created: int
    dependencies_updated: int
    errors: List[str] = Field(default_factory=list)


class NetworkExport(BaseModel):
    network: SupplyChainNetwork
    nodes: List[SupplyNode]
    dependencies: List[Dependency]


class SimulationComparison(BaseModel):
    network_id: str
    simulation_ids: List[str]
    node_risk_comparison: Dict[str, Dict[str, float]]
    overall_risk_comparison: Dict[str, float]
    created_at: datetime
