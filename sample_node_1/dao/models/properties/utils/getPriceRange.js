module.exports = (priceFrom, priceTo, field = 'price') => {
    let result = '';
    if (priceFrom) {
        result += ` ${field} >= ${priceFrom} `;

        if (priceTo) {
            result += ` AND `
        }
    }
    if (priceTo) {
        result += ` ${field} <= ${priceTo} `;
    }

    result = result ? ` AND ( ${result} )` : '';

    return result;
};