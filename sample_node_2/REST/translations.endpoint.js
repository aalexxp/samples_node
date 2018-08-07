const applicationException = require('../service/applicationException');
const business = require('../business/business.container');

module.exports = function (router) {
    router.route('/api/translations').get(function (request, response) {
        business.getTranslationsManager(request).search(request.query).then(function (result) {
            response.send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    }).post(function (request, response) {
        business.getTranslationsManager(request).update(request.body).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/translations/:id').delete(function (request, response) {
        business.getTranslationsManager(request).remove(request.params.id).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });
};