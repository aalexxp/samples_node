const applicationException = require('../service/applicationException');
const business = require('../business/business.container');
const config = require('../config/config.js');

module.exports = function (router) {
    router.route('/api/vacancies').post(function (request, response) {
        business.getVacanciesManager(request).createNewOrUpdate(request.body).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });
    router.route('/api/vacancies').get(function (request, response) {
        business.getVacanciesManager(request).search(request.query).then(function (result) {
            response.send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });
    router.route('/api/vacancies').delete(function (request, respond) {
        business.getVacanciesManager(request).removeArray(request.query.ids).then(function () {
            respond.sendStatus(200);
        }).catch(function (error) {
            applicationException.errorHandler(error);
        });
    });
    router.route('/api/vacancies/find').get(function (request, response) {

        if (config.solr.bypass === 'true') {
            business.getVacanciesManager(request).find(request.query).then(function (result) {
                response.send(result);
            }).catch(function (error) {
                applicationException.errorHandler(error, response);
            });
        } else {
            business.getVacanciesSearchManager(request).find(request.query).then(function (result) {
                response.send(result);
            }).catch(function (error) {
                applicationException.errorHandler(error, response);
            });
        }

    });

    router.route('/api/vacancies/is-new').post(function (request, response) {
        // isNew(.. true) where true stands for inform isNew method to mark pointed vacancies as seen
        business.getVacanciesManager(request).isNew(request.body, true).then(function (result) {
            response.send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/is-visited-list').post(function (request, response) {
        // isNew(.. true) where true stands for inform isNew method to mark pointed vacancies as seen
        business.getVacanciesManager(request).isNotVisitedList(request.body, true).then(function (result) {
            response.send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/is-visited').post(function (request, response) {
        business.getVacanciesManager(request).isNotVisited(request.body).then(function (result) {
            response.send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/dispatch').post(function (request, response) {
        business.getVacanciesManager(request).dispatchVacancies().then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/unapproved').get(function (request, response) {
        business.getVacanciesManager(request).getSpecific('unapproved', request.query).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/website').get(function (request, response) {
        business.getVacanciesManager(request).getSpecific('website', request.query).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/archived').get(function (request, response) {
        business.getVacanciesManager(request).getSpecific('archived', request.query).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/email').get(function (request, response) {
        business.getVacanciesManager(request).getSpecific('email', request.query).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });
    router.route('/api/vacancies/notverified').get(function (request, response) {
        business.getVacanciesManager(request).getSpecific('notverified', request.query).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });
    router.route('/api/vacancies/anonymous').get(function (request, respond) {
        business.getVacanciesManager(request).findAnonymousUsersWithVacancies(request.query).then(function (result) {
            respond.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, respond);
        });
    });

    router.route('/api/vacancies/new-applications-count').get(function (request, response) {
        business.getVacanciesManager(request).getNumberOfNewApplications().then(function (result) {
            response.send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/:id').get(function (request, response) {
        business.getVacanciesManager(request).get(request.params.id).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/:id').delete(function (request, response) {
        business.getVacanciesManager(request).remove(request.params.id).then(function () {
            response.sendStatus(200);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/:id/apply').post(function (request, response) {
        business.getVacanciesManager(request).applyTo(request.params.id).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/:id/applications').get(function (request, response) {
        business.getVacanciesManager(request).queryApplications(request.params.id, request.query).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/:id/applications').delete(function (request, response) {
        business.getVacanciesManager(request).removeApplication(request.params.id, request.query.ids).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/:id/applications').post(function (request, response) {
        business.getVacanciesManager(request).markApplicationsSeen(request.params.id, request.body.ids).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/extend-publication/:token').post(function (request, response) {
        business.getVacanciesManager(request).extendPublication(request.params.token).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });

    router.route('/api/vacancies/:id/:action').post(function (request, response) {
        business.getVacanciesManager(request).performAction(request.params.id, request.params.action, request.body).then(function (result) {
            response.status(200).send(result);
        }).catch(function (error) {
            applicationException.errorHandler(error, response);
        });
    });
};
