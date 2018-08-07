module.exports = (field = "price") => {
    return `
        json_build_object(
            'amount', "RoomTypes"."price",
            'currency', "RoomTypes"."currency",
            'timeUnit', "RoomTypes"."timeUnit"
        ) AS "${field}"
    `;
};