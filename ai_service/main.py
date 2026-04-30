from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import IsolationForest

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Option A: Sales Prediction Models
class DailySales(BaseModel):
    day: int
    amount: float

class PredictionRequest(BaseModel):
    history: List[DailySales]

@app.post("/predict-sales")
def predict_sales(req: PredictionRequest):
    if len(req.history) < 2:
        return {"error": "Need at least 2 days of history to predict"}
    
    # Prepare data for scikit-learn
    X = np.array([item.day for item in req.history]).reshape(-1, 1)
    y = np.array([item.amount for item in req.history])
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict next 7 days
    last_day = req.history[-1].day
    future_X = np.array([last_day + i for i in range(1, 8)]).reshape(-1, 1)
    predictions = model.predict(future_X)
    
    # Ensure no negative predictions
    predictions = [max(0, float(p)) for p in predictions]
    
    return {
        "predictions": [{"day": int(d[0]), "predicted_amount": p} for d, p in zip(future_X, predictions)]
    }

# Option C: Fraud Detection Model
class ClickData(BaseModel):
    id: int
    influencer_id: int
    ip_address: str
    timestamp: str

class FraudCheckRequest(BaseModel):
    clicks: List[ClickData]

@app.post("/detect-fraud")
def detect_fraud(req: FraudCheckRequest):
    if len(req.clicks) < 5:
        return {"message": "Not enough data to detect anomalies"}
    
   
    ips = [int(click.ip_address.replace('.', '')) for click in req.clicks if '.' in click.ip_address]
    
    if len(ips) < 5:
        return {"message": "Invalid IP format for detection"}

    X = np.array(ips).reshape(-1, 1)
    
    # Isolation Forest for anomaly detection
    model = IsolationForest(contamination=0.1, random_state=42)
    predictions = model.fit_predict(X)
    
    # -1 indicates anomaly
    fraud_ids = []
    for idx, pred in enumerate(predictions):
        if pred == -1:
            fraud_ids.append(req.clicks[idx].id)
            
    return {"fraudulent_click_ids": fraud_ids, "total_analyzed": len(req.clicks)}

@app.get("/")
def root():
    return {"message": "AI Service Running"}
