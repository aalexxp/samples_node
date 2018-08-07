module.exports = (field = "position", table = "Properties") => {
    return `json_build_object('lng', "${table}"."position"[0], 'lat', "${table}"."position"[1]) AS "${field}"`
};