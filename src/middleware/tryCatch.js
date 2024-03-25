const { StatusCodes } = require("http-status-codes");

module.exports = (controller) => async (req, res, next) => {
    try {
        await controller(req, res, next);
    } catch (error) {
        error.httpStatusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        next(error);
    }
};
