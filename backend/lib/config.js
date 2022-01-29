/**
 * create and export config variables
 *
 *
 */
require("dotenv").config()

const {
  DEV_ACCOUNT_SID,
  DEV_AUTH_TOKEN,
  STG_MESSAGING_SERVICE_SID,
  STG_ACCOUNT_SID,
  STG_AUTH_TOKEN,
  PROD_ACCOUNT_SID,
  PROD_AUTH_TOKEN,
} = process.env

const environments = {}

//development env
environments.development = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "development",
  hashingSecret: "thisIsADevSecret",
  maxChecks: 5,
  twilio: {
    accountSid: DEV_ACCOUNT_SID,
    authToken: DEV_AUTH_TOKEN,
    fromPhone: "+15105297687",
  },
}

//staging env
environments.staging = {
  httpPort: 4000,
  httpsPort: 4001,
  envName: "staging",
  hashingSecret: "thisIsASecret",
  maxChecks: 5,
  twilio: {
    accountSid: STG_ACCOUNT_SID,
    authToken: STG_AUTH_TOKEN,
    fromPhone: "+15105297687",
    messagingServiceSid: STG_MESSAGING_SERVICE_SID,
  },
}

//prod env
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "thisIsAProdSecret",
  maxChecks: 5,
  twilio: {
    accountSid: PROD_ACCOUNT_SID,
    authToken: PROD_AUTH_TOKEN,
    fromPhone: "+15105297687",
  },
}

//determine which environment was passed as a command line arg
currentEnvironment =
  typeof process.env.NODE_ENV == "string"
    ? process.env.NODE_ENV.toLocaleLowerCase()
    : ""

//check if env arg is valid
exportedEnvironment =
  typeof environments[currentEnvironment] == "object"
    ? environments[currentEnvironment]
    : environments.staging

module.exports = exportedEnvironment
