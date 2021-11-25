const http = require("http")
const https = require("https")
const url = require("url")
const StringDecoder = require("string_decoder").StringDecoder
const config = require("./lib/config")
const fs = require("fs")
const handlers = require("./lib/handlers")
const helpers = require("./lib/helpers")

// instantiate HTTP server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res)
})
//start server
httpServer.listen(config.httpPort, () => {
  console.log(`listening on ${config.httpPort}.`)
})

// instantiate HTTPS server
const httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
}
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res)
})
//start server
httpsServer.listen(config.httpsPort, () => {
  console.log(`listening on ${config.httpsPort}.`)
})

const unifiedServer = (req, res) => {
  //parse url
  const parsedUrl = url.parse(req.url, true)

  //get path
  const path = parsedUrl.pathname
  const trimmedPath = path.replace(/^\/+|\/+$/g, "")

  //get query string as an object
  const queryStringObject = parsedUrl.query

  //get request method
  const method = req.method.toLocaleUpperCase()

  //get headers as object
  const headers = req.headers

  //get the payload
  const decoder = new StringDecoder("utf-8")
  let buffer = ""
  req.on("data", (data) => {
    buffer += decoder.write(data)
  })
  req.on("end", () => {
    buffer += decoder.end()

    //choose handler request should route to
    //if not found use not found handler
    const chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound

    //construct data object to send to handler
    const data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer),
    }

    //route request to specified handler
    chosenHandler(data, (statusCode, payload) => {
      //use the status code called back by handler of default to 200
      statusCode = typeof statusCode == "number" ? statusCode : 200

      //use the payload calledback by handler or default to empty object
      payload = typeof payload == "object" ? payload : {}

      //convert payload to string
      payloadString = JSON.stringify(payload)

      //return response
      res.setHeader("Content-Type", "application/json")
      res.writeHead(statusCode)
      res.end(payloadString)

      //log path requested
      console.log(
        `Response from request ${data.method}: `,
        statusCode,
        payloadString
      )
    })
  })
}

//define router
const router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
}
