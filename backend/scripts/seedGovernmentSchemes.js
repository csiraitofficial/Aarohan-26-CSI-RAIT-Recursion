import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from the backend directory
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Need service role to bypass RLS for seeding

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const schemes = [
  {
    scheme_id: "AYUSHMAN",
    scheme_name: "Pradhan Mantri Jan Arogya Yojana (PMJAY)",
    category: "Central",
    coverage_amount: 500000.0,
    target_audience: "Economically Weaker Sections",
    state_applicable: "All India",
    benefits_covered: [
      "Hospitalization coverage",
      "Surgical procedures",
      "Medicines and consumables",
      "Diagnostic tests",
      "Ambulance services",
      "Pre and post-hospitalization",
    ],
    premium_amount: null, // Free
    empanelled_hospitals: 25000,
    is_active: true,
  },
  {
    scheme_id: "CGHS",
    scheme_name: "Central Government Health Scheme",
    category: "Central",
    coverage_amount: 9999999.99, // Represents Unlimited/Full coverage
    target_audience: "Central Government Employees & Pensioners",
    state_applicable: "All India",
    benefits_covered: [
      "OPD Treatment",
      "Indoor treatment at government and empanelled hospitals",
      "Investigations at government and empanelled centers",
      "Cashless facility available in empanelled hospitals",
      "Family welfare & maternity child health services",
    ],
    premium_amount: null, // Variable deducted from salary
    empanelled_hospitals: 1500,
    is_active: true,
  },
  {
    scheme_id: "ESIC",
    scheme_name: "Employees' State Insurance Scheme",
    category: "Employee",
    coverage_amount: 9999999.99, // Full coverage
    target_audience: "Factory workers and employees earning < ₹21,000/month",
    state_applicable: "All India",
    benefits_covered: [
      "Sickness Benefit",
      "Maternity Benefit",
      "Disablement Benefit",
      "Dependants' Benefit",
      "Medical Benefit for self & family",
    ],
    premium_amount: null, // Percentage of wages
    empanelled_hospitals: 2000,
    is_active: true,
  },
];

const criteria = [
  // Ayushman Bharat Criteria
  {
    scheme_id: "AYUSHMAN",
    criteria_type: "income",
    operator: "<=",
    value: "250000",
  },
  {
    scheme_id: "AYUSHMAN",
    criteria_type: "has_bpl_card",
    operator: "==",
    value: "true",
  },
  // CGHS Criteria
  {
    scheme_id: "CGHS",
    criteria_type: "employment_type",
    operator: "includes",
    value: '["Central Govt Employee", "Pensioner"]',
  },
  // ESIC Criteria
  {
    scheme_id: "ESIC",
    criteria_type: "income",
    operator: "<=",
    value: "252000", // Monthly 21000 * 12
  },
  {
    scheme_id: "ESIC",
    criteria_type: "employment_type",
    operator: "includes",
    value: '["Factory Worker", "Employee"]',
  },
];

async function seedData() {
  console.log("Starting seed process...");

  // 1. Clear existing data to prevent duplicates during multiple seed runs
  console.log("Clearing existing data...");
  const { error: deleteCriteriaError } = await supabase
    .from("eligibility_criteria")
    .delete()
    .neq("criteria_id", 0);
  
  if (deleteCriteriaError) {
      console.warn("Could not clear criteria, might be empty", deleteCriteriaError);
  }

  const { error: deleteSchemesError } = await supabase
    .from("government_schemes")
    .delete()
    .neq("scheme_id", "");
  
  if (deleteSchemesError) {
      console.warn("Could not clear schemes, might be empty", deleteSchemesError);
  }

  // 2. Insert Schemes
  console.log("Inserting government schemes...");
  const { data: schemesData, error: schemesError } = await supabase
    .from("government_schemes")
    .insert(schemes)
    .select();

  if (schemesError) {
    console.error("Error inserting schemes:", schemesError);
    return;
  }
  console.log(`Successfully inserted ${schemesData.length} schemes.`);

  // 3. Insert Criteria
  console.log("Inserting eligibility criteria...");
  const { data: criteriaData, error: criteriaError } = await supabase
    .from("eligibility_criteria")
    .insert(criteria)
    .select();

  if (criteriaError) {
    console.error("Error inserting criteria:", criteriaError);
    return;
  }
  console.log(`Successfully inserted ${criteriaData.length} criteria.`);

  console.log("Seed process completed successfully.");
}

seedData().catch(console.error);
