const mongoose = require('mongoose-bird')(require('mongoose'));
const mongoConverter = require('../DAO/mongoConverter');

const usersPermissionsSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, select: false},
    vacancyAdding: {type: Boolean, required: true, default: false},
    cvSearching: {type: Boolean, required: true, default: false}
}, {
    collection: 'users_permissions'
});
const UsersPermissionsModel = mongoose.model('usersPermissions', usersPermissionsSchema);

function createNewOrUpdate(data) {
    if (!data.id) {
        return UsersPermissionsModel(data).saveAsync().then(function (results) {
            return mongoConverter.fromMongo(results[0]);
        });
    } else {
        return UsersPermissionsModel.findByIdAndUpdateAsync(data.id, data, {new: true});
    }
}

function get(userId) {
    return UsersPermissionsModel.findOneAsync({userId: userId}).then(function (result) {
        if (result) {
            return mongoConverter.fromMongo(result);
        }

        return result;
    });
}

function updateByUserId(userId, body, options) {
    options = options || {multi: false};
    return UsersPermissionsModel.update({userId: userId}, body, options).execAsync();
}

function removeByUserId(userId) {
    UsersPermissionsModel.removeAsync({userId: userId});
}

module.exports = {
    createNewOrUpdate: createNewOrUpdate,
    get: get,
    updateByUserId: updateByUserId,
    removeByUserId: removeByUserId,

    model: UsersPermissionsModel
};