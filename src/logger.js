const fs = require("fs");
let logFile = fs.createWriteStream("C:/School/etc/vax-notifier/debug.log", {
  flags: "a",
});

function logMessage(messageType, message, outputToConsole = false) {
  const date = new Date();
  const formattedString = `[${date.getDate()}.${
    date.getMonth() + 1
  }.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}.${date.getMilliseconds()}][${messageType}] - ${message}\n`;

  logFile.write(formattedString);

  if (outputToConsole) {
    console.log(formattedString);
  }
}

module.exports = { logMessage };
