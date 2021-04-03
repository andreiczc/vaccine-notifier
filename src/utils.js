const { logMessage } = require("./logger");
const mongoClient = require("./db_client");
const mailUtils = require("./mail_utils");
const webClient = require("./web_client");

/**
 *
 * @param {number} countyId
 */
async function processCounty(county) {
  let lastPage = false;
  let pageNo = 0;

  while (!lastPage) {
    const response = await webClient.performRequest(county, pageNo++);
    if (!response) {
      break;
    }

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
          "FOUND_PLACE",
          `Found ${item.waitingListSize} places on the waiting list for ${county.name} in ${item.address}`,
          true
        );
        shouldAdd = true;
      }

      if (item.availableSlots) {
        logMessage(
          "FOUND_PLACE",
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
    const mailInfo = mailUtils.createMailInfo(county.name, mailMessageArray);
    mailUtils.sendMail(mailInfo);
  }

  return response.last;
}

module.exports = { processCounty };
