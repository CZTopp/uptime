/**
 * define request  handlers
 *
 * */

//dependencies
const config = require("./config")
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

handlers._users.GET = (data, callback) => {
  // Check that phone number is valid
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false
  if (phone) {
    //get token from headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false
    //verify that given token is valid for phone number
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
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
        callback(403, {
          Error: "Missing required token in header, or token is invalid",
        })
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
 *
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
      //get token from headers
      const token =
        typeof data.headers.token == "string" ? data.headers.token : false

      handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
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
          callback(403, {
            Error: "Missing required token in header, or token is invalid",
          })
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
 *
 */
handlers._users.DELETE = (data, callback) => {
  // check that phone number is valid
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false
  if (phone) {
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false

    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        // Lookup the user
        _data.read("users", phone, (err, userData) => {
          if (!err && userData) {
            _data.delete("users", phone, (err) => {
              if (!err) {
                //delete each check associated with user
                const userChecks =
                  typeof userData.checks == "object" &&
                  userData.checks instanceof Array
                    ? userData.checks
                    : []
                const checksToDelete = userChecks.length
                if (checksToDelete > 0) {
                  const checksDeleted = 0
                  const deletionErrors = false
                  //loop through checks,
                  userChecks.forEach((checkId) => {
                    _data.delete("checks", checkId, (err) => {
                      if (err) {
                        deletionErrors = true
                      }
                      checksDeleted + 1
                      if (checksDeleted == checksToDelete) {
                        if (!deletionErrors) {
                          callback(200)
                        } else {
                          callback(500, {
                            Error:
                              "errors encountered deleting user checks, confirm all checks were deleted.",
                          })
                        }
                      }
                    })
                  })
                } else {
                  callback(200)
                }
              } else {
                callback(500, { Error: "Could not delete the user" })
              }
            })
          } else {
            callback(404, { Error: "Could not find the specified user" })
          }
        })
      } else {
        callback(403, {
          Error: "Missing required token in header, or token is invalid",
        })
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
            if (!err) {
              callback(200)
            } else {
              callback(500, { Error: "Could not update the token." })
            }
          })
          // callback(200)
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
handlers._tokens.DELETE = (data, callback) => {
  // check that id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false
  if (id) {
    // Lookup the user
    _data.read("tokens", id, (err, data) => {
      if (!err && data) {
        _data.delete("tokens", id, (err) => {
          if (!err && data) {
            callback(200)
          } else {
            callback(500, { Error: "Could not delete the token" })
          }
        })
      } else {
        callback(404, { Error: "Could not find the specified token" })
      }
    })
  } else {
    callback(400, { Error: "Missing required field" })
  }
}

/**
 *
 * @param {*} data
 * @param {*} callback
 *
 * verify if a given token id is valid for a given user
 */
handlers._tokens.verifyToken = (id, phone, callback) => {
  //lookup token
  _data.read("tokens", id, (err, tokenData) => {
    if (!err && tokenData) {
      //check that the toke is for the given user and has not expired
      if (tokenData.phone == phone && tokenData.tokenTtl > Date.now()) {
        callback(true)
      } else {
        callback(false)
      }
    } else {
      callback(false)
    }
  })
}

//checks services
handlers.checks = (data, callback) => {
  // what method then handle message
  const method = data.method
  method.toString()
  const acceptableMethods = ["POST", "GET", "PUT", "DELETE"]
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback)
  } else {
    callback(405)
  }
}

handlers._checks = {}

//checks - POST
/**
 *
 * @param {*} data
 * @param {*} callback
 * @requires // protocol, url, method, successCode, timeoutSeconds
 */

handlers._checks.POST = (data, callback) => {
  //validate inputs
  const protocol =
    typeof data.payload.protocol == "string" &&
    ["https", "http"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false

  const url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false

  const method =
    typeof data.payload.method == "string" &&
    ["POST", "GET", "PUT", "DELETE"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false

  const successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false

  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false

  if (protocol && url && method && successCodes && timeoutSeconds) {
    //get token
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false
    //lookup user from token
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        const userPhone = tokenData.phone

        //lookup user
        _data.read("users", userPhone, (err, userData) => {
          if (!err && userData) {
            const userChecks =
              typeof userData.checks == "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : []

            //verify user has less than the number of max checks per user
            if (userChecks.length < config.maxChecks) {
              // create a random id for the check
              const checkId = helpers.createRandomString(20)

              //create check object and include user's phone
              const checkObject = {
                id: checkId,
                userPhone: userPhone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCodes,
                timeoutSeconds: timeoutSeconds,
              }

              //save the object
              _data.create("checks", checkId, checkObject, (err) => {
                if (!err) {
                  //add check id to user object
                  userData.checks = userChecks
                  userData.checks.push(checkId)

                  //save new user data
                  _data.update("users", userPhone, userData, (err) => {
                    if (!err) {
                      callback(200, checkObject)
                    } else {
                      callback(500, {
                        Error: "could not update user with new check",
                      })
                    }
                  })
                } else {
                  callback(500, { Error: "Unable to create check" })
                }
              })
            } else {
              callback(400, {
                Error: `user already reached maximum number of checks()`,
              })
            }
          } else {
            callback(403)
          }
        })
      } else {
        callback(403)
      }
    })
  } else {
    callback(400, {
      Error: "Missing required inputs, or inputs are invalid",
    })
  }
}

