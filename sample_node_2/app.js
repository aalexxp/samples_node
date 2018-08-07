const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const configDB = require('./config/config.js');

module.exports = function (port) {
    const app = express();
    app.use(express.static(__dirname + '/'));
    app.use(morgan('dev'));
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    app.set('view engine', 'jade');
    app.set('views', './app/views');

    mongoose.connect(configDB.url, function (error) {
        if (error) {
            console.error(error);
        }
    });
    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', function () {
        mongoose.connection.close(function () {
            console.error('Mongoose default connection disconnected through app termination');
            process.exit(0);
        });
    });


    require('./REST/routes.js')(app);
    const server = app.listen(port, function () {
        console.info('Listening on port', port);
    });
    server.on('close', function () {
        mongoose.disconnect();
    });
    return server;
};
