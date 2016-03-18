var requestJson = require('request-json');

var client = requestJson.createClient("https://api.meetup.com/2/");

module.exports = {
    events : function(query, callback) {

        var apiKey = process.env.MEETUP_API_KEY;
        console.log(apiKey);
        client.get('open_events?&sign=true&photo-host=public&zip=32771&text=iOS&page=20&key='+apiKey,
            function(err, res, body) {
                callback(body);
            }
        );
    }
};