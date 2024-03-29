const fs = require("fs");
const path = require("path");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const PDFDocument = require("pdfkit");
const Product = require("../models/product");
const Order = require("../models/order");
const { StatusCodes } = require("http-status-codes");

const ITEMS_PER_PAGE = 2;

exports.getProducts = async (req, res, next) => {
    const page = +req.query.page || 1;
    const totalItems = await Product.find().countDocuments();
    const products = await Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);

    res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
};

exports.getProduct = async (req, res, next) => {
    const prodId = req.params.productId;
    const product = await Product.findById(prodId);

    if (!product) {
        const error = new Error("Product not found.");
        error.httpStatusCode = StatusCodes.NOT_FOUND;
        throw error;
    }

    res.render("shop/product-detail", {
        product,
        pageTitle: product.title,
        path: "/products",
    });
};

exports.getIndex = async (req, res, next) => {
    const page = +req.query.page || 1;
    const totalItems = await Product.countDocuments();
    const products = await Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);

    res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
};

exports.getCart = async (req, res, next) => {
    const user = await req.user.populate("cart.items.productId").execPopulate();
    const products = user.cart.items;

    res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products,
    });
};

exports.postCart = async (req, res, next) => {
    const prodId = req.body.productId;
    const product = await Product.findById(prodId);
    await req.user.addToCart(product);
    res.redirect("/cart");
};

exports.postCartDeleteProduct = async (req, res, next) => {
    const prodId = req.body.productId;
    await req.user.removeFromCart(prodId);
    res.redirect("/cart");
};

exports.getCheckout = async (req, res, next) => {
    const user = await req.user.populate("cart.items.productId").execPopulate();
    let total = 0;
    user.cart.items.forEach((p) => {
        total += p.quantity * p.productId.price;
    });
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: user.cart.items.map((p) => {
            return {
                name: p.productId.title,
                description: p.productId.description,
                amount: p.productId.price * 100,
                currency: "usd",
                quantity: p.quantity,
            };
        }),
        success_url: `${req.protocol}://${req.get("host")}/checkout/success`,
        cancel_url: `${req.protocol}://${req.get("host")}/checkout/cancel`,
    });

    res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: user.cart.items,
        totalSum: total,
        sessionId: session.id,
    });
};

exports.getCheckoutSuccess = async (req, res, next) => {
    const user = await req.user.populate("cart.items.productId").execPopulate();
    const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
    });
    const order = new Order({
        user: {
            email: req.user.email,
            userId: req.user,
        },
        products,
    });
    await order.save();
    await req.user.clearCart();
    res.redirect("/orders");
};

exports.postOrder = async (req, res, next) => {
    const user = await req.user.populate("cart.items.productId").execPopulate();
    const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
    });
    const order = new Order({
        user: {
            email: req.user.email,
            userId: req.user,
        },
        products,
    });
    await order.save();
    await req.user.clearCart();
    res.redirect("/orders");
};

exports.getOrders = async (req, res, next) => {
    const orders = await Order.find({ "user.userId": req.user._id });
    res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders,
    });
};

exports.getInvoice = async (req, res, next) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error("No order found.");
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
        throw new Error("Unauthorized");
    }
    const invoiceName = `invoice-${orderId}.pdf`;
    const invoicePath = path.join("data", "invoices", invoiceName);
    const pdfDoc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`);
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
    });
    pdfDoc.text("-----------------------");
    let totalPrice = 0;
    order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc.fontSize(14).text(`${prod.product.title} - ${prod.quantity} x ` + `$${prod.product.price}`);
    });
    pdfDoc.text("---");
    pdfDoc.fontSize(20).text(`Total Price: $${totalPrice}`);
    pdfDoc.end();
};
