const loginInfo = require("../resources/credentials.json").web;
let request = require("../resources/request.json");

const { logMessage } = require("./logger");

const puppeteer = require("puppeteer");
const axios = require("axios");
const Mutex = require("async-mutex").Mutex;

const mutex = new Mutex();
let webClient = {};

let isClientReady = false;

const getSession = async () => {
  try {
    const browser = await puppeteer.launch();

    const page = await browser.newPage();
    await page.goto(
      "https://programare.vaccinare-covid.gov.ro/auth/login/by-email",
      {
        waitUntil: "networkidle0",
      }
    );

    await page.type("#mat-input-0", loginInfo.username);
    await page.type("#mat-input-1", loginInfo.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click(".submit-button"),
    ]);

    const cookies = await page.cookies();

    setTimeout(async () => await browser.close(), 15000);

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
      request.headers.Cookie = request.headers.Cookie = await getSession();
      if (request.headers.Cookie !== "") {
        isClientReady = true;
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
      throw Error("Session not ready");
    }

    return result;
  } catch (err) {
    isClientReady = false;
    await initSession();

    logMessage(
      "ERROR",
      `Error performing request. Client not ready\n${JSON.stringify(err)}`
    );

    return null;
  }
};

module.exports = webClient;
