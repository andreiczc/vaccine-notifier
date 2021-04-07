const mailUtils = require("./mail_utils");

const fs = require("fs");
const path = require("path");

const specialTags = ["ERROR", "SUCCESS"];
const BYTES_PER_MB = 1024 ** 2;

const logDirectory =
  __dirname.substr(0, __dirname.lastIndexOf(path.sep)) +
  `${path.sep}logs${path.sep}`;

let logFile = null;

function fileExists(path) {
  try {
    fs.accessSync(path);
    return true;
  } catch (err) {
    return false;
  }
}

function checkLogFile() {
  try {
    if (!fileExists(logDirectory)) {
      fs.mkdirSync(logDirectory);
    }

    const files = fs.readdirSync(logDirectory);

    if (files.length == 0) {
      logFile = fs.createWriteStream(`${logDirectory}debug1.log`, {
        flags: "a",
      });

      return;
    }

    const lastFile = files[files.length - 1];
    const lastFileSize = fs.statSync(`${logDirectory}${lastFile}`).size;

    if (lastFileSize > 20 * BYTES_PER_MB) {
      const sequenceNumber = lastFile.substring(
        "debug".length,
        lastFile.indexOf(".log")
      );

      if (logFile) logFile.close();

      logFile = fs.createWriteStream(
        `${logDirectory}debug${parseInt(sequenceNumber) + 1}.log`,
        { flags: "a" }
      );
    } else if (!logFile) {
      logFile = fs.createWriteStream(`${logDirectory}${lastFile}`, {
        flags: "a",
      });
    }
  } catch (err) {
    console.log(`Error creating logger.\n${err}`);
  }
}

checkLogFile();
setInterval(checkLogFile, 180000);

function formatLogMessage(messageType, message) {
  const date = new Date();

  return `[${date.getDate()}.${
    date.getMonth() + 1
  }.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}.${date.getMilliseconds()}][${messageType}] - ${message}\n`;
}

/**
 *
 * @param {String} messageType
 * @param {String} message
 * @param {boolean} outputToConsole
 * @param {boolean} notifyMail
 */
function logMessage(messageType, message) {
  const formattedString = formatLogMessage(messageType, message);

  logFile.write(formattedString);

  if (specialTags.includes(messageType)) {
    console.log(formattedString);
    mailUtils.sendMail({
      from: "noreply.projectjava@gmail.com",
      to: "andrei.r.cazacu@gmail.com, deeliam89@gmail.com",
      subject: "Notificare despre sistemul de monitorizare pentru vaccinari",
      text: formattedString,
    });
  }
}

module.exports = { logMessage };
