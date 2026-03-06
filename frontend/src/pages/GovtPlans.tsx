import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/ui/Layout/SideBar";
import ashokaLogo from "@/assets/ashoka.png";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    ChevronLeft,
    Building2,
    ShieldCheck,
    Sparkles,
    IndianRupee,
    Check,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// --- Static Data ---

const GOVT_SCHEMES = [
    {
        scheme_id: "PMJAY",
        scheme_name: "Ayushman Bharat (PM-JAY)",
        category: "Central",
        coverage_amount: 500000,
        target_audience: "Economically Weaker Sections (EWS), BPL Card holders",
        premium_amount: 0,
        benefits_covered: ["Hospitalization", "Surgery", "Diagnostics", "Post-hospitalization"],
        empanelled_hospitals: 25000,
        criteria: [
            { type: "income", operator: "<=", value: 250000 },
            { type: "has_bpl_card", operator: "==", value: true }
        ]
    },
    {
        scheme_id: "ESIC",
        scheme_name: "Employees State Insurance",
        category: "Employee-based",
        coverage_amount: 0, // Unlimited medical
        target_audience: "Workers in factories with monthly salary < ₹21,000",
        premium_amount: 0,
        benefits_covered: ["Full Medical Cover", "Sickness Benefit", "Maternity Benefit"],
        empanelled_hospitals: 1200,
        criteria: [
            { type: "income", operator: "<=", value: 252000 }
        ]
    },
    {
        scheme_id: "CGHS",
        scheme_name: "Central Government Health Scheme",
        category: "Employee-based",
        coverage_amount: 0,
        target_audience: "Central Govt Employees and Pensioners",
        premium_amount: 0,
        benefits_covered: ["OPD", "IPD", "Specialist Consultation", "Medicines"],
        empanelled_hospitals: 1500,
        criteria: [
            { type: "occupation", operator: "includes", value: "government" }
        ]
    }
];

// --- Types ---

interface AssessmentData {
    annual_income: string;
    occupation: string;
    employment_type: string;
    family_size: string;
    state: string;
    has_bpl_card: boolean;
    age: string;
}

interface SchemeResult {
    scheme_id: string;
    scheme_name: string;
    category: string;
    coverage_amount: number;
    target_audience: string;
    premium_amount: number;
    benefits_covered: string[];
    empanelled_hospitals: number;
    eligibility_score: number;
    is_eligible: boolean;
}

const initialData: AssessmentData = {
    annual_income: "",
    occupation: "",
    employment_type: "",
    family_size: "1",
    state: "",
    has_bpl_card: false,
    age: "",
};

