import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple


class EDAGenerator:
    """Generates EDA visualizations and statistical summaries"""
    
    def generate(
        self,
        df: pd.DataFrame,
        selected_graphs: List[str],
        config: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], Dict[str, Any], List[str]]:
        """Generate EDA visualizations and statistics"""
        
        graphs = {}
        statistics = {}
        insights = []
        
        for graph_type in selected_graphs:
            if graph_type == "distribution":
                graphs["distribution"] = self._generate_distribution(df)
                insights.append("Distribution analysis completed")
                
            elif graph_type == "correlation":
                graphs["correlation"] = self._generate_correlation(df)
                insights.append("Correlation matrix generated")
                
            elif graph_type == "box_plot":
                graphs["box_plot"] = self._generate_box_plot(df)
                insights.append("Box plot analysis completed")
                
            elif graph_type == "time_series":
                graphs["time_series"] = self._generate_time_series(df)
                insights.append("Time series visualization generated")
                
            elif graph_type == "scatter":
                graphs["scatter"] = self._generate_scatter(df)
                insights.append("Scatter plot analysis completed")
                
            elif graph_type == "heatmap":
                graphs["heatmap"] = self._generate_heatmap(df)
                insights.append("Heatmap generated")
                
            elif graph_type == "histogram":
                graphs["histogram"] = self._generate_histogram(df)
                insights.append("Histogram analysis completed")
                
            elif graph_type == "statistics":
                graphs["statistics"] = self._generate_statistics(df)
                insights.append("Statistical summary generated")
        
        # Generate overall statistics
        statistics = self._generate_overall_statistics(df)
        
        return graphs, statistics, insights
    
    def _generate_distribution(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate distribution analysis"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        distribution_data = {}
        for col in numeric_cols[:3]:  # Limit to 3 columns
            distribution_data[col] = df[col].describe().to_dict()
        
        return {
            "type": "distribution",
            "data": distribution_data,
            "numeric_columns": numeric_cols
        }
    
    def _generate_correlation(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate correlation matrix"""
        numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            return {"type": "correlation", "data": {}, "message": "No numeric columns"}
        
        corr_matrix = numeric_df.corr()
        
        return {
            "type": "correlation",
            "data": corr_matrix.to_dict(),
            "high_correlations": self._find_high_correlations(corr_matrix)
        }
    
    def _generate_box_plot(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate box plot data"""
        numeric_df = df.select_dtypes(include=[np.number])
        
        box_data = {}
        for col in numeric_df.columns[:5]:  # Limit to 5 columns
            box_data[col] = {
                "q1": float(numeric_df[col].quantile(0.25)),
                "median": float(numeric_df[col].median()),
                "q3": float(numeric_df[col].quantile(0.75)),
                "min": float(numeric_df[col].min()),
                "max": float(numeric_df[col].max()),
            }
        
        return {"type": "box_plot", "data": box_data}
    
    def _generate_time_series(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate time series data"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        if not numeric_cols:
            return {"type": "time_series", "data": {}, "message": "No numeric columns"}
        
        # Use first numeric column
        col = numeric_cols[0]
        time_series_data = df[col].head(100).to_dict()
        
        return {
            "type": "time_series",
            "column": col,
            "data": time_series_data
        }
    
    def _generate_scatter(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate scatter plot data"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        if len(numeric_cols) < 2:
            return {"type": "scatter", "data": {}, "message": "Need at least 2 numeric columns"}
        
        scatter_data = df[[numeric_cols[0], numeric_cols[1]]].head(200).to_dict('records')
        
        return {
            "type": "scatter",
            "x_column": numeric_cols[0],
            "y_column": numeric_cols[1],
            "data": scatter_data
        }
    
    def _generate_heatmap(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate heatmap data"""
        numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            return {"type": "heatmap", "data": {}, "message": "No numeric columns"}
        
        # Sample if too large
        sample_size = min(100, len(numeric_df))
        heatmap_data = numeric_df.sample(n=sample_size).corr()
        
        return {
            "type": "heatmap",
            "data": heatmap_data.to_dict(),
            "columns": numeric_df.columns.tolist()
        }
    
    def _generate_histogram(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate histogram data"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        if not numeric_cols:
            return {"type": "histogram", "data": {}, "message": "No numeric columns"}
        
        col = numeric_cols[0]
        hist, bins = np.histogram(df[col].dropna(), bins=20)
        
        return {
            "type": "histogram",
            "column": col,
            "counts": hist.tolist(),
            "bins": bins.tolist()
        }
    
    def _generate_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate statistical summary"""
        numeric_df = df.select_dtypes(include=[np.number])
        
        return {
            "type": "statistics",
            "data": numeric_df.describe().to_dict(),
            "shape": {"rows": len(df), "columns": len(df.columns)},
            "missing_values": df.isnull().sum().to_dict()
        }
    
    def _generate_overall_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate overall statistics"""
        return {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "numeric_columns": len(df.select_dtypes(include=[np.number]).columns),
            "categorical_columns": len(df.select_dtypes(include=['object']).columns),
            "missing_values_percent": (df.isnull().sum().sum() / (len(df) * len(df.columns)) * 100)
        }
    
    def _find_high_correlations(self, corr_matrix: pd.DataFrame, threshold: float = 0.7) -> Dict[str, float]:
        """Find high correlations in correlation matrix"""
        high_corr = {}
        
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                if abs(corr_matrix.iloc[i, j]) > threshold:
                    key = f"{corr_matrix.columns[i]} vs {corr_matrix.columns[j]}"
                    high_corr[key] = float(corr_matrix.iloc[i, j])
        
        return high_corr
