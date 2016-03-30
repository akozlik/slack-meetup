var requestJson = require('request-json');

var client = requestJson.createClient("https://api.meetup.com/2/");

module.exports = {

    baseParameter : function() {
        return {
            sign : true,
            "photo-host" : "public",
            zip : "32801",
            topic : "",
            page : "20",
            key : process.env.MEETUP_API_KEY
        };
    },

    events : function(param, callback) {

        var queryString = _buildQueryStringFromParameter(param);
        client.get('open_events?' + queryString,
            function(err, res, body) {
                callback(body);
            }
        );
    },
};

function _buildQueryStringFromParameter(param) {
    var str = [];
    for(var p in param)
        if (param.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(param[p]));
        }
    return str.join("&");
}