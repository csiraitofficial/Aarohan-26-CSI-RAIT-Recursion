"""
CURO — AI Insurance Premium Prediction
LightGBM Model Training Script

Dataset: Medicalpremium.csv (located in this directory)
Target:  PremiumPrice (annual insurance premium in INR)

Features (in order):
  0  Age
  1  Diabetes            (0 / 1)
  2  BloodPressureProblems (0 / 1)
  3  AnyTransplants      (0 / 1)
  4  AnyChronicDiseases  (0 / 1)
  5  Height              (cm)
  6  Weight              (kg)
  7  KnownAllergies      (0 / 1)
  8  HistoryOfCancerInFamily (0 / 1)
  9  NumberOfMajorSurgeries

Usage:
  pip install lightgbm scikit-learn pandas numpy skl2onnx onnxmltools joblib
  python train_model.py
"""

import os
import numpy as np
import pandas as pd
import joblib
import lightgbm as lgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH  = os.path.join(SCRIPT_DIR, "Medicalpremium.csv")
MODEL_PKL  = os.path.join(SCRIPT_DIR, "premium_model.pkl")

# ── Load Data ─────────────────────────────────────────────────────────────────
print("Loading dataset…")
df = pd.read_csv(DATA_PATH)
print(f"  Shape: {df.shape}")
print(f"  Columns: {list(df.columns)}")
print(df.head(3))

# Drop any rows with missing target
df = df.dropna(subset=["PremiumPrice"])

FEATURE_COLS = [
    "Age",
    "Diabetes",
    "BloodPressureProblems",
    "AnyTransplants",
    "AnyChronicDiseases",
    "Height",
    "Weight",
    "KnownAllergies",
    "HistoryOfCancerInFamily",
    "NumberOfMajorSurgeries",
]

X = df[FEATURE_COLS].values.astype(np.float32)
y = df["PremiumPrice"].values.astype(np.float32)

# ── Train / Test Split ────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"\nTrain samples: {len(X_train)}, Test samples: {len(X_test)}")

# ── Build Pipeline ────────────────────────────────────────────────────────────
lgbm_model = lgb.LGBMRegressor(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=6,
    num_leaves=31,
    min_child_samples=20,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.1,
    reg_lambda=0.1,
    random_state=42,
    verbose=-1,
)

pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model",  lgbm_model),
])

# ── Cross-Validation ──────────────────────────────────────────────────────────
print("\nRunning 5-fold cross-validation…")
cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="r2")
print(f"  CV R²: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ── Train ─────────────────────────────────────────────────────────────────────
print("\nFitting final model on full training set…")
pipeline.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────────────
y_pred = pipeline.predict(X_test)
mae  = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2   = r2_score(y_test, y_pred)

print(f"\n── Test Set Metrics ─────────────────────────")
print(f"  MAE  : ₹{mae:,.2f}")
print(f"  RMSE : ₹{rmse:,.2f}")
print(f"  R²   : {r2:.4f}")

# ── Feature Importance ────────────────────────────────────────────────────────
importance = pipeline.named_steps["model"].feature_importances_
print("\n── Feature Importances ──────────────────────")
for col, imp in sorted(zip(FEATURE_COLS, importance), key=lambda x: -x[1]):
    bar = "█" * int(imp / max(importance) * 30)
    print(f"  {col:<35} {bar} {imp:.0f}")

# ── Save Pipeline (pkl) ───────────────────────────────────────────────────────
joblib.dump(pipeline, MODEL_PKL)
print(f"\n✅  Pipeline saved → {MODEL_PKL}")

# ── Optional: Export to ONNX ─────────────────────────────────────────────────
# Uncomment this block if you want to regenerate the .onnx files used by the
# Node.js backend. Requires: pip install skl2onnx onnxmltools lightgbm onnx
#
# from skl2onnx import convert_sklearn, to_onnx
# from skl2onnx.common.data_types import FloatTensorType
# import onnxmltools
#
# # Export scaler only
# scaler_onnx = to_onnx(
#     pipeline.named_steps["scaler"],
#     X_train[:1],
#     target_opset={"": 17}
# )
# with open(os.path.join(SCRIPT_DIR, "scaler.onnx"), "wb") as f:
#     f.write(scaler_onnx.SerializeToString())
# print("✅  scaler.onnx saved")
#
# # Export full LightGBM model
# booster = pipeline.named_steps["model"].booster_
# model_onnx = onnxmltools.convert_lightgbm(
#     booster,
#     initial_types=[("input", FloatTensorType([None, len(FEATURE_COLS)]))],
#     target_opset=17
# )
# with open(os.path.join(SCRIPT_DIR, "model.onnx"), "wb") as f:
#     f.write(model_onnx.SerializeToString())
# print("✅  model.onnx saved")

print("\nTraining complete!")
