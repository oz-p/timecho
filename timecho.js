var redis = require('redis');
var restify = require('restify');
const uuid = require('uuid/v1');
var config = require('./config.js');


// If any arguments given, update the configuration
for (var a in process.argv) {
	var aParts = process.argv[a].split('=');
	if (aParts.length<=1) continue; 
	if (config[aParts[0]]!==null) config[aParts[0]]=aParts[1];
}


//Holds a list of messages that needs to be echoed to the console at a certain time, each record has a unique key and holds two properties: time, message
var messages = {};	

// echoAtTime endpoint - Sets a message to be displayed on a given time
// param time - string: A valid date/time string that can be converted to a node.js timestamp 
// param message - string: A text message to be displayed at the requested time
function echoAtTime(req, res, next) {
	console.log('Web Server: echoAtTime requested');
	var result = {error:1};
	
	// Make sure all parameters are valid
	if (req.query.time && req.query.message && !isNaN(Date.parse(req.query.time))) {	
		
		// Create a message object to hold the requested data
		var msgId = uuid();
		var msg = {
			time: new Date(req.query.time),
			message: req.query.message
		};
		
		// Add the message to the local messages list and also to the Redis db
		messages[msgId] = msg;		
		rClient.hmset('messages:'+config.instanceId, msgId, JSON.stringify(msg));

		result.error = 0;
		console.log('Web Server: message added');
	}
	
	// Convert the result to a JSON string and send the response to the client
	res.send(JSON.stringify(result));
	next();
}


// checkTime - Checks repeatedly if a message needs to be displayed
function checkTime() {
	var current = new Date();
	// Loop through the messages in memory
	for (var msgId in messages)
	{
		var msg = messages[msgId];
		// If a message time has passed, it needs to be displayed (either if the server was down when it was time or if the time has come to show it while it was online)
		if (current>=msg.time) {
			// Display the message on the server console
			console.log('MESSAGE ('+msg.time+'): '+msg.message);
			
			// Delete the message from the local messages list and from the Redis db
			delete messages[msgId];			
			rClient.hdel('messages:'+config.instanceId, msgId);
		}			
	}
	// Set the next check 
	setTimeout(checkTime, config.checkTimeDelay);
}


// Create the Redis client
var rClient = redis.createClient({	
	host:config.redisHost,
	port:config.redisPort,
	retry_strategy: function (options) {
		console.log('Redis: Connection failed (attempt: '+options.attempt+')');
		if (options.error && options.error.code === 'ECONNREFUSED') return new Error('Redis: The server refused the connection');
        if (options.total_retry_time > 1000 * 60 * 60) return new Error('Redis: Retry time exhausted');
        if (options.attempt >= 10) return undefined;
        return Math.min(options.attempt * 100, 3000);
    }
});


// Handle the Redis connect event
rClient.on('connect', function() {
	    console.log('Redis: Connected');

	    // Create the web server
	    var server = restify.createServer();
	    server.use(restify.plugins.queryParser());
	    server.get('/echoAtTime/', echoAtTime);
	    server.listen(8080, function() {
	    	console.log('Web Server: Waiting for request');    	
	    	// Retrieve the existing pending messages for our instance from the Redis db, if there are any, and add them to the local messages list
	    	rClient.hgetall('messages:'+config.instanceId, function(err, msgList) {
		        if (msgList!=null)
		        	for (var msgId in msgList) 
		        	{
		        		var params = JSON.parse(msgList[msgId]);
		        		if (params.time && params.message) messages[msgId] = {time: new Date(params.time),message: params.message};	        		
		        	}
		        // Perform the initial messages time check
		        checkTime();
		    });	    		    	
	    });
});


//Handle any Redis error
rClient.on('error', function(err){
	console.log('Redis: Error');
	console.log(err);		
});