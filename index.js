require('dotenv').config();

var express = require('express');

var app = express();
var hbs = require('hbs');

app.set('port', 3000);
app.set('view engine', 'html');
app.engine('html', hbs.__express);

app.get('/meetup', function(req, res) {
    res.send("Meetup");
});

app.get('/', function(req, res) {
    res.render('index');
});

app.listen(app.get('port'), function() {
    console.log("Node app is running on port " + app.get('port'));
});