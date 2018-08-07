const _ = require("lodash");
const Promise = require("bluebird");

module.exports = function (property, service_id) {
    let values = [];

    if (_.has(property, 'status')) {
        values.push(`"status" = '${property.status}'`)
    }

    if (values.length > 0) {

        const SQL = `UPDATE "Bookings" 
            SET ${ values.join(',') }
            WHERE "service_id" = '${service_id}'::uuid
            AND "id" = '${property.id}'::uuid`;

        this.dao.executeSql(SQL);

        return this.dao.execute();
    }

    return Promise.reject(new Error('Empty values'));
};
