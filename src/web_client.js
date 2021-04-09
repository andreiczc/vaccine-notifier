const loginInfo = require("../resources/credentials.json").web;
let request = require("../resources/request.json");

const { logMessage } = require("./logger");

const axios = require("axios");
const puppeteer = require("puppeteer");

const Mutex = require("async-mutex").Mutex;

const mutex = new Mutex();
let webClient = {};
let isClientReady = false;
let maxNumOfTries = 3;

const getSession = async () => {
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: loginInfo.wsEndpoint,
      defaultViewport: null,
      slowMo: Math.floor(Math.random() * 75 + 25),
    });

    const page = await browser.newPage();

    await page.goto(
      "https://programare.vaccinare-covid.gov.ro/auth/login/by-email",
      { waitUntil: "networkidle0" }
    );

    await page.type("#mat-input-0", loginInfo.username);
    await page.type("#mat-input-1", loginInfo.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.keyboard.press("Enter"),
    ]);

    const cookies = await page.cookies();

    const sessionCookie = cookies.find((element) => element.name === "SESSION");

    return `${sessionCookie.name}=${sessionCookie.value}`;
  } catch (err) {
    logMessage("ERROR", `Error getting session token.\n${JSON.stringify(err)}`);

    return "";
  }
};

const initSession = async () => {
  await mutex.runExclusive(async () => {
    if (!isClientReady) {
      request.headers.Cookie = await getSession();
      if (request.headers.Cookie !== "") {
        isClientReady = true;
        maxNumOfTries = 3;
        logMessage("SUCCESS", "Session reacquired");
      }
    }
  });
};

initSession();

webClient.performRequest = async (county, pageNo) => {
  try {
    if (!isClientReady) {
      return null;
    }

    logMessage(
      "INFO",
      `Performing a request for ${county.name} with page number ${pageNo}`
    );

    request.params.page = pageNo;
    request.data.countyID = county.id;

    const result = await axios(request);

    if (typeof result.data === "string") {
      throw Error("Exception thrown by me");
    }

    return result;
  } catch (err) {
    if (err.message.includes("Exception thrown by me")) {
      isClientReady = false;

      if (maxNumOfTries) {
        --maxNumOfTries;
        await initSession();
      } else {
        logMessage(
          "ERROR",
          "Exiting program since max number of tries has been reached"
        );
        process.exit(-1);
      }
    }

    logMessage("ERROR", `Error performing request.\n${JSON.stringify(err)}`);

    return null;
  }
};

module.exports = webClient;
