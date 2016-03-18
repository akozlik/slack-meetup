require('dotenv').config();

var meetup = require('./meetup-api.js');
var slack = require('./slack.js');

var express = require('express');

var app = express();
var hbs = require('hbs');

app.set('port', 3000);
app.set('view engine', 'html');
app.engine('html', hbs.__express);

app.get('/meetup', function(req, res) {
    res.send("Meetup");
});

app.get('/', function(req, res) {
    res.render('index');
    meetup.events("iOS", receivedEvents);
});

function receivedEvents(body) {
    console.log("========= GOT BODY =========");
    console.log(body.results);

    for (var i = 0; i < body.results.length; i++) {
        console.log("===========");
        console.log(body.results[i].group.name);
    }
}

app.listen(app.get('port') || 5000, function() {
    console.log("Node app is running on port " + app.get('port'));
});