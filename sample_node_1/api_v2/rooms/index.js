const express = require('express');
const router = express.Router();
const rp = require("request-promise");
const _ = require("lodash");
const propertyRoomsMapResponse = require('../properties').propertyRoomsMapResponse;

const API_BASE = process.env.MICROSERVICE_MONGO;

module.exports = router;

function roomMapResponse(response) {
    const room = response.room;
    const property = response.property;


    let result = {
        id: room.id,
        name: room.title,
        uri: room.uri,
        bedTypes: room.bedTypes,
        kitchen: room.extra.kitchen,
        wifi: room.extra.wifi,
        distance: room.distance,
        photos: room.gallery,
        price: room.price,
        amenities: room.facilities,
        review_scores: property.review_scores,
        size: room.size,
        max_adults: room.max_adults,
        max_children: room.max_children,
        property: {
            id: property.id,
            name: property.title,
            uri: property.uri,
            type: property.type,
            checkIn: property.check_in,
            checkOut: property.check_out,
            thumbnail: property.thumbnail,
            rooms: propertyRoomsMapResponse(property),
            custom_data: {
                facilities: property.facilities
            },
            address: {
                country: property.address.country,
                city: property.address.city,
            },
            position: property.position,
            popular_facilities: property.popular_facilities,
            online: response.amadeus
        }
    };

    return result;
}

module.exports.getRoom = (req, res) => {
    const uri = req.query.q;

    const room_options = {
        method: 'POST',
        uri: API_BASE + "/get_room",
        headers: {},
        body: {},
        json: {
            uri: uri,
            currency: req.query.currency,
            language: req.query.language,
            "check-online": {
                start: req.query.start,
                end: req.query.end
            }
        },
        resolveWithFullResponse: true
    };

    rp(room_options)
        .then(response => {
            let result = roomMapResponse(response.body);
            res.json(result);
        })
        .catch(error => res.status(500).json(error));
};