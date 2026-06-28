/**
 * Script: update-resume-sign-video.js
 * Updates the signLanguageVideoUrl for all lessons in the "Resume Building"
 * course to use the local video file instead of YouTube.
 *
 * Run with: node scripts/update-resume-sign-video.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Course   = require("../models/course");

const LOCAL_VIDEO = "/videos/resume-sign-language.mp4";

async function main() {
  await mongoose.connect(process.env.MONGO_URL || process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const course = await Course.findOne({ title: "Resume Building" });
  if (!course) {
    console.error("❌ 'Resume Building' course not found in the database.");
    process.exit(1);
  }

  console.log(`📚 Found course: "${course.title}" with ${course.lessons.length} lessons`);

  let updated = 0;
  course.lessons.forEach((lesson) => {
    if (lesson.signLanguageVideoUrl !== LOCAL_VIDEO) {
      console.log(`  ↳ Updating lesson "${lesson.title}"`);
      console.log(`    Old: ${lesson.signLanguageVideoUrl}`);
      console.log(`    New: ${LOCAL_VIDEO}`);
      lesson.signLanguageVideoUrl = LOCAL_VIDEO;
      updated++;
    }
  });

  if (updated > 0) {
    await course.save();
    console.log(`\n✅ Updated ${updated} lesson(s) successfully!`);
  } else {
    console.log("\n⚠️  No updates needed — all lessons already use the local video.");
  }

  await mongoose.disconnect();
  console.log("✅ Done.");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
