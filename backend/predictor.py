import joblib
import numpy as np
import pandas as pd
import json
from pathlib import Path

# Paths
BASE_PATH = Path(__file__).parent / "model"

MODEL_PATH = BASE_PATH / "fraud_model_lightgbm.pkl"
AMOUNT_SCALER_PATH = BASE_PATH / "amount_scaler.pkl"
TIME_SCALER_PATH   = BASE_PATH / "time_scaler.pkl"
THRESHOLD_PATH     = BASE_PATH / "threshold_config.json"
# MODEL_PATH = BASE_PATH / "fraud_model_random_forest.pkl"
# AMOUNT_SCALER_PATH = BASE_PATH / "amount_scaler_random.pkl"
# TIME_SCALER_PATH   = BASE_PATH / "time_scaler_random.pkl"
# THRESHOLD_PATH     = BASE_PATH / "threshold_config_random.json"

# Load artifacts
model = joblib.load(MODEL_PATH)
amount_scaler = joblib.load(AMOUNT_SCALER_PATH)
time_scaler   = joblib.load(TIME_SCALER_PATH)

with open(THRESHOLD_PATH) as f:
    threshold = json.load(f)["threshold"]

FEATURE_COLS = [f"V{i}" for i in range(1, 29)] + ["Amount_scaled", "Time_scaled"]

# Preprocessing
def preprocess(data: dict) -> pd.DataFrame:
    df = pd.DataFrame([data])

    # ✅ Correct scaling
    df["Amount_scaled"] = amount_scaler.transform(df[["Amount"]]).flatten()
    df["Time_scaled"]   = time_scaler.transform(df[["Time"]]).flatten()

    # Remove raw columns
    df = df.drop(columns=["Amount", "Time"], errors="ignore")

    # Ensure correct order
    df = df[FEATURE_COLS]

    return df

# Prediction

def predict(data: dict) -> dict:
    X = preprocess(data)

    prob = float(model.predict_proba(X)[0][1])
    pred = int(prob >= threshold)

    # Risk categorization
    if prob > threshold:
        risk = "HIGH"
    elif prob >= threshold*0.5:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "fraud_probability": round(prob, 4),
        "is_fraud": pred,
        "risk_level": risk,
        "threshold_used": threshold
    }