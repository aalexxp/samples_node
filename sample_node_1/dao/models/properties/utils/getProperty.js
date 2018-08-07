const path = require("path");
const daoPath = path.join(__dirname, "..", "..");
const getAddress = require(path.join(daoPath, "properties", "utils", "getAddress"));
const getPosition = require(path.join(daoPath, "properties", "utils", "getPosition"));
const getResourceType = require(path.join(daoPath, "properties", "utils", "getResourceType"));
const getAmenities = require(path.join(daoPath, "amenities", "utils", "getAmenitiesByRelation"));
const getTextDescriptions = require(path.join(daoPath, "textDescriptions", "utils", "getTextDescriptions"));
const getGuarantyPayment = require(path.join(daoPath, "policies", "utils", "getPolicies"));

const SERVICE_ID = process.env.SERVICE_ID;

module.exports = (id, language = "'EN'", field = 'property') => {
    const FIELDS = [
        '"Properties"."id"',
        '"Properties"."name"',
        '"Properties"."uri"',
        '"Properties"."checkIn"',
        '"Properties"."checkOut"',
        '"Properties"."segment"',
        '"Properties"."phone"',
        '"Properties"."custom_data"',
        getAddress(),
        getPosition(),
        getResourceType(),
        getGuarantyPayment('"Properties"."id"', language, "'Guaranty Payment'", 'policy'),
        getTextDescriptions('"Properties"."id"', language),
        '"ServicesProperties"."is_negotiated" as negotiated'
    ];

    return `
        (
            SELECT row_to_json("row")
            FROM (
                SELECT ${FIELDS.join(",")}
                FROM "Properties"
                LEFT JOIN "ServicesProperties" ON "Properties"."id"="ServicesProperties"."property_id"
                    AND "ServicesProperties"."service_id" = '${SERVICE_ID}'
                WHERE "Properties"."id" = ${id}
            ) AS "row"
        ) as "${field}"
    `;
};