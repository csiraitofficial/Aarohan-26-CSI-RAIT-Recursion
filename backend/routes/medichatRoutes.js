// routes/medichatRoutes.mjs
import express from "express";
import { app as cragApp } from "../graph.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

const isValidKey = (key) => key && key !== "dummy" && key.length > 5;

router.post("/medi-chat", authenticateUser, async (req, res) => {
  try {
    // Check if required API keys are configured
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

    // The initial CRAG state
    const initialState = {
      question,
      medicalRecordsText: medicalRecordsText || "",
      documents: [],
      generation: "",
    };

    // Get the async iterator
    const stateStream = await cragApp.stream(initialState, {
      recursionLimit: 10,
    });
    let finalState;

    // Iterate over the stream to capture the last partial state
    for await (const partialState of stateStream) {
      finalState = partialState;
    }

    // finalState should now hold the "final" result of the CRAG pipeline
    console.log("Final CRAG state:", finalState);

    // Return the final answer
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

export default router;
