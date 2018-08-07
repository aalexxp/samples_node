module.exports = (east, north, west, south, field = 'position') => {
    if (west > east) {
        return `(${field} <@ (BOX (POINT (${180},  ${north}), POINT (${west}, ${south})))
                OR
                ${field} <@ (BOX (POINT (${east}, ${north}), POINT (${-180}, ${south}))))`;
    }
    return `${field} <@ (BOX (POINT (${east}, ${north}), POINT (${west}, ${south})))`
};