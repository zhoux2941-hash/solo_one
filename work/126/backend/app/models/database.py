from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship, DeclarativeBase
from datetime import datetime

class Base(DeclarativeBase):
    pass

class PointCloudData(Base):
    __tablename__ = "point_cloud_data"
    
    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(10), nullable=False)
    upload_time = Column(DateTime, default=datetime.utcnow)
    point_count = Column(Integer, default=0)
    bounds_min = Column(JSON)
    bounds_max = Column(JSON)
    processed = Column(Boolean, default=False)
    
    analyses = relationship("BallisticAnalysis", back_populates="point_cloud")

class BulletHole(Base):
    __tablename__ = "bullet_holes"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("ballistic_analyses.id"))
    position_x = Column(Float, nullable=False)
    position_y = Column(Float, nullable=False)
    position_z = Column(Float, nullable=False)
    normal_x = Column(Float)
    normal_y = Column(Float)
    normal_z = Column(Float)
    hole_type = Column(String(20))
    confidence = Column(Float, default=1.0)
    is_manual = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    analysis = relationship("BallisticAnalysis", back_populates="bullet_holes")

class BallisticAnalysis(Base):
    __tablename__ = "ballistic_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    point_cloud_id = Column(Integer, ForeignKey("point_cloud_data.id"))
    case_number = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    weapon_type = Column(String(100))
    initial_velocity_min = Column(Float)
    initial_velocity_max = Column(Float)
    bullet_mass = Column(Float)
    drag_coefficient = Column(Float)
    bullet_diameter = Column(Float)
    
    temperature = Column(Float, default=20.0)
    altitude = Column(Float, default=0.0)
    humidity = Column(Float, default=50.0)
    pressure = Column(Float)
    air_density = Column(Float)
    
    shooter_position = Column(JSON)
    trajectory_data = Column(JSON)
    probability_cone = Column(JSON)
    analysis_status = Column(String(20), default="pending")
    
    point_cloud = relationship("PointCloudData", back_populates="analyses")
    bullet_holes = relationship("BulletHole", back_populates="analysis")
    reports = relationship("CaseReport", back_populates="analysis")

class CaseReport(Base):
    __tablename__ = "case_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("ballistic_analyses.id"))
    report_path = Column(String(500), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    report_format = Column(String(10), default="pdf")
    
    analysis = relationship("BallisticAnalysis", back_populates="reports")

class ChunkedUpload(Base):
    __tablename__ = "chunked_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(String(64), unique=True, index=True, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)
    total_size = Column(Integer, nullable=False)
    total_chunks = Column(Integer, nullable=False)
    uploaded_chunks = Column(Integer, default=0)
    chunk_size = Column(Integer, nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    temp_dir = Column(String(500), nullable=False)

class PointCloudLOD(Base):
    __tablename__ = "point_cloud_lods"
    
    id = Column(Integer, primary_key=True, index=True)
    point_cloud_id = Column(Integer, ForeignKey("point_cloud_data.id"))
    lod_level = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)
    point_count = Column(Integer, nullable=False)
    voxel_size = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class FirearmSample(Base):
    __tablename__ = "firearm_samples"
    
    id = Column(Integer, primary_key=True, index=True)
    sample_name = Column(String(100), nullable=False)
    firearm_type = Column(String(50), nullable=False)
    manufacturer = Column(String(100))
    model = Column(String(100))
    serial_number = Column(String(50))
    caliber = Column(String(20))
    description = Column(Text)
    case_number = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    images = relationship("CartridgeImage", back_populates="sample")
    comparisons = relationship("CartridgeComparison", back_populates="sample")

class CartridgeImage(Base):
    __tablename__ = "cartridge_images"
    
    id = Column(Integer, primary_key=True, index=True)
    sample_id = Column(Integer, ForeignKey("firearm_samples.id"), nullable=True)
    image_path = Column(String(500), nullable=False)
    thumbnail_path = Column(String(500))
    image_type = Column(String(20), default="unknown")
    image_hash = Column(String(64))
    
    width = Column(Integer)
    height = Column(Integer)
    file_size = Column(Integer)
    
    primer_region = Column(JSON)
    ejector_mark_region = Column(JSON)
    extractor_mark_region = Column(JSON)
    firing_pin_hole_region = Column(JSON)
    
    has_features = Column(Boolean, default=False)
    feature_extraction_error = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sample = relationship("FirearmSample", back_populates="images")
    features = relationship("CartridgeFeatures", uselist=False, back_populates="image")
    query_comparisons = relationship("CartridgeComparison", foreign_keys="CartridgeComparison.query_image_id", back_populates="query_image")

class CartridgeFeatures(Base):
    __tablename__ = "cartridge_features"
    
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("cartridge_images.id"), unique=True, nullable=False)
    
    primer_descriptor_path = Column(String(500))
    ejector_descriptor_path = Column(String(500))
    extractor_descriptor_path = Column(String(500))
    firing_pin_descriptor_path = Column(String(500))
    
    primer_keypoints_count = Column(Integer, default=0)
    ejector_keypoints_count = Column(Integer, default=0)
    extractor_keypoints_count = Column(Integer, default=0)
    firing_pin_keypoints_count = Column(Integer, default=0)
    
    primer_center_x = Column(Float)
    primer_center_y = Column(Float)
    primer_radius = Column(Float)
    
    ejector_center_x = Column(Float)
    ejector_center_y = Column(Float)
    ejector_angle = Column(Float)
    
    extractor_center_x = Column(Float)
    extractor_center_y = Column(Float)
    extractor_angle = Column(Float)
    
    firing_pin_center_x = Column(Float)
    firing_pin_center_y = Column(Float)
    firing_pin_radius = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    image = relationship("CartridgeImage", back_populates="features")

class CartridgeComparison(Base):
    __tablename__ = "cartridge_comparisons"
    
    id = Column(Integer, primary_key=True, index=True)
    query_image_id = Column(Integer, ForeignKey("cartridge_images.id"), nullable=False)
    sample_id = Column(Integer, ForeignKey("firearm_samples.id"), nullable=True)
    sample_image_id = Column(Integer, ForeignKey("cartridge_images.id"), nullable=True)
    
    overall_similarity = Column(Float)
    primer_similarity = Column(Float)
    ejector_similarity = Column(Float)
    extractor_similarity = Column(Float)
    firing_pin_similarity = Column(Float)
    
    matched_points = Column(JSON)
    inlier_count = Column(Integer, default=0)
    outlier_count = Column(Integer, default=0)
    homography_matrix = Column(JSON)
    
    comparison_status = Column(String(20), default="pending")
    error_message = Column(Text)
    
    case_number = Column(String(50))
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    query_image = relationship("CartridgeImage", foreign_keys=[query_image_id], back_populates="query_comparisons")
    sample = relationship("FirearmSample", back_populates="comparisons")
