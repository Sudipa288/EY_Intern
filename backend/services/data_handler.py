import pandas as pd
import numpy as np
from typing import Dict, List, Any


class DataHandler:
    """Handles initial data analysis and type inference"""
    
    def analyze_dataframe(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze dataframe and return metadata"""
        
        columns = []
        for col in df.columns:
            col_data = df[col]
            
            # Infer data type
            inferred_type = self._infer_type(col_data)
            
            # Count null values
            null_count = int(col_data.isna().sum())
            nullable = null_count > 0
            
            # Count unique values
            unique_count = int(col_data.nunique())
            
            columns.append({
                "name": col,
                "type": inferred_type,
                "nullable": nullable,
                "nullCount": null_count,
                "uniqueCount": unique_count
            })
        
        # Pre-calculate row and column-level metrics
        row_count = len(df)
        completely_null_row_count = int(df.isna().all(axis=1).sum()) if row_count > 0 else 0
        completely_null_col_count = sum(1 for c in columns if c["nullCount"] == row_count) if row_count > 0 else 0
        
        # Safely extract the first row for front-end debugging/preview
        first_row = {}
        if row_count > 0:
            try:
                first_row = df.iloc[0].replace({np.nan: None}).to_dict()
                first_row = {str(k): v for k, v in first_row.items()}
            except Exception as e:
                print(f"Error extracting first row for preview: {e}")
        
        return {
            "columns": columns,
            "data": [], # Leave empty to avoid massive memory/cpu usage during upload
            "rowCount": row_count,
            "completelyNullRowCount": completely_null_row_count,
            "completelyNullColCount": completely_null_col_count,
            "firstRow": first_row
        }
    
    def _infer_type(self, series: pd.Series) -> str:
        """Infer the data type of a series"""
        
        # Remove null values for type checking
        non_null = series.dropna()
        
        if len(non_null) == 0:
            return "string"
        
        # Check for boolean
        if series.dtype == bool or set(non_null.unique()) <= {0, 1, True, False}:
            return "boolean"
        
        # Check for integer
        if pd.api.types.is_integer_dtype(series):
            return "integer"
        
        # Check for float
        if pd.api.types.is_float_dtype(series):
            return "float"
        
        # Check for datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"
        
        # Check if numeric string
        try:
            pd.to_numeric(series)
            return "float"
        except:
            pass
        
        # Check for categorical (low cardinality)
        if len(non_null.unique()) / len(non_null) < 0.05:
            return "categorical"
        
        # Default to string
        return "string"
