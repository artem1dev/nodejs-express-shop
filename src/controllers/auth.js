const crypto = require("crypto");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");
const { transporter } = require("../util/mailer");
const User = require("../models/user.methods");

exports.getLogin = async (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
        },
        validationErrors: [],
    });
};

exports.getSignup = async (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
            confirmPassword: "",
        },
        validationErrors: [],
    });
};

exports.postLogin = async (req, res, next) => {
    const { email } = req.body;
    const { password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email,
            },
            validationErrors: errors.array(),
        });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid email or password.",
            oldInput: { email },
            validationErrors: [],
        });
    }

    const doMatch = await bcrypt.compare(password, user.password);
    if (doMatch) {
        req.session.isLoggedIn = true;
        req.session.user = {
            email: user.email,
            resetToken: user.resetToken,
            resetTokenExpiration: user.resetTokenExpiration,
            cart: user.cart,
        };
        await req.session.save();
        return res.redirect("/");
    }

    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: "Invalid email or password.",
        oldInput: { email },
        validationErrors: [],
    });
};

exports.postSignup = async (req, res, next) => {
    const { email } = req.body;
    const { password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).render("auth/signup", {
            path: "/signup",
            pageTitle: "Signup",
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email,
            },
            validationErrors: errors.array(),
        });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
        email,
        password: hashedPassword,
        cart: { items: [] },
    });
    await user.save();
    res.redirect("/login");
};

exports.postLogout = async (req, res, next) => {
    req.session.destroy((err) => {
        res.redirect("/");
    });
};

exports.getReset = async (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/reset", {
        path: "/reset",
        pageTitle: "Reset Password",
        errorMessage: message,
    });
};

exports.postReset = async (req, res, next) => {
    const buffer = await crypto.randomBytes(32);
    const token = buffer.toString("hex");

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        req.flash("error", "No account with that email found.");
        return res.redirect("/reset");
    }

    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();

    res.redirect("/");
    await transporter.sendMail({
        to: req.body.email,
        from: "shop@node-complete.com",
        subject: "Password reset",
        html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
        `,
    });
};

exports.getNewPassword = async (req, res, next) => {
    const { token } = req.params;
    const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
    });
};

exports.postNewPassword = async (req, res, next) => {
    const newPassword = req.body.password;
    const { userId } = req.body;
    const { passwordToken } = req.body;
    const user = await User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId,
    });
    if (!user) {
        const error = new Error("User not found or token expired");
        error.httpStatusCode = 404;
        throw error;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();
    res.redirect("/login");
};
