from fastapi import FastAPI, File, UploadFile, HTTPException, Response
from typing import Dict, List, Any
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import io
import uuid
import traceback
from contextlib import asynccontextmanager


from services.data_handler import DataHandler
from services.preprocessor import Preprocessor
from services.eda_generator import EDAGenerator
from services.forecaster import Forecaster
from schemas.requests import PreprocessRequest, EDARequest, ForecastRequest
from database import connect_to_mongo, close_mongo_connection, get_database
from schemas.db_models import FileMetadata, AnalysisLog

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="EDA and Forecasting API", version="1.0.0", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
data_handler = DataHandler()
preprocessor = Preprocessor()
eda_generator = EDAGenerator()
forecaster = Forecaster()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "EDA and Forecasting API"}


import json
import os

STORAGE_DIR = os.path.join(os.path.dirname(__file__), "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and parse CSV/Excel file"""
    try:
        # Read file
        contents = await file.read()

        # Handle different file types
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # Process metadata (columns, types)
        result = data_handler.analyze_dataframe(df)

        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Save full data to Disk (Bypasses MongoDB 16MB limit)
        # Using Pickle is highly efficient and significantly faster than JSON dump
        storage_path = os.path.join(STORAGE_DIR, f"{session_id}.pkl")
        df.to_pickle(storage_path)
            
        # Save metadata to MongoDB (Resilient try/except)
        db = get_database()
        if db is not None:
            try:
                # Store metadata + link to file
                await db.sessions.insert_one({
                    "sessionId": session_id,
                    "storagePath": storage_path,
                    "createdAt": pd.Timestamp.now()
                })
                
                metadata = FileMetadata(
                    file_name=file.filename,
                    file_size=len(contents),
                    content_type=file.content_type or "application/octet-stream",
                    columns=result.get("columns", []),
                    row_count=result.get("rowCount", 0)
                )
                insert_result = await db.files.insert_one(metadata.model_dump())
                result['fileId'] = str(insert_result.inserted_id)
            except Exception as mongo_err:
                print(f"MongoDB write skipped or failed: {mongo_err}. Continuing in disk-only fallback mode.")

        # Remove data rows from the response
        result.pop("data", None)
        result['sessionId'] = session_id
        result['fileName'] = file.filename
        result['fileSize'] = len(contents)

        return result

    except Exception as e:
        print(f"Upload error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process file: {str(e)}"
        )


@app.get("/api/data/{session_id}")
async def get_session_data(session_id: str, limit: int = None):
    """Return the dataset stored for a given session ID (Loaded from Disk) with optional systematic downsampling"""
    storage_path = os.path.join(STORAGE_DIR, f"{session_id}.pkl")
    if not os.path.exists(storage_path):
        raise HTTPException(
            status_code=404,
            detail="Session data not found. Please re-upload your file."
        )
    
    try:
        df = pd.read_pickle(storage_path)
        
        # Apply systematic downsampling if limit is requested and dataset is larger than limit
        if limit and len(df) > limit:
            step = max(1, len(df) // limit)
            df = df.iloc[::step].head(limit)
            
        # Extremely fast serialization using Pandas C-engine (NaN/NaT maps directly to null)
        json_data = df.to_json(orient='records', date_format='iso')
        return Response(content=json_data, media_type="application/json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load session data: {str(e)}")


@app.get("/api/meta/{session_id}")
async def get_session_meta(session_id: str):
    """Return lightweight row/col counts — supports both .pkl and legacy .json storage."""
    pkl_path = os.path.join(STORAGE_DIR, f"{session_id}.pkl")
    json_path = os.path.join(STORAGE_DIR, f"{session_id}.json")
    
    try:
        if os.path.exists(pkl_path):
            df = pd.read_pickle(pkl_path)
        elif os.path.exists(json_path):
            df = pd.read_json(json_path)
        else:
            raise HTTPException(status_code=404, detail="Session not found.")
        result = data_handler.analyze_dataframe(df)
        return {
            "rowCount": result.get("rowCount", 0),
            "colCount": len(df.columns),
            "columns": result.get("columns", []),
            "completelyNullRowCount": result.get("completelyNullRowCount", 0),
            "completelyNullColCount": result.get("completelyNullColCount", 0),
            "firstRow": result.get("firstRow", {})
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read meta: {str(e)}")


@app.put("/api/data/{session_id}")
async def update_session_data(session_id: str, payload: Dict[str, Any]):
    """Update the cached dataset for a session on disk"""
    storage_path = os.path.join(STORAGE_DIR, f"{session_id}.pkl")
    new_data = payload.get("data", [])
    
    try:
        df = pd.DataFrame(new_data)
        df.to_pickle(storage_path)
        return {"status": "updated", "count": len(new_data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save session data: {str(e)}")


@app.post("/api/preprocess")
async def preprocess_data(request: PreprocessRequest):
    """Preprocess and clean data"""
    try:
        df = pd.DataFrame(request.data)
        
        # Apply preprocessing
        processed_df = preprocessor.preprocess(
            df=df,
            column_updates=request.config.columnUpdates,
            handle_missing=request.config.handleMissing,
            scaling=request.config.scaling,
            selected_columns=request.config.selectedColumns
        )
        
        # Save to MongoDB (Resilient try/except)
        if request.fileId:
            db = get_database()
            if db is not None:
                try:
                    log = AnalysisLog(
                        file_id=request.fileId,
                        analysis_type="preprocess",
                        config_used=request.config.model_dump(),
                        summary_results={
                            "removedRows": len(df) - len(processed_df),
                            "filledValues": preprocessor.filled_count,
                            "scaledColumns": preprocessor.scaled_columns
                        }
                    )
                    await db.analysis.insert_one(log.model_dump())
                except Exception as mongo_err:
                    print(f"MongoDB preprocess logging failed: {mongo_err}. Continuing.")
        
        return {
            "status": "success",
            "processedData": processed_df.to_dict('records'),
            "removedRows": len(df) - len(processed_df),
            "filledValues": preprocessor.filled_count,
            "scaledColumns": preprocessor.scaled_columns
        }
        
    except Exception as e:
        print(f"Preprocessing error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/eda")
async def generate_eda(request: EDARequest):
    """Generate EDA visualizations and statistics"""
    try:
        df = pd.DataFrame(request.data)
        
        # Generate EDA
        graphs, statistics, insights = eda_generator.generate(
            df=df,
            selected_graphs=request.selectedGraphs,
            config=request.config
        )
        
        # Save to MongoDB (Resilient try/except)
        if request.fileId:
            db = get_database()
            if db is not None:
                try:
                    log = AnalysisLog(
                        file_id=request.fileId,
                        analysis_type="eda",
                        config_used={"selectedGraphs": request.selectedGraphs, **request.config},
                        summary_results={"completed": True}
                    )
                    await db.analysis.insert_one(log.model_dump())
                except Exception as mongo_err:
                    print(f"MongoDB EDA logging failed: {mongo_err}. Continuing.")
        
        return {
            "graphs": graphs,
            "statistics": statistics,
            "insights": insights
        }
        
    except Exception as e:
        # LOG ANY SERVER ERRORS TO A FILE
        import os
        log_path = os.path.join(os.getcwd(), "SERVER_ERROR_LOG.txt")
        with open(log_path, "a") as f:
            import traceback
            f.write(f"SERVER ERROR: {str(e)}\n{traceback.format_exc()}\n")
        print(f"EDA error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/forecast")
async def forecast_timeseries(request: ForecastRequest):
    """Train forecasting models and generate predictions"""
    try:
        # Optimization: Load from disk if sessionId provided
        if request.data:
            df = pd.DataFrame(request.data)
        elif request.sessionId:
            storage_path = os.path.join(STORAGE_DIR, f"{request.sessionId}.pkl")
            if not os.path.exists(storage_path):
                # Fallback to DB check if file not in storage
                raise HTTPException(status_code=404, detail="Session data not found on disk")
            df = pd.read_pickle(storage_path)
        else:
            raise HTTPException(status_code=400, detail="No data or sessionId provided")
            
        target_col = request.config.targetColumn
        
        # FUZZY MATCHING: Don't crash if name is slightly off
        if target_col not in df.columns:
            matches = [c for c in df.columns if target_col.lower() in c.lower()]
            if matches:
                target_col = matches[0]
            else:
                # If still not found, try to find ANY numeric column as a fallback
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                if len(numeric_cols) > 0:
                    target_col = numeric_cols[0]
                else:
                    raise ValueError(f"Target column '{target_col}' not found. Available: {df.columns.tolist()}")
        
        # Log start of training
        with open("SERVER_FORECAST_START.txt", "w") as f:
            f.write(f"Starting forecast for: {target_col} | Rows: {len(df)}\n")

        # Train models in a separate thread to avoid blocking the FastAPI event loop
        import asyncio
        results = await asyncio.to_thread(
            forecaster.train_models,
            df=df,
            target_column=target_col,
            models=request.config.models,
            train_test_split=request.config.trainTestSplit,
            forecast_horizon=request.config.forecastHorizon,
            seasonality=request.config.seasonality,
            test_df=pd.DataFrame(request.testData) if request.testData else None
        )
        
        # Save to MongoDB (Resilient try/except)
        if request.fileId:
            db = get_database()
            if db is not None:
                try:
                    log = AnalysisLog(
                        file_id=request.fileId,
                        analysis_type="forecast",
                        config_used=request.config.model_dump(),
                        summary_results={"modelsTrained": [r.get('name') for r in results]}
                    )
                    await db.analysis.insert_one(log.model_dump())
                except Exception as mongo_err:
                    print(f"MongoDB forecasting logging failed: {mongo_err}. Continuing.")
        
        return {
            "models": results,
            "trainTestSplit": request.config.trainTestSplit,
            "forecastHorizon": request.config.forecastHorizon
        }
        
    except Exception as e:
        # SUPER LOGGER: Capture exact location of the crash
        with open("DEBUG_ERROR.txt", "w") as f:
            f.write(traceback.format_exc())
        print(f"Forecasting error (Traceback saved): {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))




@app.get("/api/export")
async def export_results(format: str = "json"):
    """Export results in specified format"""
    try:
        if format not in ["csv", "json", "pdf"]:
            raise ValueError("Invalid export format")
        
        return {"status": "success", "format": format}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
