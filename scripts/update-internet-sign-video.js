/**
 * Script: update-internet-sign-video.js
 * Updates the signLanguageVideoUrl for all lessons in the "Internet"
 * course to use a local hosted video file (same approach as Resume Building).
 *
 * Run with: node scripts/update-internet-sign-video.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Course   = require("../models/course");

const LOCAL_VIDEO = "/videos/internet-sign-language.mp4";

async function main() {
  await mongoose.connect(
    process.env.MONGO_URL || process.env.MONGO_URI || process.env.MONGODB_URI
  );
  console.log("✅ Connected to MongoDB");

  const course = await Course.findOne({ title: "Internet" });
  if (!course) {
    console.error("❌ 'Internet' course not found in the database.");
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
