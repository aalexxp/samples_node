const
    _ = require('lodash'),
    rp = require('request-promise'),
    express = require('express'),
    bodyParser = require('body-parser'),
    router = express.Router(),
    API_BASE = process.env.MICROSERVICE_MONGO,
    mail = require("../../tools/mail/index");


module.exports = router;

router.use('/', bodyParser.json());

router.post('/city/search', searchCity);
router.post('/property', saveProperty);
router.post('/property/search', searchProperty);
router.post('/property/approve', approveProperty);
router.get('/property/:property_id', getProperty);
router.get('/facility/groups', getFacilityGroups);

/**
 * @deprecated Move to mongo
 * @param req
 * @param res
 */
function approveProperty(req, res) {
    const requestOptions = {
        method: 'POST',
        uri: `${API_BASE}/manager/property/approve`,
        json: req.body,
        resolveWithFullResponse: true
    };
    rp(requestOptions)
        .then(response => {
            res.json(response.body);
        })
        .catch(err => {
            let result = {error: _.get(err, 'error', 'Unknown error.')};
            res.status(400).json(result);
        });
}

/**
 * @deprecated Move to mongo
 * @param req
 * @param res
 */
function searchProperty(req, res) {
    const requestOptions = {
        method: 'POST',
        uri: `${API_BASE}/manager/property/search`,
        json: req.body,
        resolveWithFullResponse: true
    };
    rp(requestOptions)
        .then(response => res.json(response.body))
        .catch(err => res.status(400).json(err));
}

/**
 * @deprecated Move to mongo
 * @param req
 * @param res
 */
function searchCity(req, res) {
    const requestOptions = {
        method: 'POST',
        uri: `${API_BASE}/manager/city/search`,
        json: req.body,
        resolveWithFullResponse: true
    };
    rp(requestOptions).then(response => res.json(response.body));
}

/**
 * @deprecated Move to mongo
 * @param req
 * @param res
 */
function getFacilityGroups(req, res) {
    const requestOptions = {
        method: 'GET',
        uri: `${API_BASE}/manager/facility/groups`,
        json: true,
        resolveWithFullResponse: true
    };
    rp(requestOptions).then(response => res.json(response.body));
}

/**
 * @deprecated Move to mongo
 * @param req
 * @param res
 */
function getProperty(req, res) {
    const requestOptions = {
        method: 'GET',
        uri: `${API_BASE}/manager/property/${req.params.property_id}`,
        json: true,
        resolveWithFullResponse: true
    };
    rp(requestOptions).then(response => res.json(response.body));
}

/**
 * @deprecated Move to mongo
 * @param req
 * @param res
 */
function saveProperty(req, res) {
    const requestOptions = {
        method: 'POST',
        uri: `${API_BASE}/manager/property`,
        headers: {},
        body: {},
        json: req.body,
        resolveWithFullResponse: true
    };
    rp(requestOptions)
        .then(response => {
            const created_sandbox = response.body.result.created;
            if (created_sandbox) {
                const mail_data = {
                    property: {
                        updated_at: _.get(response.body, 'property.updated_at'),
                        url: `${process.env.FRONT_URL}/manage/sandbox/${_.get(response.body, 'property.uri')}?token=${response.body.property.token}`
                    }
                };
                mail.send({
                    template_name: 'manage-approving-property',
                    substitution_data: mail_data,
                    address: process.env.REQUEST_AGENT_EMAIL,
                    variables: [],
                }).then(result => {
                    console.log('MAIL_result [manage-approving-property]', result);
                }).catch(error => {
                    console.log('MAIL_error [manage-approving-property]', error);
                });
            }
            _.unset(response.body, 'property.token');
            res.json(response.body);
        })
        .catch(err => {
            res.status(400).json(err.error);
        });
}