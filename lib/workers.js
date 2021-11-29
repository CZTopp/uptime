/**
 * worker releated tasks
 *
 * list all checks in dir
 */
//dependencies
const path = require("path")
const fs = require("fs")
const _data = require("./data")
const http = require("http")
const https = require("https")
const helpers = require("./helpers")
const url = require("url")
const { checks } = require("./handlers")

//institate worker
const workers = {}

//lookup checks get their data end to validator
workers.getAllChecks = () => {
  _data.list("checks", (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach((check) => {
        //read in data
        _data.read("checks", check, (err, originalCheckData) => {
          if ((!err, originalCheckData)) {
            //pass data to validator for further processings or logging
            workers.validateCheckData(originalCheckData)
          } else {
            console.lor({ Error: "Could not read data" })
          }
        })
      })
    } else {
      console.log({ Error: "Could not find any checks to execute" })
    }
  })
}

//sanity check the check data
workers.validateCheckData = (originalCheckData) => {
  originalCheckData =
    typeof originalCheckData == "object" && originalCheckData !== null
      ? originalCheckData
      : {}
  originalCheckData.id =
    typeof originalCheckData.id == "string" &&
    originalCheckData.id.trim().length == 20
      ? originalCheckData.id.trim()
      : false

  originalCheckData.userPhone =
    typeof originalCheckData.userPhone == "string" &&
    originalCheckData.userPhone.trim().length == 10
      ? originalCheckData.userPhone.trim()
      : false
  originalCheckData.protocol =
    typeof originalCheckData.protocol == "string" &&
    ["http", "https"].indexOf(originalCheckData.protocol) > -1
      ? originalCheckData.protocol
      : false
  originalCheckData.url =
    typeof originalCheckData.url == "string" &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url.trim()
      : false
  originalCheckData.method =
    typeof originalCheckData.method == "string" &&
    ["POST", "GET", "PUT", "DELETE"].indexOf(originalCheckData.method) > -1
      ? originalCheckData.method
      : false
  originalCheckData.successCodes =
    typeof originalCheckData.successCodes == "object" &&
    originalCheckData.successCodes instanceof Array &&
    originalCheckData.successCodes.length > 0
      ? originalCheckData.successCodes
      : false
  originalCheckData.timeoutSeconds =
    typeof originalCheckData.timeoutSeconds == "number" &&
    originalCheckData.timeoutSeconds % 1 === 0 &&
    originalCheckData.timeoutSeconds >= 1 &&
    originalCheckData.timeoutSeconds <= 5
      ? originalCheckData.timeoutSeconds
      : false

  //set the keys that may not be set if wrokers have not seen this check before
  originalCheckData.state =
    typeof originalCheckData.state == "string" &&
    ["up", "down"].indexOf(originalCheckData.state) > -1
      ? originalCheckData.state
      : "down"
  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked == "number" &&
    originalCheckData.lastChecked > 0
      ? originalCheckData.lastChecked
      : false

  //if all checks pass, pass data to next process
  if (
    originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds
  ) {
    workers.performCheck(originalCheckData)
  } else {
    console.log({
      Error: "one or more checks is not properly formatted, skipping it.",
    })
  }
}

/**
 * perform check
 * send original check data
 * and outcome of process to nexxt step in process
 */
workers.performCheck = (originalCheckData) => {
  //prepare initial check outcome
  let checkOutcome = {
    error: false,
    responseCode: false,
  }
  //mark if outcome was sent yet
  let outcomeSent = false

  //parse hostname and path out of check
  const parsedUrl = new URL(
    `${originalCheckData.protocol}://${originalCheckData.url}`
  )

  const hostname = parsedUrl.hostname
  const path = parsedUrl.path // using path not "pathname" for access to query string

  const requestDetails = {
    protocol: `${originalCheckData.protocol}:`,
    hostname: hostname,
    method: originalCheckData.method.toUpperCase(),
    path: path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  }

  //instantiate the req obj use either http or https module
  const _moduleToUse = originalCheckData.protocol == "http" ? http : https
  const req = _moduleToUse.request(requestDetails, (res) => {
    //grab the status of the sent request
    const status = res.statusCode

    //update the checkoutcome and pass the data
    checkOutcome.responseCode = status
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })
  //bind to the error even so it doesnt get thrown
  req.on("error", (e) => {
    //update the checkoutcome pass data
    checkOutcome.error = { error: true, value: e }
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  //bind to the timeout event
  req.on("timeout", (e) => {
    //update the checkoutcome pass data
    checkOutcome.error = { error: true, value: timeout }
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  //end the request
  req.end()
}

// process the check outocme and update check data as needed and trigger and alert if needed
//special logic for accomdating a check that has never been tested before(dont alert on that one)
workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
  //devide if the check is considered up or down

  const state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1
      ? "up"
      : "down"

  // decide if alert is warranted
  const alertWarranted =
    originalCheckData.lastChecked && originalCheckData.state !== state
      ? true
      : false

  //update check data
  const newCheckData = originalCheckData
  newCheckData.state = state
  newCheckData.lastChecked = Date.now()

  //save the updates
  _data.update("checks", newCheckData.id, newCheckData, (err) => {
    if (!err) {
      //send the new check data to the phase in the process if needed
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckData)
      } else {
        console.log(
          `Check id: ${newCheckData.id} outcome has not changed, no alert needed`
        )
      }
    } else {
      console.log({ Error: "unable to save updates to one of the checks" })
    }
  })
}

//alert user to change in their check status
workers.alertUserToStatusChange = (newCheckData) => {
  const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${
    newCheckData.protocol
  }://${newCheckData.url} is currently ${newCheckData.state}`
  helpers.sendTwilioSms(newCheckData.userPhone, msg, (err) => {
    if (!err) {
      console.log("User was alerted of status change via sms", msg)
    } else {
      console.log({
        Error:
          "could not send sms alert to user who had a state change in their check.",
        err,
      })
    }
  })
}

//timer to execute the worker-process once per minute
workers.loop = () => {
  setInterval(() => {
    workers.getAllChecks()
  }, 1000 * 5)
}

//init script
workers.init = () => {
  // execute all checks
  workers.getAllChecks()

  // call loop on checks will execute later
  workers.loop()
}
module.exports = workers
