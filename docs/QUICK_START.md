# 🚀 QUICK START GUIDE - DIABINSIGHT

## Current Status
✅ **Backend:** 100% complete and organized  
🟡 **ML Models:** Ready to train (not yet executed)  
⏳ **Frontend:** Ready for development  

---

## Step 1: Train ML Models (Required)

This is the most critical step - the API won't fully function without trained models.

```bash
cd /home/harsh/CodeWithHarsh/Gemini_CLI/Diab-Insight/backend
python ml/train_model_optimized.py
```

**What it does:**
- Trains XGBoost models on 100,000 diabetes samples
- Uses GridSearchCV with 288 parameter combinations
- Generates 2 models: `xgb_model_app.joblib` + `xgb_model_clinical.joblib`
- Saves to: `backend/ml/artifacts/`

**Time:** ~15-20 minutes

**Alternative:** Train DFU detector (Phase 3)
```bash
python ml/train_dfu_model_optimized.py
```

---

## Step 2: Test Backend API

```bash
cd /home/harsh/CodeWithHarsh/Gemini_CLI/Diab-Insight/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Visit: **http://localhost:8000/docs** for interactive API testing

**What you'll see:**
- 10 API endpoints ready to use
- Request/response schemas
- Try-it-out button to test each endpoint

---

## Step 3: Start Frontend Development

```bash
cd /home/harsh/CodeWithHarsh/Gemini_CLI/Diab-Insight/frontend
npm install
npm run dev
```

Visit: **http://localhost:5173**

**Next:** 
- Create React components
- Connect to API endpoints at `http://localhost:8000/api/v1/`
- Implement user flow: Register → 7-day Check-in → Predict → Recommendations

---

## API Endpoints (Reference)

| Phase | Method | Route | Purpose |
|-------|--------|-------|---------|
| - | `GET` | `/api/v1/health` | Service status |
| 1 | `POST` | `/api/v1/users/register` | Register user |
| 1 | `POST` | `/api/v1/checkin/daily` | Daily entry |
| 1 | `POST` | `/api/v1/predict/diabetes` | Risk prediction |
| 2 | `GET` | `/api/v1/recommendations/{uid}` | Get recommendations |
| 3 | `POST` | `/api/v1/dfu/scan` | Foot image analysis |
| 4 | `POST` | `/api/v1/insole/reading` | IoT sensor data |

**Full docs:** http://localhost:8000/docs

---

## Key Directories

```
backend/
├── app/              ← FastAPI application code
│   ├── main.py       ← Entry point
│   ├── routers/      ← 10 API endpoints
│   ├── models/       ← 6 database tables
│   ├── schemas/      ← Request/response validation
│   └── services/     ← Business logic (3 services)
├── ml/
│   ├── train_model_optimized.py     ← XGBoost training
│   ├── train_dfu_model_optimized.py ← DFU training
│   └── artifacts/    ← Where models are saved
└── data/
    └── diabetes_dataset.csv         ← Training data

frontend/
├── src/              ← React components
├── public/           ← Static files
└── vite.config.js    ← Vite configuration

docs/
├── README files      ← Detailed documentation
├── PROJECT_ARCHITECTURE_MASTER_ALIGNED.md
├── BACKEND_IMPLEMENTATION_GUIDE.md
└── mockups/          ← UI mockup images
```

---

## Common Commands

**Start Backend:**
```bash
cd backend && python -m uvicorn app.main:app --reload --port 8000
```

**Start Frontend:**
```bash
cd frontend && npm run dev
```

**Train Models:**
```bash
cd backend && python ml/train_model_optimized.py
```

**View Logs:**
- Backend logs: Terminal where you ran uvicorn
- Frontend logs: Terminal where you ran npm run dev
- API docs: http://localhost:8000/docs
- API health: http://localhost:8000/api/v1/health

---

## Next Steps

1. ✅ Train ML models
2. ✅ Test API at http://localhost:8000/docs
3. ✅ Start frontend development
4. ⚠️ Integrate frontend with API
5. ⚠️ Add user authentication (JWT)
6. ⚠️ Set up PostgreSQL for production
7. ⚠️ Deploy to cloud (AWS/GCP/Azure)

---

## Documentation Reference

| Document | Purpose |
|----------|---------|
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Current project state |
| [README.md](README.md) | Project overview |
| [DIABINSIGHT_AGENT_CONTEXT.md](DIABINSIGHT_AGENT_CONTEXT.md) | Master specification |
| [backend/README.md](backend/README.md) | Backend guide |
| [backend/ml/README.md](backend/ml/README.md) | ML training guide |
| [docs/](docs/) | Complete documentation |

---

## Support

**API Interactive Docs:** http://localhost:8000/docs  
**Master Specification:** [DIABINSIGHT_AGENT_CONTEXT.md](DIABINSIGHT_AGENT_CONTEXT.md)  
**Backend Guide:** [backend/README.md](backend/README.md)  
**Troubleshooting:** See docs/ folder

---

**Ready to start? Run step 1 above!** 🚀
