const mongodb = require('mongodb');
const mongoose = require('mongoose-bird')(require('mongoose'));
const mongoConverter = require('../DAO/mongoConverter');
const applicationException = require('../service/applicationException');
const dateHelper = require('../service/dateHelper');
const getDate = dateHelper.get;
const _ = require('lodash');
const Promise = require('bluebird');
const sanitizeHtml = require('sanitize-html');
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const subscriptionsDAO = require('./subscriptionsDAO');
const salaryRangesDAO = require('../DAO/salaryRangesDAO');
const allowed = {
    allowedTags: ['b', 'blockquote', 'u', 'ol', 'ul', 'li', 'strike', 'p', 'a', 'br', 'strong', 'span', 'em'],
    allowedAttributes: {
        'a': ['href'],
        'p': ['style'],
        'span': ['style']
    }
};

const currencyEnum = ['KZT', 'USD', 'EUR'];

const vacanciesSchema = new mongoose.Schema({
    title: {type: String, required: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
    email: {type: String, required: true},
    weeklyDetailsId: {type: mongoose.Schema.Types.ObjectId, ref: 'weeklyDetails'},
    cityId: {type: mongoose.Schema.Types.ObjectId, ref: 'cities', required: true},
    categories: [
        {type: mongoose.Schema.Types.ObjectId, ref: 'categories', required: true}
    ],
    salaryRangeId: {type: mongoose.Schema.Types.ObjectId, ref: 'salary_ranges', required: true},
    details: {type: String, required: true},
    publishOnWebsite: {type: Boolean, required: true, default: false},
    publishViaEmail: {type: Boolean, required: true, default: true},
    showEmailOnWebsite: {type: Boolean, required: true},
    approved: {type: Boolean, required: true, default: false},
    banned: {type: Boolean, required: true, default: false},
    publishedDate: {type: Number, required: false, default: getDate},
    archived: {type: Boolean, required: true, default: false},
    verified: {type: Boolean, required: true, default: false},
    sentEmails: {type: Number, default: 0},
    distributionDate: {type: Number},
    createDate: {type: Number, required: true, default: getDate},
    companyName: {type: String, required: true},
    shortDescription: {type: String},
    extendDate: {type: Number, default: getDate},
    applicants: [
        {
            user: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
            seen: {type: Boolean, default: false, required: true},
            new: {type: Boolean, default: true, required: true}
        }
    ]
}, {
    collection: 'vacancies'
});
vacanciesSchema.index({title: 'text', companyName: 'text', details: 'text'});
vacanciesSchema.plugin(deepPopulate);

const extendVacancyPublicationTokensSchema = new mongoose.Schema({
    vacancyId: {type: mongoose.Schema.Types.ObjectId, ref: 'vacancies', required: true}
}, {
    collection: 'extend_vacancy_publication_tokens'
});
const ExtendVacancyPublicationTokensModel = mongoose.model('extend_vacancy_publication_tokens', extendVacancyPublicationTokensSchema);

const VacanciesModel = mongoose.model('vacancies', vacanciesSchema);
const deepPopulateVacanciesModelAsync = Promise.promisify(VacanciesModel.deepPopulate, VacanciesModel);

const seenVacanciesSchema = new mongoose.Schema({
    email: {type: String, required: true},
    vacancy: {type: mongoose.Schema.Types.ObjectId, ref: 'vacancies', required: true}
}, {
    collection: 'seen_vacancies'
});
const SeenVacanciesModel = mongoose.model('seen_vacancies', seenVacanciesSchema);


const VisitedVacanciesSchema = new mongoose.Schema({
    email: {type: String, required: true},
    vacancy: {type: mongoose.Schema.Types.ObjectId, ref: 'vacancies', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true},
}, {
    collection: 'visited_vacancies'
});
const VisitedVacanciesModel = mongoose.model('visited_vacancies', VisitedVacanciesSchema);

const offset = 1814400000;//3 weeks
const distributionOffset = 7 * 86400000; // 7 days

function incrementEmailSent(id) {
    return VacanciesModel.updateAsync({_id: id}, {$inc: {sentEmails: 1}, distributionDate: getDate()});
}

function query(filter, projection) {
    const populateCity = {
        path: 'cityId',
        model: 'cities'
    };
    const populateSalaryRange = {
        path: 'salaryRangeId',
        model: 'salary_ranges'
    };
    const populateCategories = {
        path: 'categories',
        model: 'categories'
    };

    const populateUser = {
        path: 'userId',
        model: 'users',
        select: 'thumbnail lastName'
    };

    const from = Math.max(filter.from, 0) || 0;
    let size = Math.max(filter.size, 0) || 20;
    if (0 > filter.size || filter.size == 'all') {
        size = null;
    }
    if (filter.categories) {
        if (!(filter.categories instanceof Array)) {
            filter.categories = [filter.categories];
        }
        filter.categories = {$in: filter.categories};
    }
    if (null != filter.registeredUser) {
        filter.userId = {$exists: filter.registeredUser};
    }
    if (!_.isEmpty(filter.emailOrTitle)) {
        if (!filter.hasOwnProperty('$or')) {
            filter.$or = [];
        }
        filter.$or.push({email: {$regex: filter.emailOrTitle, $options: 'i'}});
        filter.$or.push({title: {$regex: filter.emailOrTitle, $options: 'i'}});
    }
    if (!_.isEmpty(filter.title)) {
        if (!filter.hasOwnProperty('$or')) {
            filter.$or = [];
        }
        filter.$or.push({title: {$regex: filter.title, $options: 'i'}});
    }
    if (!_.isEmpty(filter.email)) {
        if (!filter.hasOwnProperty('$or')) {
            filter.$or = [];
        }
        filter.$or.push({email: {$regex: filter.email, $options: 'i'}});
    }
    if (!_.isEmpty(filter.companyName)) {
        if (!filter.hasOwnProperty('$or')) {
            filter.$or = [];
        }
        filter.$or.push({companyName: {$regex: filter.companyName, $options: 'i'}});
    }
    if (!_.isEmpty(filter.email)) {
        if (!filter.hasOwnProperty('$or')) {
            filter.$or = [];
        }
        filter.$or.push({email: {$regex: filter.email, $options: 'i'}});
    }

    if (null != filter.expired) {
        const expOffset = filter.publishViaEmail ? distributionOffset : offset;
        if (filter.expired) {
            filter.createDate = {$lte: getDate() - expOffset};
        } else {
            filter.createDate = {$gte: getDate() - expOffset};
        }
    }

    if (filter._id) {
        if (!(filter._id instanceof Array)) {
            filter._id = [filter._id];
        }
        filter._id = {$nin: filter._id};
    }

    if (filter.dispatch) {
        if (filter.dispatchCities) {
            filter.cityId = filter.dispatchCities;
        }

        if (filter.dispatchSalaryRanges) {
            filter.salaryRangeId = filter.dispatchSalaryRanges;
        }

        delete filter.dispatchCities;
        delete filter.dispatchSalaryRanges;
    }

    projection = projection || {};
    delete filter.from;
    delete filter.size;
    delete filter.title;
    delete filter.email;
    delete filter.companyName;
    delete filter.registeredUser;
    delete filter.emailOrTitle;
    delete filter.days;
    delete filter.dispatch;

    const sort = {createDate: -1};
    const findQuery = VacanciesModel.find(filter, projection).skip(from).sort(sort);
    if (null != size) {
        findQuery.limit(size);
    }
    return findQuery.populate(populateCategories).populate(populateCity).populate(populateSalaryRange).populate(populateUser).execAsync().then(function (data) {
        return mongoConverter.fromMongo(data);
    }).then(function (results) {
        return calculateSubscribeMatches(results).then(function (results) {
            return VacanciesModel.countAsync(filter).then(function (count) {
                return {results: results, total: count};
            });
        });

    });
}

function findByIds(ids) {
    const findQuery = VacanciesModel.find({_id: {$in: ids}});

    const populateCity = {
        path: 'cityId',
        model: 'cities'
    };
    const populateSalaryRange = {
        path: 'salaryRangeId',
        model: 'salary_ranges'
    };
    const populateCategories = {
        path: 'categories',
        model: 'categories'
    };

    const populateUser = {
        path: 'userId',
        model: 'users',
        select: 'thumbnail lastName'
    };

    return findQuery.populate(populateCategories).populate(populateCity).populate(populateSalaryRange).populate(populateUser).execAsync().then(function (data) {
        data.sort(function (a, b) {
            // Sort docs by the order of their _id values in ids.
            return _.findIndex(ids, function (id) {
                    return a._id.equals(id);
                }) -
                _.findIndex(ids, function (id) {
                    return b._id.equals(id);
                });
        });
        return mongoConverter.fromMongo(data);
    }).then(function (results) {
        return calculateSubscribeMatches(results).then(function (results) {
            return results;
        });

    });
}

function calculateSubscribeMatches(results) {
    const promises = _.map(results, function (vacancy) {
        return getSubscribersCountForVacancy(vacancy, true);
    });
    return Promise.all(promises)
}

function getSubscribersCountForVacancy(vacancy, raw) {
    const id = raw ? '_id' : 'id';

    const filter = {
        verified: {$ne: false},
        banned: {$ne: true},
        subscribed: {$ne: false},
        interval: vacancy.publishViaEmail ? 'daily' : 'weekly',
        categories: {
            $in: [null]
        },
        city: {
            $in: [null]
        },
        desiredSalaryRange: {
            $in: [null]
        }
    };
    const categories = _.pluck(vacancy.categories, id);
    if (!_.isEmpty(categories)) {
        filter.categories.$in = filter.categories.$in.concat(categories);
    }
    if (null != vacancy.cityId) {
        if (!vacancy.cityId.oilGasCamp) {
            filter.city.$in = filter.city.$in.concat([vacancy.cityId.id || vacancy.cityId._id]);
        } else {
            delete filter.city;
        }
    }


    if (null != vacancy.salaryRangeId) {
        return salaryRangesDAO.model.find({ranges: vacancy.salaryRangeId._id}).then(function (result) {
            const ids = _.pluck(result, "_id");
            ids.push(vacancy.salaryRangeId._id);

            filter.desiredSalaryRange.$in = ids;

            return subscriptionsDAO.query(filter).then(handleSubscriptions);
        });
    } else {
        return subscriptionsDAO.query(filter).then(handleSubscriptions);
    }


    function handleSubscriptions(results) {
        vacancy.matchingSubscriptions = results.total;
        const expOffset = vacancy.publishViaEmail ? distributionOffset : offset;
        vacancy.expDate = vacancy.createDate + expOffset;
        return vacancy;
    }
}

function find(filter) {
    const queries = [];
    const defaultQuery = {
        publishOnWebsite: true,
        approved: true,
        verified: true,
        archived: false
    };
    if (filter.cityId) {
        defaultQuery.cityId = filter.cityId;
    }

    if (filter.categories) {
        defaultQuery.categories = filter.categories;
    }

    if (filter.userId) {
        defaultQuery.userId = filter.userId;
    }
    if (filter.salaryRangeId) {
        defaultQuery.salaryRangeId = filter.salaryRangeId;
    }
    if (filter.days) {
        defaultQuery.createDate = {
            $gt: dateHelper.getMoment().subtract(3, 'days').set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0
            }).valueOf()
        };
    }

    const populateCity = {
        path: 'cityId',
        model: 'cities'
    };
    const populateCategories = {
        path: 'categories',
        model: 'categories'
    };
    const populateSalaryRange = {
        path: 'salaryRangeId',
        model: 'salary_ranges'
    };
    const populateUser = {
        path: 'userId',
        model: 'users',
        select: 'thumbnail lastName'
    };

    if (filter.vacancyTitle) {
        queries.push(_.assign({}, defaultQuery, {
            title: filter.vacancyTitle
        }));
    }

    if (filter.vacancyTitlePhrases) {
        filter.vacancyTitlePhrases.forEach(function (phrase) {
            // matching title only
            queries.push(_.assign({}, defaultQuery, {
                title: phrase
            }));
        });
    }

    if (filter.vacancyTitle) {
        queries.push(_.assign({}, defaultQuery, {
            $or: [
                {title: {$regex: '^' + filter.vacancyTitle, $options: 'i'}}
            ]
        }));
    }

    if (filter.vacancyTitlePhrases) {
        filter.vacancyTitlePhrases.forEach(function (key, phrase) {
            queries.push(_.assign({}, defaultQuery, {
                $or: [
                    {title: {$regex: '^' + phrase, $options: 'i'}}
                ]
            }));
        });
    }

    if (filter.vacancyTitle) {
        queries.push(_.assign({}, defaultQuery, {
            $or: [
                {title: {$regex: filter.vacancyTitle, $options: 'i'}}
            ]
        }));
    }

    if (filter.vacancyTitlePhrases) {
        filter.vacancyTitlePhrases.forEach(function (key, phrase) {
            queries.push(_.assign({}, defaultQuery, {
                $or: [
                    {title: {$regex: phrase, $options: 'i'}}
                ]
            }));
        });
    }

    // Companies
    if (filter.vacancyTitle) {
        queries.push(_.assign({}, defaultQuery, {
            $or: [
                {companyName: {$regex: filter.vacancyTitle, $options: 'i'}}
            ]
        }));
    }

    if (filter.vacancyTitle) {
        queries.push(_.assign({}, defaultQuery, {
            $or: [
                {companyName: {$regex: '^' + filter.vacancyTitle, $options: 'i'}}
            ]
        }));
    }

    if (filter.vacancyTitlePhrases) {
        filter.vacancyTitlePhrases.forEach(function (phrase) {
            queries.push(_.assign({}, defaultQuery, {
                $or: [
                    {companyName: {$regex: phrase, $options: 'i'}}
                ]
            }));
        });
    }

    if (filter.vacancyTitlePhrases) {
        filter.vacancyTitlePhrases.forEach(function (phrase) {
            queries.push(_.assign({}, defaultQuery, {
                $or: [
                    {companyName: {$regex: '^' + phrase, $options: 'i'}}
                ]
            }));
        });
    }


    if (!queries.length) {
        queries.push(_.assign({}, defaultQuery));
    }

    return Promise.reduce(queries, function (results, query) {
        const idsToExclude = _.map(_.map(results, 'id'), function (val) {
            return val.toString();
        });

        query._id = {$nin: idsToExclude};

        return VacanciesModel.find(query)
            .sort({createDate: -1})
            .populate(populateCategories)
            .populate(populateCity)
            .populate(populateSalaryRange)
            .populate(populateUser)
            .execAsync()
            .then(function (result) {
                return results.concat(mongoConverter.fromMongo(result));
            });
    }, []);
}

