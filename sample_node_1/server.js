const express = require('express'),
    configurator = require("extending-config"),
    cron = require("./bin/tools/cron/index"),
    config = configurator(),
    app = express();

app.use('/uploads', express.static('uploads'));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/api/v1', require('./api'));
app.use('/api/v2', require('./api_v2'));

app.set("config", config);
app.set('port', config.app.port);

module.exports = app;
