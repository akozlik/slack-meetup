var requestJson = require('request-json');
var request = require('request');

module.exports = {

    baseMessage: function() {
        return {
            title: "",
            username: "meetup-bot",
            title_link: "",
            text: "",
            fallback: "",
            icon_url: "https://blog.agilebits.com/wp-content/uploads/2014/09/Meetup-icon.png"
        };
    },

    postEphemeralAttachmentToChannel: function(channel, attachment) {
        var message = this.baseMessage();
        message.text = "Yet another test message";

        console.log(JSON.stringify(message));

        request.post({
            url: process.env.SLACK_WEBHOOK_INCOMING,
            body: JSON.stringify(message)
        }, function(err, httpResponse, body) {
            if (err) {
                console.error(body);
            }
        });

    },

    postAttachmentToChannel : function(channel, attachment) {

    }
};