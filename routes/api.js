/* ================================================================
   SensiQ — API Routes
   POST /api/progress  — lesson progress tracking
   POST /api/stt       — audio → text via Gemini AI
   ================================================================ */
"use strict";

const express  = require("express");
const passport = require("passport");
const nodemailer = require("nodemailer");
const Progress = require("../models/progress");
const Course   = require("../models/course");
const User     = require("../models/user");
const { isLoggedIn } = require("../middleware/auth");

const router = express.Router();

const CATEGORY_MAP = {
    deaf: { label: "Deaf Learners", icon: "fa-ear-deaf", desc: "Video modules with sign language support for better comprehension." },
    mute: { label: "Mute Learners", icon: "fa-microphone-lines-slash", desc: "Text to Speech & Speech to Text — listen to content and interact using your voice." },
    visually_impaired: { label: "Visually Impaired Learners", icon: "fa-eye-low-vision", desc: "Speech to Text & Text to Speech — dictate and listen for full audio accessibility." },
    deaf_mute: { label: "Deaf & Mute Learners", icon: "fa-hands-asl-interpreting", desc: "Sign language videos combined with Text to Speech & Speech to Text support." },
    mute_visually_impaired: { label: "Mute & Visually Impaired", icon: "fa-universal-access", desc: "Full TTS & STT support — listen to content and interact using your voice." },
};

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

/* ──────────────────────────────────────────────────────────────
   Auth APIs
   ────────────────────────────────────────────────────────────── */

router.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
        return res.json({ user: req.user });
    }
    return res.json({ user: null });
});

router.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({ error: (info && info.message) || "Invalid username or password." });
        }
        req.login(user, (loginErr) => {
            if (loginErr) return next(loginErr);
            let redirectUrl = "/dashboard";
            if (user.disabilityType && user.disabilityType !== "none") {
                redirectUrl = `/category/${user.disabilityType}`;
            }
            return res.json({ success: true, user, redirectUrl });
        });
    })(req, res, next);
});

router.post("/api/auth/signup", async (req, res, next) => {
    try {
        const { username, email, password, disabilityType } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email, and password are required." });
        }
        const newUser = new User({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            disabilityType: disabilityType || "none",
            profileComplete: !!disabilityType && disabilityType !== "none",
        });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            let redirectUrl = "/dashboard";
            if (registeredUser.disabilityType && registeredUser.disabilityType !== "none") {
                redirectUrl = `/category/${registeredUser.disabilityType}`;
            }
            return res.json({ success: true, user: registeredUser, redirectUrl });
        });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

router.all("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        return res.json({ success: true });
    });
});

/* ──────────────────────────────────────────────────────────────
   Course APIs
   ────────────────────────────────────────────────────────────── */

router.get("/api/courses", async (req, res) => {
    try {
        const q = (req.query.q || "").trim();
        let courses = [];
        if (q) {
            const regex = new RegExp(q, "i");
            courses = await Course.find({
                $or: [
                    { title: regex },
                    { description: regex },
                    { category: regex }
                ]
            });
        } else {
            courses = await Course.find({});
        }
        return res.json({ courses, searchQuery: q });
    } catch (err) {
        return res.status(500).json({ error: err.message, courses: [] });
    }
});

/* ──────────────────────────────────────────────────────────────
   Dashboard APIs
   ────────────────────────────────────────────────────────────── */

