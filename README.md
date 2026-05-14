# SentimentScope

A production-grade NLP analytics platform for real-time sentiment analysis, trend monitoring, and keyword intelligence.

Built using a Flask-powered NLP backend and a modern interactive frontend with Chart.js visualizations.

---

## Features

- Real-time sentiment analytics dashboard
- NLP preprocessing pipeline
- Sentiment scoring using VADER-style analysis
- Interactive charts and visualizations
- Keyword frequency analysis
- Region-wise sentiment tracking
- Trend and anomaly detection
- Word cloud generation
- RESTful Flask API
- Offline mock-data fallback support
- Responsive modern UI

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | HTML5, CSS3, JavaScript (ES2022) |
| Charts | Chart.js 4 |
| Backend | Python, Flask, Flask-CORS |
| NLP | Custom VADER-style sentiment engine |
| Data Processing | Python (csv, json, collections) |
| Deployment | Vercel, Render |

---

## Project Structure

```bash
sentimentscope/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── backend/
│   ├── app.py
│   ├── process_data.py
│   ├── requirements.txt
│   └── data/
│       ├── raw_data.csv
│       └── processed_data.json
│
└── README.md
```

---

## Installation & Setup

### Clone the Repository

```bash
git clone <your-repo-url>
cd sentimentscope
```

---

## Backend Setup

### 1. Navigate to backend

```bash
cd backend
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run preprocessing pipeline

```bash
python process_data.py
```

This pipeline:

- Cleans and normalizes raw data
- Removes duplicates and noise
- Performs tokenization
- Runs sentiment analysis
- Generates NLP features
- Creates processed JSON dataset

### 4. Start Flask server

```bash
python app.py
```

Backend runs at:

```bash
http://127.0.0.1:5000
```

---

## Frontend Setup

### Navigate to frontend

```bash
cd frontend
```

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `/api/health` | API health status |
| `/api/overview` | KPI & sentiment overview |
| `/api/trends` | Sentiment trend analysis |
| `/api/keywords` | Keyword frequency analysis |
| `/api/regions` | Region-wise sentiment data |
| `/api/wordcloud` | Word cloud dataset |
| `/api/insights` | NLP-generated insights |
| `/api/anomalies` | Spike/anomaly detection |
| `/api/analyze` | Full-text sentiment analysis |

---

## NLP Processing Pipeline

```text
Raw CSV
   ↓
Data Cleaning & Normalization
   ↓
Noise Removal & Tokenization
   ↓
Sentiment Scoring
   ↓
Feature Engineering
   ↓
Dataset Augmentation
   ↓
processed_data.json
```

---

## Dashboard Features

- Sentiment distribution charts
- Trend visualizations
- Keyword analytics
- Region-based filtering
- Interactive insights
- Dynamic API connectivity
- Offline fallback mode

---

## Deployment

### Frontend Deployment (Vercel)

1. Push repository to GitHub
2. Import project into Vercel
3. Deploy as a Vite application

### Backend Deployment (Render)

Build Command:

```bash
pip install -r requirements.txt && python process_data.py
```

Start Command:

```bash
gunicorn app:app
```

---

## Future Improvements

- User authentication
- Live streaming sentiment analysis
- AI-powered summarization
- Multi-language NLP support
- Database integration
- Real-time websocket updates

---

---

## Author

Developed by Anupama
