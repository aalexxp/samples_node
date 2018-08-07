const applicationException = require('../service/applicationException');
const business = require('../business/business.container');

module.exports = function (router) {
    router.route('/api/languages').get(function (request, respond) {
        business.getLanguagesManager(request).query().then(function (results) {
            respond.status(200).send(results);
        }).catch(function (error) {
            applicationException.errorHandler(error, respond);
        });
    });

    router.route('/api/languages').post(function (request, respond) {
        business.getLanguagesManager(request).createNewOrUpdate(request.body).then(function () {
            respond.sendStatus(200);
        }).catch(function (error) {
            applicationException.errorHandler(error, respond);
        });
    });

    router.route('/api/languages/:id').delete(function (request, respond) {
        business.getLanguagesManager(request).remove(request.params.id).then(function () {
            respond.sendStatus(200);
        }).catch(function (error) {
            applicationException.errorHandler(error, respond);
        });
    });
};
