const mongoose = require('mongoose-bird')(require('mongoose'));
const mongoConverter = require('../DAO/mongoConverter');
const _ = require('lodash');
const citiesSchema = new mongoose.Schema({
    name: {
        type: Object,
        en: {
            type: String,
            required: true
        },
        ru: {
            type: String,
            required: true
        }
    },
    oilGasCamp: {type: Boolean, default: false}
}, {
    collection: 'cities'
});
const CitiesModel = mongoose.model('cities', citiesSchema);

function query(showOilGasCamp) {
    return CitiesModel.findAsync(showOilGasCamp ? null : {oilGasCamp: false}, null, {sort: 'name.en'}).then(function (data) {
        return mongoConverter.fromMongo(data);

    });
}

function findByIds(ids) {
    const findQuery = CitiesModel.find({_id: {$in: ids}});

    return findQuery.execAsync().then(function (data) {
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
    });
}

function createNewOrUpdate(city) {
    if (!city.id) {
        return CitiesModel(city).saveAsync().then(function (result) {
            return mongoConverter.fromMongo(result[0]);
        });
    } else {
        return CitiesModel.findByIdAndUpdateAsync(city.id, city, {new: true}).then(function (result) {
            return mongoConverter.fromMongo(result);
        });
    }
}

function remove(id) {
    return CitiesModel.removeAsync({_id: id});
}

function get(query) {
    return CitiesModel.findOneAsync(query);
}

function populateCities(cities, path) {
    return CitiesModel.populateAsync(cities, {path: path});
}

module.exports = {
    createNewOrUpdate: createNewOrUpdate,
    remove: remove,
    query: query,
    get: get,
    populateCities: populateCities,
    findByIds: findByIds,
    model: CitiesModel
};
