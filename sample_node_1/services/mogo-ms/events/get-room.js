const rp = require("request-promise");

module.exports.getRoom = (room_id) => {
    const room_options = {
        method: 'GET',
        uri: `${process.env.MICROSERVICE_MONGO}/room/${room_id}`,
        json: true,
        resolveWithFullResponse: true
    };

    return rp(room_options).then(response => response.body);
};