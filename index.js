const express = require("express");
const app = express();
const cfenv = require("cfenv");
const bodyParser = require('body-parser');
const Cloudant = require('cloudant');
const config = require('./config.json');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// const services = cfenv.getAppEnv({vcapFile: 'vcap.json'}).getServices();
const services = cfenv.getAppEnv().getServices();
const dbCred = services[config.dbService] && services[config.dbService]['credentials'];
var dbconn;

app.use(bodyParser.json());
app.set('view engine', 'pug');

app.get('/', function (req, res) {
  if (!!dbconn) {
    renderIPTable(req, res);
  }
});

app.post('/add', function (req, res) {
  if (!!dbconn && !!req.body.hwaddr) {
    var now = new Date();
    dbconn.insert(
      {
        MAC: req.body.hwaddr,
        IP: req.body.ipaddr,
        Date: now.toUTCString(),
        DateNum: now.getTime()
      });
  }
  res.json({msg: 'OK'});
});

app.post('/purge', function (req, res) {
  if (!!dbconn) {
    purge();
  }
  res.json({msg: 'OK'});
});


var port = process.env.PORT || 3000;
app.listen(port, function() {
  if (dbCred) {
    Cloudant(
      { url:dbCred.url,
        username:dbCred.username,
        password:dbCred.password
      }, function(err, cloudant, reply) {

      if (err) {
        console.error(`unable to connect to cloudantNoSQLDB ${err.stack}`)
      }

      console.log('Connected to cloudantNoSQLDB');
      dbconn = cloudant.db.use('ipboard');
    });
  }
});

function purge(req, res) {
  dbconn.find({
    "selector": { "DateNum": { "$gt": 0 } },
    "fields": [ "_id", "_rev" ],
    "sort": [ { "DateNum": "desc" } ]
  }, (err, result) => {
    if (err) {
      console.error(`can't query db: ${err.stack}`);
    } else {
      result.docs.shift();
      if (result.docs.length != 0) {
        result.docs.forEach((v) => {
          dbconn.destroy(v._id, v._rev);
        });
      }
    }
  });
}

function renderIPTable(req, res) {
  dbconn.find({
    "selector": { "DateNum": { "$gt": 0 } },
    "fields": [ "MAC", "IP", "Date" ],
    "sort": [ { "DateNum": "desc" } ],
    "limit": 10
  }, (err, result) => {
    if (err) {
      console.error(`can't query db: ${err.stack}`);
    } else {
      res.render('index', { title: 'IP table', docs: result.docs });
    }
  });
}
