module.exports = (alias = "kitchen") => {
    return `(
        SELECT "Amenities"."amenity"
        FROM "AmenityRelations"
            JOIN "Amenities" ON "Amenities"."uuid" = "AmenityRelations"."amenity"
        WHERE "AmenityRelations"."roomTypeId" = "RoomTypes"."id"
            AND "Amenities"."amenity" = 'Kitchen'
        ) IS NOT NULL as "${alias}"
    `;
};