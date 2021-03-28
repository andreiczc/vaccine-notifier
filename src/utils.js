const nodemailer = require("nodemailer");
const axios = require("axios");

const credentials = require("../etc/credentials.json");
let mailInfo = require("../etc/mailInfo.json");
const counties = require("../etc/counties.json");

let { logMessage } = require("./logger.js");

const boosters = ["Pfizer", "Moderna", "Astra Zeneca"];

let transporter = nodemailer.createTransport(credentials);

transporter.verify((err) => {
  if (err) {
    logMessage(
      "ERROR",
      `Error ocurred while logging in. Message: ${err}`,
      true
    );
  }
});

/**
 *
 * @param {string} county
 * @param {string} address
 * @param {number} noAvailable
 * @param {number} noWaiting
 * @param {number} boosterType
 * @returns
 */
function createMailInfoText(
  county,
  address,
  noAvailable,
  noWaiting,
  boosterType
) {
  logMessage(
    "INFO",
    `Creating mail info for ${address} with vaccine ${
      boosters[boosterType - 1]
    }`,
    true
  );

  return `Localitate: ${county}\nAdresa: ${address}\nVaccin: ${
    boosters[boosterType - 1]
  }\nLocuri valabile: ${noAvailable}\nLocuri in asteptare: ${noWaiting}\n\n`;
}

async function sendMail(mailInfo) {
  let info = await transporter.sendMail(mailInfo, (err) => {
    if (err) {
      logMessage("ERROR", `Error sending message. ${err}`, true);
    }
  });

  logMessage("INFO", "Mail sent", true);

  return info;
}

function parseResponse(response) {
  const content = response.content;
  let ownMessage = "";

  const currentCounty = counties.find(
    (element) => element.id === content[0].countyID
  );

  content.forEach((item) => {
    logMessage(
      "INFO",
      `Checking availability for ${item.address} in ${currentCounty.name}`
    );

    if (item.boosterID < 3) {
      if (
        currentCounty.search === "all" &&
        item.usesWaitingList &&
        item.waitingListSize < 20
      ) {
        logMessage(
          "INFO",
          `Found ${item.waitingListSize} places on the waiting list for ${currentCounty.name} in ${item.address}`,
          true
        );

        ownMessage += createMailInfoText(
          item.countyName,
          item.address,
          item.availableSlots,
          item.waitingListSize,
          item.boosterID
        );
      }

      if (item.availableSlots) {
        logMessage(
          "INFO",
          `Found ${item.availableSlots} places available list for ${currentCounty.name}`,
          true
        );

        ownMessage += createMailInfoText(
          item.countyName,
          item.address,
          item.availableSlots,
          item.waitingListSize,
          item.boosterID
        );
      }
    }
  });

  if (ownMessage !== "") {
    logMessage("INFO", "Sending a mail");
    mailInfo.text = ownMessage;
    mailInfo.subject = `Raport locuri vaccinare pentru ${currentCounty.name}`;
    sendMail(mailInfo);
  }

  return response.last;
}

async function performRequest(countyIdValue, pageNo) {
  let currentCounty = counties.find((element) => element.id === countyIdValue);

  logMessage(
    "INFO",
    `Performing a request for ${currentCounty.name} with page number ${pageNo}`
  );

  const result = await axios({
    method: "post",
    url: "https://programare.vaccinare-covid.gov.ro/scheduling/api/centres",
    params: {
      page: pageNo,
    },
    headers: {
      Cookie: "SESSION=NzY5ZDE4ZTItNjA1My00YTIxLWE5NjItMzYyZGM5YTFiNjFm",
      "sec-ch-ua": `"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"`,
      Accept: `application/json, text/plain, */*`,
      DNT: 1,
      "sec-ch-ua-mobile": "?0",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
      "Content-Type": "application/json",
    },
    data: {
      countyID: countyIdValue,
      identificationCode: "1990503460060",
      masterPersonnelCategoryID: -4,
      personnelCategoryID: 32,
      recipientID: 5728863,
    },
  });

  return result;
}

module.exports = { performRequest, parseResponse };
