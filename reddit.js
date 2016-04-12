// Use request JSON for quick JSON loading
var requestJson = require('request-json');

// Create a new Meetup API client
var client = requestJson.createClient("https://reddit.com");

module.exports = {

    // Returns a base parameter object with smart defaults
    // These can be overridden on the routing level
    baseParameter : function() {
        return {
            sub : "all",
            sort: "top",
            limit : "20",
        };
    },

    posts : function(param, callback) {

        // Generate our API query string
        var queryString = _buildQueryStringFromParameter(param);
        console.log(client);

        // Send the request to receive all available events
        client.get(queryString,
            function(err, res, body) {
                // Call the callback in our original area
                // callback(body);
                var results = body.data.children.splice(0, param.limit);

                callback(results);
            }
        );
    },
};

// Given a JSON object, build the associated parameter string
function _buildQueryStringFromParameter(param) {
    var str = [];

    var query = "/r/";

    if (param.sub) {
        query += param.sub;
    }

    if (param.sort) {
        query += "/" + param.sort;
    }

    query += ".json";

    return query;
}