router.get("/api/dashboard", isLoggedIn, async (req, res) => {
    try {
        const user  = req.user;
        const dtype = user.disabilityType || "none";

        let courses = [];
        if (dtype !== "none") {
            courses = await Course.find({ category: dtype });
        } else {
            courses = await Course.find({});
        }

        const progressRecords = await Progress.find({ userId: user._id });
        const progressMap = {};
        progressRecords.forEach(r => { progressMap[r.courseId.toString()] = r; });

        const courseStats = courses.map(course => {
            const prog          = progressMap[course._id.toString()] || null;
            const totalLessons  = course.lessons.length;
            const completedLessons = prog
                ? Math.min(prog.completedLessons.length, totalLessons)
                : 0;
            const pct = prog ? prog.percentComplete : 0;

            let status = "not-started";
            if (pct === 100)           status = "completed";
            else if (completedLessons > 0) status = "in-progress";

            return {
                course,
                pct,
                totalLessons,
                completedLessons,
                remainingLessons: totalLessons - completedLessons,
                status,
                lastAccessedAt: prog ? prog.lastAccessedAt : null,
            };
        });

        const totalCourses     = courses.length;
        const totalCompleted   = courseStats.filter(s => s.status === "completed").length;
        const inProgress       = courseStats.filter(s => s.status === "in-progress").length;
        const notStarted       = courseStats.filter(s => s.status === "not-started").length;

        const totalLessonsAll      = courseStats.reduce((a, s) => a + s.totalLessons, 0);
        const completedLessonsAll  = courseStats.reduce((a, s) => a + s.completedLessons, 0);
        const overallPct = totalLessonsAll > 0
            ? Math.round((completedLessonsAll / totalLessonsAll) * 100)
            : 0;

        const catLabels = {
            deaf: "Deaf Learners",
            mute: "Mute Learners",
            visually_impaired: "Visually Impaired Learners",
            deaf_mute: "Deaf & Mute Learners",
            mute_visually_impaired: "Mute & Visually Impaired",
            none: "All Categories",
        };

        return res.json({
            user,
            dtype,
            catLabel: catLabels[dtype] || "All Categories",
            courseStats,
            totalCourses,
            totalCompleted,
            inProgress,
            notStarted,
            totalLessonsAll,
            completedLessonsAll,
            overallPct,
        });
    } catch (err) {
        console.error("Dashboard API error:", err);
        return res.status(500).json({ error: "Could not load dashboard." });
    }
});

router.post("/api/profile", isLoggedIn, async (req, res) => {
    try {
        const { disabilityType, highContrast, autoNarrate, fontSize } = req.body;
        const user = req.user;
        if (disabilityType) user.disabilityType = disabilityType;
        user.preferences = user.preferences || {};
        user.preferences.highContrast = highContrast === true || highContrast === "on";
        user.preferences.autoNarrate  = autoNarrate  === true || autoNarrate  === "on";
        if (fontSize) user.preferences.fontSize = fontSize;
        user.profileComplete = true;
        await user.save();
        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ error: "Could not update profile." });
    }
});

/* ──────────────────────────────────────────────────────────────
   Category & Course APIs
   ────────────────────────────────────────────────────────────── */

router.get("/api/category/:type", isLoggedIn, async (req, res) => {
    try {
        const type = req.params.type;
        const meta = CATEGORY_MAP[type];
        if (!meta) return res.status(404).json({ error: "Unknown category." });
        const courses = await Course.find({ category: type });
        let progressMap = {};
        if (req.user) {
            const records = await Progress.find({ userId: req.user._id, courseId: { $in: courses.map(c => c._id) } });
            records.forEach(r => { progressMap[r.courseId.toString()] = r.percentComplete; });
        }
        return res.json({ type, meta, courses, progressMap });
    } catch (err) {
        return res.status(500).json({ error: "Could not load category." });
    }
});

router.get("/api/category/:type/course/:courseId", isLoggedIn, async (req, res) => {
    try {
        const { type, courseId } = req.params;
        const meta = CATEGORY_MAP[type];
        if (!meta) return res.status(404).json({ error: "Unknown category." });
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ error: "Course not found." });
        let progress = null;
        if (req.user) {
            progress = await Progress.findOne({ userId: req.user._id, courseId: course._id });
        }
        return res.json({ type, meta, course, progress });
    } catch (err) {
        return res.status(500).json({ error: "Could not load course." });
    }
});

