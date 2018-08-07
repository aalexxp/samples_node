const mongoose = require('mongoose-bird')(require('mongoose'));
const mongoConverter = require('../DAO/mongoConverter');
const dateHelper = require('../service/dateHelper');
const getDate = dateHelper.get;
const _ = require('lodash');
const translationsSchema = new mongoose.Schema({
    action: {type: String, required: true},
    translation: {type: Object, required: true},
    createDate: {type: Number, default: getDate}
}, {
    collection: 'translations'
});
const TranslationsModel = mongoose.model('translations', translationsSchema);

function query(filter, projection) {
    const from = Math.max(filter.from, 0) || 0;
    let size = Math.max(filter.size, 0) || null;
    if (0 > filter.size) {
        size = null;
    }
    if (!_.isEmpty(filter.action)) {
        if (!filter.hasOwnProperty('$or')) {
            filter.$or = [];
        }
        filter.$or.push({
            'translation.en': {$regex: filter.action, $options: 'i'}
        });
    }

    projection = projection || {};
    delete filter.from;
    delete filter.size;
    delete filter.action;

    const sort = {action: 1};

    const findQuery = TranslationsModel.find(filter, projection).skip(from).sort(sort);
    if (null != size) {
        findQuery.limit(size);
    }
    return findQuery.execAsync().then(function (data) {
        return mongoConverter.fromMongo(data);
    }).then(function (results) {
        return TranslationsModel.countAsync(filter).then(function (count) {
            return {results: results, total: count};
        });
    });
}

function update(translation) {
    return TranslationsModel.findByIdAndUpdateAsync(translation.id, translation, {new: true}).then(function (result) {
        return mongoConverter.fromMongo(result);
    });
}

function remove(id) {
    return TranslationsModel.removeAsync({_id: id});
}

function get(query) {
    return TranslationsModel.findOneAsync(query);
}

module.exports = {
    update: update,
    remove: remove,
    query: query,
    get: get,

    model: TranslationsModel
};
