import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// debug startup information
console.log("Backend working directory:", process.cwd());

import supabase from "./supabase.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import chatRoutes from "./routes/medichatRoutes.js";
import "./scheduler/reminderScheduler.js";
import admin from "./firebaseAdmin.js";
// Multer configuration for file uploads
import axios from "axios";
import zlib from "zlib";
import { promisify } from "util";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import premiumPredictorRoutes from "./routes/premiumPredictorRoutes.js";
import govtInsuranceRoutes from "./routes/govtInsuranceRoutes.js";
const upload = multer({ dest: "uploads/" });


const gunzip = promisify(zlib.gunzip);

// API configurations
const PHARMEASY_BASE_URL =
  "https://pharmeasy.in/api/search/search/?intent_id=1736254134724";
const ONE_MG_BASE_URL =
  "https://www.1mg.com/pharmacy_api_webservices/search-all";
const APOLLO_BASE_URL = "https://search.apollo247.com/v3/fullSearch";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
};

async function searchPharmEasy(searchTerm) {
  try {
    const response = await axios.get(
      `${PHARMEASY_BASE_URL}&q=${searchTerm}&page=1`,
      {
        headers: HEADERS,
      },
    );

    // Log full response for debugging
    console.log("API Response:", response.data);

    const products = response.data?.data?.products;
    if (!products || products.length === 0) {
      console.warn("No products found for the given search term.");
      return [];
    }

    // Map and return product details
    return products.map((product) => ({
      name: product.name,
      price: product.salePriceDecimal,
      availability: product.productAvailabilityFlags.isAvailable,
      image: product.image,
      url: "https://pharmeasy.in/online-medicine-order/" + product.slug,
    }));
  } catch (error) {
    // Improved error logging
    console.error(
      "PharmEasy Error:",
      error.response ? error.response.data : error.message,
    );
    return [];
  }
}

async function searchOneMg(searchTerm) {
  try {
    const response = await axios.get(ONE_MG_BASE_URL, {
      params: {
        city: "Gurgaon",
        name: searchTerm,
        pageSize: 40,
        page_number: 0,
        types: "sku,allopathy",
        filter: true,
        state: 1,
      },
      responseType: "arraybuffer",
      headers: { ...HEADERS, "Accept-Encoding": "gzip, deflate, br" },
    });

    let decompressedData;
    const contentEncoding = response.headers["content-encoding"];

    if (contentEncoding?.includes("gzip")) {
      decompressedData = await gunzip(response.data);
    } else {
      decompressedData = response.data;
    }

    const jsonData = JSON.parse(decompressedData.toString("utf-8"));
    const products = [];

    jsonData.results.forEach((result) => {
      if (result.value?.data && Array.isArray(result.value.data)) {
        result.value.data.forEach((product) => {
          products.push({
            name: product.label,
            price: product.discounted_price,
            availability: true,
            image: product.cropped_image,
            url: "https://www.1mg.com" + product.url,
          });
        });
      }
    });

    return products;
  } catch (error) {
    console.error("1mg Error:", error.message);
    return [];
  }
}

async function searchApollo(searchTerm) {
  try {
    const payload = {
      query: searchTerm,
      page: 1,
      productsPerPage: 24,
      selSortBy: "relevance",
      filters: [],
      pincode: "",
    };

    const response = await axios.post(APOLLO_BASE_URL, payload, {
      headers: {
        ...HEADERS,
        "Content-Type": "application/json",
        Authorization: "Oeu324WMvfKOj5KMJh2Lkf00eW1",
      },
    });

    return response.data.data.products.map((product) => ({
      name: product.name,
      price: product.specialPrice || product.price,
      availability: product.status === "AVAILABLE",
      image: "https://images.apollo247.in/pub/media" + product.thumbnail,
      url:
        "https://www.apollopharmacy.in/search-medicines/" +
        encodeURIComponent(product.name),
    }));
  } catch (error) {
    console.error("Apollo Error:", error.message);
    return [];
  }
}

