// Use request JSON for quick JSON loading
const requestJson = require("request-json");
require("moment-timezone");
const moment = require("moment");
const striptags = require("striptags");
const tokenCache = {}; // Is this a stupid idea. Yes it is.
const router = require("express").Router();
const qs = require("querystring");
const axios = require("axios");
const slack = require("./slack.js");
const cron = require("node-cron");

let response_url = "";

// Search topics for meetup
const engineeringTopics = [
  "computer-programming",
  "ios",
  "ios-development",
  "swift-language",
  "objective-c",
  "android",
  "android-developers",
  "java",
  "mobile-development",
  "javascript",
  "reactjs",
  "nodejs",
  "angularjs",
  "php",
  "internet-of-things",
  "dotnet",
  "ruby",
  "amazon-web-services",
  "big-data",
  "clojure",
  "css",
  "drupal",
  "wordpress",
  "sql",
  "user-experience",
  "ui-design",
  "virtual-reality",
  "agile-project-management",
  "saas-software-as-a-service",
  "opensource",
  "softwaredev"
];
const designTopics = [
  "design",
  "sketch",
  "photoshop",
  "illustrator",
  "graphic design",
  "ux",
  "user experience",
  "dribble"
];

router.get("/generate-token", (req, res) => {
  const url = `https://secure.meetup.com/oauth2/authorize?client_id=${
    process.env.MEETUP_KEY
  }&response_type=code&redirect_uri=${process.env.MEETUP_REDIRECT_URI}`;
  res.redirect(url);
});

router.get("/fetch-meetup-token", (req, res) => {
  const { code } = req.query;

  const postData = {
    client_id: process.env.MEETUP_KEY,
    client_secret: process.env.MEETUP_SECRET,
    grant_type: "authorization_code",
    redirect_uri: process.env.MEETUP_REDIRECT_URI,
    code
  };

  const config = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  };

  // Request json won't work since we want url-encoded for meetup api
  axios
    .post(
      "https://secure.meetup.com/oauth2/access",
      qs.stringify(postData),
      config
    )
    .then(({ data }) => {
      console.log(data);

      tokenCache["meetup"] = data;
      res.json(data);
    })
    .catch(err => {
      console.log(err);
    });
});

// Set up the GET route
router.get("/meetup", function(req, res) {
  res.send("Meetup");
});

// Set up the POST route
router.post("/meetup", function(req, res, next) {
  // Store the response URL for Slack
  if (req.body.response_url !== undefined) {
    // Make sure we have a valid request
    if (
      req.body.token !== process.env.SLACK_TOKEN &&
      req.body.token !== process.env.DESIGN_SLACK_TOKEN
    ) {
      res.send("Slack token is bad");
      return;
    }

    response_url = req.body.response_url;
  } else {
    res.send("There is no body");
  }

  // Build an empty parameter object
  const param = baseParameter();

  // Build the topics search query string and set it

  let topics = Array();

  console.log(req.body.team_id);

  if (req.body.team_id == "T03E1AWDP")
    // Orlando Devs
    topics = engineeringTopics.join();
  else if (req.body.team_id == "T03EDNQMH") {
    // Orlando Designer
    topics = designTopics.join();
  } else {
    // Why not both?
    topics = [...engineeringTopics, ...designTopics].join();
  }

  param.topic = topics;

  // Set the time limit if one is available
  // This could be the current day, week, or month
  const time = getDateForText(req.body.text);
  if (time !== undefined) {
    param.time = moment() + "," + time;
  }

  // Load the events from Meetup using the URL parameter
  events(param, receivedEvents);

  // Spit out an empty response
  res.send("");
});

// Create a new Meetup API client
const client = requestJson.createClient("https://api.meetup.com/2/");

function baseParameter() {
  return {
    sign: true,
    "photo-host": "public",
    zip: "32801",
    topic: "",
    page: "20",
    utc_offset: "-18000000",
    access_token: tokenCache.meetup.access_token
  };
}

function events(param, callback) {
  // Generate our API query string
  const queryString = _buildQueryStringFromParameter(param);

  console.log(queryString);
  // Send the request to receive all available events
  client.get("open_events?" + queryString, function(err, res, body) {
    // Call the callback in our original area
    callback(body);
  });
}

// Callback after Meetup API call returns
// Parses response and sends it into slack
function receivedEvents(body) {
  // Specify we want a new ephemeral message
  const message = { response_type: "ephemeral" };

  // Set the correct response URL
  message.response_url = response_url;

  const attachments = [];

  // Notify the user if we don't have any results
  if (body.results === undefined || body.results.length === 0) {
    message.text = "There are no meetups scheduled. How did that happen?";
    slack.postMessageToChannel(message);
    return;
  }

  // Loop through each meetup event result
  for (let i = 0; i < body.results.length; i++) {
    let text = "";
    const result = body.results[i];

    // Start a new attachment
    const attachment = {};
    const date = new Date(result.time);

    // Build the attachment title
    title =
      "<" +
      result.event_url +
      "|" +
      result.name +
      ">" +
      " hosted by <http://www.meetup.com/" +
      result.group.urlname +
      "|" +
      result.group.name +
      ">\n";

    // Specify the date of the event and display the description without any HTML tags
    text +=
      moment(date)
        .tz("America/New_York")
        .format("dddd, MMMM Do h:mm a") + "\n";
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

// Given a JSON object, build the associated parameter string
function _buildQueryStringFromParameter(param) {
  const str = [];

  // Loop through each parameter and build a key=value string
  for (let p in param)
    if (param.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(param[p]));
    }
  // Return & separated query string
  return str.join("&");
}

// Given a string, return the appropriate unix timestamp using Moment.js
function getDateForText(text) {
  if (text === "") {
    return;
  }

  if (text === "today") {
    return moment()
      .tz("America/New_York")
      .endOf("day");
  }

  if (text === "week") {
    return moment()
      .tz("America/New_York")
      .endOf("week");
  }

  if (text === "month") {
    return moment()
      .tz("America/New_York")
      .endOf("month");
  }
}

cron.schedule("*/15 * * * *", () => {
  if (tokenCache.meetup) {
    const postData = {
      client_id: process.env.MEETUP_KEY,
      client_secret: process.env.MEETUP_SECRET,
      grant_type: "refresh_token",
      refresh_token: tokenCache.meetup.refresh_token
    };

    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    };

    // Request json won't work since we want url-encoded for meetup api
    axios
      .post(
        "https://secure.meetup.com/oauth2/access",
        qs.stringify(postData),
        config
      )
      .then(({ data }) => {
        console.log(data);

        tokenCache["meetup"] = data;
      })
      .catch(err => {
        console.log(err);
      });
  }
});

module.exports = {
  router
};
