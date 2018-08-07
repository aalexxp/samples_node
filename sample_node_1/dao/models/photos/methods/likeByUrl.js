module.exports = function (url) {

    const SQL = `
        SELECT id, url FROM "Photos" where url like $1 and deleted_at isnull;
    `;

    return this.dao.select(SQL, [`%${url}%`]);
};
