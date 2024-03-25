const express = require("express");
const authController = require("../controllers/auth");
const { checkOnLogin, checkOnSignUp } = require("../validations/auth.validation");
const tryCatch = require("../middleware/tryCatch");

const router = express.Router();

router.get("/login", tryCatch(authController.getLogin));

router.get("/signup", tryCatch(authController.getSignup));

router.post("/login", checkOnLogin, tryCatch(authController.postLogin));

router.post("/signup", checkOnSignUp, tryCatch(authController.postSignup));

router.post("/logout", tryCatch(authController.postLogout));

router.get("/reset", tryCatch(authController.getReset));

router.post("/reset", tryCatch(authController.postReset));

router.get("/reset/:token", tryCatch(authController.getNewPassword));

router.post("/new-password", tryCatch(authController.postNewPassword));

module.exports = router;
