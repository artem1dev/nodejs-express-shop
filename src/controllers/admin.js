const { validationResult } = require("express-validator");
const fileHelper = require("../util/file");
const Product = require("../models/product");
const { StatusCodes } = require("http-status-codes");

exports.getAddProduct = async (req, res, next) => {
    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
    });
};

exports.postAddProduct = async (req, res, next) => {
    const { title } = req.body;
    const image = req.file;
    const { price } = req.body;
    const { description } = req.body;
    if (!image) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: {
                title,
                price,
                description,
            },
            errorMessage: "Attached file is not an image.",
            validationErrors: [],
        });
    }
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: {
                title,
                price,
                description,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    const imageUrl = image.path;

    const product = new Product({
        title,
        price,
        description,
        imageUrl,
        userId: req.user,
    });
    const result = await product.save();
    res.redirect("/admin/products");
};

exports.getEditProduct = async (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect("/");
    }
    const prodId = req.params.productId;
    const product = await Product.findById(prodId);
    if (!product) {
        return res.redirect("/");
    }
    res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
    });
};

exports.postEditProduct = async (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDesc = req.body.description;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDesc,
                _id: prodId,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }
    const product = await Product.findById(prodId);
    if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
    }
    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDesc;
    if (image) {
        await fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
    }
    await product.save();
    res.redirect("/admin/products");
};

exports.getProducts = async (req, res, next) => {
    const products = await Product.find({ userId: req.user._id });
    res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
    });
};

exports.deleteProduct = async (req, res, next) => {
    const prodId = req.params.productId;
    const product = await Product.findById(prodId);
    if (!product) {
        throw new Error("Product not found.");
    }
    await fileHelper.deleteFile(product.imageUrl);
    await Product.deleteOne({ _id: prodId, userId: req.user._id });
    res.status(StatusCodes.OK).json({ message: "Success!" });
};