export default function GovtPlans() {
    const [activeTab, setActiveTab] = useState("Govt Insurance Plans");
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<AssessmentData>(initialData);
    const [results, setResults] = useState<SchemeResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- Handlers ---

    const handleChange = (name: keyof AssessmentData, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };





    const calculateEligibility = () => {
        setIsLoading(true);
        setTimeout(() => {
            const incomeVal = Number(formData.annual_income);
            const isBpl = formData.has_bpl_card;
            const occ = formData.occupation.toLowerCase();

            const calculated = GOVT_SCHEMES.map(scheme => {
                let matched = 0;
                const total = scheme.criteria.length;

                scheme.criteria.forEach(crit => {
                    if (crit.type === "income" && incomeVal <= (crit.value as number)) matched++;
                    if (crit.type === "has_bpl_card" && isBpl === crit.value) matched++;
                    if (crit.type === "occupation" && Array.isArray(crit.value)
                        ? crit.value.some(v => occ.includes(v))
                        : occ.includes(crit.value as string)) matched++;
                });

                const score = total === 0 ? 100 : Math.round((matched / total) * 100);
                return {
                    ...scheme,
                    eligibility_score: score,
                    is_eligible: score >= 50 // Lower threshold for static demo
                };
            });

            setResults(calculated.sort((a, b) => b.eligibility_score - a.eligibility_score));
            setIsLoading(false);
            setStep(3);
        }, 800);
    };



    const progress = (step / 3) * 100;

    return (
        <div className="flex h-screen w-screen bg-slate-50 overflow-hidden text-slate-900">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-8">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-1 bg-white rounded-2xl shadow-lg shadow-blue-100 overflow-hidden border border-slate-100 flex items-center justify-center h-14 w-14">
                                <img src={ashokaLogo} alt="Ashoka Stambh" className="h-12 w-12 object-contain" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold">Government Insurance Plans</h1>
                                <p className="text-slate-500 font-medium font-sans tracking-tight">Discover and assess your eligibility for national health schemes</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-6">

                            <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden bg-white/70 backdrop-blur-xl">
                                <div className="h-1.5 w-full bg-slate-100">
                                    <motion.div
                                        className="h-full bg-blue-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>

                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-3 py-1">
                                            Step {step} of 3
                                        </Badge>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{Math.round(progress)}% Complete</span>
                                    </div>
                                    <CardTitle className="text-xl">
                                        {step === 1 ? "Personal Profile" : step === 2 ? "Economic & Location Data" : "Eligibility Results"}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent>
                                    <AnimatePresence mode="wait">
                                        {step === 1 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="age">Age</Label>
                                                        <Input
                                                            id="age"
                                                            type="number"
                                                            placeholder="e.g. 45"
                                                            value={formData.age}
                                                            onChange={(e) => handleChange("age", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="family_size">Family Size</Label>
                                                        <Select onValueChange={(val) => handleChange("family_size", val)} defaultValue={formData.family_size}>
                                                            <SelectTrigger id="family_size">
                                                                <SelectValue placeholder="Select size" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                                                    <SelectItem key={n} value={n.toString()}>{n} Members</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor="occupation">Occupation</Label>
                                                        <Input
                                                            id="occupation"
                                                            placeholder="e.g. Farmer, Factory Worker, Government Service"
                                                            value={formData.occupation}
                                                            onChange={(e) => handleChange("occupation", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="income">Annual Family Income (₹)</Label>
                                                        <div className="relative">
                                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                            <Input
                                                                id="income"
                                                                type="number"
                                                                className="pl-9"
                                                                placeholder="e.g. 180000"
                                                                value={formData.annual_income}
                                                                onChange={(e) => handleChange("annual_income", e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="state">State</Label>
                                                        <Select onValueChange={(val) => handleChange("state", val)} defaultValue={formData.state}>
                                                            <SelectTrigger id="state">
                                                                <SelectValue placeholder="Select state" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                                                                <SelectItem value="Karnataka">Karnataka</SelectItem>
                                                                <SelectItem value="Delhi">Delhi</SelectItem>
                                                                <SelectItem value="Other">Other</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div
                                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer md:col-span-2 ${formData.has_bpl_card ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100"}`}
                                                        onClick={() => handleChange("has_bpl_card", !formData.has_bpl_card)}
                                                    >
                                                        <div className="space-y-0.5">
                                                            <Label className="text-base cursor-pointer">BPL Card Holder</Label>
                                                            <p className="text-xs text-slate-500">Below Poverty Line certificate?</p>
                                                        </div>
                                                        <div className={`h-6 w-6 rounded-md border flex items-center justify-center transition-colors ${formData.has_bpl_card ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"}`}>
                                                            {formData.has_bpl_card && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 3 && (
                                            <motion.div
                                                key="step3"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="space-y-4"
                                            >
                                                {results.filter(s => s.is_eligible).length > 0 ? (
                                                    results.filter(s => s.is_eligible).map((scheme) => (
                                                        <div key={scheme.scheme_id} className="p-4 border border-slate-200 rounded-2xl bg-white hover:border-blue-400 transition-all shadow-sm">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <h3 className="font-bold text-slate-900">{scheme.scheme_name}</h3>
                                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">{scheme.eligibility_score}% Match</Badge>
                                                                    </div>
                                                                    <p className="text-sm text-slate-500">{scheme.target_audience}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Coverage</div>
                                                                    <div className="text-lg font-bold text-blue-600">
                                                                        {scheme.coverage_amount > 0 ? `₹${(scheme.coverage_amount / 100000).toFixed(1)}L` : "Comprehensive Cover"}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                                                <div className="flex items-center gap-1 text-slate-600">
                                                                    <Building2 className="h-3.5 w-3.5 text-blue-500" /> {scheme.empanelled_hospitals}+ Hospitals
                                                                </div>
                                                                <div className="flex items-center gap-1 text-slate-600">
                                                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Free Treatment
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center p-8 bg-slate-50 rounded-2xl">
                                                        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                                        <h4 className="font-bold text-slate-900">No matching plans</h4>
                                                        <p className="text-sm text-slate-500">Try changing your income or checking the BPL card status.</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>

                                <CardFooter className="flex justify-between border-t border-slate-100 bg-slate-50/50 p-6">
                                    {step === 3 ? (
                                        <Button variant="outline" onClick={() => { setStep(1); setResults([]); }} className="w-full h-11 border-dashed">
                                            <ChevronLeft className="mr-2 h-4 w-4" /> Start New Assessment
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                variant="ghost"
                                                disabled={step === 1}
                                                onClick={() => setStep(s => s - 1)}
                                                className="text-slate-500"
                                            >
                                                <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                            </Button>

                                            <Button
                                                onClick={() => step === 2 ? calculateEligibility() : setStep(s => s + 1)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 rounded-xl shadow-lg shadow-blue-200"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assessing...</>
                                                ) : step === 2 ? (
                                                    <><Sparkles className="mr-2 h-4 w-4" /> Check Eligibility</>
                                                ) : (
                                                    <>Next <ChevronRight className="ml-2 h-4 w-4" /></>
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </CardFooter>
                            </Card>
                        </div>

                        <div className="lg:col-span-4 space-y-6">


                            <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="bg-slate-50/50">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-slate-400" /> Public Health Tips
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-5">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold">Ayushman Card</p>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">The Ayushman card provides ₹5 Lakh free health cover per year for hospitalization in generic hospitals.</p>
                                    </div>
                                    <div className="h-px bg-slate-100" />
                                    <div className="space-y-2 text-slate-900">
                                        <p className="text-xs font-bold">No Cash Needed</p>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">All government insurance schemes mentioned are cashless. You don’t need to pay upfront.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

