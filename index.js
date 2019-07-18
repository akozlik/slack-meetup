require("dotenv").config();

var bodyParser = require("body-parser");
var meetup = require("./meetup-api.js");

var express = require("express");
var hbs = require("hbs");
var reddit = require("./reddit.js");
// Instantiate a new express app
var app = express();

// Configure the express app
app.set("port", 8000);
app.set("view engine", "html");

// Specify handlebars for templating
app.engine("html", hbs.__express);

// Mount bodyParser
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(meetup.router);

app.post("/r", function(req, res, next) {
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
        query += "/" + sort;
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
app.get("/", function(req, res) {
  console.log(req.body);
  res.render("index");
});

function parseRedditRSS(results) {
  // Specify we want a new ephemeral message
  var message = { response_type: "ephemeral" };

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
    title =
      "<https://www.reddit.com/" +
      result.data.permalink +
      "|" +
      result.data.title +
      "> posted by <https://www.reddit.com/u/" +
      result.data.author +
      "|" +
      result.data.author +
      ">";

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
app.listen(process.env.PORT || 8000, function() {
  console.log("Node app is running on port " + app.get("port"));
});
