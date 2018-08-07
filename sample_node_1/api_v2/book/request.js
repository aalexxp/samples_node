const _ = require('lodash');
const BookingRequest = require("../../api/@types/booking/request").BookingRequest;
const Promise = require('bluebird');

module.exports.handler = (req, res) => {

    const booking_data = req.body;

    const rooms_collection = booking_data.rooms || [];
    const lang = booking_data.lang || 'en';

    const collection = rooms_collection.map(data => {
        const guest_address = _.get(data, 'guest.address', {});

        let acquirer = _.get(data, 'acquirer', {});
        acquirer.address = acquirer.address || {};

        let filter_conditions = _.get(data, 'filterConditions.selected_filter_methods', [])
            .map(filter => filter.key)
            .join(', ');

        return new BookingRequest({
            room_id: data.roomTypeId,
            date: {
                start: data.startDate,
                end: data.endDate
            },
            comment: data.comment,
            guest: {
                address: {
                    address_line: guest_address.addressLine,
                    house: guest_address.house,
                    city: guest_address.city,
                    postal_code: guest_address.postalCode,
                    country: guest_address.country
                },
                first_name: data.guest.firstName,
                last_name: data.guest.lastName,
                email: data.guest.email,
                phone: data.guest.phone,
                company: data.guest.company
            },
            acquirer: {
                address: {
                    address_line: acquirer.address.addressLine,
                    house: acquirer.address.house,
                    city: acquirer.address.city,
                    postal_code: acquirer.address.postalCode,
                    country: acquirer.address.country
                },
                first_name: acquirer.firstName,
                last_name: acquirer.lastName,
                email: acquirer.email,
                phone: acquirer.phone,
            },
            guestCount: {
                adults: _.get(data, 'guestCount.adults'),
                children: _.get(data, 'guestCount.children')
            },
            state: {
                filter: filter_conditions
            }
        }, {lang: lang})
    })
        .map(data => data.loadExtraData());

    Promise.all(collection)
        .then(_request => Promise.resolve(_request.map(request => {
            return request.sendRequest();
        })))
        .then(request_results => {
            return Promise.all(request_results)
                .then(result => {
                    result = result.map(obj => {
                        return {
                            request: !!obj.mailer.total_accepted_recipients,
                            room: {id: obj.room.id}
                        }
                    });
                    return res.json({
                        result: result
                    });
                });
        })
        .catch(err => {
            res.status(400).json(err);
        });
};