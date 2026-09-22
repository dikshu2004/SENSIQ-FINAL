const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    disabilityType: {
        type: String,
        enum: ["deaf", "mute", "visually_impaired", "deaf_mute", "mute_visually_impaired", "none"],
        default: "none",
    },
    preferences: {
        highContrast: { type: Boolean, default: false },
        autoNarrate: { type: Boolean, default: false },
        fontSize: { type: String, enum: ["normal", "large", "x-large"], default: "normal" },
    },
    profileComplete: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);