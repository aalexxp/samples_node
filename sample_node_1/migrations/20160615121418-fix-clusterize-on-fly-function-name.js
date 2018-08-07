const SQL =
`
ALTER FUNCTION cluterize_on_fly(box, integer, int, integer) RENAME TO clusterize_on_fly;
`;

const SQL_OLD =
`
ALTER FUNCTION clusterize_on_fly(box, integer, int, integer) RENAME TO cluterize_on_fly;
`;

exports.up = function (db) {
    return db.runSql(
        SQL
    );
};

exports.down = function (db) {
    return db.runSql(
        SQL_OLD
    );
};
