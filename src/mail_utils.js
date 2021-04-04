const mailInfo = require("../resources/mail_info.json");
const loginInfo = require("../resources/credentials.json").mail;

const nodemailer = require("nodemailer");

const boosters = ["Pfizer", "Moderna", "Astra Zeneca"];

let transporter = nodemailer.createTransport(loginInfo);

transporter.verify((err) => {
  if (err) {
    console.log(
      `Error in the mailing layer. Will now proceed in killing the process.\n${JSON.stringify(
        err
      )}`
    );

    process.exit(-1);
  }
});

let mailUtils = {};

/**
 *
 * @param {string} countyName
 * @param {Array} arrayInfo
 * @returns {Mail.Options} mailInfo
 */
mailUtils.createMailInfo = (countyName, arrayInfo) => {
  mailInfo.subject = `Raport locuri vaccinare pentru ${countyName}`;
  mailInfo.text = "";

  arrayInfo.forEach((item) => {
    mailInfo.text += `Localitate: ${item.county}\nAdresa: ${
      item.address
    }\nVaccin: ${boosters[item.boosterType - 1]}\nLocuri valabile: ${
      item.noAvailable
    }\nLocuri in asteptare: ${item.noWaiting}\n\n`;
  });

  return mailInfo;
};

/**
 *
 * @param {Mail.Options} mailInfo
 */
mailUtils.sendMail = (mailInfo) => {
  transporter.sendMail(mailInfo, (err) => {
    if (err) {
      console.log(
        `Error while sending mail. Will kill the process.\nMail info: ${JSON.stringify(
          mailInfo
        )}\nError: ${JSON.stringify(err)}`
      );

      process.exit();
    }
  });
};

module.exports = mailUtils;
