const mailUtils = require("./mail_utils.js");

const fs = require("fs");
let logFile = fs.createWriteStream(
  "C:/School/etc/developing/vax-notifier/debug.log",
  {
    flags: "a",
  }
);

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
function logMessage(
  messageType,
  message,
  outputToConsole = false,
  notifyMail = false
) {
  const formattedString = formatLogMessage(messageType, message);

  logFile.write(formattedString);

  if (outputToConsole) {
    console.log(formattedString);
  }

  if (notifyMail) {
    mailUtils.sendMail({
      from: "noreply.projectjava@gmail.com",
      to: "andrei.r.cazacu@gmail.com, deeliam89@gmail.com",
      subject: "Eroare in sitemul de notficare pentru vaccin",
      text: formattedString,
    });
  }
}

module.exports = { logMessage };
