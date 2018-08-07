module.exports.whereResource = (options) => {
    let SQL = '';
    if (!options.appendBookingData) {
        SQL = ` AND (resource <> 'BOOKING' OR resource ISNULL) `
    }
    return SQL;
};