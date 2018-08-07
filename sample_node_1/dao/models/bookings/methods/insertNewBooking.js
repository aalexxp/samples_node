const path = require("path");
const daoPath = path.join(__dirname, "..", "..");
const getTextDescriptions = require(path.join(daoPath, "textDescriptions", "utils", "getTextDescriptions"));
const getPhotos = require(path.join(daoPath, "photos", "utils", "getPhotos"));
const getRoomTypeAmenities = require(path.join(daoPath, "amenities", "utils", "getAmenitiesByRelation"));
const getProperty = require(path.join(daoPath, "properties", "utils", "getProperty"));
const getPrice = require(path.join(daoPath, "roomTypes", "utils", "getPrice"));

function insertAsIs(index) {
    return '$' + String(index);
}

function insertRoomType(index) {
    return `
    (SELECT row_to_json("row") FROM (
        SELECT
            ${getProperty('"RoomTypes"."property"')},
            "RoomTypes"."id",
            "RoomTypes"."name",
            "RoomTypes"."quantity",
            ${getPrice()},
            "RoomTypes"."occupancy",
            "RoomTypes"."roomView",
            "RoomTypes"."bedTypes",
            ${getTextDescriptions('"RoomTypes"."id"')},
            ${getRoomTypeAmenities('"RoomTypes"."id"')},
            ${getPhotos('"RoomTypes"."property"', "'EN'", 'photos', ['Suite', 'Guest room', 'Guest room amenity'])}
        FROM
            "RoomTypes"
        WHERE "RoomTypes"."id" = $${index}
    ) as "row") as "roomType"
    `;
}

const RULES = {
    "id": insertAsIs,
    "dateBegin": insertAsIs,
    "dateEnd": insertAsIs,
    "confirmationNumber": insertAsIs,
    "vendorData": insertAsIs,
    "ratePlan": insertAsIs,
    "status": insertAsIs,
    "roomTypeId": insertRoomType,
    "guestFirstName": insertAsIs,
    "guestLastName": insertAsIs,
    "guestEmail": insertAsIs,
    "guestPhone": insertAsIs,
    "company": insertAsIs,
    "street": insertAsIs,
    "house": insertAsIs,
    "city": insertAsIs,
    "postalCode": insertAsIs,
    "country": insertAsIs,
    "creditCardType": insertAsIs,
    "acquirerFirstName": insertAsIs,
    "acquirerLastName": insertAsIs,
    "acquirerEmail": insertAsIs,
    "acquirerPhone": insertAsIs,
    "acquirerStreet": insertAsIs,
    "acquirerHouse": insertAsIs,
    "acquirerCity": insertAsIs,
    "acquirerPostalCode": insertAsIs,
    "acquirerCountry": insertAsIs,
    "comments": insertAsIs,
    "service_id": insertAsIs,
    "customer_id": insertAsIs
};

module.exports = function (options) {

    let fields = [];
    let values = [];
    let params = [];

    Object.keys(RULES).forEach(function (rule) {
        if (!(rule in options)) {
            return;
        }
        fields.push(`"${rule == 'roomTypeId' ? 'roomType' : rule}"`);
        values.push(RULES[rule](params.push(options[rule])));
    });

    let SQL = `INSERT INTO "Bookings" (${fields.join(",")}) SELECT ${values.join(",")};`;

    return this.dao.executeSql(SQL, params);
};