function countNewApplicationsByUserId(userId) {
    const query = {
        userId: userId,
        applicants: {
            $elemMatch: {seen: false}
        }
    };

    const aggregation = [
        {
            $match: query
        },
        {
            $project: {_id: 0, seen: '$applicants.seen'}
        },
        {
            $unwind: '$seen'
        },
        {
            $match: {seen: false}
        },
        {
            $group: {
                _id: {count: '$seen'},
                count: {$sum: 1}
            }
        }
    ];

    return VacanciesModel.aggregateAsync(aggregation).then(function (result) {
        if (result && result.length) {
            return result[0].count;
        }

        return 0;
    });
}

function createNewOrUpdate(vacancy) {
    vacancy.details = sanitizeHtml(vacancy.details, allowed);
    if (!vacancy.id) {
        return new VacanciesModel(vacancy).saveAsync().then(function (result) {
            return mongoConverter.fromMongo(result[0]);
        });
    } else {
        return VacanciesModel.findByIdAndUpdateAsync(vacancy.id, vacancy, {new: true}).then(function (result) {
            return mongoConverter.fromMongo(result);
        });
    }
}

function get(id) {

    const populateCategories = {
        path: 'categories',
        model: 'categories'
    };
    const populateCity = {
        path: 'cityId',
        model: 'cities'
    };
    const populateSalaryRange = {
        path: 'salaryRangeId',
        model: 'salary_ranges'
    };

    const populateUser = {
        path: 'userId',
        model: 'users',
        select: 'thumbnail lastName'
    };

    return VacanciesModel.findOne({_id: id}).populate(populateCategories).populate(populateCity).populate(populateSalaryRange).populate(populateUser).execAsync().then(function (data) {
        if (!data) {
            throw applicationException.new(applicationException.NOT_FOUND);
        }
        if (data.cityId) {
            data._doc.cityId = {name: data.cityId.name, id: data.cityId.id};
        }
        if (data.salaryRangeId) {
            data._doc.salaryRangeId = {name: data.salaryRangeId.name, id: data.salaryRangeId.id};
        }
        data._doc.categories = data.categories.map(function (categories) {
            return {id: categories.id, name: categories.name};
        });
        data = mongoConverter.fromMongo(data);
        return data;
    }).then(function (data) {
        return getSubscribersCountForVacancy(data);
    });
}

