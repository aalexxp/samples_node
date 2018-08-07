/**
 * Need installed PostgreSQL extension - pg_trgm
 * @param details
 */

const MINIMAL_SIMILARITY = 0.8;

module.exports = function (details) {
    const SQL = `SELECT  (POINT(${details.lng}, ${details.lat}) <-> "position"), uri
            FROM "Properties"
            WHERE LOWER("city") = LOWER('${details.city}')
            AND similarity(name::text,'${details.name}'::text) > ${MINIMAL_SIMILARITY}
            ORDER BY 1 ASC
            LIMIT 1`;

    return this.dao.selectOne(SQL);
};