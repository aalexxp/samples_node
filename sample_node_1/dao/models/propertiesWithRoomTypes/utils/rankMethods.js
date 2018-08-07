module.exports.rankMethods = rankMethods = {
    P: {
        _description: 'price',
        type: 'SEPARATE',
        rank_field: '(case when main_price=0 then -1 else main_price end)',
        extend_query: []
    },
    L: {
        _description: 'livability index',
        type: 'SEPARATE',
        rank_field: 'coalesce(filtered_rooms.livability_index, 0)',
        extend_query: []
    },
    I: {
        _description: 'WiFi internet guest review score',
        type: 'SEPARATE',
        rank_field: 'igrs_index',
        extend_query: [{
            select: 'coalesce(filtered_rooms.igrs_index, 0) as igrs_index'
        }]
    },
    H: {
        _description: 'highest overall guest rating',
        type: 'SEPARATE',
        rank_field: 'hogr_index',
        extend_query: [{
            select: 'coalesce(filtered_rooms.hogr_index, 0) as hogr_index'
        }]
    },
    D: {
        _description: 'distance to the map centre',
        type: 'SEPARATE',
        rank_field: '(CASE WHEN distance_index != 0 THEN 1/distance_index END)',
        extend_query: []
    },
    AM: {
        field: 'Ambiance',
        type: 'RATING_GROUP',
    },
    BA: {
        field: 'Bathroom',
        type: 'RATING_GROUP'
    },
    BE: {
        field: 'Bedding',
        type: 'RATING_GROUP'
    },
    BR: {
        field: 'Breakfast',
        type: 'RATING_GROUP'
    },
    CL: {
        field: 'Cleanliness',
        type: 'RATING_GROUP'
    },
    FA: {
        field: 'Facilities',
        type: 'RATING_GROUP'
    },
    FB: {
        field: 'Food & Beverage',
        type: 'RATING_GROUP'
    },
    FR: {
        field: 'Freebies',
        type: 'RATING_GROUP'
    },
    HO: {
        field: 'Host',
        type: 'RATING_GROUP'
    },
    IF: {
        field: 'In-room facilities',
        type: 'RATING_GROUP'
    },
    LO: {
        field: 'Location',
        type: 'RATING_GROUP'
    },
    PT: {
        field: 'Parking & Transport',
        type: 'RATING_GROUP'
    },
    PR: {
        field: 'Price',
        type: 'RATING_GROUP'
    },
    QU: {
        field: 'Quietness',
        type: 'RATING_GROUP'
    },
    SP: {
        field: 'Spaciousness',
        type: 'RATING_GROUP'
    },
    SG: {
        field: 'Spa & Gym',
        type: 'RATING_GROUP'
    },
    ST: {
        field: 'Staff',
        type: 'RATING_GROUP'
    },
    VS: {
        field: 'Views & Surroundings',
        type: 'RATING_GROUP'
    },
    WF: {
        field: 'WiFi',
        type: 'RATING_GROUP'
    }

};

function isAvailableSortMethod(method) {
    return !!rankMethods[method];
}

module.exports.isAvailableSortMethod = isAvailableSortMethod;