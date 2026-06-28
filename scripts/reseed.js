require("dotenv").config();
const mongoose = require("mongoose");
const Course = require("../models/course");
const seedCourses = require("../seeds/courses");

const DB_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/sensiq";

async function reseed() {
    try {
        await mongoose.connect(DB_URL);
        console.log("✅ MongoDB connected");

        // Delete all existing courses
        const deleted = await Course.deleteMany({});
        console.log(`🗑️  Deleted ${deleted.deletedCount} old courses`);

        // Re-seed with new AI video URLs
        await seedCourses();
        console.log("🌱 Database re-seeded with AI videos successfully!");

    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
        process.exit(0);
    }
}

reseed();