function update(query, body, options) {
    const valid = mongodb.ObjectID.isValid(query.toString());
    query = valid ? {_id: query} : query;
    options = options || {multi: false};
    return VacanciesModel.update(query, body, options).execAsync().then(function () {
        if (valid) {
            const populateCategories = {
                path: 'categories',
                model: 'categories'
            };
            const populateCity = {
                path: 'cityId',
                model: 'cities'
            };
            const populateSalaryRange = {
                path: 'salaryRangeId',
                model: 'salary_ranges'
            };

            return VacanciesModel.findOne(query).populate(populateCategories).populate(populateCity).populate(populateSalaryRange).execAsync().then(function (results) {
                if (!results) {
                    throw applicationException.new(applicationException.NOT_FOUND);
                }
                return mongoConverter.fromMongo(results);
            });
        } else {
            return Promise.resolve();
        }
    });
}

function remove(id) {
    if (!Array.isArray(id)) {
        id = [id];
    }
    return VacanciesModel.removeAsync({_id: {$in: id}});
}


function isNotVisited(vacancyIds) {

    return VisitedVacanciesModel.find({vacancy: vacancyIds.vacancyId, user: vacancyIds.userId}).then(function (result) {

        if (result.length <= 0) {
            return new VisitedVacanciesModel({
                user: vacancyIds.userId,
                email: vacancyIds.userEmail,
                vacancy: vacancyIds.vacancyId
            }).saveAsync().then(function (data) {
                const map = {};
                _.forEach(data, function (item) {
                    map[item.vacancy] = true;
                });
                const result = {};
                _.forEach(vacancyIds, function (vacancy) {
                    result[vacancy] = !map[vacancy];
                });
                return result;
            });
        } else {
            return;
        }

    });
}

