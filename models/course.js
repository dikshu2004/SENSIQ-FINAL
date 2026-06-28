const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    videoUrl: { type: String, default: "" },
    signLanguageVideoUrl: { type: String, default: "" },
    order: { type: Number, required: true },
    duration: { type: String, default: "10 min" },
});

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "fa-book" },
    category: {
        type: [String],
        enum: ["deaf", "mute", "visually_impaired", "deaf_mute", "mute_visually_impaired"],
        required: true,
    },
    lessons: [lessonSchema],
    difficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner",
    },
    estimatedDuration: { type: String, default: "1 hour" },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Course", courseSchema);
