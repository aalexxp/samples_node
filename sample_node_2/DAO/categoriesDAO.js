const mongoose = require('mongoose-bird')(require('mongoose'));
const mongoConverter = require('../DAO/mongoConverter');
const categoriesSchema = new mongoose.Schema({
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
    }
}, {
    collection: 'categories'
});
const CategoriesModel = mongoose.model('categories', categoriesSchema);

function query() {
    return CategoriesModel.findAsync({}, null, {sort: 'name.en'}).then(function (data) {
        return mongoConverter.fromMongo(data);
    });
}

function get(query) {
    return CategoriesModel.findOneAsync(query).then(function (data) {
        if (!data) {
            return false;
        }
        return mongoConverter.fromMongo(data);
    });
}

function createNewOrUpdate(category) {
    if (!category.id) {
        return new CategoriesModel(category).saveAsync().then(function (result) {
            return mongoConverter.fromMongo(result[0]);
        });
    } else {
        return CategoriesModel.findByIdAndUpdateAsync(category.id, category, {new: true}).then(function (result) {
            return mongoConverter.fromMongo(result);
        });
    }
}

function remove(id) {
    return CategoriesModel.removeAsync({_id: id});
}

function findCategoriesByArrayIdCategories(arrayId, language) {
    language = language || 'en';
    const project = {};
    project['name.' + language] = 1;

    return CategoriesModel.findAsync({_id: {$in: arrayId}}, project).then(function (results) {
        return mongoConverter.fromMongo(results);
    });
}

module.exports = {
    get: get,
    query: query,
    remove: remove,
    createNewOrUpdate: createNewOrUpdate,
    findCategoriesByArrayIdCategories: findCategoriesByArrayIdCategories,

    model: CategoriesModel
};