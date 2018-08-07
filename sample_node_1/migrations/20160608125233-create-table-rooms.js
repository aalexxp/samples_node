exports.up = function (db) {
    return db.runSql(
        `CREATE TABLE "Rooms" (
            "id" UUID PRIMARY KEY,
            "property" UUID not null REFERENCES "Properties",
            "name" VARCHAR not null,
            "quantity" INTEGER not null
        );`
    );
};

exports.down = function (db) {
    return db.runSql(
        `DROP TABLE "Rooms";`
    );
};
