var requestJson = require('request-json');
var request = require('request');
var merge = require('merge');

module.exports = {

    baseMessage: function() {
        return {
            title: "Test",
            username: "meetup-bot",
            title_link: "",
            text: "Test",
            fallback: "Test",
            icon_url: "https://blog.agilebits.com/wp-content/uploads/2014/09/Meetup-icon.png"
        };
    },

    postAttachmentToChannel: function(attachment, channel) {
        console.log("Posting");
        var message = this.baseMessage();
        message = merge(message, attachment);

        if (channel !== null) {
            message.channel = channel;
        }

        console.log(message);

        request.post({
            url: process.env.SLACK_WEBHOOK_INCOMING,
            body: JSON.stringify(message)
        }, function(err, httpResponse, body) {
            if (err) {
                console.error(body);
            } else {
                console.log("Message sent");
            }
        });

    }
};