const path = require("path");
const express = require('express');
const router = express.Router();
const getDAO = require(path.join(__dirname, "..", "dao"));
const packageJson = require('../package.json');

module.exports = router;

router.use(require(path.join(__dirname, "..", "apiTools", "errorHandling")));

router.use(function (req, res, next) {
    req.dao = getDAO(req.app.get('config'));
    next();
});

router.get('/version', function (request, response) {
    response.json({
        name: 'HTTP API',
        version: packageJson.version
    });
});

//get translate
router.use(function (req, res, next) {
    if (global['translate'] === undefined) {
        req.dao.translate.getTranslation()
            .then((translation) => {
                global['translate'] = translation[0].translate;
            });
    }
    next();
});

router.use('/auth', require('./auth'));

router.use('/amenities', require('./amenities'));
router.use('/properties', require('./properties'));
router.use('/heatmap', require('./heatmap'));
router.use('/availability', require('./availability'));
router.use('/book', require('./book'));
router.use('/bookings', require('./bookings'));
router.use('/roomTypes', require('./roomTypes'));
router.use('/currency', require('./currency'));
router.use('/exports', require('./exports'));
router.use('/admin', require('./admin'));
router.use('/images', require('./images'));
router.use('/offer', require('./offers'));
router.use('/manager', require('../api_v2/manager'));

