const adminRoutes = require("./admin");
const shopRoutes = require("./shop");
const authRoutes = require("./auth");
const errorController = require("../controllers/error");
const User = require("../models/user.methods");
const { StatusCodes } = require("http-status-codes");

class AppRouter {
    constructor(app) {
        this.app = app;
    }

    init() {
        this.app.use((req, res, next) => {
            res.locals.isAuthenticated = req.session.isLoggedIn;
            res.locals.csrfToken = req.csrfToken();
            next();
        });
        this.app.use((req, res, next) => {
            if (!req.session.user) {
                return next();
            }
            User.findById(req.session.user._id)
                .then((user) => {
                    if (!user) {
                        return next();
                    }
                    req.user = user;
                    next();
                })
                .catch((err) => {
                    next(new Error(err));
                });
        });
        this.app.use("/admin", adminRoutes);
        this.app.use(shopRoutes);
        this.app.use(authRoutes);
        this.app.get("/500", errorController.get500);
        this.app.use(errorController.get404);
        this.app.use((error, req, res, next) => {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).render("500", {
                pageTitle: "Error!",
                path: "/500",
                isAuthenticated: req.session.isLoggedIn,
            });
        });
    }
}

module.exports = AppRouter;
