module.exports = (field = "address", table = "Properties") => {
    return `
        json_build_object(
            'country', "${table}"."country",
            'city', "${table}"."city",
            'addressLine', "${table}"."address",
            'postalCode', "${table}"."postalCode"
        ) AS "${field}"
    `
};