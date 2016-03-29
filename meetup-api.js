var requestJson = require('request-json');

var client = requestJson.createClient("https://api.meetup.com/2/");

module.exports = {
    events : function(query, callback) {

        var apiKey = process.env.MEETUP_API_KEY;

        client.get('open_events?&sign=true&photo-host=public&zip=32801&topic=' + query + '&page=20&key='+apiKey,
            function(err, res, body) {
                callback(body);
            }
        );
    }
};