from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Point3D(BaseModel):
    x: float
    y: float
    z: float

class Vector3D(BaseModel):
    x: float
    y: float
    z: float

class BulletHoleCreate(BaseModel):
    position: Point3D
    normal: Optional[Vector3D] = None
    hole_type: Optional[str] = None
    confidence: float = 1.0
    is_manual: bool = True

class BulletHoleResponse(BaseModel):
    id: int
    analysis_id: int
    position: Point3D
    normal: Optional[Vector3D] = None
    hole_type: Optional[str] = None
    confidence: float
    is_manual: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PointCloudUploadResponse(BaseModel):
    id: int
    file_name: str
    file_type: str
    upload_time: datetime
    point_count: int
    bounds_min: Optional[Point3D] = None
    bounds_max: Optional[Point3D] = None

    class Config:
        from_attributes = True

class EnvironmentParameters(BaseModel):
    temperature: float = Field(20.0, ge=-50, le=60, description="环境温度 (°C)")
    altitude: float = Field(0.0, ge=-500, le=10000, description="海拔高度 (m)")
    humidity: float = Field(50.0, ge=0, le=100, description="相对湿度 (%)")
    pressure: Optional[float] = Field(None, ge=80000, le=110000, description="大气压 (Pa)，如不提供则根据海拔计算")

class WeaponParameters(BaseModel):
    weapon_type: str = Field(..., description="枪支类型")
    initial_velocity_min: float = Field(..., ge=0, description="最小初速 (m/s)")
    initial_velocity_max: float = Field(..., ge=0, description="最大初速 (m/s)")
    bullet_mass: Optional[float] = Field(None, description="子弹质量 (g)")
    drag_coefficient: Optional[float] = Field(None, description="空气阻力系数")
    bullet_diameter: Optional[float] = Field(None, description="子弹直径 (m)")

class TrajectoryPoint(BaseModel):
    position: Point3D
    velocity: float
    time: float

class ProbabilityCone(BaseModel):
    apex: Point3D
    direction: Vector3D
    angle: float
    height: float
    confidence: float

class BallisticAnalysisCreate(BaseModel):
    point_cloud_id: int
    case_number: Optional[str] = None
    bullet_holes: List[BulletHoleCreate]
    weapon_params: WeaponParameters
    environment_params: Optional[EnvironmentParameters] = None

class BallisticAnalysisResponse(BaseModel):
    id: int
    point_cloud_id: int
    case_number: Optional[str] = None
    created_at: datetime
    weapon_type: Optional[str] = None
    shooter_position: Optional[Point3D] = None
    trajectory_data: Optional[List[TrajectoryPoint]] = None
    probability_cone: Optional[ProbabilityCone] = None
    analysis_status: str
    bullet_holes: List[BulletHoleResponse] = []

    class Config:
        from_attributes = True

class AnalysisListResponse(BaseModel):
    total: int
    analyses: List[BallisticAnalysisResponse]

class ReportGenerateRequest(BaseModel):
    analysis_id: int
    include_point_cloud_info: bool = True
    include_trajectory: bool = True
    include_probability_cone: bool = True
    additional_notes: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    analysis_id: int
    report_path: str
    generated_at: datetime
    report_format: str

    class Config:
        from_attributes = True

class Point2D(BaseModel):
    x: float
    y: float

class Region(BaseModel):
    center: Point2D
    width: Optional[float] = None
    height: Optional[float] = None
    radius: Optional[float] = None
    angle: Optional[float] = None

class MatchedPoint(BaseModel):
    query_point: Point2D
    sample_point: Point2D
    distance: float
    inlier: bool = True

class FirearmSampleCreate(BaseModel):
    sample_name: str
    firearm_type: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    caliber: Optional[str] = None
    description: Optional[str] = None
    case_number: Optional[str] = None

class FirearmSampleResponse(BaseModel):
    id: int
    sample_name: str
    firearm_type: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    caliber: Optional[str] = None
    description: Optional[str] = None
    case_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CartridgeImageResponse(BaseModel):
    id: int
    sample_id: Optional[int] = None
    image_type: str = "unknown"
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    has_features: bool = False
    primer_region: Optional[Region] = None
    ejector_mark_region: Optional[Region] = None
    extractor_mark_region: Optional[Region] = None
    firing_pin_hole_region: Optional[Region] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CartridgeFeaturesResponse(BaseModel):
    id: int
    image_id: int
    primer_keypoints_count: int = 0
    ejector_keypoints_count: int = 0
    extractor_keypoints_count: int = 0
    firing_pin_keypoints_count: int = 0
    primer_center_x: Optional[float] = None
    primer_center_y: Optional[float] = None
    primer_radius: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CartridgeComparisonResponse(BaseModel):
    id: int
    query_image_id: int
    sample_id: Optional[int] = None
    sample_image_id: Optional[int] = None
    overall_similarity: Optional[float] = None
    primer_similarity: Optional[float] = None
    ejector_similarity: Optional[float] = None
    extractor_similarity: Optional[float] = None
    firing_pin_similarity: Optional[float] = None
    inlier_count: int = 0
    outlier_count: int = 0
    comparison_status: str = "pending"
    case_number: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComparisonResult(BaseModel):
    comparison_id: int
    sample_id: Optional[int] = None
    sample_name: Optional[str] = None
    overall_similarity: float
    primer_similarity: Optional[float] = None
    ejector_similarity: Optional[float] = None
    extractor_similarity: Optional[float] = None
    inlier_count: int
    matched_points: Optional[List[MatchedPoint]] = None
    rank: int
    confidence: str

class ComparisonResponse(BaseModel):
    query_image_id: int
    total_samples: int
    top_n: int
    results: List[ComparisonResult]
    comparison_time: Optional[float] = None

class SampleListResponse(BaseModel):
    total: int
    samples: List[FirearmSampleResponse]

class ImageListResponse(BaseModel):
    total: int
    images: List[CartridgeImageResponse]
