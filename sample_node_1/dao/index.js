const path = require("path");
const DAO = require("zatanna");

module.exports = function (config) {
    return new DAO(config.db.connectionString, path.join(__dirname, 'models'));
};