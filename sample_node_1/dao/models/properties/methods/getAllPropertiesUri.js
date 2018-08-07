module.exports = function(){

    const query = 'SELECT p."uri"'
        + ' FROM "Properties" p'
        + ' WHERE p."uri" IS NOT NULL';

    return this.dao.select(query);

};
