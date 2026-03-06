import express from 'express';
import * as ort from 'onnxruntime-node';
import { authenticateUser } from '../middleware/auth.js';
import supabase from '../supabase.js';

const router = express.Router();

let scalerSession;
let modelSession;

// ── Model Initialisation ─────────────────────────────────────────────────────

async function initializeModels() {
  try {
    scalerSession = await ort.InferenceSession.create('./MachineLearningModel/scaler.onnx');
    console.log('[PremiumPredictor] Scaler model loaded. Inputs:', scalerSession.inputNames);

    modelSession = await ort.InferenceSession.create('./MachineLearningModel/model.onnx');
    console.log('[PremiumPredictor] Prediction model loaded. Inputs:', modelSession.inputNames);
  } catch (error) {
    console.error('[PremiumPredictor] Error loading ONNX models:', error);
  }
}

await initializeModels();

// ── Helper: derive confidence heuristic ──────────────────────────────────────
// Since LightGBM ONNX doesn't expose native prediction intervals, we derive
// a confidence proxy based on number of risk flags present.
// Fewer flags → model is more confident (closer to baseline population).
function deriveConfidence(features) {
  // features: [age, diabetes, bp, transplant, chronic, height, weight, allergies, cancer, surgeries]
  const riskFlags = [features[1], features[2], features[3], features[4], features[7], features[8]];
  const surgeries = features[9];
  const totalRisk = riskFlags.reduce((sum, f) => sum + (f ? 1 : 0), 0) + Math.min(surgeries, 4);
  // Confidence ranges from 0.70 (max risk) to 0.96 (no risk)
  const maxRisk = 10;
  const confidence = 0.96 - (totalRisk / maxRisk) * 0.26;
  return Math.round(confidence * 100) / 100;
}

// ── POST /predict ─────────────────────────────────────────────────────────────

router.post('/predict', authenticateUser, async (req, res) => {
  try {
    const features = req.body.features;

    if (!features || !Array.isArray(features) || features.length !== 10) {
      return res.status(400).json({
        error: 'Please provide an array of exactly 10 numeric features.',
        expected: '[age, diabetes, bloodPressure, transplant, chronicDisease, height, weight, allergies, cancerHistory, surgeries]'
      });
    }

    // Ensure all values are numbers
    const numericFeatures = features.map(Number);
    if (numericFeatures.some(isNaN)) {
      return res.status(400).json({ error: 'All feature values must be numeric.' });
    }

    if (!scalerSession || !modelSession) {
      return res.status(503).json({ error: 'ML models are not initialized yet. Please retry in a moment.' });
    }

    // ── Inference ──
    const inputTensor = new ort.Tensor('float32', Float32Array.from(numericFeatures), [1, 10]);

    // Scale features
    const scalerResults = await scalerSession.run({ input: inputTensor });
    const processedInput = scalerResults.variable;

    // Deep-clone tensor data to avoid stale buffer issues
    const clonedData = new Float32Array(processedInput.cpuData.length);
    for (let i = 0; i < processedInput.cpuData.length; i++) {
      clonedData[i] = processedInput.cpuData[i];
    }
    const processedInputTensor = new ort.Tensor(processedInput.type, clonedData, [1, 10]);

    // Predict
    const modelResults = await modelSession.run({ input: processedInputTensor });
    let rawPrediction;
    if (modelResults.prediction) {
      rawPrediction = modelResults.prediction.data[0];
    } else {
      rawPrediction = modelResults[Object.keys(modelResults)[0]].data[0];
    }

    const prediction = Math.max(0, Number(rawPrediction));
    const confidence = deriveConfidence(numericFeatures);

    console.log(`[PremiumPredictor] Prediction: ₹${prediction.toFixed(2)}  Confidence: ${confidence}`);

    return res.json({
      prediction: Math.round(prediction * 100) / 100,
      currency: 'INR',
      confidence,
    });

  } catch (error) {
    console.error('[PremiumPredictor] Inference error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
