require('dotenv').config();
var bodyParser = require('body-parser');

var meetup = require('./meetup-api.js');
var slack = require('./slack.js');
var striptags = require('striptags');
var dateFormat = require('dateformat');

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
    meetup.events("iOS", receivedEvents);
});

function receivedEvents(body) {

    var message = {response_type: "ephemeral"};

    var attachments = [];

    for (var i = 0; i < body.results.length; i++) {

        var text = "";
        var result = body.results[i];
        var attachment = {};

        var date = new Date(result.time);
        console.log(date);

        title = "<" + result.event_url + "|" + result.name + ">" + " hosted by <http://www.meetup.com/" + result.group.urlname + "|" + result.group.name + ">\n";
        text += dateFormat(date, "dddd, mmmm dS h:MM TT") + "\n";

        text += striptags(result.description) + "\n\n";

        attachment.title = title;
        attachment.text = text;
        attachment.color = "#A5C8D8";

        attachments.push(attachment);
    }

    message.text = "The following meetups are happening:";
    message.attachments = attachments;

    slack.postMessageToChannel(message);
    console.log("done");
}

app.listen(process.env.PORT || 3000, function() {
    console.log("Node app is running on port " + app.get('port'));
});