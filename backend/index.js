/**
 *
 */

//dependencies
const server = require("./lib/server")
const workers = require("./lib/workers")

// declare app
const app = {}

//init function
app.init = () => {
  server.init()
  workers.init()
}

//excute
app.init()

//export.app
module.exports = app
