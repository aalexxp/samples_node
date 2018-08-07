const mongoose = require('mongoose-bird')(require('mongoose'));
const mongoConverter = require('../DAO/mongoConverter');
const mongodb = require('mongodb');
const dateHelper = require('../service/dateHelper');
const getDate = dateHelper.get;
const _ = require('lodash');
const cvfilesSchema = new mongoose.Schema({
    email: {type: String, required: true},
    file: {
        name: {type: String, required: true},
        url: {type: String, required: true},
        extension: {type: String, required: true}
    },
    createDate: {type: Number, default: getDate}
}, {
    collection: 'cvfiles'
});
const CvfilesModel = mongoose.model('cvfiles', cvfilesSchema);

function query(filter, projection) {
    const from = Math.max(filter.from, 0) || 0;
    let size = Math.max(filter.size, 0) || null;
    if (0 > filter.size) {
        size = null;
    }
    if (!_.isEmpty(filter.email)) {
        if (!filter.hasOwnProperty('$or')) {
            filter.$or = [];
        }
        filter.$or.push({email: {$regex: filter.email, $options: 'i'}});
    }

    projection = projection || {};
    delete filter.from;
    delete filter.size;
    delete filter.file;
    delete filter.email;

    const sort = {action: -1};

    const findQuery = CvfilesModel.find(filter, projection).skip(from).sort(sort);
    if (null != size) {
        findQuery.limit(size);
    }
    return findQuery.execAsync().then(function (data) {
        return mongoConverter.fromMongo(data);
    }).then(function (results) {
        return CvfilesModel.countAsync(filter).then(function (count) {
            return {results: results, total: count};
        });
    });
}

function update(translation) {
    return CvfilesModel.findByIdAndUpdateAsync(translation.id, translation, {new: true}).then(function (result) {
        return mongoConverter.fromMongo(result);
    });
}

function remove(query, context) {
    query = mongodb.ObjectID.isValid(query) ? {_id: query} : query;
    return CvfilesModel.findOneAndRemoveAsync(query);
}

function get(query) {
    return CvfilesModel.findOneAsync(query);
}

module.exports = {
    update: update,
    remove: remove,
    query: query,
    get: get,

    model: CvfilesModel
};
