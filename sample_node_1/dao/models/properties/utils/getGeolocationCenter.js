module.exports = (east, north, west, south) => {
    return `@@ (BOX (POINT (${east}, ${north}), POINT (${west}, ${south})))`
};