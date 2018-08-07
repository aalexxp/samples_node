exports.up = function (db) {
    return db.runSql(
        `CREATE TABLE "Properties" (
            "id" UUID PRIMARY KEY,
            "name" VARCHAR not null,
            "position" POINT not null
        );`
    );
};

exports.down = function (db) {
    return db.runSql(
        `DROP TABLE "Properties";`
    );
};
