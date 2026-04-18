from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from schemas import Transaction
from predictor import predict
import pandas as pd
import io

app = FastAPI(
    title="Credit Card Fraud Detection API",
    description="Real-time fraud detection powered by Random Forest classifier",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory transaction log for stats/history
transaction_log = []


@app.get("/")
def root():
    return {"status": "ok", "model": "Random Forest", "version": "1.0.0"}


@app.post("/predict")
def predict_single(tx: Transaction):
    data = tx.model_dump()
    thresh = data.pop("threshold", 0.5)
    result = predict(data, threshold=thresh)
    entry = {**data, **result, "id": len(transaction_log) + 1}
    transaction_log.append(entry)
    return result


@app.post("/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))
    results = []
    for _, row in df.iterrows():
        row_dict = row.to_dict()
        thresh = row_dict.pop("threshold", 0.5)
        res = predict(row_dict, threshold=thresh)
        results.append(res)
        entry = {**row_dict, **res, "id": len(transaction_log) + 1}
        transaction_log.append(entry)
    return {
        "total": len(results),
        "fraud_count": sum(r["is_fraud"] for r in results),
        "results": results,
    }


@app.get("/stats")
def get_stats():
    total = len(transaction_log)
    frauds = sum(1 for t in transaction_log if t.get("is_fraud"))
    return {
        "total_analyzed": total,
        "fraud_detected": frauds,
        "legit_count": total - frauds,
        "fraud_rate": round(frauds / total * 100, 2) if total else 0,
        "recent": transaction_log[-10:][::-1],
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
