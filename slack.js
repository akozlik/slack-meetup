var requestJson = require('request-json');
var request = require('request');
var merge = require('merge');

module.exports = {

    baseMessage: function() {
        return {
            title: "Only upcoming meetups with at least 3 RSVPs will be displayed",
            username: "meetup-bot",
            title_link: "",
            text: "Only upcoming meetups with at least 3 RSVPs will be displayed",
            fallback: "Test",
            icon_url: "https://blog.agilebits.com/wp-content/uploads/2014/09/Meetup-icon.png"
        };
    },

    postMessageToChannel: function(attachment, channel) {

        var message = this.baseMessage();

        message = merge(message, attachment);

        if (channel !== null) {
            message.channel = channel;
        }

        var url = (message.response_url === "" || message.response_url === undefined) ? process.env.SLACK_WEBHOOK_INCOMING : message.response_url;

        request.post({
            url: url,
            body: JSON.stringify(message)
        }, function(err, httpResponse, body) {
            if (err) {
                console.error("Error: " + err);
            }
        });
    }
};