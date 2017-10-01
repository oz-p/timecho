// Default configuration, the parameters can be overridden from the command line i.e. "$ node timecho.js redisHost=10.0.0.1 redisPort=4000" 
module.exports =  {	
	instanceId: '1',			// Unique identifier for the server instance
	redisHost: '127.0.0.1',		// Redis host
	redisPort: '6379',			// Redis port
	checkTimeDelay: 1000		// How much time to wait (milliseconds) between messages checks - if seconds precision is important than this should be equal or lower than 1000, otherwise this value can be higher
};