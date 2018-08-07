module.exports = function (data) {
    const SQL = `
        INSERT INTO "Translate" ("original", "translated", "language") VALUES
        ('${data.original}', '${data.translate}', '${data.language}')
        ON CONFLICT DO NOTHING
    `;

    return this.dao.select(SQL);
};
