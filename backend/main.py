from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import Transaction
from predictor import predict
import pandas as pd
import io

# App Config

app = FastAPI(
    title="Credit Card Fraud Detection API",
    description="Real-time fraud detection powered by LightGBM with threshold tuning",
    version="2.0.0",
)

# CORS (Allow all for now)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory transaction log
transaction_log = []

# Root Endpoint
@app.get("/")
def root():
    return {
        "status": "ok",
        "model": "LightGBM",
        "version": "2.0.0"
    }

# Single Prediction
@app.post("/predict")
def predict_single(tx: Transaction):
    data = tx.model_dump()

    # ✅ No manual threshold (uses saved config internally)
    result = predict(data)

    # Store transaction
    entry = {**data, **result, "id": len(transaction_log) + 1}
    transaction_log.append(entry)

    return result

# Batch Prediction (CSV Upload)
@app.post("/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    content = await file.read()

    # Validate file type
    if file.content_type not in ["text/csv", "application/vnd.ms-excel", "text/plain", "application/octet-stream"]:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {file.content_type}")

    try:
        # Parse CSV
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        print(f"CSV Parsing Error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")

    results = []

    for _, row in df.iterrows():
        row_dict = row.to_dict()

        # ✅ No threshold override
        res = predict(row_dict)

        results.append(res)

        entry = {**row_dict, **res, "id": len(transaction_log) + 1}
        transaction_log.append(entry)

    return {
        "total": len(results),
        "fraud_count": sum(r["is_fraud"] for r in results),
        "results": results,
    }

# Stats Endpoint
@app.get("/stats")
def get_stats():
    total = len(transaction_log)
    frauds = sum(1 for t in transaction_log if t.get("is_fraud"))

    return {
        "total_analyzed": total,
        "fraud_detected": frauds,
        "legit_count": total - frauds,
        "fraud_rate": round((frauds / total) * 100, 2) if total else 0,
        "recent": transaction_log[-10:][::-1],
    }

# Health Check
@app.get("/health")
def health():
    return {"status": "healthy"}