exports.up = function (db) {
    return db.runSql(
        `CREATE INDEX "Properties_position_index" ON "Properties" USING gist ("position" point_ops);`
    );
};

exports.down = function (db) {
    return db.runSql(
        `DROP INDEX "Properties_position_index";`
    );
};