const applicationException = require('../service/applicationException');
const business = require('../business/business.container');

module.exports = function (router) {
    router.route('/api/categories').get(function (request, response) {
        business.getCategoriesManager(request).getAllCategories().then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/categories').post(function (request, response) {
        business.getCategoriesManager(request).createNewOrUpdate(request.body).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });
    router.route('/api/categories/count').get(function (request, respond) {
        business.getCategoriesManager(request).getAllCategoriesWithCount().then(function (results) {
            respond.status(200).send(results);
        }).catch(function (error) {
            applicationException.errorHandler(error, respond);
        });
    });
    router.route('/api/categories/:id/:toReplace').delete(function (request, response) {
        business.getCategoriesManager(request).remove(request.params.id, request.params.toReplace).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });
};