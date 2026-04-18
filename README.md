# 🛡️ FraudGuard AI — Credit Card Fraud Detection

A full-stack, industry-ready credit card fraud detection system powered by a **Random Forest** machine learning model. Features a **FastAPI** backend for real-time inference and a **React + TailwindCSS** dashboard for an interactive, visually stunning experience.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Tech Stack](#-tech-stack)

---

## ✨ Features

| Feature                         | Description                                                                 |
| ------------------------------- | --------------------------------------------------------------------------- |
| **Single Transaction Analysis** | Analyze individual transactions with all 30 features (Time, V1–V28, Amount) |
| **Batch CSV Upload**            | Upload CSV files for bulk fraud detection with downloadable results         |
| **Real-time Dashboard**         | Live statistics with animated charts (Pie, Bar) and counters                |
| **Quick Demo Mode**             | Pre-filled sample data for instant fraud/legit testing                      |
| **Configurable Threshold**      | Adjustable decision threshold (0.0–1.0) for sensitivity tuning              |
| **Risk Level Classification**   | Color-coded HIGH / MEDIUM / LOW risk badges                                 |
| **Transaction History**         | Searchable log of all analyzed transactions                                 |
| **Responsive Design**           | Works on desktop and tablet devices                                         |

---

## 🏗️ Architecture

```
credit-card-fraud-detection/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── predictor.py          # Model loading & prediction logic
│   ├── schemas.py            # Pydantic request schemas
│   ├── model/
│   │   ├── fraud_model_random_forest.pkl   # Trained RF model
│   │   └── robust_scaler.pkl               # Fitted RobustScaler
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main app with sidebar navigation
│   │   ├── main.jsx          # React entry point
│   │   ├── index.css         # Global styles + Tailwind
│   │   └── components/
│   │       ├── Dashboard.jsx
│   │       ├── TransactionForm.jsx
│   │       ├── ResultCard.jsx
│   │       ├── StatsPanel.jsx
│   │       ├── RecentTransactions.jsx
│   │       └── BatchUpload.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **npm**

### 1. Clone & Setup

```bash
cd credit-card-fraud-detection
```

### 2. Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

📖 **Interactive API docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup

In a new terminal:

```bash
cd frontend

# Install Node.js dependencies
npm install

# Start the dev server
npm run dev
```

The app will open at `http://localhost:5173`

---

## 📡 API Documentation

| Endpoint         | Method | Description                                     |
| ---------------- | ------ | ----------------------------------------------- |
| `/`              | GET    | Root — API status and model info                |
| `/health`        | GET    | Health check                                    |
| `/predict`       | POST   | Analyze a single transaction                    |
| `/predict/batch` | POST   | Batch analyze a CSV file                        |
| `/stats`         | GET    | Get analysis statistics and recent transactions |

### POST `/predict` — Request Body

```json
{
  "Time": 0,
  "V1": -1.3598,
  "V2": -0.0728,
  "V3": 2.5363,
  "...": "V4 through V28",
  "Amount": 149.62,
  "threshold": 0.5
}
```

### Response

```json
{
  "fraud_probability": 0.0312,
  "is_fraud": 0,
  "risk_level": "LOW",
  "threshold_used": 0.5
}
```

---

## 🛠️ Tech Stack

### Backend

- **FastAPI** — High-performance async API framework
- **scikit-learn** — ML model inference
- **joblib** — Model serialization
- **pandas / numpy** — Data preprocessing

### Frontend

- **React 18** — Component-based UI
- **Vite** — Fast build tool
- **TailwindCSS** — Utility-first CSS
- **Framer Motion** — Smooth animations
- **Recharts** — Charts and data visualization
- **Lucide React** — Beautiful icons
- **Axios** — HTTP client

### Model

- **Random Forest Classifier** — 5-fold CV: ROC-AUC 1.0, PR-AUC 1.0, F1 0.9998
- **RobustScaler** — Fitted on Amount and Time features
- **Dataset** — 284,807 transactions (492 frauds, 0.17% imbalance)

---

## ⚙️ Environment Variables

| Variable       | Default                 | Description                      |
| -------------- | ----------------------- | -------------------------------- |
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL for the frontend |

---

## 📄 License

MIT License — feel free to use this for educational and commercial purposes.
