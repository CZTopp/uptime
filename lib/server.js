/**
 * server tasks
 */
const http = require("http")
const https = require("https")
const url = require("url")
const StringDecoder = require("string_decoder").StringDecoder
const config = require("./config")
const fs = require("fs")
const handlers = require("./handlers")
const helpers = require("./helpers")
const path = require("path")
const util = require("util")
const debug = util.debuglog("server")

const server = {}

// instantiate HTTP server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res)
})

// instantiate HTTPS server
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem")),
}
server.httpsServer = https.createServer(
  server.httpsServerOptions,
  (req, res) => {
    unifiedServer(req, res)
  }
)

server.unifiedServer = (req, res) => {
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
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
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
    chosenHandler(data, (statusCode, payload, contentType) => {
      //type of resonse
      contentType = typeof contentType == "string" ? contentType : "json"

      //use the status code called back by handler of default to 200
      statusCode = typeof statusCode == "number" ? statusCode : 200

      //return response parts that are contenet specific
      payloadString = ""
      if (contentType == "json") {
        res.setHeader("Content-Type", "application/json")
        payload = typeof payload == "object" ? payload : {}
        payloadString = JSON.stringify(payload)
      }
      if (contentType == "html") {
        res.setHeader("Content-Type", "text/html")
        payloadString = typeof payload == "string" ? payload : ""
      }
      //return response parts that are common to all content types
      res.writeHead(statusCode)
      res.end(payloadString)

      //log path requested
      if (statusCode == 200) {
        debug(
          "\x1b[32m%s\x1b[0m",
          `${method.toUpperCase()}/${trimmedPath} ${statusCode}`
        )
      } else {
        debug(
          "\x1b[31m%s\x1b[0m",
          `${method.toUpperCase()}/${trimmedPath} ${statusCode}`
        )
      }
    })
  })
}

//define router
server.router = {
  "": handlers.index,
  "account/create": handlers.accountCreate,
  "account/edit": handlers.accountEdit,
  "account/deleted": handlers.accountDeleted,
  "session/create": handlers.sessionCreate,
  "session/delete": handlers.sessionDeleted,
  "checks/all": handlers.checkList,
  "checks/create": handlers.checksCreate,
  "checks/edit": handlers.checksEdit,
  "api/users": handlers.users,
  "api/tokens": handlers.tokens,
  "api/checks": handlers.checks,
  ping: handlers.ping,
}

//int script
server.init = () => {
  //start http server
  server.httpServer.listen(config.httpPort, () => {
    console.log("\x1b[36m%s\x1b[0m", `listening on ${config.httpPort}.`)
  })
  //start https server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log("\x1b[35m%s\x1b[0m", `listening on ${config.httpsPort}.`)
  })
}

module.exports = server
