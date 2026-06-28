const express = require("express");
const passport = require("passport");

const User = require("../models/user");

const router = express.Router();

function redirectIfAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        req.flash("success", "You are already signed in.");
        let redirectUrl = "/dashboard";
        if (req.user && req.user.disabilityType && req.user.disabilityType !== "none") {
            redirectUrl = `/category/${req.user.disabilityType}`;
        }
        return res.redirect(redirectUrl);
    }
    next();
}

router.get("/home/signup", redirectIfAuthenticated, (req, res) => {
    res.render("auth/signup", { pageTitle: "Create Account" });
});

router.post("/home/signup", redirectIfAuthenticated, async (req, res, next) => {
    try {
        const { username, email, password, disabilityType } = req.body;

        if (!username || !email || !password) {
            req.flash("error", "Username, email, and password are required.");
            return res.redirect("/home/signup");
        }

        const newUser = new User({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            disabilityType: disabilityType || "none",
            profileComplete: !!disabilityType && disabilityType !== "none",
        });

        const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            let redirectUrl = "/dashboard";
            if (registeredUser.disabilityType && registeredUser.disabilityType !== "none") {
                redirectUrl = `/category/${registeredUser.disabilityType}`;
            }
            const returnTo = req.session.returnTo || redirectUrl;
            delete req.session.returnTo;
            req.flash("success", "🎉 Welcome to SensiQ! Your account has been created. Start learning!");
            res.redirect(returnTo);
        });
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/home/signup");
    }
});

router.get("/home/login", redirectIfAuthenticated, (req, res) => {
    res.render("auth/login", { pageTitle: "Log In" });
});

router.post(
    "/home/login",
    redirectIfAuthenticated,
    passport.authenticate("local", {
        failureRedirect: "/home/login",
        failureFlash: true,
    }),
    (req, res) => {
        let redirectUrl = "/dashboard";
        if (req.user && req.user.disabilityType && req.user.disabilityType !== "none") {
            redirectUrl = `/category/${req.user.disabilityType}`;
        }
        const returnTo = req.session.returnTo || redirectUrl;
        delete req.session.returnTo;
        req.flash("success", "✅ Welcome back to SensiQ! Continue your learning journey.");
        res.redirect(returnTo);
    }
);

router.get("/home/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        req.flash("success", "You have logged out successfully.");
        res.redirect("/home");
    });
});

module.exports = router;
