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
}

//staging env
environments.staging = {
  httpPort: 4000,
  httpsPort: 4001,
  envName: "staging",
  hashingSecret: "thisIsASecret",
  maxChecks: 5,
}

//prod env
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "thisIsAProdSecret",
  maxChecks: 5,
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
