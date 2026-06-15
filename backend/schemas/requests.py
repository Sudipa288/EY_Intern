from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class PreprocessConfig(BaseModel):
    columnUpdates: Dict[str, str]
    handleMissing: str  # 'drop', 'mean', 'median', 'forward_fill'
    scaling: bool
    selectedColumns: List[str]


class PreprocessRequest(BaseModel):
    fileId: Optional[str] = None
    data: List[Dict[str, Any]]
    config: PreprocessConfig


class EDARequest(BaseModel):
    fileId: Optional[str] = None
    data: List[Dict[str, Any]]
    selectedGraphs: List[str]
    config: Dict[str, Any]


class ForecastConfig(BaseModel):
    targetColumn: str
    models: List[str]  # ['arima', 'prophet', 'lstm', 'xgboost', 'random_forest', 'ets']
    trainTestSplit: float
    forecastHorizon: int
    seasonality: int


class ForecastRequest(BaseModel):
    fileId: Optional[str] = None
    sessionId: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    testData: Optional[List[Dict[str, Any]]] = None
    config: ForecastConfig
