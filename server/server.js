var express = require('express');
var util = require('./utils');
var db = require('./db/config');
var Line = require('./db/models/line');
var Lines = require('./db/collections/lines');
//var Lines =require('./db/collections/lines');
//var Pictures =require('./db/collections/pictures');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
//will change port at later date
var port = 8080;
server.listen(port);

app.use(express.static(__dirname + '/../client'));
//lines.add({id: data.id, coordinates: data.coordinates}, {merge: true});
var line = new Line({coordinates: JSON.stringify('coords')});
line.save().then(function(res) { console.log('saved. ', res); });
//debugger;
//saveToDb();
io.on('connection', function(socket) {
    socket.emit('connected', Lines); //send the server lines to the socket to be drawn
    socket.on('user moved', function(data) {
      console.log('a user drew. their data: ', data);
      Lines.add({id: data.id, coordinates: data.coordinates}, {merge: true});
      //saveToDb();

      //setTimeout(saveToDb, 1000*60*5); //save to db every 5 minutes. begin this timer when at least 1 person has started drawing

      //now save the data to a bookshelf collection of lines ie a picture
      //that persists here. when the pic is done save() to the db
      //if (data.id) { //server has seen line before, it is an existing line someone is drawing
       ////do something 
      //} else { //this is the start of a new line
        //util.serverId(function(id) {
          //data.id = id;
          ////broadcast with a particular id
        //});
      //}
      //socket.broadcast.emit('user moved', data);
      socket.broadcast.emit('user moved', data);
    });
    socket.on('user ended', function(data) {
      socket.broadcast.emit('user ended', data);
      lines.get({id: data.id}).set('id', null);
    });
    socket.on('disconnect', function() {
      io.emit('user disconnected'); //custom event
    });
});

var saveToDb = function() {
  Lines.save().then(function(res) {
    console.log(res); //do we have to manually remove the ids so db can set its own ids?
  });
};

app.route('/gallery')
	.get(function(req,res,next){
		var results = [];
		new Pictures({}).fetch().then(function(pictures){
			for(var i = 0; i<pictures.models.length; i++){
				results[i]=[];
				new Lines({picture_id : pictures.get(i).get('id')}).fetch().then(function(lines){
					for (var i = 0; i < lines.models.length; i++) {
						results[i].push(lines.get(i));
					}
				});
			}
		});
		res.send(results);
	});
