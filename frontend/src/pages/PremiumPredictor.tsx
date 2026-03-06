import { useState, type ChangeEvent, type FormEvent } from "react";
import { getAuth } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { PREMIUM_ENDPOINTS } from "@/lib/config";
import Sidebar from "../components/ui/Layout/SideBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  HeartPulse,
  Loader2,
  Info,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Activity,
  Scissors,
  CheckCircle2,
  IndianRupee,
  Scale,
  Sparkles,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  Age: string;
  Diabetes: boolean;
  BloodPressureProblems: boolean;
  AnyTransplants: boolean;
  AnyChronicDiseases: boolean;
  Height: string;
  Weight: string;
  KnownAllergies: boolean;
  HistoryOfCancerInFamily: boolean;
  NumberOfMajorSurgeries: string;
}

interface PredictionResult {
  prediction: number;
  currency: string;
  confidence: number;
}



// ── Constants ─────────────────────────────────────────────────────────────────

const initialFormData: FormData = {
  Age: "",
  Diabetes: false,
  BloodPressureProblems: false,
  AnyTransplants: false,
  AnyChronicDiseases: false,
  Height: "",
  Weight: "",
  KnownAllergies: false,
  HistoryOfCancerInFamily: false,
  NumberOfMajorSurgeries: "",
};

// ── Step Definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Basic Info", icon: Activity, color: "text-blue-500" },
  { id: 2, title: "Medical History", icon: ShieldCheck, color: "text-purple-500" },
  { id: 3, title: "Surgical Info", icon: Scissors, color: "text-rose-500" },
];

// ── BMI Helpers ───────────────────────────────────────────────────────────────

function getBMI(height: string, weight: string): number | null {
  if (!height || !weight) return null;
  const hM = Number(height) / 100;
  const w = Number(weight);
  if (hM <= 0 || w <= 0) return null;
  return parseFloat((w / (hM * hM)).toFixed(1));
}

function getBMICategory(bmi: number): {
  label: string;
  color: string;
  bg: string;
  percent: number;
} {
  if (bmi < 18.5) return { label: "Underweight", color: "text-sky-600", bg: "bg-sky-100", percent: 15 };
  if (bmi < 25) return { label: "Normal", color: "text-green-600", bg: "bg-green-100", percent: 35 };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-600", bg: "bg-amber-100", percent: 65 };
  return { label: "Obese", color: "text-red-600", bg: "bg-red-100", percent: 90 };
}

// ── Risk Level Helper ─────────────────────────────────────────────────────────

