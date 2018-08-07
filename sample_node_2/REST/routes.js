const business = require('../business/business.container.js');

function authenticate(request, response, next) {
    if (!request.headers.authorization) {
        next();
    } else {
        let token = request.headers.authorization.substring(6);
        token = new Buffer(token, 'base64').toString('ascii');
        business.getUsersManager(request).getUserByToken(token).then(function (result) {
            request.user = result;
        }).catch(function (error) {
            //applicationException.errorHandler(error, response);
        }).finally(next);
    }
}

module.exports = function (router) {
    router.use(authenticate);
    require('./blacklistedDomains.endpoint.js')(router);
    require('./subscriptions.endpoint')(router);
    require('./users.endpoint')(router);
    require('./cities.endpoint')(router);
    require('./salaryRanges.endpoint')(router);
    require('./categories.endpoint')(router);
    require('./vacancies.endpoint')(router);
    require('./common.endpoint.js')(router);
    require('./languages.endpoint.js')(router);
    require('./email.endpoint')(router);
    require('./distributors.endpoint')(router);
    require('./cms.endpoint')(router);
    require('./banners.endpoint')(router);
    require('./settings.endpoint')(router);
    require('./seo.endpoint')(router);
    require('./exporter.endpoint')(router);
    require('./bugreports.endpoint')(router);
    require('./translations.endpoint')(router);
    require('./phrases.endpoint')(router);
    require('./emailErrors.endpoint')(router);
    require('./cvfiles.endpoint')(router);
    require('./solrtest.endpoint')(router);
    require('./autocomplete.endpoint')(router);
    require('../modules/job_feeds/job_feeds.endpoint')(router);
};