//checks - GET
/**
 *
 * @param {*} data
 * @param {*} callback
 *
 * Required id
 */
handlers._checks.GET = (data, callback) => {
  // Check that phone number is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false
  if (id) {
    //lookup check
    _data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        //get token from headers
        const token =
          typeof data.headers.token == "string" ? data.headers.token : false

        //verify that given token is valid and belongs to user who created check
        handlers._tokens.verifyToken(
          token,
          checkData.userPhone,
          (tokenIsValid) => {
            if (tokenIsValid) {
              callback(200, checkData)
            } else {
              callback(403, {
                Error: "Missing required token in header, or token is invalid",
              })
            }
          }
        )
      } else {
        callback(404)
      }
    })
  } else {
    callback(400, { Error: "Missing required field" })
  }
}

//checks - UPDATE
/**
 *
 * @param {*} data
 * @param {*} callback
 *
 * required id one optional value
 * optional protocol url method successCodes, timeoutSeconds
 *
 */
handlers._checks.PUT = (data, callback) => {
  //check for required field
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false

  //check for optional fields
  const protocol =
    typeof data.payload.protocol == "string" &&
    ["https", "http"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false

  const url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false

  const method =
    typeof data.payload.method == "string" &&
    ["POST", "GET", "PUT", "DELETE"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false

  const successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false

  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false

  //validate id
  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      //lookup check
      _data.read("checks", id, (err, checkData) => {
        if (!err && checkData) {
          const token =
            typeof data.headers.token == "string" ? data.headers.token : false

          //verify that given token is valid and belongs to user who created check
          handlers._tokens.verifyToken(
            token,
            checkData.userPhone,
            (tokenIsValid) => {
              if (tokenIsValid) {
                //update the check at given fields
                if (protocol) {
                  checkData.protocol = protocol
                }
                if (url) {
                  checkData.url = url
                }
                if (method) {
                  checkData.method = method
                }
                if (successCodes) {
                  checkData.successCodes = successCodes
                }
                if (timeoutSeconds) {
                  checkData.timeoutSeconds = timeoutSeconds
                }
                //store updates
                _data.update("checks", id, checkData, (err) => {
                  if (!err) {
                    callback(200)
                  } else {
                    callback(500, { Error: "could not update check" })
                  }
                })
              } else {
                callback(403)
              }
            }
          )
        } else {
          callback(404, { Error: "check id does not exist" })
        }
      })
    } else {
      callback(400, { Error: "missing fields to update" })
    }
  } else {
    callback(400, { Error: "missing required fields" })
  }
}

//checks - DELETE
/**
 *
 * @param {*} data
 * @param {*} callback
 *
 */
handlers._checks.DELETE = (data, callback) => {
  // check that phone number is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false
  if (id) {
    _data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        const token =
          typeof data.headers.token == "string" ? data.headers.token : false

        handlers._tokens.verifyToken(
          token,
          checkData.userPhone,
          (tokenIsValid) => {
            if (tokenIsValid) {
              //dlete check
              _data.delete("checks", id, () => {
                if (!err) {
                  // Lookup the user
                  _data.read("users", checkData.userPhone, (err, userData) => {
                    if (!err && userData) {
                      const userChecks =
                        typeof userData.checks == "object" &&
                        userData.checks instanceof Array
                          ? userData.checks
                          : []
                      //remove check to delete from user list of checks

                      const checkPosition = userChecks.indexOf(id)
                      if (checkPosition > -1) {
                        userChecks.splice(checkPosition, 1)
                        //resave
                        _data.update(
                          "users",
                          checkData.userPhone,
                          userData,
                          (err) => {
                            if (!err) {
                              callback(200)
                            } else {
                              callback(500, {
                                Error: "Could not update the user's check data",
                              })
                            }
                          }
                        )
                      } else {
                        callback(500, {
                          Error:
                            "could not find check on user data, did not remove",
                        })
                      }
                    } else {
                      callback(500, {
                        Error:
                          "Could not find the user, who created check to remove from user data",
                      })
                    }
                  })
                } else {
                  callback(500, { Error: "could not delete chdck data" })
                }
              })
            } else {
              callback(403)
            }
          }
        )
      } else {
        callback(400, { Error: "specifeid check id does not exist" })
      }
    })
  } else {
    callback(400, { Error: "Missing required field" })
  }
}

handlers.ping = (data, callback) => {
  callback(200)
}

handlers.notFound = (data, callback) => {
  callback(404)
}

//export the module
module.exports = handlers
