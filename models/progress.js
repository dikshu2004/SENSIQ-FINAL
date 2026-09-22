const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    completedLessons: [{
        type: Number,   /* stores 0-based lesson index — NOT an ObjectId */
    }],
    lastAccessedAt: {
        type: Date,
        default: Date.now,
    },
    percentComplete: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
});

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