function isNew(email, vacancyIds) {
    const mongooseVacancyIds = vacancyIds.filter(function (item) {
        return mongodb.ObjectID.isValid(item && item.toString && item.toString());
    });
    return SeenVacanciesModel.find({
        email: email,
        vacancy: {$in: mongooseVacancyIds}
    }).execAsync().then(function (data) {
        const map = {};
        _.forEach(data, function (item) {
            map[item.vacancy] = true;
        });
        const result = {};
        _.forEach(vacancyIds, function (vacancy) {
            result[vacancy] = !map[vacancy];
        });
        return result;
    });
}

function isNotVisitedList(email, vacancyIds) {

    const mongooseVacancyIds = vacancyIds.filter(function (item) {
        return mongodb.ObjectID.isValid(item && item.toString && item.toString());
    });

    return VisitedVacanciesModel.find({
        email: email,
        vacancy: {$in: mongooseVacancyIds}
    }).execAsync().then(function (data) {
        const map = {};
        _.forEach(data, function (item) {
            map[item.vacancy] = true;
        });
        const result = {};
        _.forEach(vacancyIds, function (vacancy) {
            result[vacancy] = !map[vacancy];
        });
        return result;
    });
}

function countSeenVacancies(vacancyId) {
    return SeenVacanciesModel.countAsync({vacancy: vacancyId});
}

