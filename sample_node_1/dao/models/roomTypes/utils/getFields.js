const path = require("path");
const daoPath = path.join(__dirname, "..", "..");
const getPrice = require(path.join(daoPath, "roomTypes", "utils", "getPrice"));
const getWifi = require(path.join(daoPath, "roomTypes", "utils", "getWifi"));
const getKitchen = require(path.join(daoPath, "roomTypes", "utils", "getKitchen"));

module.exports = (language = "'EN'") => {
    return [
        '"RoomTypes"."id"',
        '"RoomTypes"."name"',
        '"RoomTypes"."uri"',
        '"RoomTypes"."typeCode"',
        '"RoomTypes"."quantity"',
        '"RoomTypes"."occupancy"',
        '"RoomTypes"."roomView"',
        '"RoomTypes"."bedTypes"',
        '"RoomTypes"."numberOfBeds"',
        '"RoomTypes"."custom_data"',
        '"RoomTypes"."typeCode"',
        getKitchen(),
        getWifi()
    ];
};