const mongoConverter = require('./mongoConverter'),
    applicationException = require('../service/applicationException'),
    mongoose = require('mongoose-bird')(require('mongoose')),
    languages = new mongoose.Schema({
        language: {type: String, required: true, unique: true},
        code: {type: String, required: true, unique: true}
    }, {
        collection: 'languages'
    });
const Model = mongoose.model('languages', languages);


function createNewOrUpdate(language) {
    if (!language.id) {
        return new Model(language).saveAsync().catch(function (error) {
            if (11000 === error.code) {
                throw applicationException.new(applicationException.CONFLICT, 'This languages exist in database');
            } else {
                throw error;
            }
        });
    } else {
        return Model.findByIdAndUpdateAsync(language.id, language);
    }
}

function query() {
    return Model.countAsync().then(function (count) {
        return Model.findAsync().then(function (results) {
            return {results: mongoConverter.fromMongo(results), total: count};
        });
    });
}

function getCodesByIds(ids) {
    return new Promise(function (resolve, reject) {
        Model.find({_id: {$in: ids}}, {code: 1, _id: 0}).execAsync().then(function (results) {
            const flatResults = [];

            results.forEach(function (x) {
                flatResults.push(x.code);
            });

            resolve(flatResults);
        });
    });
}

function getCodesByNames(names) {
    return new Promise(function (resolve, reject) {
        Model.find({language: {$in: names}}, {code: 1, language: 1, _id: 0}).execAsync().then(function (results) {
            const flatResults = {};

            results.forEach(function (x) {
                flatResults[x.language] = x.code;
            });

            resolve(flatResults);
        });
    });
}

function remove(languageId) {
    return Model.findByIdAndRemoveAsync(languageId);
}

module.exports = {
    query: query,
    remove: remove,
    createNewOrUpdate: createNewOrUpdate,
    getCodesByIds: getCodesByIds,
    getCodesByNames: getCodesByNames,
    model: Model
};
