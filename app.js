require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const cors = require("cors");

const User = require("./models/user");
const apiRoutes = require("./routes/api");
const chatRoutes = require("./routes/chat");

const app = express();

/* Cross-Origin Resource Sharing */
app.use(cors({
    origin: function (origin, callback) {
        return callback(null, true);
    },
    credentials: true
}));

const PORT = Number(process.env.PORT) || 3001;
const DB_URL = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/sensiq";
const SESSION_SECRET = process.env.SESSION_SECRET || "sensiq-secret-key-2026-secure";

mongoose.set('strictQuery', true);

/* Database Connection */
async function connectDatabase() {
    try {
        await mongoose.connect(DB_URL);
        console.log("MongoDB connected");

        /* Seed courses on first run if database is empty */
        const Course = require("./models/course");
        const count = await Course.countDocuments();
        if (count === 0) {
            console.log("No courses found. Seeding database...");
            const seedCourses = require("./seeds/courses");
            await seedCourses();
        }
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
}

connectDatabase();

/* Body Parsers */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* Static Assets from public/ */
app.use(express.static(path.join(__dirname, "public")));

/* Session & Passport Authentication */
const sessionStore = MongoStore.create({
    mongoUrl: DB_URL,
    touchAfter: 24 * 3600,
    crypto: {
        secret: SESSION_SECRET,
    },
});

app.use(
    session({
        store: sessionStore,
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* Backend REST API & Chatbot Routes */
app.use("/", apiRoutes);
app.use("/", chatRoutes);

/* React SPA Static Files & Client-Side HTML5 Routing */
const clientDist = path.join(__dirname, "client", "dist");
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));

    app.use((req, res, next) => {
        // Skip API routes and chat routes
        if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/chat")) {
            return res.sendFile(path.join(clientDist, "index.html"));
        }
        next();
    });
}

/* 404 handler for unknown API routes */
app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: "API endpoint not found." });
    }
    next();
});

/* Global Error Handler */
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Internal server error.";
    console.error("Server error:", err);
    res.status(status).json({ error: message });
});

app.listen(PORT, () => {
    console.log(`SensiQ server running at http://localhost:${PORT}`);
});