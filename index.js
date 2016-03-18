var express = require('express');
var app = express();

app.set('port', 3000);

app.get('/', function(req, res) {
    response.write("Hello World");
});