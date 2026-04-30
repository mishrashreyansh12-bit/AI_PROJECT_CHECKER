# Influencer Affiliate Sales & Payment Tracking Platform

A full-stack web application designed for brands to track influencer-driven sales, manage commissions, and visualize performance through AI-powered analytics.

## Features

- **Role-based Dashboards**: Separate views for Admins (Brands) and Influencers.
- **Affiliate Tracking**: Unique referral links (`/t/refCode`) that automatically log clicks and attribute sales.
- **Commission System**: Automated tracking of pending and approved payouts.
- **Visual Analytics**: Interactive charts built with Recharts displaying sales over time, revenue split, and top influencers.
- **AI Integration**: A dedicated Python FastAPI microservice that uses `scikit-learn` for **Sales Prediction** (forecasting the next 7 days of revenue based on historical data) and **Fraud Detection** (Isolation Forest anomaly detection on clicks).
- **Premium UI**: Custom glassmorphism design with responsive grid layouts.

## Tech Stack

- **Frontend**: React (Vite), React Router, Recharts, Lucide Icons, Vanilla CSS
- **Backend**: Node.js, Express, SQLite (via Sequelize), JWT Authentication
- **AI Service**: Python, FastAPI, scikit-learn, numpy

---

## 🚀 Quick Setup Guide

### 1. Backend (Node.js API)
```bash
cd backend
npm install
node server.js
# Runs on http://localhost:5000
```

### 2. AI Service (Python FastAPI)
```bash
cd ai_service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
```

### 3. Frontend (React Vite)
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## 🎮 How to Test

1. **Start all 3 services** using the commands above.
2. Open `http://localhost:5173/login`.
3. **Register as an Admin** (e.g., `admin@brand.com`, Role: Admin).
4. **Register as an Influencer** (e.g., `john@influencer.com`, Role: Influencer).
5. Log in as the **Influencer**. You will see your unique referral link (e.g., `http://localhost:5000/t/john123`). Copy this link.
6. Open an incognito window or just paste the referral link in your browser. This will log a "Click" and redirect you to the simulated Shop.
7. On the simulated Shop page, click **"Buy Now"**. This simulates a successful conversion!
8. Log in as the **Admin**. You will see the total sales, the active influencer, and the AI Sales Prediction running.

## Deliverables
- [x] Code Structure (Frontend, Backend, AI Service)
- [x] Clean UI / Visual Dashboards
- [x] Tracking system (Clicks, Conversions)
- [x] AI Sales Prediction API integration

*Note: For the demo video, simply record the workflow mentioned in "How to Test".*