function getRiskLevel(features: number[]): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  const flags = [1, 2, 3, 4, 7, 8].map((i) => features[i]);
  const surgeries = features[9];
  const score = flags.reduce((s, f) => s + (f ? 1 : 0), 0) + Math.min(surgeries, 4);
  if (score <= 1) return { label: "Low Risk", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" };
  if (score <= 3) return { label: "Moderate Risk", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  return { label: "High Risk", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
}

function getRiskFactors(formData: FormData): string[] {
  const factors: string[] = [];
  if (formData.Diabetes) factors.push("Diabetes");
  if (formData.BloodPressureProblems) factors.push("Blood Pressure Issues");
  if (formData.AnyTransplants) factors.push("Organ Transplant");
  if (formData.AnyChronicDiseases) factors.push("Chronic Disease");
  if (formData.KnownAllergies) factors.push("Known Allergies");
  if (formData.HistoryOfCancerInFamily) factors.push("Cancer History");
  const s = Number(formData.NumberOfMajorSurgeries);
  if (s > 0) factors.push(`${s} Major Surger${s === 1 ? "y" : "ies"}`);
  return factors;
}

// ── Confidence Ring ───────────────────────────────────────────────────────────

function ConfidenceRing({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <motion.circle
          cx="48" cy="48" r={r} fill="none"
          stroke="#10b981"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <text x="48" y="44" textAnchor="middle" fontSize="20" fontWeight="700" fill="#059669">{pct}%</text>
        <text x="48" y="62" textAnchor="middle" fontSize="10" fill="#6b7280">confidence</text>
      </svg>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PremiumPredictor() {
  const [activeTab, setActiveTab] = useState("Insurance Premium Predictor");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [features, setFeatures] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bmi = getBMI(formData.Height, formData.Weight);
  const bmiCategory = bmi ? getBMICategory(bmi) : null;
  const riskFactors = getRiskFactors(formData);

  // ── Step validation ──
  const step1Valid = formData.Age !== "" && formData.Height !== "" && formData.Weight !== "";
  const step2Valid = true; // all booleans, always valid
  const step3Valid = formData.NumberOfMajorSurgeries !== "";

  function canProceed() {
    if (step === 1) return step1Valid;
    if (step === 2) return step2Valid;
    return step3Valid;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setResult(null);
    setError(null);
    setStep(1);
    setFeatures([]);
  };

  const buildFeatures = (fd: FormData): number[] => [
    Number(fd.Age),
    fd.Diabetes ? 1 : 0,
    fd.BloodPressureProblems ? 1 : 0,
    fd.AnyTransplants ? 1 : 0,
    fd.AnyChronicDiseases ? 1 : 0,
    Number(fd.Height),
    Number(fd.Weight),
    fd.KnownAllergies ? 1 : 0,
    fd.HistoryOfCancerInFamily ? 1 : 0,
    Number(fd.NumberOfMajorSurgeries),
  ];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    const feat = buildFeatures(formData);
    setFeatures(feat);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) { setError("No logged-in user found."); setIsLoading(false); return; }
      const token = await user.getIdToken();

      const response = await fetch(PREMIUM_ENDPOINTS.predict, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ features: feat }),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Failed to get prediction");
      }
    } catch {
      setError("Failed to connect to the prediction service. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };





  // ── Progress ─────────────────────────────────────────────────────────────

  const totalRequiredFields = 4; // Age, Height, Weight, NumberOfMajorSurgeries
  const filledRequired = [formData.Age, formData.Height, formData.Weight, formData.NumberOfMajorSurgeries]
    .filter((v) => v !== "").length;
  const formProgress = (filledRequired / totalRequiredFields) * 100;

  const riskLevel = features.length === 10 ? getRiskLevel(features) : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                <HeartPulse className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Insurance Premium Calculator</h1>
                <p className="text-sm text-gray-500">AI-powered prediction using health & lifestyle data</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="flex items-center gap-2 text-gray-600">
              <RefreshCw className="h-4 w-4" /> Reset
            </Button>
          </div>

          {/* ── PREDICT CONTENT ── */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-4">

              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {STEPS.map((s, idx) => {
                  const Icon = s.icon;
                  const done = step > s.id;
                  const active = step === s.id;
                  return (
                    <div key={s.id} className="flex items-center gap-2 flex-1">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? "bg-blue-600 text-white shadow-md" :
                        done ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-400"
                        }`}>
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : s.color}`} />}
                        {s.title}
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={`flex-1 h-px ${step > s.id ? "bg-green-300" : "bg-gray-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Form progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Form completion</span>
                  <span>{formProgress.toFixed(0)}%</span>
                </div>
                <Progress value={formProgress} className="h-1.5" />
              </div>

              {/* Form Card */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-800">
                    {step === 1 && "Step 1 — Basic Information"}
                    {step === 2 && "Step 2 — Medical Conditions"}
                    {step === 3 && "Step 3 — Surgical History"}
                  </CardTitle>
                  <CardDescription>
                    {step === 1 && "Enter your age, height, and weight to calculate BMI."}
                    {step === 2 && "Indicate any pre-existing medical conditions."}
                    {step === 3 && "Enter the number of major surgeries you've had."}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.25 }}
                    >
                      <form id="premium-form" onSubmit={handleSubmit}>

                        {/* ── STEP 1 ── */}
                        {step === 1 && (
                          <div className="space-y-5">
                            <div className="space-y-2">
                              <Label htmlFor="Age" className="text-sm font-medium flex items-center gap-1">
                                Age <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="Age" type="number" min="1" max="120"
                                placeholder="Enter your age in years"
                                value={formData.Age}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("Age", e.target.value)}
                                className="w-full"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="Height" className="text-sm font-medium flex items-center gap-1">
                                  Height <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                  <Input
                                    id="Height" type="number" min="100" max="250"
                                    placeholder="e.g. 170"
                                    value={formData.Height}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("Height", e.target.value)}
                                    className="pr-10"
                                    required
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">cm</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="Weight" className="text-sm font-medium flex items-center gap-1">
                                  Weight <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                  <Input
                                    id="Weight" type="number" min="20" max="300"
                                    placeholder="e.g. 75"
                                    value={formData.Weight}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("Weight", e.target.value)}
                                    className="pr-10"
                                    required
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">kg</span>
                                </div>
                              </div>
                            </div>

                            {/* Live BMI */}
                            {bmi && bmiCategory && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-xl border p-4 ${bmiCategory.bg}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Scale className={`h-4 w-4 ${bmiCategory.color}`} />
                                    <span className="text-sm font-semibold text-gray-700">Your BMI</span>
                                  </div>
                                  <Badge className={`${bmiCategory.bg} ${bmiCategory.color} border-0 font-semibold`}>
                                    {bmiCategory.label}
                                  </Badge>
                                </div>
                                <div className={`text-3xl font-bold ${bmiCategory.color} mb-2`}>{bmi}</div>
                                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <motion.div
                                    className={`absolute left-0 top-0 h-full rounded-full ${bmiCategory.label === "Normal" ? "bg-green-500" :
                                      bmiCategory.label === "Underweight" ? "bg-sky-500" :
                                        bmiCategory.label === "Overweight" ? "bg-amber-500" : "bg-red-500"
                                      }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${bmiCategory.percent}%` }}
                                    transition={{ duration: 0.6 }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                  <span>15 (Low)</span>
                                  <span>25</span>
                                  <span>30</span>
                                  <span>40+</span>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}

                        {/* ── STEP 2 ── */}
                        {step === 2 && (
                          <div className="grid gap-4 sm:grid-cols-2">
                            {[
                              { name: "Diabetes", label: "Diabetes", desc: "Type 1 or Type 2 diabetes" },
                              { name: "BloodPressureProblems", label: "Blood Pressure Issues", desc: "Hypertension or hypotension" },
                              { name: "AnyTransplants", label: "Any Transplants", desc: "Organ or tissue transplants" },
                              { name: "AnyChronicDiseases", label: "Chronic Diseases", desc: "Long-term medical conditions" },
                              { name: "KnownAllergies", label: "Known Allergies", desc: "Significant allergic conditions" },
                              { name: "HistoryOfCancerInFamily", label: "Family Cancer History", desc: "Immediate family members" },
                            ].map((field) => (
                              <div key={field.name} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{field.label}</p>
                                  <p className="text-xs text-gray-500">{field.desc}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id={field.name}
                                    checked={formData[field.name as keyof FormData] as boolean}
                                    onCheckedChange={(checked) => handleChange(field.name, checked)}
                                  />
                                  <Label htmlFor={field.name} className={`text-xs font-semibold ${formData[field.name as keyof FormData] ? "text-blue-600" : "text-gray-400"}`}>
                                    {formData[field.name as keyof FormData] ? "Yes" : "No"}
                                  </Label>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ── STEP 3 ── */}
                        {step === 3 && (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Label htmlFor="surgeries" className="text-sm font-medium flex items-center gap-1">
                                Number of Major Surgeries <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="surgeries" type="number" min="0" max="10"
                                placeholder="e.g. 0, 1, 2…"
                                value={formData.NumberOfMajorSurgeries}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("NumberOfMajorSurgeries", e.target.value)}
                                required
                              />
                              <p className="text-xs text-gray-500">Include any major operations requiring general anaesthesia.</p>
                            </div>

                            {/* Summary before submit */}
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-3">
                              <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                <Info className="h-4 w-4" /> Quick Summary
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <span className="text-gray-500">Age</span>
                                <span className="font-medium">{formData.Age} years</span>
                                <span className="text-gray-500">BMI</span>
                                <span className={`font-medium ${bmiCategory?.color}`}>{bmi ?? "—"} {bmiCategory ? `(${bmiCategory.label})` : ""}</span>
                                <span className="text-gray-500">Risk Factors</span>
                                <span className="font-medium">{riskFactors.length > 0 ? riskFactors.length : "None"}</span>
                              </div>
                              {riskFactors.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {riskFactors.map((f) => (
                                    <Badge key={f} variant="secondary" className="text-xs bg-white border border-blue-200 text-blue-700">{f}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {error && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}
                      </form>
                    </motion.div>
                  </AnimatePresence>
                </CardContent>

                <CardFooter className="flex justify-between pt-0">
                  <Button
                    variant="outline"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>

                  {step < 3 ? (
                    <Button
                      onClick={() => setStep((s) => s + 1)}
                      disabled={!canProceed()}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      Next <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      form="premium-form"
                      type="submit"
                      disabled={isLoading || !step3Valid}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                      onClick={(e) => {
                        e.preventDefault();
                        const fakeEvent = new Event("submit", { bubbles: true, cancelable: true }) as unknown as FormEvent<HTMLFormElement>;
                        handleSubmit(fakeEvent);
                      }}
                    >
                      {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Calculating…</>
                      ) : (
                        <><Sparkles className="h-4 w-4" /> Predict Premium</>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>

            {/* Right: Result panel */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {!result && (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-slate-100 h-full">
                      <CardContent className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                        <div className="p-3 rounded-full bg-gray-200/70">
                          <TrendingUp className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-400 max-w-[180px]">
                          Fill in the form and click <strong>Predict Premium</strong> to see your result.
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {result && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
                        <p className="text-emerald-100 text-xs font-semibold uppercase tracking-widest mb-1">Estimated Annual Premium</p>
                        <div className="flex items-end gap-1">
                          <IndianRupee className="h-6 w-6 mb-1" />
                          <motion.span
                            className="text-4xl font-bold"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            {result.prediction.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </motion.span>
                        </div>
                        <p className="text-emerald-100 text-xs mt-1">per year · {result.currency}</p>
                      </div>

                      <CardContent className="pt-4 space-y-4">
                        {/* Confidence Ring */}
                        <div className="flex flex-col items-center">
                          <ConfidenceRing confidence={result.confidence} />
                        </div>

                        <Separator />

                        {/* Risk Level */}
                        {riskLevel && (
                          <div className={`rounded-lg border p-3 ${riskLevel.bg} ${riskLevel.border}`}>
                            <p className={`text-sm font-semibold ${riskLevel.color}`}>{riskLevel.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Based on {riskFactors.length} risk factor{riskFactors.length !== 1 ? "s" : ""} detected
                            </p>
                          </div>
                        )}

                        {/* Risk Factor Chips */}
                        {riskFactors.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2 font-medium">Contributing risk factors:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {riskFactors.map((f) => (
                                <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <p className="text-xs text-gray-400 flex items-center gap-1 cursor-help">
                                <Info className="h-3 w-3" /> How is this calculated?
                              </p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              This prediction uses a LightGBM machine learning model trained on health insurance data.
                              Actual premiums vary based on insurer, policy terms, and additional underwriting factors.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
