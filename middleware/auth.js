function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    req.flash("error", "🔒 Please sign in or create a free account to access learning content and assistive tools.");
    res.redirect("/home/login");
}

function isProfileComplete(req, res, next) {
    if (req.isAuthenticated() && !req.user.profileComplete) {
        req.flash("error", "Please complete your profile to continue.");
        return res.redirect("/dashboard/profile");
    }
    next();
}

module.exports = { isLoggedIn, isProfileComplete };
