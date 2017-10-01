# timecho

A REST endpoint that defines a message to be printed at a given time in the future to the server console

# Usage

Start the REST server:
```
node timecho.js
```
Configuration arguments can be added to the command line, in example:
```
node timecho.js instanceId=2 redisHost=10.0.0.1 redisPort=4000
```
 
This will create the following endpoint (showing default configuration):

http://localhost:8080/echoAtTime/

Which takes two parameters (time,message), in example:
```
curl -i 'http://localhost:8080/echoAtTime/?time=2017-10-01+19:43:12&message=Hello+world'
```
The result is a JSON object: 
```
{
  "error":0
}
```

# Files/Folders
- /timecho.js: The main endpoint file, used to launch the server
- /config.js: Default configuration
- /node_modules/: Third-party frameworks

