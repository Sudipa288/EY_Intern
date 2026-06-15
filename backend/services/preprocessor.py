import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from typing import Dict, List, Any


class Preprocessor:
    """Handles data preprocessing and cleaning"""
    
    def __init__(self):
        self.filled_count = 0
        self.scaled_columns = []
    
    def preprocess(
        self,
        df: pd.DataFrame,
        column_updates: Dict[str, str],
        handle_missing: str,
        scaling: bool,
        selected_columns: List[str]
    ) -> pd.DataFrame:
        """Preprocess dataframe"""
        
        # Create a copy
        df = df.copy()
        
        # Select columns
        if selected_columns:
            df = df[selected_columns]
        
        # Reset counters
        self.filled_count = 0
        self.scaled_columns = []
        
        # Handle missing values
        df = self._handle_missing_values(df, handle_missing)
        
        # Apply scaling if needed
        if scaling:
            df = self._scale_numeric_columns(df)
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        return df
    
    def _handle_missing_values(self, df: pd.DataFrame, strategy: str) -> pd.DataFrame:
        """Handle missing values based on strategy"""
        
        if strategy == "drop":
            initial_rows = len(df)
            df = df.dropna()
            self.filled_count = initial_rows - len(df)
            
        elif strategy == "mean":
            for col in df.select_dtypes(include=[np.number]).columns:
                if df[col].isna().any():
                    fill_value = df[col].mean()
                    df[col].fillna(fill_value, inplace=True)
                    self.filled_count += df[col].isna().sum()
                    
        elif strategy == "median":
            for col in df.select_dtypes(include=[np.number]).columns:
                if df[col].isna().any():
                    fill_value = df[col].median()
                    df[col].fillna(fill_value, inplace=True)
                    self.filled_count += df[col].isna().sum()
                    
        elif strategy == "forward_fill":
            df = df.fillna(method='ffill')
            self.filled_count = df.isna().sum().sum()
        
        return df
    
    def _scale_numeric_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Scale numeric columns to 0-1 range"""
        
        scaler = MinMaxScaler()
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            df[col] = scaler.fit_transform(df[[col]])
            self.scaled_columns.append(col)
        
        return df
