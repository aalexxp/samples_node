const TYPES = {
    VALIDATION_ERROR: {type: 'VALIDATION_ERROR', message: 'Error of validation data.'},
    EMPTY: {type: 'EMPTY_RESULT'},
    SUCCESS: {type: 'SUCCESS', message: 'SUCCESS'},
    ERROR: {type: 'ERROR', message: 'Undefined error'},
    FAILED: {type: 'FAILED', message: 'FAILED'}
};

class response {

    constructor() {
        this._response = {};
    }

    setType(type) {
        this._response = Object.assign({}, type);
        return this;
    }

    setMessage(message = '') {
        this._response.message = message;
        return this;
    }

    setErrors(errors = []) {
        this._response.errors = errors;
        return this;
    }

    addError(key, message) {
        if (!this._response.errors) {
            this._response.errors = {};
        }
        if (!this._response.errors[key]) {
            this._response.errors[key] = [];
        }
        this._response.errors[key].push(message);
        return this;
    }

    addToken(token) {
        this._response.token = token;
        return this;
    }

    addData(key, value) {
        if (!this._response.data) {
            this._response.data = {};
        }
        this._response.data[key] = value;
        return this;
    }

    hasError() {
        return !!this._response.errors;
    }

    send(res, status = 200) {
        return res.status(status).json(this._response);
    }
}

module.exports = {
    response: response,
    TYPES: TYPES
};