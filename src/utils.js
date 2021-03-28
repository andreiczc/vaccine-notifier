const axios = require("axios");

let request = require("../etc/request.json");

const { logMessage } = require("./logger.js");
const mongoClient = require("./db_client.js");
const mailUtils = require("./mail_utils.js");
const { createMailInfo } = require("./mail_utils.js");

/**
 *
 * @param {number} countyId
 */
async function processCounty(county) {
  let lastPage = false;
  let pageNo = 0;

  while (!lastPage) {
    const response = await performRequest(county, pageNo++);
    const responseData = response.data;

    const myDb = await mongoClient.getDb("vax-notifier");
    await mongoClient.insertIntoDb(myDb, county.name, responseData.content);
    lastPage = processMessage(responseData, county);
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
        item.waitingListSize < 100
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
          `Found ${item.availableSlots} places available for ${county.name} in ${item.address}`,
          true
        );
        shouldAdd = true;
      }

      if (shouldAdd) {
        mailMessageArray.push({
          county: county.name,
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

  request.params.page = pageNo;
  request.data.countyID = county.id;

  const result = await axios(request);

  return result;
}

module.exports = { processCounty };
