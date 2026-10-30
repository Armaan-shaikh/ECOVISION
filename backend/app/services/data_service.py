import numpy as np
import pandas as pd

class EnvironmentalDataService:
    """Service handling data processing, aggregations, and rolling calculations with Pandas and NumPy."""
    
    @staticmethod
    def calculate_air_quality_stats(df: pd.DataFrame) -> dict:
        """Compute statistical summary for air quality series."""
        if df.empty:
            return {}
        return {
            "mean_aqi": float(df["aqi"].mean()),
            "median_aqi": float(df["aqi"].median()),
            "std_aqi": float(df["aqi"].std()) if len(df) > 1 else 0.0,
            "max_pm25": float(df["pm25"].max()),
            "min_pm25": float(df["pm25"].min()),
            "record_count": int(len(df))
        }

    @staticmethod
    def detect_anomalies_zscore(values: list[float], threshold: float = 2.5) -> list[bool]:
        """Detect environmental outliers using NumPy Z-score calculation."""
        arr = np.array(values, dtype=float)
        if len(arr) < 3:
            return [False] * len(arr)
        mean = np.mean(arr)
        std = np.std(arr)
        if std == 0:
            return [False] * len(arr)
        z_scores = np.abs((arr - mean) / std)
        return (z_scores > threshold).tolist()

