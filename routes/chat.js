/* ================================================================
   SensiQ — AI Chat API Route
   POST /api/chat  → calls Gemini or OpenAI, returns AI answer
   ================================================================ */
"use strict";

const express = require("express");
const router  = express.Router();

const GEMINI_KEY  = process.env.GEMINI_API_KEY  || "";
const OPENAI_KEY  = process.env.OPENAI_API_KEY  || "";
const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();

const SYSTEM_PROMPT = `You are SensiQ Assistant, a helpful AI embedded in SensiQ — an inclusive e-learning platform built for Deaf, Mute, and Visually Impaired learners. 

SensiQ offers:
- 5 learning categories: Deaf, Mute, Visually Impaired, Deaf & Mute, Mute & Visually Impaired
- 3 assistive tools: Speech-to-Text, Text-to-Speech, Text-to-Sign (ISL fingerspelling)
- Voice Navigation, High Contrast Mode, keyboard shortcuts
- Courses on Introduction to Computer, Internet, Communication, Resume Building, AI

Answer every user question clearly and helpfully. For platform questions, give specific SensiQ guidance. For general knowledge questions (coding, science, math, etc.), answer fully. Keep responses concise but complete. Use bullet points where helpful.`;

/* ── Gemini handler — tries multiple models as fallbacks ── */
async function askGemini(userMessage, apiKey) {
  const fetch = (await import("node-fetch")).default;

  // Models in priority order — tested and verified
  const MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.7-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  const body = {
    contents: [
      { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nUser: " + userMessage }] }
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
  };

  let lastError = "";
  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.status === 429) {
        // Rate limited on this model — try next
        lastError = "rate_limit";
        console.warn(`[Gemini] ${model} rate-limited, trying next model...`);
        continue;
      }
      if (!res.ok) {
        lastError = data.error?.message || `Status ${res.status}`;
        console.warn(`[Gemini] ${model} error ${res.status}: ${lastError}`);
        // If API key is invalid or quota exceeded, stop trying further models
        if (data.error?.message?.includes("API key not valid") || data.error?.status === "INVALID_ARGUMENT") {
          throw new Error(data.error.message || "Invalid Gemini API Key");
        }
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`[Gemini] Answered using ${model}`);
        return text;
      }
    } catch (err) {
      lastError = err.message;
      if (err.message?.includes("API key not valid") || err.message?.includes("Invalid Gemini API Key")) {
        throw err;
      }
      console.warn(`[Gemini] ${model} threw: ${err.message}`);
    }
  }

  // All models failed
  if (lastError === "rate_limit") {
    throw new Error("RATE_LIMIT");
  }
  throw new Error("All Gemini models failed: " + lastError);
}

/* ── OpenAI handler ── */
async function askOpenAI(userMessage, apiKey) {
  const fetch = (await import("node-fetch")).default;
  const url = "https://api.openai.com/v1/chat/completions";

  const body = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: userMessage }
    ],
    max_tokens: 500,
    temperature: 0.7
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("OpenAI error: " + err);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
}

/* ── POST /api/chat ── */
router.post("/api/chat", express.json(), async (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required." });
  }

  const geminiKey  = (process.env.GEMINI_API_KEY || "").trim();
  const openAiKey  = (process.env.OPENAI_API_KEY || "").trim();
  const aiProvider = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  try {
    let reply;

    if (aiProvider === "openai" && openAiKey && openAiKey !== "your_openai_api_key_here") {
      try {
        reply = await askOpenAI(message.trim(), openAiKey);
      } catch (err) {
        console.warn("OpenAI failed, falling back to Gemini:", err.message);
        if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
          reply = await askGemini(message.trim(), geminiKey);
        } else {
          throw err;
        }
      }
    } else if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
      try {
        reply = await askGemini(message.trim(), geminiKey);
      } catch (err) {
        if (err.message === "RATE_LIMIT") {
          return res.json({
            reply: "⏳ I'm temporarily rate-limited by Google's free tier. Please wait a minute and try again, or ask a shorter question!"
          });
        }
        if (openAiKey && openAiKey !== "your_openai_api_key_here") {
          console.warn("Gemini failed, falling back to OpenAI:", err.message);
          reply = await askOpenAI(message.trim(), openAiKey);
        } else {
          throw err;
        }
      }
    } else {
      return res.json({
        reply: "⚠️ AI is not configured yet. Please make sure your GEMINI_API_KEY is placed in the `.env` file (not .env.example) and restart the server."
      });
    }

    res.json({ reply });

  } catch (err) {
    console.error("Chat API error:", err.message);
    res.status(500).json({
      reply: `Sorry, I'm having trouble connecting to AI (${err.message}). Please make sure your GEMINI_API_KEY in .env is a valid key from Google AI Studio (starts with AIzaSy...) and restart the server.`
    });
  }
});

module.exports = router;
