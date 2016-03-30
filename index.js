require('dotenv').config();
var bodyParser = require('body-parser');

var meetup = require('./meetup-api.js');
var slack = require('./slack.js');
var striptags = require('striptags');
var dateFormat = require('dateformat');
var moment = require("moment");

var express = require('express');

var app = express();
var hbs = require('hbs');
var response_url = "";

var topicsArray = ["iOS","android","react","php","javascript","iot","dotnet","ruby","angular","aws","bigdata","clojure","css","drupal","wordpress","programming","java","node","swift","objective-c","sql"];

app.set('port', 3000);
app.set('view engine', 'html');

app.engine('html', hbs.__express);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


/* Routes */

app.get('/meetup', function(req, res) {
    res.send("Meetup");
});

app.post('/meetup', function(req, res, next) {

    response_url = req.body.response_url;

    var param = meetup.baseParameter();
    var topics = topicsArray.join();
    param.topic = topics;

    var time = getDateForText(req.body.text);
    if (time !== undefined) {
        param.time = moment() + "," + time;
    }

    meetup.events(param, receivedEvents);

    res.send("");
});

app.get('/', function(req, res) {
    res.render('index');
});

function getDateForText(text) {

    if (text === "") {
        return;
    }

    if (text === "today") {
        return moment().endOf("day");
    }

    if (text === "week") {
        return moment().endOf("week");
    }

    if (text === "month") {
        return moment().endOf("month");
    }
}

/* Callback */
function receivedEvents(body) {

    var message = {response_type: "ephemeral"};

    var attachments = [];

    if (body.results === undefined || body.results.length === 0) {
        message.text = "There are no meetups scheduled. How did that happen?";
        slack.postMessageToChannel(message);
        return;
    }

    for (var i = 0; i < body.results.length; i++) {

        var text = "";
        var result = body.results[i];
        var attachment = {};
        var date = new Date(result.time);

        title = "<" + result.event_url + "|" + result.name + ">" + " hosted by <http://www.meetup.com/" + result.group.urlname + "|" + result.group.name + ">\n";

        text += dateFormat(date, "dddd, mmmm dS h:MM TT") + "\n";
        text += striptags(result.description) + "\n\n";

        attachment.title = title;
        attachment.text = text;
        attachment.color = "#A5C8D8";

        attachments.push(attachment);
    }

    message.attachments = attachments;
    message.response_url = response_url;

    console.log(message);

    slack.postMessageToChannel(message);
}

/* Start Server */
app.listen(process.env.PORT || 3000, function() {
    console.log("Node app is running on port " + app.get('port'));
});