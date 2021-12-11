/**
 * library for sorting and rotating logs
 */

// Dependencies
const fs = require("fs")
const path = require("path")
const zlib = require("zlib")

//container for module
const lib = {}

// base directory of the logs folder
lib.baseDir = path.join(__dirname, "/../.logs/")

//append a string to a file. create the file if it does not exist
lib.append = (file, str, callback) => {
  fs.open(`${lib.baseDir}${file}.log`, "a", (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      fs.appendFile(fileDescriptor, str + "\n", (err) => {
        if (!err) {
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              callback(false)
            } else {
              callback({ Error: "Error closing file that was being appended." })
            }
          })
        } else {
          callback({ Error: "Error appending file" })
        }
      })
    } else {
      callback({ Error: "Could not open file for appending" })
    }
  })
}

//list all the logs and optionally include compressed logs
lib.list = (includeCompressedLogs, callback) => {
  fs.readdir(lib.baseDir, (err, data) => {
    if (!err && data) {
      const trimmedFileNames = []
      data.forEach((fileName) => {
        //add .log files
        if (fileName.indexOf(".log") > -1) {
          trimmedFileNames.push(fileName.replace(".log", ""))
        }
        //add on the .gz files
        if (fileName.indexOf(".gz.b64") > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace(".gz.b64", ""))
        }
      })
      callback(false, trimmedFileNames)
    } else {
      callback(err, data)
    }
  })
}

//compress contents of one .log file in a .gz.b64 in same directory
lib.compress = (logId, newFileId, callback) => {
  const sourceFile = `${logId}.log`
  const destFile = `${newFileId}.gz.b64`

  fs.readFile(lib.baseDir + sourceFile, "utf8", (err, inputString) => {
    if (!err && inputString) {
      //comress the data
      zlib.gzip(inputString, (err, buffer) => {
        if (!err && buffer) {
          fs.open(lib.baseDir + destFile, "wx", (err, fileDescriptor) => {
            if (!err && fileDescriptor) {
              //write to file
              fs.writeFile(fileDescriptor, buffer.toString("base64"), (err) => {
                if (!err) {
                  fs.close(fileDescriptor, (err) => {
                    if (!err) {
                      callback(false)
                    } else callback(err)
                  })
                } else callback(err)
              })
            } else callback(err)
          })
        } else callback(err)
      })
    } else callback(err)
  })
}
//decompress the concts of a gz.b64 file into string
lib.decompress = (fileId, callback) => {
  const fileName = `${fileId}.gz.b64`
  fs.readFile(lib.baseDir + fileName, "utf8", (err, str) => {
    if (!err && str) {
      //dcompress data
      const inputBuffer = Buffer.frol(str, "base64")
      zlib.unzip(inputBuffer, (err, outputBuffer) => {
        if (!err && outputBuffer) {
          //callback
          const str = outputBuffer.toString()
          callback(false, str)
        } else callback(err)
      })
    } else callback(err)
  })
}

//truncate log file
lib.truncate = (logId, callback) => {
  fs.truncate(`${lib.baseDir}${logId}.log`, 0, (err) => {
    if (!err) {
      callback(false)
    } else callback(err)
  })
}

//export the module
module.exports = lib
