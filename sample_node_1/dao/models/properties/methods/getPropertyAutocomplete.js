module.exports = function (query) {

    const AUTOCOMPLETE_LIMIT = 10;
    const PROPERTY_FIELDS = [
        '"Properties"."id"',
        '"Properties"."name"',
        '"Properties"."address"',
        '"Properties"."uri"'
    ];

    const WHERE_QUERIES = [
        '"Properties"."name" LIKE \'%' + query + '%\'',
        '"Properties"."address" LIKE \'%' + query + '%\'',
        '"Properties"."uri" LIKE \'%' + query + '%\'',
    ];

    const SQL = `SELECT ${PROPERTY_FIELDS.join(",")} FROM "Properties" WHERE ${WHERE_QUERIES.join(' OR ')} LIMIT ${AUTOCOMPLETE_LIMIT}`;

    return this.dao.select(SQL);
};
