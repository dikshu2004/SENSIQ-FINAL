require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const User = require("./models/user");
const userRoutes = require("./routes/user");
const homeRoutes = require("./routes/home");
const dashboardRoutes = require("./routes/dashboard");
const categoryRoutes = require("./routes/category");
const apiRoutes = require("./routes/api");
const chatRoutes = require("./routes/chat");

const app = express();

const PORT = Number(process.env.PORT) || 3001;
const DB_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/sensiq";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-secret-in-production";

async function connectDatabase() {
    try {
        await mongoose.connect(DB_URL);
        console.log("MongoDB connected");

        /* Seed courses on first run */
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

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        },
    })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user || null;
    res.locals.pageTitle = "SensiQ";
    next();
});

app.use("/", homeRoutes);
app.use("/", userRoutes);
app.use("/", dashboardRoutes);
app.use("/", categoryRoutes);
app.use("/", apiRoutes);
app.use("/", chatRoutes);

app.use((req, res) => {
    res.status(404).render("error", {
        pageTitle: "Page Not Found",
        err: {
            status: 404,
            message: "The page you requested does not exist.",
        },
    });
});

app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Something went wrong.";

    res.status(status).render("error", {
        pageTitle: "Application Error",
        err: { status, message },
    });
});

app.listen(PORT, () => {
    console.log(`SensiQ server running at http://localhost:${PORT}`);
});
app.use(express.static(require('path').join(__dirname, 'public')));