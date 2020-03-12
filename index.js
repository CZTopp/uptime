/**
 * App entry
 */

//Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

//server to respond to all requests
const server = http.createServer((req, res) => {

  //get url aßnd parse it
  var parsedUrl = url.parse(req.url, true);

  //get the path from the url
  var path = parsedUrl.pathname;
  //trim extraneous slashes from both sides
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  //get query string as an object
  var queryStringObject = parsedUrl.query;

  //get http method
  var method = req.method.toLowerCase();

  //get headers into object if any
  var headers = req.headers;

  //get the payload if any
  //create a decoder that decodes utf -8
  //create a string that can hold the entire decoded string
  //on req data event append result onto the buffer/payload string one piece at a time
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();
    //send response
    res.end('Welcome to Uptime\n');
    //log the path requested
    console.log('Request received with this payload ', buffer);
  });

});
//start server listen on port
server.listen(3000, () => {
  console.log("Listening on port 3000")
});