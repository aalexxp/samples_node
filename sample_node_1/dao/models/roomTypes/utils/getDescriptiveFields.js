const path = require("path");
const daoPath = path.join(__dirname, "..", "..");
const getRoomTypeFields = require(path.join(daoPath, "roomTypes", "utils", "getFields"));
const getPhotos = require(path.join(daoPath, "photos", "utils", "getPhotos"));

module.exports = (language = "'EN'") => {
    return [
        ...getRoomTypeFields(),
        getPhotos('"RoomTypes"."property"', language, 'photos', ['Suite', 'Guest room', 'Guest room amenity'], {
            resource: 'INDEX'
        })
    ];
};