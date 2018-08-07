const _ = require('lodash');
const moment = require("moment");
/**
 * Mark image as deleted
 * @param {uuid|uuid[]} id
 */
module.exports = function (id) {
    let condition = id;

    if (!_.isArray(id)) {
        condition = [id];
    }

    const SQL = `
        UPDATE "Photos" SET deleted_at=now() where id in ($1);
    `;

    return this.dao.select(SQL, [condition.join(',')]);
};
