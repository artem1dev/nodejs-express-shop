const fs = require("fs").promises;

const deleteFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (err) {}
};

exports.deleteFile = deleteFile;
