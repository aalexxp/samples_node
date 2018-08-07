const path = require("path");
const daoPath = path.join(__dirname, "..", "..");
const getAddress = require(path.join(daoPath, "properties", "utils", "getAddress"));
const getPosition = require(path.join(daoPath, "properties", "utils", "getPosition"));

module.exports = (id) => {
    const SQL = `
        SELECT
          "PropertiesWithRoomTypes"."id",
          "PropertiesWithRoomTypes"."name",
          ${getPosition("position", "PropertiesWithRoomTypes")},
          ${getAddress("address", "PropertiesWithRoomTypes")},
          "PropertiesWithRoomTypes"."roomTypes"
        FROM "PropertiesWithRoomTypes"
        WHERE "PropertiesWithRoomTypes"."id" = $1;
    `;
    return this.dao.select(SQL, [id]);
};