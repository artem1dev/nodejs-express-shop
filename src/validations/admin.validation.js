const { body } = require("express-validator");

const checkOnAddOrEditProduct = [
    body("title").isString().isLength({ min: 3 }).trim(),
    body("price").isFloat(),
    body("description").isLength({ min: 5, max: 400 }).trim(),
];

module.exports = {
    checkOnAddOrEditProduct,
};
