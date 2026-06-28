/**
 * Script: update-all-three-courses.js
 * Updates videoUrl and signLanguageVideoUrl for:
 *   1. Introduction to AI       → Descript embed + local sign video
 *   2. Communication Skills     → HeyGen embed + local sign video
 *   3. Introduction to Computer → HeyGen embed + local sign video
 *
 * Run with: node scripts/update-all-three-courses.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Course   = require("../models/course");

const UPDATES = [
  {
    courseTitle: "Introduction to AI",
    videoUrl:             "https://share.descript.com/embed/ovD3PIk4eql",
    signLanguageVideoUrl: "/videos/ai-sign-language.mp4",
  },
  {
    courseTitle: "Communication Skills",
    videoUrl:             "https://app.heygen.com/embeds/a54fb52f97a14536898bfde987f57032",
    signLanguageVideoUrl: "/videos/communication-sign-language.mp4",
  },
  {
    courseTitle: "Introduction to Computer",
    videoUrl:             "https://app.heygen.com/embeds/126ac65139e146aab662c32fd41a1ba5",
    signLanguageVideoUrl: "/videos/computer-sign-language.mp4",
  },
];

async function main() {
  await mongoose.connect(
    process.env.MONGO_URL || process.env.MONGO_URI || process.env.MONGODB_URI
  );
  console.log("✅ Connected to MongoDB\n");

  for (const update of UPDATES) {
    const course = await Course.findOne({ title: update.courseTitle });
    if (!course) {
      console.error(`❌ Course "${update.courseTitle}" not found — skipping.`);
      continue;
    }

    console.log(`📚 Updating: "${course.title}" (${course.lessons.length} lessons)`);

    course.lessons.forEach((lesson) => {
      console.log(`   ↳ "${lesson.title}"`);
      console.log(`      videoUrl:            ${lesson.videoUrl} → ${update.videoUrl}`);
      console.log(`      signLanguageVideoUrl: ${lesson.signLanguageVideoUrl} → ${update.signLanguageVideoUrl}`);
      lesson.videoUrl             = update.videoUrl;
      lesson.signLanguageVideoUrl = update.signLanguageVideoUrl;
    });

    await course.save();
    console.log(`   ✅ Saved ${course.lessons.length} lesson(s)\n`);
  }

  await mongoose.disconnect();
  console.log("✅ All done!");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
