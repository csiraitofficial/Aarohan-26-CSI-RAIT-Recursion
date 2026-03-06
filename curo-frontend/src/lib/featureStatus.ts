// Feature status and availability checker
interface FeatureStatus {
  enabled: boolean;
  message: string;
}

interface FeaturesStatusResponse {
  features: {
    medichat: FeatureStatus;
    nearbyServices: FeatureStatus;
    appointments: FeatureStatus;
    medicineReminder: FeatureStatus;
    healthRecords: FeatureStatus;
    medicinePrice: FeatureStatus;
    premiumPredictor: FeatureStatus;
  };
}

let cachedStatus: FeaturesStatusResponse | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getFeaturesStatus(): Promise<FeaturesStatusResponse> {
  // Return cached status if still valid
  if (cachedStatus && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedStatus!;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/features-status`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch features status");
    }

    const data = await response.json();
    cachedStatus = data;
    cacheTime = Date.now();
    return data as FeaturesStatusResponse;
  } catch (error) {
    console.error("Error fetching features status:", error);

    // Return default status if fetch fails
    return {
      features: {
        medichat: { enabled: false, message: "Unable to check status" },
        nearbyServices: { enabled: false, message: "Unable to check status" },
        appointments: { enabled: false, message: "Unable to check status" },
        medicineReminder: { enabled: true, message: "Ready" },
        healthRecords: { enabled: true, message: "Ready" },
        medicinePrice: { enabled: true, message: "Ready" },
        premiumPredictor: { enabled: true, message: "Ready" },
      },
    };
  }
}

export async function isFeatureEnabled(feature: string): Promise<boolean> {
  const status = await getFeaturesStatus();
  const featureKey = feature as keyof typeof status.features;
  return status.features[featureKey]?.enabled ?? false;
}

export async function getFeatureMessage(feature: string): Promise<string> {
  const status = await getFeaturesStatus();
  const featureKey = feature as keyof typeof status.features;
  return status.features[featureKey]?.message ?? "Unknown feature";
}

export function getFallbackMessage(feature: string): string {
  const messages: { [key: string]: string } = {
    medichat:
      "MediChat AI Doctor is not currently available. Please configure API keys (GROQ_API_KEY, TAVILY_API_KEY, PINECONE_API_KEY).",
    nearbyServices:
      "Nearby Services feature is not available. Please configure GOOGLE_MAPS_API_KEY.",
    appointments:
      "Appointments feature is not available. Please configure NexHealth API credentials.",
    medicineReminder: "Medicine Reminder service is ready.",
    healthRecords: "Health Records service is ready.",
    medicinePrice: "Medicine Price Comparison service is ready.",
    premiumPredictor: "Insurance Premium Predictor service is ready.",
  };

  return messages[feature] || "Feature is not currently available.";
}
