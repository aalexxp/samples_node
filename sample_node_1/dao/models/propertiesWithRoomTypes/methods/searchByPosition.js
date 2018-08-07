const path = require("path");
const daoPath = path.join(__dirname, "..", "..");
const getGeolocationBounds = require(path.join(daoPath, "properties", "utils", "getGeolocationBounds"));
const getPosition = require(path.join(daoPath, "properties", "utils", "getPosition"));
const whereResource = require("../utils/whereReresource.js").whereResource;

const SERVICE_ID = process.env.SERVICE_ID;
const BOUNDS_LIMIT = 1;

module.exports = (input) => {
    const appendBookingData = input.east - input.west <= BOUNDS_LIMIT;
    const SQL = `
        SELECT
          p."id",
          p."name",
          p."uri",
          ${getPosition('position', 'p')},
          p."roomTypes",
          sp."is_highlight" as highlight, sp."is_negotiated" as negotiated
        FROM "PropertiesWithRoomTypes" AS p
        LEFT JOIN "ServicesProperties" AS sp
            ON p."id"=sp."property_id" AND sp."service_id"='${SERVICE_ID}'::uuid
        WHERE ${getGeolocationBounds(input.east, input.north, input.west, input.south)} 
        ${whereResource({appendBookingData: appendBookingData})}
        AND (sp."is_block"='false' OR sp."is_block" IS NULL);
    `;

    return this.dao.select(SQL);
};