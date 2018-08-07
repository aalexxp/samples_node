const express = require('express');
const router = express.Router();
const rp = require("request-promise");
const _ = require("lodash");

const API_BASE = process.env.MICROSERVICE_MONGO;

module.exports = router;

function searchCity(query) {
    const request_options = {
        method: 'POST',
        uri: API_BASE + '/get_cities',
        headers: {},
        body: {},
        json: {
            text: query
        },
        resolveWithFullResponse: true
    };

    return rp(request_options)
        .then(response => {
            return response.body.data;
        })
        .catch(error => {
            return error;
        });

}

const MAP_METHOD = [
    {name: 'Breakfast', "icon-selector": "bicon-breakfast", selected: true},
    {name: 'Spa & Gym', "icon-selector": "bicon-spa", selected: true},
    {name: 'Quietness', "icon-selector": "bicon-deals", selected: true},
    {name: "Bathroom", "icon-selector": "bicon-private-bathroom", selected: true},
    {name: "In-room facilities", "icon-selector": "bicon-acselect", selected: true},
    {name: "Food & Beverage", "icon-selector": "bicon-food-and-drink", selected: true},
    {name: "Facilities", "icon-selector": "dficon-27", selected: true},
    {name: "Cleanliness", "icon-selector": "bicon-delight", selected: true},
    {name: "WiFi", "icon-selector": "bicon-wifi", selected: true},
    {name: "Location", "icon-selector": "bicon-location", selected: true},
    {name: "Staff", "icon-selector": "bicon-frontdesk", selected: true},
    {name: "Parking & Transport", "icon-selector": "bicon-parking", selected: true},
    {name: "Spaciousness", "icon-selector": "bicon-roomsize", selected: true},
    {name: "Freebies", "icon-selector": "bicon-pricetag", selected: true},
    {name: "Bedding", "icon-selector": "bicon-bed", selected: true},
    {name: "Views & Surroundings", "icon-selector": "bicon-landscape", selected: true},
    {name: "Ambiance", "icon-selector": "bicon-wine", selected: true}
];

function propertyRoomsMapResponse(response) {
    return response.rooms.map(room => {

        room.gallery = room.gallery || [];

        return {
            id: room.room_id,
            name: room.name,
            uri: room.uri,
            typeCode: null,
            quantity: null,
            price: room.price,
            occupancy: null,
            roomview: null,
            bedtypes: [],
            bedTypes: {
                types: room.bedTypes,
                count: _.reduce(room.bedTypes, (res, v) => res + v, 0)
            },
            numberofbeds: 1,
            distance: response.distance,
            highlight: null,
            negotiated: null,
            size: room.size,
            kitchen: room.extra ? room.extra.kitchen : room.has_kitchen,
            wifi: room.extra ? room.extra.wifi : room.has_wifi,
            photos: room.gallery.map(image => {
                image = image.replace('square60', 'max500');
                return {
                    url: image,
                    title: null,
                    text: null,
                    type: null
                };
            }),
            amenities: room.amenities,
            property: {
                id: response._id,
                name: response.title,
                uri: response._id,
                vendors: response.vendors
            }
        };
    });

}

function roomsMapResponse(response) {
    response = response.map(record => {
        let room = {
            id: record.room.id,
            name: record.room.name,
            uri: record.room.uri,
            typecode: null,
            quantity: null,
            price: record.price,
            occupancy: null,
            roomview: null,
            bedTypes: {
                types: record.room.bedTypes,
                count: _.reduce(record.room.bedTypes, (res, v) => res + v, 0)
            },
            size: record.room.size,
            distance: record.distance,
            highlight: null,
            negotiated: null,
            kitchen: record.room.has_kitchen,
            wifi: record.room.has_wifi,
            photos: record.room.image_ids.map(image => {
                image = image.replace('square60', 'max500');
                return {
                    url: image,
                    title: null,
                    text: null,
                    type: null
                };
            }),
            amenities: null,
            property: {
                id: record._id,
                name: record.title,
                uri: record._id,
                vendors: record.vendors
            }
        };

        return room;
    });

    return response;
}

function propertyMapResponse(property_data, options = {}) {

    let room = {
        id: property_data._id,
        name: property_data.title,
        uri: property_data.uri,
        position: {
            lng: property_data.lng,
            lat: property_data.lat
        },
        address: {
            country: "DE",
            city: "BERLIN",
            addressLine: null,
            postalCode: null
        },
        roomTypes: [],
        resource: "BOOKING",
        price: property_data.avg_price || 0,
        currency: "EUR",
        propertyRoomUri: property_data.room && property_data.room.uri
    };

    if (options.with__rooms) {
        room.roomTypes = propertyRoomsMapResponse(property_data);
    }

    return room;
}

function propertiesMapResponse(response) {
    response = response.map(record => propertyMapResponse(record));
    return response;
}

async function get_data(options = {}) {

    let request_data = {
        sort: options.sort || [],
        filters: options.filter || [],
        offset: parseInt(options.offset) || false,
        price: options.price || false,
        map: options.map || {},
        guest: options.guest || {},
        currency: options.currency,
    };

    if (options.start && options.end) {
        request_data["check-online"] = {
            start: options.start,
            end: options.end
        }
    }

    const request_options = {
        method: 'POST',
        uri: API_BASE + '/get_data',
        headers: {},
        body: {},
        json: request_data,
        resolveWithFullResponse: true
    };

    return rp(request_options)
        .then(response => {
            let properties = propertiesMapResponse(response.body.data);
            properties = _.unionBy(properties, 'id');

            let result = {
                price_bounds: response.body.price_bounds,
                results: roomsMapResponse(response.body.data),
                map_properties: properties,
                map_properties_count: response.body.pagination.pages,
                filtered_properties_count: response.body.properties_count
            };

            return result;
        })
        .catch(error => {
            console.log('------------------------------------------------------------');
            console.error('Error:', error);
            console.log('Request', JSON.stringify(request_options));
            console.log('------------------------------------------------------------');
        });
}


module.exports.getData = (req, res) => {
    get_data(req.body)
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error));
};

module.exports.getProperty = (req, res) => {
    const room_options = {
        method: 'POST',
        uri: `${API_BASE}/get_detail`,
        headers: {},
        body: {},
        json: {
            uri: req.query.q,
            south: req.query.south,
            north: req.query.north,
            west: req.query.west,
            east: req.query.east,
            lat: req.query.lat,
            lng: req.query.lng,
            currency: req.query.currency,
            resource: req.query.resource
        },
        resolveWithFullResponse: true
    };

    rp(room_options)
        .then(response => {
            let result = propertyMapResponse(response.body.data, {with__rooms: true});
            res.json(result);
        })
        .catch(error => {
            res.status(500).json(error);
        });
};

module.exports.propertyRoomsMapResponse = propertyRoomsMapResponse;