const express  = require("express");
const Course    = require("../models/course");
const nodemailer = require("nodemailer");
const { isLoggedIn } = require("../middleware/auth");

const router = express.Router();

/* ── Nodemailer transporter (Gmail) ── */
function createTransporter() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
}

router.get("/", (req, res) => {
    res.redirect("/home");
});

router.get("/home", async (req, res) => {
    let courses = [];
    const q = (req.query.q || "").trim();
    try {
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
    } catch (e) { /* ignore */ }
    res.render("home/index", {
        pageTitle: "Inclusive Learning Platform",
        courses,
        searchQuery: q
    });
});

router.get("/home/about", (req, res) => {
    res.render("home/about", { pageTitle: "About SensiQ" });
});

router.get("/home/contact", (req, res) => {
    res.render("home/contact", { pageTitle: "Contact SensiQ" });
});

/* ── POST /home/contact — handle form submission ── */
router.post("/home/contact", async (req, res) => {
    const { name, email, subject, message } = req.body;

    /* Basic validation */
    if (!name || !email || !message) {
        req.flash("error", "Please fill in all required fields.");
        return res.redirect("/home/contact");
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    /* If Gmail not configured — still show success (for demo) */
    if (!gmailPass || gmailPass === "your_gmail_app_password_here") {
        console.log("📩 [Contact Form - Demo Mode]", { name, email, subject, message });
        req.flash("success", `Thank you ${name}! Your message has been received. We'll get back to you at ${email} soon.`);
        return res.redirect("/home/contact");
    }

    try {
        const transporter = createTransporter();

        /* Email to SensiQ inbox */
        await transporter.sendMail({
            from: `"SensiQ Contact Form" <${gmailUser}>`,
            to: gmailUser,
            replyTo: email,
            subject: `[SensiQ Contact] ${subject || "New message from " + name}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:12px;">
                    <div style="background:linear-gradient(135deg,#07111f,#0d6efd);padding:20px 24px;border-radius:8px;margin-bottom:20px;">
                        <h2 style="color:#fff;margin:0;font-size:1.4rem;">📩 New Contact Form Submission</h2>
                        <p style="color:rgba(255,255,255,.7);margin:6px 0 0;font-size:.9rem;">SensiQ Inclusive E-Learning Platform</p>
                    </div>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:bold;width:100px;color:#555;">Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;">${name}</td></tr>
                        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:bold;color:#555;">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee;"><a href="mailto:${email}" style="color:#0d6efd;">${email}</a></td></tr>
                        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:bold;color:#555;">Subject</td><td style="padding:10px 0;border-bottom:1px solid #eee;">${subject || "—"}</td></tr>
                    </table>
                    <div style="margin-top:16px;background:#fff;padding:16px;border-radius:8px;border-left:4px solid #0d6efd;">
                        <p style="font-weight:bold;color:#555;margin:0 0 8px;">Message</p>
                        <p style="color:#333;line-height:1.7;margin:0;">${message.replace(/\n/g, "<br>")}</p>
                    </div>
                    <p style="margin-top:16px;font-size:.8rem;color:#999;">Reply directly to this email to respond to ${name}.</p>
                </div>
            `,
        });

        /* Auto-reply to the sender */
        await transporter.sendMail({
            from: `"SensiQ Support" <${gmailUser}>`,
            to: email,
            subject: "We received your message — SensiQ",
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:12px;">
                    <div style="background:linear-gradient(135deg,#07111f,#0d6efd);padding:20px 24px;border-radius:8px;margin-bottom:20px;">
                        <h2 style="color:#fff;margin:0;">Hi ${name}! 👋</h2>
                        <p style="color:rgba(255,255,255,.7);margin:6px 0 0;">Thank you for reaching out to SensiQ.</p>
                    </div>
                    <p style="color:#333;line-height:1.7;">We've received your message and will get back to you as soon as possible, typically within <strong>24–48 hours</strong>.</p>
                    <div style="background:#fff;padding:16px;border-radius:8px;border-left:4px solid #f4b400;margin:16px 0;">
                        <p style="font-weight:bold;color:#555;margin:0 0 6px;">Your message:</p>
                        <p style="color:#666;margin:0;font-style:italic;">"${message.replace(/\n/g, "<br>")}"</p>
                    </div>
                    <p style="color:#333;">In the meantime, feel free to explore our <a href="http://localhost:8080/home" style="color:#0d6efd;">platform</a> or use our assistive tools.</p>
                    <p style="color:#888;font-size:.85rem;margin-top:20px;">— The SensiQ Team</p>
                </div>
            `,
        });

        req.flash("success", `✅ Message sent! Thank you ${name}. We've also sent a confirmation to ${email}.`);
    } catch (err) {
        console.error("Contact form email error:", err.message);
        req.flash("error", "Sorry, we couldn't send your message right now. Please email us directly at sensiq1991@gmail.com");
    }

    res.redirect("/home/contact");
});


/* ---------- Tool pages (login required) ---------- */

router.get("/tools/speech-to-text", isLoggedIn, (req, res) => {
    res.render("tools/speech-to-text", { pageTitle: "Speech to Text" });
});

router.get("/tools/text-to-speech", isLoggedIn, (req, res) => {
    res.render("tools/text-to-speech", { pageTitle: "Text to Speech" });
});

router.get("/tools/text-to-sign", isLoggedIn, (req, res) => {
    res.render("tools/text-to-sign", { pageTitle: "Text to Sign Language" });
});

module.exports = router;
