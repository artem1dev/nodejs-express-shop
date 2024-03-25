const fs = require("fs").promises;

const deleteFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
        console.log(`File ${filePath} has been deleted`);
    } catch (err) {
        console.error(`Error deleting file ${filePath}:`, err);
    }
};

exports.deleteFile = deleteFile;
