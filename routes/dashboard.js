const express = require("express");
const Course = require("../models/course");
const Progress = require("../models/progress");
const { isLoggedIn } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", isLoggedIn, async (req, res) => {
    try {
        const user  = req.user;
        const dtype = user.disabilityType || "none";

        /* ── Load courses ── */
        let courses = [];
        if (dtype !== "none") {
            courses = await Course.find({ category: dtype });
        } else {
            courses = await Course.find({});
        }

        /* ── Load all progress records for this user ── */
        const progressRecords = await Progress.find({ userId: user._id });
        const progressMap = {};
        progressRecords.forEach(r => { progressMap[r.courseId.toString()] = r; });

        /* ── Build per-course enriched data ── */
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

        /* ── Summary stats ── */
        const totalCourses     = courses.length;
        const totalCompleted   = courseStats.filter(s => s.status === "completed").length;
        const inProgress       = courseStats.filter(s => s.status === "in-progress").length;
        const notStarted       = courseStats.filter(s => s.status === "not-started").length;

        /* Total lessons across all courses */
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

        res.render("dashboard/index", {
            pageTitle: "Dashboard",
            user, dtype,
            catLabel: catLabels[dtype] || "All Categories",
            courseStats,
            progressMap,
            totalCourses,
            totalCompleted,
            inProgress,
            notStarted,
            totalLessonsAll,
            completedLessonsAll,
            overallPct,
        });
    } catch (err) {
        console.error("Dashboard error:", err);
        req.flash("error", "Could not load dashboard.");
        res.redirect("/home");
    }
});

router.get("/dashboard/profile", isLoggedIn, (req, res) => {
    res.render("dashboard/profile", { pageTitle: "My Profile" });
});

router.post("/dashboard/profile", isLoggedIn, async (req, res) => {
    try {
        const { disabilityType, highContrast, autoNarrate, fontSize } = req.body;
        const user = req.user;
        if (disabilityType) user.disabilityType = disabilityType;
        user.preferences.highContrast = highContrast === "on";
        user.preferences.autoNarrate  = autoNarrate  === "on";
        if (fontSize) user.preferences.fontSize = fontSize;
        user.profileComplete = true;
        await user.save();
        req.flash("success", "Profile updated successfully.");
        res.redirect("/dashboard");
    } catch (err) {
        req.flash("error", "Could not update profile.");
        res.redirect("/dashboard/profile");
    }
});

module.exports = router;
