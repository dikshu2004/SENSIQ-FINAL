const mongoose = require("mongoose");
const Course = require("../models/course");

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/sensiq";
const HEYGEN_URL = "https://app.heygen.com/embeds/b9470fef905d4637b24e1171956e30c0";

async function updateResumeVideos() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to MongoDB");

  const course = await Course.findOne({ title: "Resume Building" });

  if (!course) {
    console.log("Resume Building course not found in database.");
    await mongoose.connection.close();
    return;
  }

  // Update each lesson's videoUrl
  course.lessons.forEach(lesson => {
    lesson.videoUrl = HEYGEN_URL;
  });

  await course.save();

  console.log("Updated Resume Building course. Lessons:");
  course.lessons.forEach(l => console.log(" -", l.title, "|", l.videoUrl));

  await mongoose.connection.close();
  console.log("Done.");
}

updateResumeVideos().catch(err => {
  console.error(err);
  process.exit(1);
});
