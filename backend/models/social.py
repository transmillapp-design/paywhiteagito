from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

class VideoType(str, Enum):
    FREE = "free"  # 7-30s
    PAID = "paid"  # 30-60s

class VideoPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_type: str  # "cliente", "lojista", "service_provider"
    video_data: str  # Base64 encoded video
    duration: int  # Duration in seconds
    video_type: VideoType
    description: Optional[str] = None
    hashtags: List[str] = []
    
    # Lojista specific
    product_id: Optional[str] = None
    store_link: Optional[str] = None
    
    # Prestador specific
    service_id: Optional[str] = None
    booking_link: Optional[str] = None
    
    # Stats
    views_count: int = 0
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    
    # Points awarded
    points_awarded: int = 0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class VideoLike(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VideoComment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    comment_text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VideoView(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_id: str
    user_id: str
    watch_duration: int  # Seconds watched
    completed: bool = False  # Watched until end
    points_awarded: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SocialSettings(BaseModel):
    # Monetization settings
    free_video_min_duration: int = 7  # seconds
    free_video_max_duration: int = 30  # seconds
    paid_video_min_duration: int = 30  # seconds
    paid_video_max_duration: int = 60  # seconds
    paid_video_price: float = 5.00  # BRL per video
    
    # Points system
    points_per_post: int = 50
    points_per_like: int = 5
    points_per_comment: int = 10
    points_per_view: int = 2  # For viewers
    points_per_full_view: int = 5  # Bonus for watching until end
    
    # Conversion
    points_to_brl_rate: float = 0.01  # 100 points = R$ 1.00
    
    # Master control
    social_enabled: bool = True
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Request/Response models
class CreateVideoRequest(BaseModel):
    video_data: str
    duration: int
    description: Optional[str] = None
    hashtags: List[str] = []
    product_id: Optional[str] = None
    service_id: Optional[str] = None

class LikeVideoRequest(BaseModel):
    video_id: str

class CommentVideoRequest(BaseModel):
    video_id: str
    comment_text: str

class ViewVideoRequest(BaseModel):
    video_id: str
    watch_duration: int
    completed: bool = False

class UpdateSocialSettingsRequest(BaseModel):
    free_video_max_duration: Optional[int] = None
    paid_video_min_duration: Optional[int] = None
    paid_video_max_duration: Optional[int] = None
    paid_video_price: Optional[float] = None
    points_per_post: Optional[int] = None
    points_per_like: Optional[int] = None
    points_per_comment: Optional[int] = None
    points_per_view: Optional[int] = None
    points_per_full_view: Optional[int] = None
    points_to_brl_rate: Optional[float] = None
    social_enabled: Optional[bool] = None
