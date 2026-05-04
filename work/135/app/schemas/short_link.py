from pydantic import BaseModel, Field, validator, HttpUrl
from typing import Optional, List
from datetime import datetime, timedelta
from enum import Enum


class ExpiryType(str, Enum):
    ABSOLUTE = "absolute"
    RELATIVE = "relative"
    NEVER = "never"


class ShortLinkCreate(BaseModel):
    original_url: str = Field(..., description="Original URL to shorten")
    custom_short_code: Optional[str] = Field(None, description="Custom short code (optional)", min_length=3, max_length=50)
    expiry_type: ExpiryType = Field(default=ExpiryType.NEVER, description="Expiry type")
    expiry_days: Optional[int] = Field(None, description="Number of days until expiry (for relative type)", ge=1)
    expires_at: Optional[datetime] = Field(None, description="Absolute expiry date and time")
    
    @validator('original_url')
    def validate_url(cls, v):
        if not v:
            raise ValueError('URL cannot be empty')
        if not (v.startswith('http://') or v.startswith('https://')):
            raise ValueError('URL must start with http:// or https://')
        return v
    
    @validator('expires_at')
    def validate_absolute_expiry(cls, v, values):
        if values.get('expiry_type') == ExpiryType.ABSOLUTE and v is None:
            raise ValueError('expires_at is required for absolute expiry type')
        if v and v < datetime.utcnow():
            raise ValueError('expires_at must be in the future')
        return v
    
    @validator('expiry_days')
    def validate_relative_expiry(cls, v, values):
        if values.get('expiry_type') == ExpiryType.RELATIVE and v is None:
            raise ValueError('expiry_days is required for relative expiry type')
        return v


class ShortLinkBatchCreate(BaseModel):
    original_url: str = Field(..., description="Original URL to shorten")
    custom_short_code: Optional[str] = Field(None, description="Custom short code (optional)")
    expiry_type: Optional[str] = Field(default="never", description="Expiry type")
    expiry_days: Optional[int] = Field(None, description="Days until expiry")
    expires_at: Optional[datetime] = Field(None, description="Absolute expiry time")


class ShortLinkResponse(BaseModel):
    id: int
    short_code: str
    custom_short_code: Optional[str]
    original_url: str
    short_url: str
    expires_at: Optional[datetime]
    created_at: datetime
    total_clicks: int
    is_active: str
    is_expired: bool
    
    class Config:
        from_attributes = True


class ShortLinkDetail(BaseModel):
    id: int
    short_code: str
    custom_short_code: Optional[str]
    original_url: str
    short_url: str
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    total_clicks: int
    is_active: str
    is_expired: bool
    
    class Config:
        from_attributes = True


class ClickStatistics(BaseModel):
    total_clicks: int
    unique_visitors: int
    device_distribution: dict
    browser_distribution: dict
    country_distribution: dict


class HourlyTrendItem(BaseModel):
    hour: str
    clicks: int


class DailyTrendItem(BaseModel):
    date: str
    clicks: int


class StatisticsResponse(BaseModel):
    short_link: ShortLinkResponse
    statistics: ClickStatistics
    hourly_trend: List[HourlyTrendItem]
    daily_trend: List[DailyTrendItem]


class BatchImportResult(BaseModel):
    success: int
    failed: int
    errors: List[dict]
    created_links: List[ShortLinkResponse]
