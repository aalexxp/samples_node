exports.up = function (db) {
    return db.runSql(
        `CREATE INDEX "Rooms_property_index" ON "Rooms" ("property");`
    );
};

exports.down = function (db) {
    return db.runSql(
        `DROP INDEX "Rooms_property_index";`
    );
};
