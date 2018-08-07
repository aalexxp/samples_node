module.exports = (alias = "wifi") => {
    return ` EXISTS (
        SELECT "Amenities"."amenity"
        FROM "AmenityRelations"
            JOIN "Amenities" ON "Amenities"."uuid" = "AmenityRelations"."amenity"
        WHERE ("AmenityRelations"."roomTypeId" = "RoomTypes"."id" OR "AmenityRelations"."propertyId" = "RoomTypes"."property")
            AND "Amenities"."amenity" IN (
                'Wireless internet connection',
                'High speed internet connection',
                'Free high speed internet connection',
                'Hotspots'
            )
        ) as "${alias}"
    `;
};
