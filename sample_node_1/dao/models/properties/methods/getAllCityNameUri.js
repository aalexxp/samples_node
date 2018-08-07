module.exports = function(){

    const query = 'SELECT DISTINCT(p."city") as uri'
        + ' FROM "Properties" p';

    return this.dao.select(query);

};
