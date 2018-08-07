const SQL = `
    (SELECT array_to_json(array_agg(row)) FROM
            (SELECT "vendor", "vendorId" FROM "VendorIds" where "relation" = "Properties"."id" ) AS "row"
    ) as "vendorIds"`;

module.exports = {
    toSQL: function () {
        return SQL;
    }
};