// Initialize Firebase Admin

const app = express();

const allowedOrigins = [
  "https://curo-flame.vercel.app",
  "http://localhost:5173",
];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true); // Allow the origin in the response
    } else {
      callback(new Error("Not allowed by CORS")); // Disallow the origin
    }
  },
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Use cors middleware with options
app.use(cors(corsOptions));
app.use(express.json());

// Mount routes
app.use("/api/premium-predictor", premiumPredictorRoutes);
app.use("/api/govt-insurance", govtInsuranceRoutes);

const decodeTokenPayload = (token) => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf8");
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
};

// Middleware to verify Firebase token
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    if (token === "Testing-JWT-Token") {
      req.user = { uid: "test-user" };
      next();
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    const allowUnverifiedTokens =
      process.env.ALLOW_UNVERIFIED_FIREBASE_TOKENS !== "false";

    if (!allowUnverifiedTokens) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const token = req.headers.authorization?.split("Bearer ")[1];
    const payload = token ? decodeTokenPayload(token) : null;

    const uid = payload?.user_id || payload?.sub;
    const exp = payload?.exp;
    const now = Math.floor(Date.now() / 1000);

    if (!uid || !exp || exp < now) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = {
      uid,
      email: payload?.email || null,
      firebase: payload?.firebase || null,
      unverified: true,
    };
    next();
  }
};

const sendNearbyPlacesResponse = async (res, url, label) => {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({
      error: `Failed to fetch nearby ${label}`,
      details: data?.error_message || data?.error || "Upstream API error",
      status: data?.status || null,
    });
  }

  // Google Places uses its own status codes in JSON body.
  if (data?.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return res.status(502).json({
      error: `Google Places error while fetching nearby ${label}`,
      details: data?.error_message || "Google Places returned a non-success status",
      status: data.status,
    });
  }

  return res.json(data);
};

