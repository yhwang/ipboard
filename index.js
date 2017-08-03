var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());
app.set('view engine', 'pug');

app.get('/', function (req, res) {
  res.render('index', { title: 'IP table' });
});

app.post('/add', function (req, res) {
  console.log(req.body);
  res.json({msg: 'OK'});
});


var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("To view your app, open this link in your browser: http://localhost:" + port);
});
