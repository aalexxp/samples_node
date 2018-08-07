module.exports = function () {

    const query = `SELECT r."uri"
        FROM "RoomTypes" r
        WHERE r."uri" IS NOT NULL
    `;

    return this.dao.select(query);

};
