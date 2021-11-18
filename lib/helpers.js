/**
 * helpers for various tasks
 */

//dependencies
const crypto = require("crypto")
const config = require("./config")

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

module.exports = helpers