router.get("/api/category/:type/course/:courseId/lesson/:lessonIndex", isLoggedIn, async (req, res) => {
    try {
        const { type, courseId, lessonIndex } = req.params;
        const meta = CATEGORY_MAP[type];
        if (!meta) return res.status(404).json({ error: "Unknown category." });
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ error: "Course not found." });
        const idx = parseInt(lessonIndex, 10);
        if (isNaN(idx) || idx < 0 || idx >= course.lessons.length) {
            return res.status(404).json({ error: "Lesson not found." });
        }
        const lesson = course.lessons[idx];
        const totalLessons = course.lessons.length;
        const prevLesson = idx > 0 ? idx - 1 : null;
        const nextLesson = idx < totalLessons - 1 ? idx + 1 : null;
        let isCompleted = false;
        if (req.user) {
            const prog = await Progress.findOne({ userId: req.user._id, courseId: course._id });
            if (prog && prog.completedLessons && prog.completedLessons.includes(idx)) {
                isCompleted = true;
            }
        }
        return res.json({ type, meta, course, lesson, lessonIndex: idx, totalLessons, prevLesson, nextLesson, isCompleted });
    } catch (err) {
        return res.status(500).json({ error: "Could not load lesson." });
    }
});

/* ──────────────────────────────────────────────────────────────
   Contact API
   ────────────────────────────────────────────────────────────── */

router.post("/api/contact", async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: "Please fill in all required fields." });
    }
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const recipientEmail = process.env.CONTACT_RECEIVER_EMAIL || gmailUser;

    if (!gmailUser || !gmailPass || gmailPass.includes("your_") || gmailPass === "your_gmail_app_password_here") {
        console.log("📩 [Contact Form - Demo Mode (GMAIL_APP_PASSWORD not configured)]", { name, email, subject, message });
        return res.json({
            success: true,
            message: `Thank you ${name}! Your message has been received. We'll get back to you at ${email} soon.`
        });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: gmailUser,
                pass: gmailPass,
            },
        });

        // 1. Send contact notification to website owner/admin
        await transporter.sendMail({
            from: `"SensiQ Contact Form" <${gmailUser}>`,
            to: recipientEmail,
            replyTo: email,
            subject: `[SensiQ Contact] ${subject ? subject : "New message from " + name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
                        <h2 style="color: #1e293b; margin: 0; font-size: 20px;">📬 New Message from SensiQ Website</h2>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 15px;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; width: 100px;"><strong>From:</strong></td>
                            <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b;"><strong>Email:</strong></td>
                            <td style="padding: 8px 0; color: #2563eb;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b;"><strong>Subject:</strong></td>
                            <td style="padding: 8px 0; color: #1e293b;">${subject || "(No subject provided)"}</td>
                        </tr>
                    </table>
                    <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
                        <p style="margin: 0 0 6px; font-weight: bold; color: #475569; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Message:</p>
                        <p style="margin: 0; color: #1e293b; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                    </div>
                    <p style="font-size: 13px; color: #94a3b8; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 14px;">
                        💡 You can reply directly to this email to respond to <strong>${name}</strong> (${email}).
                    </p>
                </div>
            `,
        });

        // 2. Send automated receipt confirmation to the person contacting
        await transporter.sendMail({
            from: `"SensiQ Support" <${gmailUser}>`,
            to: email,
            subject: "We received your message — SensiQ",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <h2 style="color: #1e293b; margin-top: 0;">Hi ${name}! 👋</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                        Thank you for contacting SensiQ. We've safely received your message regarding <strong>"${subject || "your inquiry"}"</strong>.
                    </p>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                        Our team will review your inquiry and get back to you within <strong>24–48 hours</strong>.
                    </p>
                    <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px 18px; margin: 20px 0; border: 1px solid #e2e8f0;">
                        <span style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Your message copy:</span>
                        <p style="margin: 6px 0 0; color: #334155; font-style: italic; font-size: 14px;">"${message.replace(/\n/g, "<br>")}"</p>
                    </div>
                    <p style="font-size: 14px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                        Warm regards,<br>
                        <strong>The SensiQ Team</strong>
                    </p>
                </div>
            `,
        });

        return res.json({ success: true, message: `✅ Message sent! Thank you ${name}. We've also sent a confirmation to ${email}.` });
    } catch (err) {
        console.error("Contact email error:", err.message);
        return res.status(500).json({ error: `Could not send email right now (${err.message}).` });
    }
});

module.exports = router;
