const axios = require("axios");

const credentials = require("../etc/credentials.json");
const counties = require("../etc/counties.json");

const { logMessage } = require("./logger.js");
const mongoClient = require("./db_client.js");
const mailUtils = require("./mail_utils.js");
const { createMailInfo } = require("./mail_utils.js");

const boosters = ["Pfizer", "Moderna", "Astra Zeneca"];

/**
 *
 * @param {number} countyId
 */
async function processCounty(county) {
  let pageNo = 0;
  while (true) {
    const response = await performRequest(county, pageNo);

    const content = response.content;
    mongoClient.insertIntoDb("test", "test", content);

    if (processMessage(response, county)) {
      break;
    }

    ++pageNo;
  }
}

/**
 *
 * @param {Array} content
 * @returns
 */
function processMessage(response, county) {
  const content = response.content;
  let mailMessageArray = [];

  content.forEach((item) => {
    logMessage(
      "INFO",
      `Checking availability for ${item.address} in ${county.name}`
    );

    let shouldAdd = false;

    if (item.boosterID < 3) {
      if (
        county.search === "all" &&
        item.usesWaitingList &&
        item.waitingListSize < 20
      ) {
        logMessage(
          "INFO",
          `Found ${item.waitingListSize} places on the waiting list for ${county.name} in ${item.address}`,
          true
        );
        shouldAdd = true;
      }

      if (item.availableSlots) {
        logMessage(
          "INFO",
          `Found ${item.availableSlots} places available list for ${county.name}`,
          true
        );
        shouldAdd = true;
      }

      if (shouldAdd) {
        mailMessageArray.push({
          county: item.countyName,
          address: item.address,
          boosterType: item.boosterID,
          noAvailable: item.availableSlots,
          noWaiting: item.waitingListSize,
        });
      }
    }
  });

  if (mailMessageArray.length !== 0) {
    logMessage("INFO", "Sending a mail");
    const mailInfo = createMailInfo(county.name, mailMessageArray);
    mailUtils.sendMail(mailInfo);
  }

  return response.last;
}

async function performRequest(county, pageNo) {
  logMessage(
    "INFO",
    `Performing a request for ${county.name} with page number ${pageNo}`
  );

  const result = await axios({
    method: "post",
    url: "http://localhost:3000/test",
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
      countyID: county.id,
      identificationCode: "1990503460060",
      masterPersonnelCategoryID: -4,
      personnelCategoryID: 32,
      recipientID: 5728863,
    },
  });

  return result;
}

module.exports = { processCounty };
