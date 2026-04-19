# 🛡️ FraudGuard AI — Credit Card Fraud Detection

A full-stack, industry-ready credit card fraud detection system powered by a **LightGBM** machine learning model. Features a **FastAPI** backend with automated preprocessing pipelines and a **React + TailwindCSS** dashboard engineered with a premium Slate & Violet aesthetic for a deeply interactive experience.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18-blue?logo=react)

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
| **Batch CSV Upload**            | Upload unscaled, raw transaction datasets for bulk fraud detection          |
| **Real-time Dashboard**         | Live statistics with animated charts (Pie, Bar) and counters                |
| **Automated Dual Scaling**      | Backend automatically processes raw `Amounts` and `Times` against saved scalers |
| **Dynamic Thresholding**        | Fully automated decision threshold configuration via backend settings         |
| **Risk Level Classification**   | Color-coded HIGH / MEDIUM / LOW risk badges                                 |
| **Transaction History**         | Searchable log of all analyzed transactions                                 |
| **Custom Aesthetic**            | Premium "Slate & Violet" modern interface breaking away from standard templates |
| **Responsive Design**           | Works seamlessly on desktop and tablet devices                              |

---

## 🏗️ Architecture

```
credit-card-fraud-detection/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── predictor.py          # Model loading & automatic dataframe scaling
│   ├── schemas.py            # Pydantic request schemas
│   ├── model/
│   │   ├── fraud_model_lightgbm.pkl   # Trained LightGBM model
│   │   ├── amount_scaler.pkl          # Dedicated RobustScaler for Amount
│   │   ├── time_scaler.pkl            # Dedicated RobustScaler for Time
│   │   └── threshold_config.json      # Optimal decision boundary limit
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main app with sidebar navigation
│   │   ├── main.jsx          # React entry point
│   │   ├── index.css         # Global Violet/Slate styles + Tailwind
│   │   └── components/
│   │       ├── Dashboard.jsx
│   │       ├── ResultCard.jsx
│   │       ├── StatsPanel.jsx
│   │       ├── RecentTransactions.jsx
│   │       └── BatchUpload.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js    # Customized deep slate color palette
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
uvicorn main:app --host 127.0.0.1 --port 8000


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
| `/predict`       | POST   | Analyze a single transaction using backend config|
| `/predict/batch` | POST   | Batch analyze a raw CSV file automatically      |
| `/stats`         | GET    | Get analysis statistics and recent transactions |

### POST `/predict` — Request Body

```json
{
  "Time": 10000,
  "V1": -1.3598,
  "V2": -0.0728,
  "V3": 2.5363,
  "...": "V4 through V28",
  "Amount": 149.62
}
```
*(No need to submit `threshold`, backend resolves this via `threshold_config.json`)*

### Response

```json
{
  "fraud_probability": 0.0312,
  "is_fraud": 0,
  "risk_level": "LOW",
  "threshold_used": 0.32
}
```

---

## 🛠️ Tech Stack

### Backend

- **FastAPI** — High-performance async API framework
- **LightGBM** — Advanced gradient boosting framework for ML inference
- **scikit-learn** — Machine learning utilities
- **joblib** — Model & scaler serialization
- **pandas / numpy** — Incoming payload preprocessing

### Frontend

- **React 18** — Component-based UI
- **Vite** — Fast build tool
- **TailwindCSS** — Utility-first CSS (configured with Slate & Violet architecture)
- **Framer Motion** — Smooth structural animations
- **Recharts** — Charts and data visualization
- **Lucide React** — Beautiful icons
- **Axios** — HTTP client

### Model

- **LightGBM Classifier** — High-performance gradient boosting tree
- **Hardware Agnostic Scalers** — Dedicated, separated `.pkl` exports properly mapping unscaled payload components (Amount/Time).
- **Dataset** — 284,807 Kaggle Credit Card transactions
 
---

## ⚙️ Environment Variables

| Variable       | Default                 | Description                      |
| -------------- | ----------------------- | -------------------------------- |
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL for the frontend |

---

