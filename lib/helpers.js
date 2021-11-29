/**
 * helpers for various tasks
 */

//dependencies
const crypto = require("crypto")
const config = require("./config")
const https = require("https")
const querystring = require("querystring")
const url = require("url")

const helpers = {}

//create a SHA256
helpers.hash = (string) => {
  if (typeof string == "string" && string.length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(string)
      .digest("hex")
    return hash
  } else {
    return false
  }
}
//take string and return json object or false
helpers.parseJsonToObject = (string) => {
  try {
    const obj = JSON.parse(string)
    return obj
  } catch (e) {
    return false
  }
}

//create a string of random alpha numeric chars of a given lenght
helpers.createRandomString = (stringLength) => {
  stringLength =
    typeof stringLength == "number" && stringLength > 0 ? stringLength : false
  if (stringLength) {
    //define all posble chars
    const possibleChars = "abcdefghijklmnopqrstuvwxyz0123456789"
    let string = ""
    for (i = 1; i <= stringLength; i++) {
      //get random char from possible Chars
      let randomChar = possibleChars.charAt(
        Math.floor(Math.random() * possibleChars.length)
      )
      string += randomChar
    }
    return string
  } else {
    return false
  }
}

//send an sms message via twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
  phone =
    typeof phone == "string" && phone.trim().length == 10 ? phone.trim() : false
  msg =
    typeof msg == "string" && msg.trim().length > 0 && msg.trim().length <= 1600
      ? msg.trim()
      : false
  if (phone && msg) {
    //configure request payload for twilio api.twilio.com
    const payload = {
      From: config.twilio.fromPhone,
      Body: msg,
      To: `+1${phone}`,
    }

    //stringefy payload
    const stringefyPayload = querystring.stringify(payload)

    //request details
    const requestDetails = {
      method: "POST",
      protocol: "https:",
      hostname: "api.twilio.com",
      path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      messagingServiceSid: `${config.twilio.MessagingServiceSid}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringefyPayload),
      },
      auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
    }
    //instantiate request aobject
    const req = https.request(requestDetails, (res) => {
      //get status of sent request
      const status = res.statusCode
      //callback successful
      status == 200 || status == 201
        ? callback(false)
        : callback(`Status code returned was ${status}`)
    })
    //bind to the error event so it doesnt get thrown
    req.on("error", (e) => {
      callback(e)
    })

    //add paylod to request
    req.write(stringefyPayload)

    //end request
    req.end()
  } else {
    callback("Given parameters were missing or invalid")
  }
}

module.exports = helpers
