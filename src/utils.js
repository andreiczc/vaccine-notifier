const { logMessage } = require("./logger");
const mongoClient = require("./db_client");
const mailUtils = require("./mail_utils");
const webClient = require("./web_client");

let lastInsertTime = {};

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
    lastPage = processMessage(responseData, county);

    await persistRecords(county, responseData.content);
  }
}

/**
 *
 * @param {string} county
 * @param {Array} records
 */
async function persistRecords(county, records) {
  const currTimeMs = Date.now();

  if (lastInsertTime[county.name]) {
    if (currTimeMs - lastInsertTime[county.name] < 15 * 60000) {
      return;
    }
  }

  const myDb = await mongoClient.getDb("vax-notifier");
  await mongoClient.insertIntoDb(myDb, county.name, records);
  lastInsertTime[county.name] = currTimeMs;

  logMessage("INFO", `Data for ${county.name} has been persisted in db.`);
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
        item.waitingListSize < 500
      ) {
        logMessage(
          "FOUND_PLACE",
          `Found ${item.waitingListSize} places on the waiting list for ${county.name} in ${item.address}`
        );
        shouldAdd = true;
      }

      if (item.availableSlots) {
        logMessage(
          "FOUND_PLACE",
          `Found ${item.availableSlots} places available for ${county.name} in ${item.address}`
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
