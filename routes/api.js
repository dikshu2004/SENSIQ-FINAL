/* ================================================================
   SensiQ — API Routes
   POST /api/progress  — lesson progress tracking
   POST /api/stt       — audio → text via Gemini AI
   ================================================================ */
"use strict";

const express  = require("express");
const Progress = require("../models/progress");
const Course   = require("../models/course");
const { isLoggedIn } = require("../middleware/auth");

const router = express.Router();

/* ──────────────────────────────────────────────────────────────
   POST /api/progress
   Body: { courseId, lessonIndex (Number), totalLessons (Number) }
   ────────────────────────────────────────────────────────────── */
router.post("/api/progress", isLoggedIn, express.json(), async (req, res) => {
    try {
        const { courseId, lessonIndex, totalLessons } = req.body;

        if (!courseId || lessonIndex === undefined || lessonIndex === null || !totalLessons) {
            return res.status(400).json({ error: "Missing fields: courseId, lessonIndex, totalLessons." });
        }

        const idx   = parseInt(lessonIndex,  10);
        const total = parseInt(totalLessons, 10);

        if (isNaN(idx) || isNaN(total) || total <= 0 || idx < 0) {
            return res.status(400).json({ error: "lessonIndex and totalLessons must be positive numbers." });
        }

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ error: "Course not found." });

        const actualTotal = course.lessons.length || total;

        if (idx >= actualTotal) {
            return res.status(400).json({ error: `lessonIndex ${idx} out of range (course has ${actualTotal} lessons).` });
        }

        let progress = await Progress.findOne({ userId: req.user._id, courseId });
        if (!progress) {
            progress = new Progress({ userId: req.user._id, courseId, completedLessons: [], percentComplete: 0 });
        }

        if (!progress.completedLessons.includes(idx)) {
            progress.completedLessons.push(idx);
        }

        const completedCount     = Math.min(progress.completedLessons.length, actualTotal);
        progress.percentComplete = Math.round((completedCount / actualTotal) * 100);
        progress.lastAccessedAt  = new Date();

        await progress.save();

        return res.json({ success: true, percentComplete: progress.percentComplete, completedCount, totalLessons: actualTotal, lessonIndex: idx });

    } catch (err) {
        console.error("Progress API error:", err.message);
        return res.status(500).json({ error: "Server error: " + err.message });
    }
});

/* ──────────────────────────────────────────────────────────────
   POST /api/stt
   Body: { audio: "<base64 string>", mimeType: "audio/webm" }
   Returns: { success: true, transcript: "..." }

   Uses Gemini AI to transcribe audio — works in all browsers,
   on HTTP, and without any cloud speech service accounts.
   ────────────────────────────────────────────────────────────── */
router.post("/api/stt", express.json({ limit: "20mb" }), async (req, res) => {
    try {
        const { audio, mimeType } = req.body;

        if (!audio) {
            return res.status(400).json({ error: "No audio data provided." });
        }

        const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
        if (!GEMINI_KEY) {
            return res.status(500).json({ error: "Gemini API key not configured." });
        }

        const fetch = (await import("node-fetch")).default;

        /* Gemini models to try in order */
        const MODELS = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-2.5-flash-lite",
        ];

        const safeMime = (mimeType || "audio/webm").split(";")[0];

        const body = {
            contents: [{
                parts: [
                    {
                        inline_data: {
                            mime_type: safeMime,
                            data:      audio,   /* already base64 */
                        }
                    },
                    {
                        text: "Transcribe the English speech in this audio clip. Capitalize sentences and add appropriate punctuation. Return ONLY the transcribed text, without any explanations or extra text.",
                    }
                ]
            }],
            generationConfig: { temperature: 0, maxOutputTokens: 1024 },
        };

        let transcript = "";
        let lastError  = "";

        for (const model of MODELS) {
            const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_KEY}`;
            try {
                const r    = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                const data = await r.json();

                if (r.status === 429) { lastError = "rate_limit"; continue; }
                if (!r.ok) { lastError = data.error?.message || "api error"; continue; }

                transcript = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
                if (transcript) {
                    console.log(`[STT] Transcribed using ${model}: "${transcript.substring(0, 60)}..."`);
                    break;
                }
            } catch (e) {
                lastError = e.message;
                console.warn(`[STT] ${model} failed: ${e.message}`);
            }
        }

        if (!transcript && lastError === "rate_limit") {
            return res.status(429).json({ error: "AI is temporarily busy. Please wait a moment and try again." });
        }

        return res.json({ success: true, transcript });

    } catch (err) {
        console.error("STT API error:", err.message);
        return res.status(500).json({ error: "Transcription failed: " + err.message });
    }
});

module.exports = router;