function getSeenDetailsAboutVacancy(vacancyId) {
    return SeenVacanciesModel.findAsync({vacancy: vacancyId});
}

function applyTo(vacancyId, userId) {
    return VacanciesModel.findOneAndUpdate({_id: vacancyId}, {$addToSet: {applicants: {user: userId}}}, {'new': true}).execAsync().then(function (results) {
        if (!results) {
            throw applicationException.new(applicationException.NOT_FOUND);
        }
        return mongoConverter.fromMongo(results);
    });
}

function markSeen(email, vacancyId) {
    const entry = {email: email, vacancy: vacancyId};
    return SeenVacanciesModel.findOneAsync({email: email, vacancy: vacancyId}).then(function (result) {
        if (result) {
            return Promise.resolve();
        }
        return SeenVacanciesModel.createAsync(entry);
    });
}

function markManySeen(email, ids) {
    return _.map(ids, function (id) {
        return SeenVacanciesModel.createAsync({
            email: email,
            vacancy: id
        });
    });
}

function queryDistributors() {
    return VacanciesModel.find({userId: {$ne: null}}).populate({
        path: 'userId',
        select: {_id: 1, email: 1, firstName: 1, lastName: 1, verify: 1, language: 1, type: 1, verified: 1}
    }).distinct('userId').execAsync().then(function (arrayUsers) {
        return arrayUsers;
    });
}

