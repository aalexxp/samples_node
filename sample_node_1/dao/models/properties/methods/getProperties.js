const path = require("path");
const daoPath = path.join(__dirname, "..", "..");
const getGeolocationBounds = require(path.join(daoPath, "properties", "utils", "getGeolocationBounds"));
const getPosition = require(path.join(daoPath, "properties", "utils", "getPosition"));
const ROOM_FIELDS = require(path.join(daoPath, "roomTypes", "utils", "getFields"))(language='$2');

module.exports = function (input) {
    const restrictBounds = getGeolocationBounds(input.east, input.north, input.west, input.south);
    const PROPERTY_FIELDS = [
        '"Properties"."id"',
        '"Properties"."name"',
        getPosition()
    ];

    const ROOM_TYPES = `(
        SELECT array_to_json(array_agg(row))
        FROM (
            SELECT ${ROOM_FIELDS.join(",")},
            json_build_object(
                'amount', (
                        CASE WHEN "Currency"."rate" IS NOT NULL
                        THEN searchindex.common_price * "Currency"."rate" 
                        ELSE searchindex.common_price 
                        END
                    ) as price,
                'currency', '${input.currency}',
                'timeUnit', "RoomTypes"."timeUnit"
            ) AS "price"
             , (SELECT array_to_json(array_agg(row.amenity))
                FROM (
                    SELECT am.id amenity
                    FROM "AmenityRelations" ar
                        JOIN "Amenities" am ON am."uuid" = ar."amenity"
                    WHERE (ar."roomTypeId" = "RoomTypes"."id" OR ar."propertyId" = "RoomTypes"."property")
                        ORDER BY am.id
                ) AS row
            ) as "amenities"
            FROM "RoomTypes"
            LEFT JOIN "searchindex" ON "RoomTypes"."id"="searchindex"."roomtype_id"
		    LEFT JOIN "Currency" ON searchindex.common_currency = "Currency".initial AND "Currency".target='${input.currency}'
            WHERE "RoomTypes"."property" = "Properties"."id"
            ORDER BY "RoomTypes"."price"
        ) AS row
    ) AS "roomTypes"
    `;

    const SQL_PROPERTIES_BY_AREA = `
        SELECT ${PROPERTY_FIELDS.join(",")}
             , ${ROOM_TYPES}
        FROM "Properties"
        WHERE ${restrictBounds}
    `;

    return this.dao.select(SQL_PROPERTIES_BY_AREA);
};