const counties = require("../etc/counties.json");

const fs = require("fs");
let log_file = fs.createWriteStream(__dirname + "/debug.log", { flags: "w" });

const nodemailer = require("nodemailer");
const axios = require("axios");

const credentials = require("../etc/credentials.json");
let mailInfo = require("../etc/mailInfo.json");

const boosters = ["Pfizer", "Moderna", "Astra Zeneca"];

let transporter = nodemailer.createTransport(credentials);

transporter.verify((err, success) => {
  if (err) {
    console.log(`Error ocurred while logging in. Error ${err}`);
  }
});

function createMailInfoText(
  county,
  address,
  noAvailable,
  noWaiting,
  boosterType
) {
  log_file.write(
    `Creating mail info for ${address} with vaccine ${
      boosters[boosterType - 1]
    }\n`
  );

  return `Localitate: ${county}\nAdresa: ${address}\nVaccin: ${
    boosters[boosterType - 1]
  }\nLocuri valabile: ${noAvailable}\nLocuri in asteptare: ${noWaiting}\n\n`;
}

async function sendMail(mailInfo) {
  let info = await transporter.sendMail(mailInfo, (err, info) => {
    if (err) {
      console.log(`Error sending message. ${err}`);
      log_file.write(`Error sending message. ${err}\n`);
    }
  });

  console.log(`Mail sent`);
  log_file.write(`Mail has been sent\n`);

  return info;
}

function parseResponse(response) {
  const content = response.content;
  let ownMessage = "";

  const currentCounty = counties.find(
    (element) => element.id === content[0].countyID
  );

  content.forEach((item) => {
    log_file.write(
      `Checking availability for ${item.address} in ${currentCounty.name}\n`
    );

    if (item.boosterID < 3) {
      if (
        currentCounty.search === "all" &&
        item.usesWaitingList &&
        item.waitingListSize < 20
      ) {
        console.log(
          `Found ${item.waitingListSize} places on the waiting list for ${currentCounty.name} in ${item.address}`
        );
        log_file.write(
          `Found ${item.waitingListSize} places on the waiting list for ${currentCounty.name} in ${item.address}\n`
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
        console.log(
          `Found ${item.availableSlots} places available list for ${currentCounty.name}`
        );
        log_file.write(
          `Found ${item.availableSlots} places available for ${currentCounty.name}\n`
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
    console.log(`Sending a mail`);
    log_file.write("Sending a mail\n");
    mailInfo.text = ownMessage;
    mailInfo.subject = `Raport locuri vaccinare pentru ${currentCounty.name}`;
    sendMail(mailInfo);
  }

  return response.last;
}

async function performRequest(countyIdValue, pageNo) {
  let currentCounty = counties.find((element) => element.id === countyIdValue);

  log_file.write(
    `Performing a request for ${currentCounty.name} with page number ${pageNo}\n`
  );

  const result = await axios({
    method: "post",
    url: "https://programare.vaccinare-covid.gov.ro/scheduling/api/centres",
    params: {
      page: pageNo,
    },
    headers: {
      Cookie: "SESSION=MzY3N2NlOGEtYjFjZC00YjUwLTk1MjMtMDFhNDE2OGRiMzUy",
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
