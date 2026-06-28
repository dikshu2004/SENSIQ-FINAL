/**
 * Script: update-internet-videos.js
 * Updates ALL lessons in the "Internet" course:
 *   - videoUrl            → Descript AI embed (Course Video)
 *   - signLanguageVideoUrl → Gemini AI video share link (Sign Language)
 *
 * Run with: node scripts/update-internet-videos.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Course   = require("../models/course");

const DESCRIPT_URL = "https://share.descript.com/embed/Al4V6sPI4rE";
const GEMINI_URL   = "https://share.gemini.google/3Oodtvajfz3r";

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

  course.lessons.forEach((lesson) => {
    console.log(`\n  ↳ Updating lesson: "${lesson.title}"`);
    console.log(`    videoUrl (old):            ${lesson.videoUrl}`);
    console.log(`    videoUrl (new):            ${DESCRIPT_URL}`);
    console.log(`    signLanguageVideoUrl (old): ${lesson.signLanguageVideoUrl}`);
    console.log(`    signLanguageVideoUrl (new): ${GEMINI_URL}`);

    lesson.videoUrl             = DESCRIPT_URL;
    lesson.signLanguageVideoUrl = GEMINI_URL;
  });

  await course.save();
  console.log(`\n✅ All ${course.lessons.length} lesson(s) updated successfully!`);

  await mongoose.disconnect();
  console.log("✅ Done.");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