function queryCountVacancyInCategory(arrayCategory) {
    const promises = _.map(arrayCategory, function (element) {
        return VacanciesModel.countAsync({
            categories: element.id,
            approved: true,
            verified: true,
            banned: false,
            publishOnWebsite: true
        }).then(function (count) {
            return {id: element.id, name: element.name, count: count};
        });
    });
    return Promise.all(promises).then(function (results) {
        return VacanciesModel.distinct('userId', {userId: {$ne: null}}).execAsync().then(function (arrayUsersId) {
            return VacanciesModel.countAsync({
                approved: true,
                verified: true,
                banned: false,
                publishOnWebsite: true
            }).then(function (count) {
                results.unshift({name: {en: 'All', ru: 'все'}, count: count});
                return {results: results, arrayUsersId: arrayUsersId};
            });

        });

    });
}

function removeByUserId(query) {
    query = mongodb.ObjectID.isValid(query) ? {userId: query} : query;
    return VacanciesModel.removeAsync(query);
}

function queryApplications(vacancyId, filter, ownerId) {
    const from = Math.max(filter.from, 0) || 0;
    const size = Math.max(filter.size, 0) || 20;
    return VacanciesModel.findOne({_id: vacancyId}, {applicants: 1, userId: 1}).execAsync().then(function (result) {
        const populatePaths = ['applicants.user', 'applicants.user.city', 'applicants.user.categories'];
        const populateSelects = {
            'applicants.user.city': {
                select: 'name'
            },
            'applicants.user.categories': {
                select: 'name'
            },
        };
        return deepPopulateVacanciesModelAsync(result, populatePaths, populateSelects).then(function (data) {
            const applicants = _.map(mongoConverter.fromMongo(data.applicants), function (elem) {
                elem.user = mongoConverter.fromMongo(elem.user);
                return elem;
            });
            return {
                results: applicants.slice(from, from + size),
                total: applicants.length,
                isOwner: ownerId.toString() === data.userId.toString()
            };
        });
    });
}

function removeApplications(vacancyId, applications) {
    if (!Array.isArray(applications)) {
        applications = [applications];
    }
    return VacanciesModel.findOneAndUpdateAsync({_id: vacancyId}, {$pull: {applicants: {user: {$in: applications}}}});
}

function removeAllApplications(applicantId) {
    return VacanciesModel.update({'applicants.user': {$in: [applicantId]}}, {$pull: {applicants: {user: {$in: [applicantId]}}}}, {multi: true});
}

function removeOldVacancy() {
    //remove all vacancies older than 21 days
    return VacanciesModel.update({createDate: {$lte: getDate() - offset}}, {archived: true}, {multi: true}, function () {
    });
}

function removeOldDistributions() {
    //remove all vacancies older than 7 days
    return VacanciesModel.update({
        publishViaEmail: true,
        publishedDate: {$lte: getDate() - distributionOffset}
    }, {archived: true}, {multi: true}, function () {
    });

}

function searchBySystem(filter, project) {
    return VacanciesModel.findAsync(filter, project).then(function (results) {
        return mongoConverter.fromMongo(results);
    });
}

function createExtendToken(vacancyId) {
    return new ExtendVacancyPublicationTokensModel({
        vacancyId: vacancyId
    }).saveAsync().then(function (token) {
        return mongoConverter.fromMongo(token[0]);
    });
}

