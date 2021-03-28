const nodemailer = require("nodemailer");
const Mail = require("nodemailer/lib/mailer");

const mailInfo = require("../etc/mail_info.json");
const credentials = require("../etc/credentials.json");
const boosters = ["Pfizer", "Moderna", "Astra Zeneca"];

let transporter = nodemailer.createTransport(credentials.mail);

transporter.verify((err) => {
  if (err) {
    throw Error(`Error ocurred while logging in to mail. Message: ${err}`);
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
  console.log(
    `Creating mail info for ${arrayInfo[0].address} with vaccine ${
      boosters[arrayInfo[0].boosterType - 1]
    }`
  );

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
      throw Error(`Error sending message. ${err}`);
    }
  });

  console.log("Mail sent");
};

module.exports = mailUtils;
