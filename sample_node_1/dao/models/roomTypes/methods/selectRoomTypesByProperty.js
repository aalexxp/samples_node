let SQL = `
    SELECT "RoomTypes"."id", "RoomTypes"."mergeDocumentId" 
    FROM "RoomTypes" 
    WHERE "RoomTypes"."property" = $1;
`;

module.exports = function (propertyId) {
    return this.dao.select(SQL, [propertyId]);
};