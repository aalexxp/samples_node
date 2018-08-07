const path = require("path");
const daoPath = path.join(__dirname, "..", "..");
const getProperty = require(path.join(daoPath, "properties", "utils", "getProperty"));
const getTextDescriptionByType = require(path.join(daoPath, "textDescriptions", "utils", "getTextDescriptionByType"));
const getRoomTypeAmenities = require(path.join(daoPath, "amenities", "utils", "getAmenitiesByRelation"));

const FIELDS = require(path.join(daoPath, "roomTypes", "utils", "getDescriptiveFields"))();
const PROPERTY = getProperty('"RoomTypes"."property"');
const ROOM_DESCRIPTION = getTextDescriptionByType('"RoomTypes"."id"', "'en'", "Description");

module.exports = (id, options =  {currency: 'EUR', language: 'en'}) => {
    const SQL_ROOMTYPE = `
    SELECT
        ${FIELDS.join(',')},
        json_build_object(
            'amount', (
                    CASE WHEN "Currency"."rate" IS NOT NULL
                    THEN searchindex.common_price * "Currency"."rate" 
                    ELSE searchindex.common_price 
                    END
                ),
            'currency', '${options.currency}',
            'timeUnit', "RoomTypes"."timeUnit"
        ) AS "price"
      , ${ROOM_DESCRIPTION} AS "description"
      , (
            SELECT array_to_json(array_agg(row.amenity))
            FROM (
                SELECT "Amenities".id amenity
                FROM "AmenityRelations" ar
                    JOIN "Amenities" ON "Amenities"."uuid" = ar."amenity"
                WHERE (ar."roomTypeId" = "RoomTypes"."id" OR ar."propertyId" = "RoomTypes"."property")
                    ORDER BY "Amenities"."category" nulls last, "Amenities"."categoryOrder" nulls last, "Amenities"."propertyLevel" DESC nulls last
            ) AS row
        ) as "amenities"
      , ${PROPERTY}
    FROM "RoomTypes"
    LEFT JOIN "searchindex" ON "RoomTypes"."id"="searchindex"."roomtype_id"
    LEFT JOIN "Currency" ON searchindex.common_currency = "Currency".initial AND "Currency".target='${options.currency}'
    WHERE "RoomTypes"."id" = $1
    ;`;

    return this.dao.selectOne(SQL_ROOMTYPE, [id]);
};