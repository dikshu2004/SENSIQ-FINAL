const express = require("express");
const Course = require("../models/course");
const Progress = require("../models/progress");
const { isLoggedIn } = require("../middleware/auth");

const router = express.Router();

const CATEGORY_MAP = {
    deaf: { label: "Deaf Learners", icon: "fa-ear-deaf", desc: "Video modules with sign language support for better comprehension." },
    mute: { label: "Mute Learners", icon: "fa-microphone-lines-slash", desc: "Text to Speech & Speech to Text — listen to content and interact using your voice." },
    visually_impaired: { label: "Visually Impaired Learners", icon: "fa-eye-low-vision", desc: "Speech to Text & Text to Speech — dictate and listen for full audio accessibility." },
    deaf_mute: { label: "Deaf & Mute Learners", icon: "fa-hands-asl-interpreting", desc: "Sign language videos combined with Text to Speech & Speech to Text support." },
    mute_visually_impaired: { label: "Mute & Visually Impaired", icon: "fa-universal-access", desc: "Full TTS & STT support — listen to content and interact using your voice." },
};

router.get("/category/:type", isLoggedIn, async (req, res) => {
    try {
        const type = req.params.type;
        const meta = CATEGORY_MAP[type];
        if (!meta) {
            req.flash("error", "Unknown category.");
            return res.redirect("/home");
        }
        const courses = await Course.find({ category: type });
        let progressMap = {};
        if (req.user) {
            const records = await Progress.find({ userId: req.user._id, courseId: { $in: courses.map(c => c._id) } });
            records.forEach(r => { progressMap[r.courseId.toString()] = r.percentComplete; });
        }
        res.render("category/index", { pageTitle: meta.label, type, meta, courses, progressMap });
    } catch (err) {
        req.flash("error", "Could not load category.");
        res.redirect("/home");
    }
});

router.get("/category/:type/course/:courseId", isLoggedIn, async (req, res) => {
    try {
        const { type, courseId } = req.params;
        const meta = CATEGORY_MAP[type];
        if (!meta) { req.flash("error", "Unknown category."); return res.redirect("/home"); }
        const course = await Course.findById(courseId);
        if (!course) { req.flash("error", "Course not found."); return res.redirect(`/category/${type}`); }
        let progress = null;
        if (req.user) {
            progress = await Progress.findOne({ userId: req.user._id, courseId: course._id });
        }
        res.render("category/course", { pageTitle: course.title, type, meta, course, progress });
    } catch (err) {
        req.flash("error", "Could not load course.");
        res.redirect("/home");
    }
});

router.get("/category/:type/course/:courseId/lesson/:lessonIndex", isLoggedIn, async (req, res) => {
    try {
        const { type, courseId, lessonIndex } = req.params;
        const meta = CATEGORY_MAP[type];
        if (!meta) { req.flash("error", "Unknown category."); return res.redirect("/home"); }
        const course = await Course.findById(courseId);
        if (!course) { req.flash("error", "Course not found."); return res.redirect(`/category/${type}`); }
        const idx = parseInt(lessonIndex, 10);
        if (isNaN(idx) || idx < 0 || idx >= course.lessons.length) {
            req.flash("error", "Lesson not found.");
            return res.redirect(`/category/${type}/course/${courseId}`);
        }
        const lesson = course.lessons[idx];
        const totalLessons = course.lessons.length;
        const prevLesson = idx > 0 ? idx - 1 : null;
        const nextLesson = idx < totalLessons - 1 ? idx + 1 : null;
        res.render("category/lesson", { pageTitle: lesson.title, type, meta, course, lesson, lessonIndex: idx, totalLessons, prevLesson, nextLesson });
    } catch (err) {
        req.flash("error", "Could not load lesson.");
        res.redirect("/home");
    }
});

module.exports = router;
