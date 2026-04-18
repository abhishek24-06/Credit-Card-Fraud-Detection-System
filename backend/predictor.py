import joblib
import numpy as np
import pandas as pd
from pathlib import Path

MODEL_PATH = Path(__file__).parent / "model" / "fraud_model_random_forest.pkl"
SCALER_PATH = Path(__file__).parent / "model" / "robust_scaler.pkl"

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

FEATURE_COLS = [f"V{i}" for i in range(1, 29)] + ["Amount_scaled", "Time_scaled"]


def preprocess(data: dict) -> pd.DataFrame:
    """Preprocess a single transaction dict into model-ready DataFrame."""
    df = pd.DataFrame([data])
    # Scale Amount and Time using the fitted RobustScaler
    amount_scaled = scaler.transform(df[["Amount"]].values.reshape(-1, 1))
    time_scaled = scaler.transform(df[["Time"]].values.reshape(-1, 1))
    df["Amount_scaled"] = amount_scaled.flatten()
    df["Time_scaled"] = time_scaled.flatten()
    df = df.drop(columns=["Amount", "Time"], errors="ignore")
    return df[FEATURE_COLS]


def predict(data: dict, threshold: float = 0.5) -> dict:
    """Run prediction on a single transaction."""
    X = preprocess(data)
    prob = float(model.predict_proba(X)[0][1])
    pred = int(prob >= threshold)
    risk = "HIGH" if prob > 0.7 else "MEDIUM" if prob > 0.3 else "LOW"
    return {
        "fraud_probability": round(prob, 4),
        "is_fraud": pred,
        "risk_level": risk,
        "threshold_used": threshold,
    }
