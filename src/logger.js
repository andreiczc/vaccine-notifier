const mailUtils = require("./mail_utils");

const fs = require("fs");
const path = require("path");

const specialTags = ["FOUND_PLACE", "ERROR", "SUCCESS"];

const logDirectory = __dirname.substr(0, __dirname.lastIndexOf(path.sep));
let logFile = fs.createWriteStream(`${logDirectory}${path.sep}debug.log`, {
  flags: "a",
});

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
      subject: "Eroare in sistemul de notficare pentru vaccin",
      text: formattedString,
    });
  }
}

module.exports = { logMessage };
