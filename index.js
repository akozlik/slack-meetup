require('dotenv').config();
var bodyParser = require('body-parser');

var meetup = require('./meetup-api.js');
var slack = require('./slack.js');

var express = require('express');

var app = express();
var hbs = require('hbs');

app.set('port', 3000);
app.set('view engine', 'html');

app.engine('html', hbs.__express);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


app.get('/meetup', function(req, res) {
    res.send("Meetup");
});

app.post('/meetup', function(req, res, next) {
    console.log(req.body.token);
    var responseURL = req.body.response_url;
    res.send("");
});

app.get('/', function(req, res) {
    res.render('index');
    // meetup.events("iOS", receivedEvents);
    var attachment = {response_type: "ephemeral", text: "some message"};
    slack.postAttachmentToChannel(attachment, null);
    console.log("done");
});

function receivedEvents(body) {
    console.log("========= GOT BODY =========");
    // console.log(body.results);

    for (var i = 0; i < body.results.length; i++) {
        console.log("===========");
        console.log(body.results[i].group.name);
    }
}

app.listen(process.env.PORT || 3000, function() {
    console.log("Node app is running on port " + app.get('port'));
});