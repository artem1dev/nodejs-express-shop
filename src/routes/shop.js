const express = require("express");
const shopController = require("../controllers/shop");
const isAuth = require("../middleware/is-auth");
const tryCatch = require("../middleware/tryCatch");

const router = express.Router();

router.get("/", tryCatch(shopController.getIndex));

router.get("/products", tryCatch(shopController.getProducts));

router.get("/products/:productId", tryCatch(shopController.getProduct));

router.get("/cart", isAuth, tryCatch(shopController.getCart));

router.post("/cart", isAuth, tryCatch(shopController.postCart));

router.post("/cart-delete-item", isAuth, tryCatch(shopController.postCartDeleteProduct));

router.get("/checkout", isAuth, tryCatch(shopController.getCheckout));

router.get("/checkout/success", tryCatch(shopController.getCheckoutSuccess));

router.get("/checkout/cancel", tryCatch(shopController.getCheckout));

router.get("/orders", isAuth, tryCatch(shopController.getOrders));

router.get("/orders/:orderId", isAuth, tryCatch(shopController.getInvoice));

module.exports = router;
