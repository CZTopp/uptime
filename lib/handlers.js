/**
 * define request  handlers
 *
 * */

//dependencies
const _data = require("./data")
const helpers = require("./helpers")

handlers = {}

handlers.users = (data, callback) => {
  // what method then handle message
  const method = data.method
  method.toString()
  const acceptableMethods = ["POST", "GET", "PUT", "DELETE"]
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback)
  } else {
    callback(405)
  }
}
//container for users sub method
handlers._users = {}

//user - post
//required data: firstName, lastName, phone, email, password, tosAgreement
//optional data
handlers._users.POST = (data, callback) => {
  //check for all req fields
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false

  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false

  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false

  const email =
    typeof data.payload.email == "string" &&
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(data.payload.email.trim())
      ? data.payload.email.trim()
      : false

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false

  const tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false

  if (firstName && lastName && phone && email && password && tosAgreement) {
    console.log("all inputs are filled....")
    //make sure user doesnt exist
    _data.read("users", phone, (err, data) => {
      if (err) {
        //hash the password
        const hashedPassword = helpers.hash(password)

        if (hashedPassword) {
          //create user object
          const userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            email: email,
            hashedPassword: hashedPassword,
            tosAgreement: true,
          }

          //store user
          _data.create("users", phone, userObject, (err) => {
            if (!err) {
              callback(200)
            } else {
              console.log(err)
              callback(500, { Error: "Could not create new user." })
            }
          })
        } else {
          callback(500, { Error: "Could not hash password" })
        }
      } else {
        //user exists
        callback(400, { Error: "A user with that information exists already" })
      }
    })
  } else {
    callback(400, { Error: "Missing required fields" })
  }
}

//user - get
/**
 *
 * @param {*} data
 * @param {*} callback
 *
 * required data: phone
 * optional data: none
 */
//@TODO authenticated user can only access their information
handlers._users.GET = (data, callback) => {
  // Check that phone number is valid
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false
  if (phone) {
    // Lookup the user
    _data.read("users", phone, (err, data) => {
      if (!err && data) {
        // Remove the hashed password from the user user object before returning it to the requester
        delete data.hashedPassword
        callback(200, data)
      } else {
        callback(404, { Error: "Could not find the specified user" })
      }
    })
  } else {
    callback(400, { Error: "Missing required field" })
  }
}

//user - put
/**
 *
 * @param {*} data
 * @param {*} callback
 * Required data: phone
 * Optional data: firstName, lastName, password (at least one must be specified)
 * @TODO only let authenticate user update own object no others
 */
handlers._users.PUT = (data, callback) => {
  //check for required field
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false

  //check for optional fields
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false

  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false

  const email =
    typeof data.payload.email == "string" &&
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(data.payload.email.trim())
      ? data.payload.email.trim()
      : false

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false

  //error if phone is invalid
  if (phone) {
    //error if no field is sent is updated
    if (firstName || lastName || email || password) {
      //lookup user
      _data.read("users", phone, (err, userData) => {
        if (!err && userData) {
          if (firstName) {
            userData.firstName = firstName
          }
          if (lastName) {
            userData.lastName = lastName
          }
          if (email) {
            userData.email = email
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password)
          }
          //store new updates
          _data.update("users", phone, userData, (err) => {
            if (!err) {
              callback(200)
            } else {
              callback(500, { Error: "Could not update user." })
            }
          })
        } else {
          callback(400, { Error: "Specified user does not exist." })
        }
      })
    } else {
      callback(400, { Error: "Missing fields to update." })
    }
  } else {
    callback(400, { Error: "Missing required field." })
  }
}

//user - delete
/**
 *
 * @param {*} data
 * @param {*} callback
 *
 * @TODO only allow authenticatied user to delete their own object
 * @TODO delete any other data files with this user
 */
handlers._users.DELETE = (data, callback) => {
  // check that phone number is valid
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false
  if (phone) {
    // Lookup the user
    _data.read("users", phone, (err, data) => {
      if (!err && data) {
        _data.delete("users", phone, (err) => {
          if (!err && data) {
            callback(200)
          } else {
            callback(500, { Error: "Could not delete the user" })
          }
        })
      } else {
        callback(404, { Error: "Could not find the specified user" })
      }
    })
  } else {
    callback(400, { Error: "Missing required field" })
  }
}

handlers.tokens = (data, callback) => {
  // what method then handle message
  const method = data.method
  method.toString()
  const acceptableMethods = ["POST", "GET", "PUT", "DELETE"]
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback)
  } else {
    callback(405)
  }
}
//container for tokens sub method
handlers._tokens = {}

///tokens POST
/**
 *
 * @param {*} data
 * @param {*} callback
 *
 * required data: phone, password
 */
handlers._tokens.POST = (data, callback) => {
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false
  if (phone && password) {
    //lookup the user who matches the phone number
    _data.read("users", phone, (err, userData) => {
      if (!err && userData) {
        //check password
        //hash sent pw and compare against stored pw
        const hashedPassword = helpers.hash(password)
        if (hashedPassword == userData.hashedPassword) {
          //if valid create token with ttl of 1 hour
          const tokenId = helpers.createRandomString(20)
          const tokenTtl = Date.now() + 1000 * 60 * 60
          tokenObject = {
            phone: phone,
            id: tokenId,
            tokenTtl: tokenTtl,
          }

          //store token
          _data.create("tokens", tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject)
            }
          })
        } else {
          callback(400, { Error: "password did not match" })
        }
      } else {
        callback(400, { Error: "Could not find the specified user" })
      }
    })
    //match user pw
  } else {
    callback(400, { Error: "Missing required field(s)" })
  }
}
///tokens GET
/**
 *
 * @param {*} data
 * @param {*} callback
 *
 * Required data is: id
 */
handlers._tokens.GET = (data, callback) => {
  //check if id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false
  if (id) {
    // Lookup the token
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData)
      } else {
        callback(404, { Error: "Could not find the specified user" })
      }
    })
  } else {
    callback(400, { Error: "Missing required field" })
  }
}
///tokens PUT
/**
 *
 * @param {*} data
 * @param {*} callback
 *
 * Required data: id, extend
 * optional data: none
 */
handlers._tokens.PUT = (data, callback) => {
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false

  const extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false
  if (id && extend) {
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        //check to make sure todin isnt already expired
        if (tokenData.tokenTtl > Date.now()) {
          //set expiration for an hour from now
          tokenData.tokenTtl = Date.now() + 1000 * 60 * 60
          //persist to db
          _data.update("tokens", id, tokenData, (err) => {
            console.log(tokenData)
            if (!err) {
              callback(200)
            } else {
              callback(500, { Error: "Could not update the token." })
            }
          })
          callback(200)
        } else {
          callback(400, {
            Error: "Token has already expired, and cannot be extended.",
          })
        }
      } else {
        callback(400, { Error: "Specified token does not exist" })
      }
    })
  } else {
    callback(400, {
      Error: "Missing required field(s) or field(s) are invalid.",
    })
  }
}

//tokens DELETE
handlers._tokens.DELETE = (data, callback) => {}

handlers.ping = (data, callback) => {
  callback(200)
}

handlers.notFound = (data, callback) => {
  callback(404)
}

//export the module
module.exports = handlers
