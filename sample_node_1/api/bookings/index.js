const path = require("path");
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const moment = require("moment");
const responses = require('../@types/response');


const clean = require(path.join(__dirname, "..", "..", "apiTools", "clean"));
const auth = require(path.join(__dirname, "..", "..", "apiTools", "auth"))();

module.exports = router;


router.use("/", bodyParser.json(), auth.initialize());

router.post("/", auth.authenticate(), function (req, res) {
    let response = new responses.response();
    return req.dao.auth.getUserById(req.user.id)
        .then(function (user) {
            if (user) {
                return getBookings(req, res)
                    .then((bookings) => {
                        return response.setType(responses.TYPES.SUCCESS)
                            .addData('list', bookings)
                            .send(res, 200);
                    });
            } else {
                throw new Error("User not found");
            }
        })
});

router.post("/update", auth.authenticate(), (req, res) => {
    let response = new responses.response();
    return req.dao.auth.getUserById(req.user.id)
        .then(function (user) {
            if (user) {
                return updateBooking(req, res)
                    .then((result) => {
                        return response.setType(responses.TYPES.SUCCESS)
                            .addData('result', result)
                            .send(res, 200);
                    });
            } else {
                throw new Error("User not found");
            }
        })
});


const GET_BOOKINGS_RULES = {
    "filters": {
        base: "body",
        type: "string"
    },
    "limit": {
        base: "query",
        type: "int"
    },
    "offset": {
        base: "query",
        type: "int"
    }
};

const UPDATE_BOOKING_FIELD = {
    "id": {
        base: "body",
        obligatory: true,
        type: "uuid"
    },
    "status": {
        base: "body",
        obligatory: false,
        type: "string"
    },
};

const BOOKING_FIELDS = [
    "id", "requestTime", "confirmationNumber", "dateBegin", "dateEnd", "status", "cancelStatus",
    "ratePlan", "roomType", "totalPriceAmount", "totalPriceCurrency",
    "penalties", "creditCardType", "vendorBookingData", "vendorData",
    "guestFirstName", "guestLastName", "guestEmail", "guestPhone",
    "company", "street", "house", "city", "postalCode", "country",
    "acquirerFirstName", "acquirerLastName", "acquirerEmail", "acquirerPhone",
    "acquirerStreet", "acquirerHouse", "acquirerCity", "acquirerPostalCode", "acquirerCountry"
];

function getBookings(req, res) {
    return clean(req, GET_BOOKINGS_RULES).bind({
        res: res,
        req: req
    }).then(function (cleaned) {
        return req.dao.bookings.getBookings({
            service_id: process.env.SERVICE_ID,
            filters: cleaned.filters
        }, BOOKING_FIELDS);
    }).then(function (bookings) {
        if (bookings.length === 0) {
            return [];
        }
        return processResponse(bookings);
    }).catch(handleErrors);
}

function processResponse(bookings) {
    return bookings.map(booking => processBooking(booking));
}

function processBooking(booking) {
    let stayLength = moment(booking.dateEnd).diff(booking.dateBegin, 'days');

    let processed = {
        id: booking.id,
        cTime: booking.requestTime,
        status: booking.status,
        cancelStatus: booking.cancelStatus,
        startDate: booking.dateBegin,
        endDate: booking.dateEnd,
        lengthOfStay: stayLength,
        guest: {
            firstName: booking.guestFirstName,
            lastName: booking.guestLastName,
            email: booking.guestEmail,
            phone: booking.guestPhone,
            company: booking.company
        },
        acquirer: {},
        price: {
            pricePerDay: +(booking.totalPriceAmount / stayLength).toFixed(2),
            totalPrice: booking.totalPriceAmount,
            currency: booking.totalPriceCurrency
        },
        confirmationNumber: booking.confirmationNumber,
        penalties: booking.penalties,
        roomType: booking.roomType,
        ratePlan: booking.ratePlan,
        vendorData: booking.vendorData,
        vendorBookingData: booking.vendorBookingData
    };

    if (booking.street || booking.house || booking.city || booking.postalCode || booking.country) {
        processed.guest.address = {
            "addressLine": booking.street,
            "house": booking.house,
            "city": booking.city,
            "postalCode": booking.postalCode,
            "country": booking.country
        }
    }
    if (booking.acquirerFirstName || booking.acquirerLastName || booking.acquirerEmail || booking.acquirerPhone) {
        processed.acquirer = {
            firstName: booking.acquirerFirstName || '',
            lastName: booking.acquirerLastName || '',
            email: booking.acquirerEmail || '',
            phone: booking.acquirerPhone || '',
            address: {
                "addressLine": booking.acquirerStreet || '',
                "house": booking.acquirerHouse || '',
                "city": booking.acquirerCity || '',
                "postalCode": booking.acquirerPostalCode || '',
                "country": booking.acquirerCountry || ''
            }
        }
    }

    return processed;
}

function updateBooking(req, res) {
    return clean(req, UPDATE_BOOKING_FIELD).bind({
        res: res,
        req: req
    }).then(function (cleaned) {
        return req.dao.bookings.updateBooking(cleaned, process.env.SERVICE_ID);
    }).catch(handleErrors);
}

function handleErrors(error) {
    this.res.sendError(error);
}
