const SQL =
    `
WITH
    "RoomTypeIds" AS (
        SELECT "RoomTypes"."id"
        FROM "RoomTypes"
        WHERE "RoomTypes"."property" = $1),
    "PhotoIds" AS (
        SELECT "Photos"."id"
        FROM "Photos", "RoomTypeIds"
        WHERE "Photos"."relation" IN ("RoomTypeIds"."id", $1)),
    "AllRelationIds" AS (
        SELECT "PhotoIds".id
        FROM "PhotoIds"
        UNION DISTINCT
            SELECT "RoomTypeIds".id
            FROM "RoomTypeIds"),
    "DeleteTexts" AS (
        DELETE FROM "TextDescriptions"
        USING "AllRelationIds"
        WHERE "TextDescriptions"."relation" IN ("AllRelationIds"."id", $1)),
    "DeleteAmenities" AS (
        DELETE FROM "AmenityRelations"
        USING "RoomTypeIds"
        WHERE "AmenityRelations"."roomTypeId" IN ("RoomTypeIds"."id")
            OR "AmenityRelations"."propertyId" = $1),
    "DeletePolicies" AS (
        DELETE FROM "Policies"
        USING "RoomTypeIds"
        WHERE "Policies"."relation" IN ("RoomTypeIds"."id", $1))
DELETE FROM "Photos"
USING "RoomTypeIds"
WHERE "Photos"."relation" IN ("RoomTypeIds"."id", $1);`;

module.exports = function (id) {
    return this.dao.executeSql(SQL, [id]);
};