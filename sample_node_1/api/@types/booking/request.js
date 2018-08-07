const _ = require('lodash');
const mail = require('../../../tools/mail/index');
const mongoMS = require("../../../services/mogo-ms");
const doRequest = require('../../../tools/request');

module.exports.BookingRequest = class {

    constructor(initialData, options = {lang: 'en'}) {

        this.options = options;

        this.data = {
            room_id: undefined,
            date: {
                start: undefined,
                end: undefined
            },
            comment: undefined,
            guest: {
                address: {
                    address_line: undefined,
                    house: undefined,
                    city: undefined,
                    postal_code: undefined,
                    country: undefined
                },
                first_name: undefined,
                last_name: undefined,
                email: undefined,
                phone: undefined,
                company: undefined
            },
            acquirer: {
                address: {
                    address_line: undefined,
                    house: undefined,
                    city: undefined,
                    postal_code: undefined,
                    country: undefined
                },
                first_name: undefined,
                last_name: undefined,
                email: undefined,
                phone: undefined
            },
            guestCount: {
                adults: undefined,
                children: undefined
            },
            state: {
                filter: undefined
            }
        };

        this.extra_data = {};

        if (initialData) {
            this.setData(initialData);
        }
    }

    /**
     * Set data to instance.
     * @param data
     * @returns {exports.BookingRequest}
     */
    setData(data) {
        this.data = _.assignIn(this.data, data);
        return this;
    }

    setExtraData(data) {
        this.extra_data = data;
        return this;
    }

    /**
     * Extend data byRoom
     * @returns {exports.BookingRequest}
     */
    loadExtraData() {
        return mongoMS.getRoom(this.data.room_id).then(extra_data => this.setExtraData(extra_data));
    }

    sendRequest() {
        this.dataToSend = {
            requestDateTime: [this.data.date.start, this.data.date.end].join(' - '),
            guest: {
                firstName: this.data.guest.first_name,
                lastName: this.data.guest.last_name,
                contact: {
                    email: this.data.guest.email,
                    phone: this.data.guest.phone
                },
                address: {
                    street: this.data.guest.address.address_line,
                    house_number: this.data.guest.address.house,
                    city: this.data.guest.address.city,
                    postal_code: this.data.guest.address.postal_code,
                    country: this.data.guest.address.country
                },
                company: this.data.guest.company,
            },
            acquirer: {
                firstName: this.data.acquirer.first_name,
                lastName: this.data.acquirer.last_name,
                contact: {
                    email: this.data.acquirer.email,
                    phone: this.data.acquirer.phone,
                },
                address: {
                    street: this.data.acquirer.address.address_line,
                    house_number: this.data.acquirer.address.house,
                    city: this.data.acquirer.address.city,
                    postal_code: this.data.acquirer.address.postal_code,
                    country: this.data.acquirer.address.country
                }
            },
            rate: {
                guarantee: {}
            },
            room: {
                name: this.extra_data.room.name,
                uri: [process.env.FRONT_URL, 'search/room', this.extra_data.room.uri].join('/'),
            },
            property: {
                name: this.extra_data.title,
                uri: [process.env.FRONT_URL, 'search', this.extra_data.uri].join('/'),
                contact: {
                    phone: '',
                    address: {}
                },
                latitude: this.extra_data.lat,
                longitude: this.extra_data.lng
            },
            comments: this.data.comment,
            guestCount: this.data.guestCount,
            filter: this.data.state.filter
        };
        return mail.send({
            template_name: 'rfp-de',
            substitution_data: this.dataToSend,
            address: process.env.REQUEST_AGENT_EMAIL,
            variables: [],
        }).then(mailer => {
            this.sendWebhook();
            return {
                mailer: mailer.results,
                room: {
                    id: this.data.room_id
                }
            };
        });
    }

    sendWebhook() {
        let webhook_data = Object.assign({}, this.dataToSend);
        switch (this.options.lang) {
            case 'en': {
                webhook_data.language = 'English';
                break;
            }
            case 'de': {
                webhook_data.language = 'German';
            }
        }
        return doRequest('https://hooks.zapier.com', webhook_data);
    }

};