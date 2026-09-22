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

/* System context so the AI knows it's inside SensiQ */
const SYSTEM_PROMPT = `You are SensiQ Assistant, a helpful AI embedded in SensiQ — an inclusive e-learning platform built for Deaf, Mute, and Visually Impaired learners. 

SensiQ offers:
- 5 learning categories: Deaf, Mute, Visually Impaired, Deaf & Mute, Mute & Visually Impaired
- 3 assistive tools: Speech-to-Text, Text-to-Speech, Text-to-Sign (ISL fingerspelling)
- Voice Navigation, High Contrast Mode, keyboard shortcuts
- Courses on Introduction to Computer, Internet, Communication, Resume Building, AI

Answer every user question clearly and helpfully. For platform questions, give specific SensiQ guidance. For general knowledge questions (coding, science, math, etc.), answer fully. Keep responses concise but complete. Use bullet points where helpful.`;

/* ── Gemini handler — tries multiple models as fallbacks ── */
async function askGemini(userMessage) {
  const fetch = (await import("node-fetch")).default;

  // Models in priority order — if one is rate-limited, try the next
  const MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ];

  const body = {
    contents: [
      { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nUser: " + userMessage }] }
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
  };

  let lastError = "";
  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_KEY}`;
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
        lastError = data.error?.message || "unknown error";
        console.warn(`[Gemini] ${model} error ${res.status}: ${lastError}`);
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`[Gemini] Answered using ${model}`);
        return text;
      }
    } catch (err) {
      lastError = err.message;
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
async function askOpenAI(userMessage) {
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
      "Authorization": "Bearer " + OPENAI_KEY
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

  try {
    let reply;

    if (AI_PROVIDER === "openai" && OPENAI_KEY && OPENAI_KEY !== "your_openai_api_key_here") {
      try {
        reply = await askOpenAI(message.trim());
      } catch (err) {
        console.warn("OpenAI failed, falling back to Gemini:", err.message);
        reply = await askGemini(message.trim());
      }
    } else if (GEMINI_KEY && GEMINI_KEY !== "your_gemini_api_key_here") {
      try {
        reply = await askGemini(message.trim());
      } catch (err) {
        if (err.message === "RATE_LIMIT") {
          return res.json({
            reply: "⏳ I'm temporarily rate-limited by Google's free tier. Please wait a minute and try again, or ask a shorter question!"
          });
        }
        console.warn("Gemini failed, falling back to OpenAI:", err.message);
        if (OPENAI_KEY && OPENAI_KEY !== "your_openai_api_key_here") {
          reply = await askOpenAI(message.trim());
        } else {
          throw err;
        }
      }
    } else {
      return res.json({
        reply: "⚠️ AI is not configured yet. Please add your GEMINI_API_KEY in the .env file."
      });
    }

    res.json({ reply });

  } catch (err) {
    console.error("Chat API error:", err.message);
    res.status(500).json({
      reply: "Sorry, I'm having trouble connecting to AI right now. Please try again in a moment."
    });
  }
});

module.exports = router;
