require('dotenv').config();
require('moment-timezone');

var bodyParser = require('body-parser');
var meetup = require('./meetup-api.js');
var slack = require('./slack.js');
var striptags = require('striptags');
var moment = require("moment");
var express = require('express');
var hbs = require('hbs');
var reddit = require('./reddit.js');

// Instantiate a new express app
var app = express();

var response_url = "";

// Search topics for meetup
var engineeringTopics = ["computer-programming","ios","ios-development","swift-language","objective-c","android","android-developers","java","mobile-development","javascript","reactjs","nodejs","angularjs","php","internet-of-things","dotnet","ruby","amazon-web-services","big-data","clojure","css","drupal","wordpress","sql","user-experience","ui-design","virtual-reality","agile-project-management","saas-software-as-a-service","opensource","softwaredev"];
var designTopics = ["design", "sketch", "photoshop", "illustrator", "graphic design", "ux", "user experience", "dribble"];

// Configure the express app
app.set('port', 3000);
app.set('view engine', 'html');

// Specify handlebars for templating
app.engine('html', hbs.__express);

// Mount bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


// Set up the GET route
app.get('/meetup', function(req, res) {
    res.send("Meetup");
});

// Set up the POST route
app.post('/meetup', function(req, res, next) {

    res.send("hi");
    // Store the response URL for Slack
    if (req.body.response_url !== undefined) {

        // Make sure we have a valid request
        if (req.body.token !== process.env.SLACK_TOKEN || req.body.token !== process.env.DESIGN_SLACK_TOKEN) {
            res.send("");
            return;
        }

        response_url = req.body.response_url;

    }

    // Build an empty parameter object
    var param = meetup.baseParameter();

    // Build the topics search query string and set it

    var topics = Array()

    if (req.body.team_id == "T03E1AWDP") // Orlando Devs
        topics = engineeringTopics.join();
    else if (req.body.team_id == "T03EDNQMH") { // Orlando Designer
        topics = designTopics.join();
    }

    param.topic = topics;

    // Set the time limit if one is available
    // This could be the current day, week, or month
    var time = getDateForText(req.body.text);
    if (time !== undefined) {
        param.time = moment() + "," + time;
    }

    // Load the events from Meetup using the URL parameter
    meetup.events(param, receivedEvents);

    // Spit out an empty response
    res.send("");
});

app.post('/r', function(req, res, next) {

    var validRequest = isValidRequest(req, process.env.SLACK_R_TOKEN);

    if (validRequest) {
        response_url = req.body.response_url;

        var text = req.body.text;
        var args = text.split(" ");

        var sub = args[0];
        var mid = args[1];
        var limit = args[2];
        var sort;

        if (args.length === 0) {
            sub = "all";
            mid = "hot";
        }

        var query = "/r/";

        if (sub) {
            query += sub;

            if (!isNumeric(mid)) {
                sort = mid;
            }

            if (limit === undefined) {
                limit = 20;
            }

            if (sort !== undefined) {
                query  += "/" + sort;
            }

            var params = reddit.baseParameter();
            params.sub = sub;
            params.sort = sort;
            params.limit = limit;
            console.log("params");
            console.log(params);

            reddit.posts(params, parseRedditRSS);
        }
        res.send("");
    } else {
        console.log("invalid request");
        res.send("");
        return;
    }
});

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}


function isValidRequest(req, token) {
    if (req.body.response_url !== undefined) {

        console.log("Req token: " + req.body.token);
        console.log("Actual token: " + token);
        if (req.body.token !== token) {
            console.log("Wrong token");
            return false;
        }

        return true;

    }

    console.log("undefined request");

    return false;
}

// Route for the index
app.get('/', function(req, res) {
    res.render('index');
});

// Given a string, return the appropriate unix timestamp using Moment.js
function getDateForText(text) {
    if (text === "") {
        return;
    }

    if (text === "today") {
        return moment().tz("America/New_York").endOf("day");
    }

    if (text === "week") {
        return moment().tz("America/New_York").endOf("week");
    }

    if (text === "month") {
        return moment().tz("America/New_York").endOf("month");
    }
}

// Callback after Meetup API call returns
// Parses response and sends it into slack
function receivedEvents(body) {

    // Specify we want a new ephemeral message
    var message = {response_type: "ephemeral"};

    // Set the correct response URL
    message.response_url = response_url;

    var attachments = [];

    // Notify the user if we don't have any results
    if (body.results === undefined || body.results.length === 0) {
        message.text = "There are no meetups scheduled. How did that happen?";
        slack.postMessageToChannel(message);
        return;
    }

    // Loop through each meetup event result
    for (var i = 0; i < body.results.length; i++) {

        var text = "";
        var result = body.results[i];

        // Start a new attachment
        var attachment = {};
        var date = new Date(result.time);

        // Build the attachment title
        title = "<" + result.event_url + "|" + result.name + ">" + " hosted by <http://www.meetup.com/" + result.group.urlname + "|" + result.group.name + ">\n";

        // Specify the date of the event and display the description without any HTML tags
        text += moment(date).tz("America/New_York").format("dddd, MMMM Do h:mm a") + "\n";
        text += striptags(result.description) + "\n\n";

        // Set a few other properties for the event
        attachment.title = title;
        attachment.text = text;
        attachment.color = "#A5C8D8";

        // Add the attachment object to the array
        attachments.push(attachment);
    }

    // Set the messages attachments
    // Each one of these messages is highlighted as a result
    message.attachments = attachments;

    // Send the message into slack
    slack.postMessageToChannel(message);
}

function parseRedditRSS(results) {

    // Specify we want a new ephemeral message
    var message = {response_type: "ephemeral"};

    // Set the correct response URL
    message.response_url = response_url;

    var attachments = [];

    // Notify the user if we don't have any results
    if (results === undefined || results.length === 0) {
        message.text = "There are no posts available. How did that happen?";
        slack.postMessageToChannel(message);
        return;
    }


    for (var i = 0; i < results.length; i++) {
        var result = results[i];

        var text = "";

        var attachment = {};

        // Build the attachment title
        title = "<https://www.reddit.com/" + result.data.permalink + "|" + result.data.title + "> posted by <https://www.reddit.com/u/" + result.data.author + "|" + result.data.author + ">";

        // Specify the date of the event and display the description without any HTML tags
        text += "<" + result.data.url + "|Direct Link> ";
        text += "▲: " + result.data.ups;

        // Set a few other properties for the event
        attachment.title = title;
        attachment.text = text;
        attachment.color = "#A5C8D8";

        // Add the attachment object to the array
        attachments.push(attachment);
    }

    // console.log(message);
    message.attachments = attachments;

    // Send the message into slack
    message.text = "";
    slack.postMessageToChannel(message);
}

/* Start Server */
app.listen(process.env.PORT || 3000, function() {
    console.log("Node app is running on port " + app.get('port'));
});