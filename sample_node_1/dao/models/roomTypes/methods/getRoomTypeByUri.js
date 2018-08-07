module.exports = function (uri) {
    const SQL = `select * from "RoomTypes" where uri=$1`;
    return this.dao.selectOne(SQL, [uri]);
};