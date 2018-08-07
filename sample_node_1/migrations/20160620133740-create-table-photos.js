exports.up = function (db) {
    return db.runSql(
        `CREATE TABLE "Photos" (
            "id" UUID PRIMARY KEY,
            "room" UUID not null REFERENCES "Rooms",
            "url" VARCHAR not null
        );`
    );
};

exports.down = function (db) {
    return db.runSql(
        `DROP TABLE "Photos";`
    );
};
