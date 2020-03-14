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
  const parsedUrl = url.parse(req.url, true);

  //get the path from the url
  const path = parsedUrl.pathname;
  //trim extraneous slashes from both sides
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  //get query string as an object
  const queryStringObject = parsedUrl.query;

  //get http method
  const method = req.method.toLowerCase();

  //get headers into object if any
  const headers = req.headers;

  //get the payload if any
  //create a decoder that decodes utf -8
  //create a string that can hold the entire decoded string
  //on req data event append result onto the buffer/payload string one piece at a time
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();

    //choose handler response should got to
    //if not found use not found
    let chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    //construct data obj to send to handler
    let data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': buffer
    };

    //route request to handler specified in router
    chosenHandler(data, (statusCode, payload) => {

      //use code called back or default status code
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

      //use the payload called back or default payload
      payload = typeof (payload) == 'object' ? payload : {};

      //convert payload to string
      let payloadString = JSON.stringify(payload);

      //send response
      res.writeHead(statusCode);

      res.end('Welcome to Uptime\n' + payloadString);

      //log the path requested
      console.log('Returning this response: ', statusCode, payloadString);
    });
  });

});
//start server listen on port
server.listen(3000, () => {
  console.log("Listening on port 3000")
});

const handlers = {};

handlers.sample = (data, callback) => {
  //callback a http status code and a payload obj
  callback(406, { 'name': 'sample handler' });
};

handlers.notFound = (data, callback) => {
  callback(403);
};

const router = {
  "sample": handlers.sample
}