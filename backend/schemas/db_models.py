from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class FileMetadata(BaseModel):
    file_name: str
    file_size: int
    content_type: str
    upload_time: datetime = Field(default_factory=datetime.utcnow)
    columns: List[Dict[str, Any]] = []
    row_count: int = 0
    preprocessing_history: List[Dict[str, Any]] = []

class AnalysisLog(BaseModel):
    file_id: str
    analysis_type: str # 'eda', 'forecast', 'preprocess'
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    config_used: Dict[str, Any] = {}
    summary_results: Dict[str, Any] = {}
