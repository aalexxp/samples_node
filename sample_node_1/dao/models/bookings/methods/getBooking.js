const path = require("path");
const daoPath = path.join(__dirname, "..", "..");

module.exports = function(input, fields) {
    const SQL_BOOKING = `
        SELECT "Bookings"."${fields.join('","Bookings"."')}"
        FROM "Bookings"
        WHERE LOWER("Bookings"."guestEmail") = '${input.email}' AND "Bookings"."confirmationNumber" = '${input.confirmation}'
    `;

    return this.dao.select(SQL_BOOKING);
};
