const applicationException = require('../service/applicationException');
const business = require('../business/business.container');

module.exports = function (router) {
    router.route('/api/cities').get(function (request, response) {
        business.getCitiesManager(request).getAllCities(false).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    }).post(function (request, response) {
        business.getCitiesManager(request).createNewOrUpdate(request.body).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/cities/:showOilGasCamp').get(function (request, response) {
        business.getCitiesManager(request).getAllCities(request.params.showOilGasCamp ? true : false).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/cities/:id/:replaceId').delete(function (request, response) {
        business.getCitiesManager(request).remove(request.params.id, request.params.replaceId).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });
};
