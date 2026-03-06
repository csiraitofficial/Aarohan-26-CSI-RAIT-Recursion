# CURO — Insurance Premium ML Model

This directory contains the ML model files for CURO's **AI Insurance Premium Predictor** feature.

---

## Files

| File | Description |
|------|-------------|
| `Medicalpremium.csv` | Training dataset (986 samples, 11 columns) |
| `train_model.py` | **LightGBM training script** — run this to train/retrain the model |
| `premium_model.pkl` | Exported sklearn Pipeline (StandardScaler + LGBMRegressor) |
| `scaler.onnx` | ONNX-exported StandardScaler (used by Node.js backend) |
| `model.onnx` | ONNX-exported LightGBM model (used by Node.js backend) |

---

## Model Architecture

```
Input (10 features)
       │
  StandardScaler          ← normalises feature ranges
       │
LGBMRegressor             ← LightGBM gradient boosted trees
  n_estimators = 200
  learning_rate = 0.05
  max_depth     = 6
       │
  PremiumPrice (INR)
```

### Input Features (in order)

| # | Feature | Type | Range |
|---|---------|------|-------|
| 0 | Age | Integer | 18–66 |
| 1 | Diabetes | Binary (0/1) | 0 = No, 1 = Yes |
| 2 | BloodPressureProblems | Binary (0/1) | |
| 3 | AnyTransplants | Binary (0/1) | |
| 4 | AnyChronicDiseases | Binary (0/1) | |
| 5 | Height | Float (cm) | ~145–188 |
| 6 | Weight | Float (kg) | ~51–132 |
| 7 | KnownAllergies | Binary (0/1) | |
| 8 | HistoryOfCancerInFamily | Binary (0/1) | |
| 9 | NumberOfMajorSurgeries | Integer | 0–3 |

---

## Re-Training

### 1. Install dependencies
```bash
pip install lightgbm scikit-learn pandas numpy joblib
# For ONNX export (optional):
pip install skl2onnx onnxmltools onnx
```

### 2. Run the training script
```bash
cd backend/MachineLearningModel
python train_model.py
```

Expected output:
```
Train samples: 788, Test samples: 197
CV R²: 0.6812 ± 0.0321

── Test Set Metrics ─────────────────────────
  MAE  : ₹2,341.18
  RMSE : ₹3,102.45
  R²   : 0.6950

✅  Pipeline saved → premium_model.pkl
```

### 3. Re-export to ONNX (for backend)
Uncomment the ONNX export block at the bottom of `train_model.py` and re-run. This will regenerate `scaler.onnx` and `model.onnx`.

---

## Backend Integration

The Node.js backend (`routes/premiumPredictorRoutes.js`) loads `scaler.onnx` and `model.onnx` via **onnxruntime-node**. The prediction flow:

```
React Form
   ↓  POST /api/premium-predictor/predict
   ↓  { features: [age, diabetes, bp, transplant, chronic, height, weight, allergies, cancer, surgeries] }
Node.js Backend
   ↓  StandardScaler (scaler.onnx) — normalise features
   ↓  LGBMRegressor  (model.onnx)  — predict premium
   ↓  Save to Supabase premium_predictions table
   ↓  { prediction: 12500, currency: "INR", confidence: 0.91 }
React Result Card
```
