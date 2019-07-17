// Use request JSON for quick JSON loading
var requestJson = require("request-json");
const axios = require("axios");

// Create a new Meetup API client
var client = requestJson.createClient("https://api.meetup.com/2/");

module.exports = {
  // Returns a base parameter object with smart defaults
  // These can be overridden on the routing level
  baseParameter: function() {
    return {
      sign: true,
      "photo-host": "public",
      zip: "32801",
      topic: "",
      page: "20",
      //   key: process.env.MEETUP_API_KEY,
      utc_offset: "-18000000"
    };
  },

  events: function(param, callback) {
    // Generate our API query string
    var queryString = _buildQueryStringFromParameter(param);

    console.log(queryString);
    // Send the request to receive all available events
    client.get("open_events?" + queryString, function(err, res, body) {
      // Call the callback in our original area
      callback(body);
    });
  }
};

// Given a JSON object, build the associated parameter string
function _buildQueryStringFromParameter(param) {
  var str = [];

  // Loop through each parameter and build a key=value string
  for (var p in param)
    if (param.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(param[p]));
    }

  // Return & separated query string
  return str.join("&");
}