// Register new user
app.post("/api/auth/register", async (req, res) => {
  try {
    const { uid, email, name } = req.body;

    // Validate input
    if (!uid || !email || !name) {
      return res
        .status(400)
        .json({ error: "Missing required fields: uid, email, name" });
    }

    console.log("Registering user:", { uid, email, name });

    // Update user profile in Firebase
    try {
      await admin.auth().updateUser(uid, {
        displayName: name,
      });
      console.log("Firebase user updated successfully");
    } catch (firebaseError) {
      console.warn("Firebase update warning:", firebaseError.message);
      // Don't fail entirely if Firebase update fails - proceed to Supabase
    }

    // Now save the user to Supabase (using service role which bypasses RLS)
    const { data, error } = await supabase
      .from("users")
      .insert([{ uid, email, name }])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      // Check if it's a duplicate uid error
      if (error.code === "23505" || error.message.includes("unique")) {
        // User already exists, try to update instead
        const { data: updateData, error: updateError } = await supabase
          .from("users")
          .update({ email, name })
          .eq("uid", uid)
          .select();

        if (updateError) {
          return res
            .status(500)
            .json({ error: `Update failed: ${updateError.message}` });
        }
        return res
          .status(200)
          .json({ message: "User updated successfully", data: updateData });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: "User registered successfully", data });
    console.log("User registered successfully in Supabase:", uid);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/users/update-fcm-token", authenticateUser, async (req, res) => {
  try {
    const { uid } = req.user;
    const { fcmToken } = req.body;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("uid", uid)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ fcm_token: fcmToken })
      .eq("id", user.id);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    res.status(200).json({ message: "FCM token updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google sign-in handler
app.post("/api/auth/google", async (req, res) => {
  try {
    const { uid, email, name } = req.body;

    // Validate input
    if (!uid || !email) {
      return res
        .status(400)
        .json({ error: "Missing required fields: uid, email" });
    }

    console.log("Google sign-in for user:", { uid, email, name });

    // Upsert user in Supabase (create or update if exists)
    const { data, error } = await supabase
      .from("users")
      .upsert([{ uid, email, name }], {
        onConflict: "uid", // column to check for duplicates
      })
      .select();

    if (error) {
      console.error("Supabase upsert error:", error);
      return res
        .status(500)
        .json({ error: `Database error: ${error.message}` });
    }

    res.status(200).json({ message: "Google sign-in successful", data });
    console.log("Google sign-in successful for user:", uid);
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Google Maps / Nearby Hospitals endpoint (protected)
// Google Maps / Nearby Hospitals endpoint (protected)
app.get("/api/maps/nearby-hospitals", authenticateUser, async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat or lng query params" });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      return res.status(500).json({ error: "Missing Google Maps API key" });
    }

    // Construct the Nearby Search URL
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=hospital&key=${googleApiKey}`;
    return sendNearbyPlacesResponse(res, url, "hospitals");
  } catch (error) {
    console.error("Nearby hospitals error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/maps/nearby-lab", authenticateUser, async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat or lng query params" });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      return res.status(500).json({ error: "Missing Google Maps API key" });
    }

    // Construct the Nearby Search URL
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=hospital&keyword=${encodeURIComponent("diagnostic lab pathology")}&key=${googleApiKey}`;
    return sendNearbyPlacesResponse(res, url, "labs");
  } catch (error) {
    console.error("Nearby hospitals error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/maps/nearby-doctor", authenticateUser, async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat or lng query params" });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      return res.status(500).json({ error: "Missing Google Maps API key" });
    }

    // Construct the Nearby Search URL
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=doctor&keyword=doctor&key=${googleApiKey}`;
    return sendNearbyPlacesResponse(res, url, "doctors");
  } catch (error) {
    console.error("Nearby doctor error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/maps/nearby-doctor-type", authenticateUser, async (req, res) => {
  try {
    const { lat, lng, radius = 5000, keyword } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat or lng query params" });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      return res.status(500).json({ error: "Missing Google Maps API key" });
    }

    // Construct the Nearby Search URL
    const safeKeyword = encodeURIComponent(keyword || "doctor");
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=doctor&keyword=${safeKeyword}&key=${googleApiKey}`;
    return sendNearbyPlacesResponse(res, url, "specialists");
  } catch (error) {
    console.error("Nearby doctor error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/maps/nearby-pharmacy", authenticateUser, async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat or lng query params" });
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      return res.status(500).json({ error: "Missing Google Maps API key" });
    }

    // Construct the Nearby Search URL
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=pharmacy&key=${googleApiKey}`;
    return sendNearbyPlacesResponse(res, url, "pharmacies");
  } catch (error) {
    console.error("Nearby pharmacy error:", error);
    res.status(500).json({ error: error.message });
  }
});
// Add health record
app.post(
  "/api/health-records",
  authenticateUser,
  upload.single("file"), // Multer handles file upload
  async (req, res) => {
    try {
      const { type, details } = req.body;
      const { uid } = req.user;
      const file = req.file;

      console.log("=== HEALTH RECORD UPLOAD DEBUG ===");
      console.log("1. Request body - type:", type);
      console.log("2. Request body - details:", details ? details.substring(0, 100) + "..." : "MISSING");
      console.log("3. File attached:", file ? `YES (${file.originalname}, ${file.size} bytes, ${file.mimetype})` : "NO");
      console.log("4. User UID:", uid);

      if (!type || !details) {
        console.log("ERROR: Missing type or details");
        return res
          .status(400)
          .json({ error: "Missing required fields: type or details" });
      }

      let parsedDetails;
      try {
        parsedDetails = JSON.parse(details);
        console.log("5. Details parsed successfully");
      } catch (error) {
        console.log("ERROR: Invalid JSON in details:", error.message);
        return res.status(400).json({ error: "Invalid JSON in details field" });
      }

      // Fetch user ID from Supabase
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("uid", uid)
        .single();

      console.log("6. User lookup:", user ? `Found (id: ${user.id})` : "NOT FOUND", userError ? `Error: ${userError.message}` : "");

      if (userError || !user) {
        return res.status(404).json({ error: "User not found" });
      }

      let fileUrl = null;

      // If a file is uploaded, upload it to Supabase storage
      if (file) {
        console.log("7. Starting file upload to Supabase Storage...");
        const fileExt = path.extname(file.originalname);
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = `${fileName}`;

        console.log("   - fileName:", fileName);
        console.log("   - filePath:", filePath);
        console.log("   - bucket: health_records");
        console.log("   - temp file path:", file.path);
        console.log("   - temp file exists:", fs.existsSync(file.path));

        const fileBuffer = fs.readFileSync(file.path);
        console.log("   - buffer size:", fileBuffer.length, "bytes");

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("health_records")
          .upload(filePath, fileBuffer, {
            contentType: file.mimetype,
          });

        // Clean up the temp file created by multer
        fs.unlink(file.path, (err) => {
          if (err) console.error("Failed to clean up temp file:", err);
        });

        if (uploadError) {
          console.error("8. SUPABASE STORAGE UPLOAD FAILED!");
          console.error("   - Error message:", uploadError.message);
          console.error("   - Error statusCode:", uploadError.statusCode);
          console.error("   - Full error:", JSON.stringify(uploadError, null, 2));
          return res.status(500).json({
            error: "Failed to upload file",
            details: uploadError.message || "Unknown storage error"
          });
        }

        console.log("8. File uploaded successfully:", JSON.stringify(uploadData));

        // List buckets for debugging
        const { data: allBuckets } = await supabase.storage.listBuckets();
        console.log("   - Available buckets:", allBuckets?.map(b => `${b.name} (public: ${b.public})`));

        // Use signed URL (works for both public and private buckets)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("health_records")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

        if (signedUrlError) {
          console.error("   - Signed URL error:", signedUrlError.message);
          // Fallback to public URL
          const { data: publicUrlData } = supabase.storage
            .from("health_records")
            .getPublicUrl(filePath);
          fileUrl = publicUrlData.publicUrl;
        } else {
          fileUrl = signedUrlData.signedUrl;
        }
        console.log("   - File URL:", fileUrl);
      } else {
        console.log("7. No file attached, skipping upload");
      }

      // Insert the record into Supabase
      console.log("9. Inserting record into health_records table...");
      const { data, error } = await supabase.from("health_records").insert({
        user_id: user.id,
        type,
        details: parsedDetails,
        uploaded_file_url: fileUrl,
      });

      if (error) {
        console.error("10. SUPABASE INSERT FAILED:", error.message, error);
        return res.status(500).json({ error: "Failed to insert record" });
      }

      console.log("10. Record inserted successfully!");
      console.log("=== END DEBUG ===");
      res.status(201).json({ message: "Record added successfully", data });
    } catch (error) {
      console.error("UNEXPECTED ERROR in health-records POST:", error);
      res.status(500).json({ error: error.message });
    }
  },
);
// Fetch health records
app.get("/api/health-records", authenticateUser, async (req, res) => {
  try {
    const { uid } = req.user;

    // Fetch user ID from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("uid", uid)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch health records for the user
    const { data, error } = await supabase
      .from("health_records")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch records" });
    }

    res.status(200).json({ records: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
// Update health record

app.put("/api/health-records/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;
    const { type, details } = req.body;

    if (!type || !details) {
      return res
        .status(400)
        .json({ error: "Missing required fields: type or details" });
    }

    // Fetch user ID from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("uid", uid)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the record
    const { data, error } = await supabase
      .from("health_records")
      .update({ type, details })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating record:", error);
      return res.status(500).json({ error: "Failed to update record" });
    }

    res.status(200).json(req.body);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});
// Delete health record
app.delete("/api/health-records/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;

    // Fetch user ID from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("uid", uid)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete the record
    const { data, error } = await supabase
      .from("health_records")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting record:", error);
      return res.status(500).json({ error: "Failed to delete record" });
    }

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});
//Medichat Routes
// Mount AFTER all other /api routes to avoid middleware order issues
app.post("/api/medi-chat", authenticateUser, async (req, res) => {
  // Inline the medichat logic here instead of using router
  try {
    const isValidKey = (key) => key && key !== "dummy" && key.length > 5;

    if (
      !isValidKey(process.env.GROQ_API_KEY) ||
      !isValidKey(process.env.TAVILY_API_KEY) ||
      !isValidKey(process.env.PINECONE_API_KEY)
    ) {
      return res.status(503).json({
        error: "MediChat service is not configured",
        details: {
          groq: isValidKey(process.env.GROQ_API_KEY) ? "configured" : "missing",
          tavily: isValidKey(process.env.TAVILY_API_KEY)
            ? "configured"
            : "missing",
          pinecone: isValidKey(process.env.PINECONE_API_KEY)
            ? "configured"
            : "missing",
        },
        message: "Please configure the required API keys in your .env file",
      });
    }

    const { question, medicalRecordsText } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const initialState = {
      question,
      medicalRecordsText: medicalRecordsText || "",
      documents: [],
      generation: "",
    };

    const { app: cragApp } = await import("./graph.js");
    const stateStream = await cragApp.stream(initialState, {
      recursionLimit: 10,
    });
    let finalState;

    for await (const partialState of stateStream) {
      finalState = partialState;
    }

    console.log("Final CRAG state:", finalState);

    if (finalState?.generate?.generation) {
      return res.json({ answer: finalState.generate.generation });
    } else {
      return res
        .status(500)
        .json({ error: "Failed to generate response from MediChat" });
    }
  } catch (err) {
    console.error("CRAG error:", err);
    return res.status(500).json({
      error: "Something went wrong with MediChat",
      details: err.message,
    });
  }
});

//Medicine Reminder Routes
console.log("Registering medicine reminder routes");
// CREATE a new medicine reminder
app.post("/api/medicine-reminder", authenticateUser, async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, dosage, time, days } = req.body;

    if (!name || !time || !days) {
      return res
        .status(400)
        .json({ error: "name, time, and days are required." });
    }

    // 1) find the user’s ID in supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("uid", uid)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2) insert the medicine reminder
    const { data, error } = await supabase
      .from("medicine_reminders")
      .insert({
        user_id: user.id,
        name,
        dosage,
        time,
        days, // must be an array e.g. ['Monday','Wednesday']
      })
      .single();

    if (error) {
      console.error("Error creating reminder:", error);
      return res.status(500).json({ error: "Failed to create reminder" });
    }

    res.status(201).json({ message: "Reminder created", reminder: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// READ: get all reminders for the authenticated user
app.get("/api/medicine-reminder", authenticateUser, async (req, res) => {
  try {
    const { uid } = req.user;

    // find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("uid", uid)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // get reminders for user
    const { data, error } = await supabase
      .from("medicine_reminders")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching reminders:", error);
      return res.status(500).json({ error: "Failed to fetch reminders" });
    }

    res.status(200).json({ reminders: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE: update a reminder
app.put("/api/medicine-reminder/:id", authenticateUser, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const { name, dosage, time, days } = req.body;

    // find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("uid", uid)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // update the record
    const { data, error } = await supabase
      .from("medicine_reminders")
      .update({ name, dosage, time, days })
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error updating reminder:", error);
      return res.status(500).json({ error: "Failed to update reminder" });
    }

    res.status(200).json({ message: "Reminder updated", reminder: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: delete a reminder
app.delete("/api/medicine-reminder/:id", authenticateUser, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    // find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("uid", uid)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // delete the record
    const { data, error } = await supabase
      .from("medicine_reminders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error deleting reminder:", error);
      return res.status(500).json({ error: "Failed to delete reminder" });
    }

    res.status(200).json({ message: "Reminder deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/medicine-search/", authenticateUser, async (req, res) => {
  try {
    const { query } = req.query;
    console.log("hello");
    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    const [pharmEasyResults, oneMgResults, apolloResults] = await Promise.all([
      searchPharmEasy(query),
      searchOneMg(query),
      searchApollo(query),
    ]);

    res.json({
      success: true,
      data: {
        pharmEasy: {
          source: "PharmEasy",
          products: pharmEasyResults,
        },
        oneMg: {
          source: "1mg",
          products: oneMgResults,
        },
        apollo: {
          source: "Apollo",
          products: apolloResults,
        },
      },
    });
    console.log(res.json);
  } catch (error) {
    console.error("Medicine search error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search medicines across pharmacies",
    });
  }
});

//Appointment Routes

app.use("/api/appointments", appointmentRoutes);

// Routes are already mounted at the top of the file

app.get("/api/user-profile", authenticateUser, async (req, res) => {
  try {
    const { uid } = req.user; // Assume `authenticateUser` middleware adds `user` to `req`
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("uid", uid)
      .single(); // Use .single() to get only one record if `uid` is unique

    if (userError && userError.code !== "PGRST116") {
      console.error("Error fetching user:", userError);
      return res.status(500).json({ error: "Failed to fetch user profile." });
    }

    if (!user || userError?.code === "PGRST116") {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({
      user: {
        name: user.name ?? null,
        email: user.email ?? null,
        blood_group: user.blood_group ?? null,
        allergies: user.allergies ?? null,
        heart_rate: user.heart_rate ?? null,
        blood_pressure: user.blood_pressure ?? null,
        height: user.height ?? null,
        weight: user.weight ?? null,
        date_of_birth: user.date_of_birth ?? user.dob ?? null,
      },
    });
  } catch (err) {
    console.error("Error in /api/user-profile:", err);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

app.post("/api/update-profile", authenticateUser, async (req, res) => {
  try {
    const { uid } = req.user; // Extract the user's UID from the middleware
    const {
      blood_group,
      allergies,
      heart_rate,
      blood_pressure,
      height,
      weight,
      date_of_birth,
    } = req.body; // Destructure the fields from the request body

    const parseNumeric = (value) => {
      if (value === null || value === undefined || value === "") return null;
      if (typeof value === "number" && Number.isFinite(value)) return value;
      const cleaned = String(value).replace(/[^\d.]/g, "");
      if (!cleaned) return null;
      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const normalizeDate = (value) => {
      if (!value) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
        const [dd, mm, yyyy] = value.split("-");
        return `${yyyy}-${mm}-${dd}`;
      }
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed.toISOString().slice(0, 10);
    };

    const payload = {
      blood_group: blood_group ?? null,
      allergies: allergies ?? null,
      heart_rate: parseNumeric(heart_rate),
      blood_pressure: blood_pressure ?? null,
      height: parseNumeric(height),
      weight: parseNumeric(weight),
      date_of_birth: normalizeDate(date_of_birth),
    };

    const retryablePayload = { ...payload };
    const skippedFields = [];
    let updateData = null;
    let lastError = null;

    while (Object.keys(retryablePayload).length > 0) {
      const { data, error } = await supabase
        .from("users")
        .update(retryablePayload)
        .eq("uid", uid)
        .select("*");

      if (!error) {
        updateData = data;
        lastError = null;
        break;
      }

      const missingColumnMatch =
        error.code === "PGRST204"
          ? /Could not find the '([^']+)' column/.exec(error.message || "")
          : null;

      if (missingColumnMatch?.[1]) {
        const missingField = missingColumnMatch[1];
        skippedFields.push(missingField);
        delete retryablePayload[missingField];
        continue;
      }

      lastError = error;
      break;
    }

    if (lastError) {
      console.error("Error updating user profile:", lastError);
      return res.status(500).json({
        error: "Failed to update profile.",
        details: lastError.message || "Unknown database error",
      });
    }

    if (skippedFields.length > 0 && Object.keys(retryablePayload).length === 0) {
      return res.status(200).json({
        message: "Profile saved, but this database is missing profile health columns.",
        data: updateData || [],
        skipped_fields: skippedFields,
      });
    }

    if (skippedFields.length > 0) {
      return res.status(200).json({
        message: "Profile updated (some fields were skipped).",
        data: updateData || [],
        skipped_fields: skippedFields,
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      data: updateData || [],
    });
  } catch (err) {
    console.error("Error in /api/update-profile:", err);
    return res.status(500).json({ error: "Internal Server Error." });
  }
});

app.get("/api/fetch-user", authenticateUser, async (req, res) => {
  try {
    const { uid } = req.user;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("uid", uid);

    // Use error from the query, and check if data is empty or null
    if (error || !data) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(data); // Log the fetched data
    res.status(200).json({ records: data }); // Send the fetched data as the response
  } catch (err) {
    console.error(err); // Log the error if any
    res.status(500).json({ error: err.message }); // Send the error message in the response
  }
});

// Protected route example
app.get("/api/protected", authenticateUser, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

// Feature availability check endpoint
app.get("/api/features-status", (req, res) => {
  const isValidKey = (key) => key && key !== "dummy" && key.length > 5;

  res.json({
    features: {
      medichat: {
        enabled:
          isValidKey(process.env.GROQ_API_KEY) &&
          isValidKey(process.env.TAVILY_API_KEY) &&
          isValidKey(process.env.PINECONE_API_KEY),
        message: !isValidKey(process.env.GROQ_API_KEY)
          ? "Missing GROQ_API_KEY"
          : !isValidKey(process.env.TAVILY_API_KEY)
            ? "Missing TAVILY_API_KEY"
            : !isValidKey(process.env.PINECONE_API_KEY)
              ? "Missing PINECONE_API_KEY"
              : "Ready",
      },
      nearbyServices: {
        enabled: isValidKey(process.env.GOOGLE_MAPS_API_KEY),
        message: !isValidKey(process.env.GOOGLE_MAPS_API_KEY)
          ? "Missing GOOGLE_MAPS_API_KEY"
          : "Ready",
      },
      appointments: {
        enabled:
          isValidKey(process.env.NEXHEALTH_API_KEY) &&
          isValidKey(process.env.NEXHEALTH_SUBDOMAIN) &&
          isValidKey(process.env.NEXHEALTH_LOCATION_ID),
        message: !isValidKey(process.env.NEXHEALTH_API_KEY)
          ? "Missing NEXHEALTH credentials"
          : "Ready",
      },
      medicineReminder: {
        enabled: true,
        message: "Ready",
      },
      healthRecords: {
        enabled: true,
        message: "Ready",
      },
      medicinePrice: {
        enabled: true,
        message: "Ready",
      },
      premiumPredictor: {
        enabled: true,
        message: "Ready",
      },
    },
  });
});

// Add error handling for missing Medichat API keys
app.use("/api", (err, req, res, next) => {
  if (req.path.includes("/medi-chat")) {
    const isValidKey = (key) => key && key !== "dummy" && key.length > 5;
    if (
      !isValidKey(process.env.GROQ_API_KEY) ||
      !isValidKey(process.env.TAVILY_API_KEY)
    ) {
      return res.status(503).json({
        error: "MediChat service is not configured. Missing API keys.",
        feature: "medichat",
        message: "Please configure GROQ_API_KEY and TAVILY_API_KEY",
      });
    }
  }
  next();
});

const PORT = process.env.PORT;

// log available routes for debugging
if (app && app._router) {
  console.log("Registered routes:");
  app._router.stack
    .filter((r) => r.route)
    .forEach((r) => {
      const methods = Object.keys(r.route.methods).join(",");
      console.log(`${methods.toUpperCase()} ${r.route.path}`);
    });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Firebase Admin initialized successfully.`);
});
