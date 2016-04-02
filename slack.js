var requestJson = require('request-json');
var request = require('request');
var merge = require('merge');

module.exports = {

    // Set up a base message object with smart defaults
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

    // Post a message to a specified channel
    postMessageToChannel: function(attachment, channel) {

        // Get our base message
        var message = this.baseMessage();

        // Merge the custom attachment with the base message to update any properties
        message = merge(message, attachment);

        // If we have a channel specified, set it
        if (channel !== null) {
            message.channel = channel;
        }

        // Get the correct response URL
        // This is the webhook we post to that is unique per channel
        var url = (message.response_url === "" || message.response_url === undefined) ? process.env.SLACK_WEBHOOK_INCOMING : message.response_url;

        // POST the request to our webhook
        request.post({
            url: url,
            body: JSON.stringify(message) // Build a string out of the JSON object
        }, function(err, httpResponse, body) {
            if (err) {
                console.error("Error: " + err);
            }
        });
    }
};