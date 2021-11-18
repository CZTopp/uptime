/**
 * Libray for storing and editing data
 */
const fs = require("fs")
const path = require("path")
const helpers = require("./helpers")

const lib = {}
//base directory
lib.baseDir = path.join(__dirname, "/../.data/")
//write data
lib.create = (dir, file, data, callback) => {
  //open file for writing
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "wx",
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        //convert data to string
        const strignData = JSON.stringify(data)

        //write to file and close
        fs.writeFile(fileDescriptor, strignData, (err) => {
          if (!err) {
            fs.close(fileDescriptor, (err) => {
              if (!err) {
                callback(false)
              } else {
                callback("Error closing new file")
              }
            })
          } else {
            callback("Error writing to file")
          }
        })
      } else {
        callback("Could not create new file, it may already exists")
      }
    }
  )
}

lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir + dir + "/" + file + ".json", "utf8", (err, data) => {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObject(data)
      callback(false, parsedData)
    } else {
      callback(err, data)
    }
  })
}

lib.update = (dir, file, data, callback) => {
  //open file
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "r+",
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        const strignData = JSON.stringify(data)

        fs.ftruncate(fileDescriptor, (err) => {
          if (!err) {
            fs.writeFile(fileDescriptor, strignData, (err) => {
              if (!err) {
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callback(false)
                  } else {
                    callback("Error closing the file.")
                  }
                })
              } else {
                callback("Error writing to existitng file")
              }
            })
          } else {
            callback("Error truncating file")
          }
        })
      } else {
        callback("Could not open the file for updating. It may not exist.")
      }
    }
  )
}

lib.delete = (dir, file, callback) => {
  fs.unlink(lib.baseDir + dir + "/" + file + ".json", (err) => {
    if (!err) {
      callback(false)
    } else {
      callback("Error deleting the file.")
    }
  })
}
module.exports = lib
