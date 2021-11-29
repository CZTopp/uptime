/**
 * create and export config variables
 *
 *
 */

const environments = {}

//development env
environments.development = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "development",
  hashingSecret: "thisIsADevSecret",
  maxChecks: 5,
  twilio: {
    accountSid: "AC089d1b34ce6100b7baeb1ee4a938d08d",
    authToken: "8b329b0be81ffc2a4118afec73f11a42",
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
    accountSid: "ACbccd8946980cf3ee86449fe70f93074b",
    authToken: "f850b32d0b43e43b65c7f7ea7763c18f",
    fromPhone: "+15105297687",
    messagingServiceSid: "MG5c52216998a792096a82a23018c018d0",
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
    accountSid: "ACbccd8946980cf3ee86449fe70f93074b",
    authToken: "8cc88ec0ec51bc14e79942d6d616d4e3",
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
