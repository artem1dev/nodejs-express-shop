const express = require("express");
const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");
const { checkOnAddOrEditProduct } = require("../validations/admin.validation");
const tryCatch = require("../middleware/tryCatch");
const router = express.Router();

router.get("/add-product", isAuth, tryCatch(adminController.getAddProduct));

router.get("/products", isAuth, tryCatch(adminController.getProducts));

router.post("/add-product", checkOnAddOrEditProduct, isAuth, tryCatch(adminController.postAddProduct));

router.get("/edit-product/:productId", isAuth, tryCatch(adminController.getEditProduct));

router.post("/edit-product", checkOnAddOrEditProduct, isAuth, tryCatch(adminController.postEditProduct));

router.delete("/product/:productId", isAuth, tryCatch(adminController.deleteProduct));

module.exports = router;
