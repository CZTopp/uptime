/**
 * App entry
 */

//Dependencies
const http = require('http');

//server to respond to all requests
const server = http.createServer((req, res) => {
  res.end('Welcome to Uptime\n');
});
//start server listen on port
server.listen(3000, () => {
  console.log("Listening on port 3000")
});