function getVacancyFromExtendToken(token) {
    return ExtendVacancyPublicationTokensModel.findOneAsync({_id: token}).then(function (token) {
        if (!token) {
            throw applicationException.new(applicationException.NOT_FOUND);
        }
        return VacanciesModel.findOneAsync({_id: token.vacancyId}, {extendDate: 1});
    }).then(function (vacancy) {
        if (!vacancy) {
            throw applicationException.new(applicationException.NOT_FOUND);
        }
        return mongoConverter.fromMongo(vacancy);
    });
}

function removeExtendToken(token) {
    return ExtendVacancyPublicationTokensModel.removeAsync({_id: token});
}

function changeCompanyNameAndDescription(data, userId) {
    return VacanciesModel.update({userId: userId}, data, {multi: true});
}

function getDataForCompanyFilter(searchString, category, city, userId) {
    const filter = {
        publishOnWebsite: true,
        approved: true,
        verified: true,
        archived: false
    };
    if (city) {
        filter.cityId = mongoose.Types.ObjectId(city);
    }
    if (userId) {
        filter.userId = mongoose.Types.ObjectId(userId);
    }
    if (searchString || category) {
        filter.$or = [];

        if (searchString) {
            filter.$or.push({title: {$regex: searchString, $options: 'i'}});
            filter.$or.push({details: {$regex: searchString, $options: 'gm'}});
        }
        if (category) {
            filter.$or.push({categories: mongoose.Types.ObjectId(category)});
        }
    }

    const aggregation = [
        {
            $match: filter
        },
        {
            $group: {
                _id: {userId: '$userId', name: '$companyName'},
                count: {$sum: 1}
            }
        },
        {
            $sort: {count: -1}
        }
    ];
    return VacanciesModel.aggregateAsync(aggregation);
}

function getDataForLocationFilter(searchString, category) {
    const filter = {
        publishOnWebsite: true,
        approved: true,
        verified: true,
        archived: false
    };

    if (searchString || category) {
        filter.$or = [];

        if (searchString) {
            filter.$or.push({title: {$regex: searchString, $options: 'i'}});
            filter.$or.push({details: {$regex: searchString, $options: 'gm'}});
        }
        if (category) {
            filter.$or.push({categories: mongoose.Types.ObjectId(category)});
        }
    }

    const aggregation = [
        {
            $match: filter
        },
        {
            $group: {
                _id: {cityId: '$cityId'},
                count: {$sum: 1}
            }
        },
        {
            $sort: {count: -1}
        }
    ];
    return VacanciesModel.aggregateAsync(aggregation);
}

module.exports = {
    countSeenVacancies: countSeenVacancies,
    getSeenDetailsAboutVacancy: getSeenDetailsAboutVacancy,
    get: get,
    searchBySystem: searchBySystem,
    incrementEmailSent: incrementEmailSent,
    isNew: isNew,
    isNotVisited: isNotVisited,
    isNotVisitedList: isNotVisitedList,
    markSeen: markSeen,
    markManySeen: markManySeen,
    query: query,
    find: find,
    findByIds: findByIds,
    countNewApplicationsByUserId: countNewApplicationsByUserId,
    update: update,
    remove: remove,
    removeByUserId: removeByUserId,
    createNewOrUpdate: createNewOrUpdate,
    applyTo: applyTo,
    queryDistributors: queryDistributors,
    queryApplications: queryApplications,
    removeApplications: removeApplications,
    removeAllApplications: removeAllApplications,
    queryCountVacancyInCategory: queryCountVacancyInCategory,
    createExtendToken: createExtendToken,
    getVacancyFromExtendToken: getVacancyFromExtendToken,
    removeExtendToken: removeExtendToken,
    changeCompanyNameAndDescription: changeCompanyNameAndDescription,
    getDataForCompanyFilter: getDataForCompanyFilter,
    getDataForLocationFilter: getDataForLocationFilter,
    offset: offset,
    removeOldVacancy: removeOldVacancy,
    removeOldDistributions: removeOldDistributions,
    model: VacanciesModel,
    seenVacancies: SeenVacanciesModel
};