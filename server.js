
// external modules
var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var http = require('http');

// internal modules
var endpoints = require('./endpoints');
var config = require('./config').settings;
var db = require('./db');
var oauth = require('./oauth');

// get mongo User model
var User = db.getUserModel(config);

// get passport reference from factory
var passport = require('./passport').getPassport(config, oauth, User);

var app = express();

// standard express config (including sessions)
app.set('port', process.env.PORT || 4000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(require('morgan')('dev'));
app.use(cookieParser());
app.use(require('body-parser')());
app.use(require('method-override')());
app.use(session({ secret: 'whatever' }));
app.use(passport.initialize());
app.use(passport.session());

if ('development' == app.get('env')) {
  app.use(require('errorhandler')());
}

// set up our HTTP endpoints
endpoints.configureEndpoints(app, passport);

// start listening for incoming requests
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
