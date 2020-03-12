/**
 * App entry
 */

//Dependencies
const http = require('http');
const url = require('url');

//server to respond to all requests
const server = http.createServer((req, res) => {

  //get url aßnd parse it
  var parsedUrl = url.parse(req.url, true);

  //get the path from the url
  var path = parsedUrl.pathname;

  //trim extraneous slashes from both sides
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  //get http method
  var method = req.method.toLowerCase();

  //send response
  res.end('Welcome to Uptime\n');

  //log the path requested
  console.log('Request received on path: ' + trimmedPath + ' with this method: ' + method);

});
//start server listen on port
server.listen(3000, () => {
  console.log("Listening on port 3000")
});