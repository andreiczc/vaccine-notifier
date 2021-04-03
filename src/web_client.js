const loginInfo = require("../resources/credentials.json").web;
let request = require("../resources/request.json");

const { logMessage } = require("./logger");

const puppeteer = require("puppeteer");
const axios = require("axios");
const Mutex = require("async-mutex").Mutex;

const mutex = new Mutex();
let webClient = {};

let badSession = true;

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
    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    const cookies = await page.cookies();

    setTimeout(async () => await browser.close(), 60000);

    const sessionCookie = cookies.find((element) => element.name === "SESSION");

    return `${sessionCookie.name}=${sessionCookie.value}`;
  } catch (err) {
    logMessage("ERROR", "Error getting session token");

    return "";
  }
};

const sanitizeSession = async () => {
  await mutex.runExclusive(async () => {
    if (badSession) {
      request.headers.Cookie = request.headers.Cookie = await getSession();
      if (request.headers.Cookie !== "") {
        badSession = false;
        logMessage("SUCCESS", "Session reacquired");
      }
    }
  });
};

webClient.performRequest = async (county, pageNo) => {
  try {
    await sanitizeSession();

    logMessage(
      "INFO",
      `Performing a request for ${county.name} with page number ${pageNo}`
    );

    request.params.page = pageNo;
    request.data.countyID = county.id;

    const result = await axios(request);

    if (result.data.contains("<!doctype html>")) {
      throw Error("Result returned is most likely incorrect.");
    }

    return result;
  } catch (err) {
    badSession = true;

    logMessage(
      "ERROR",
      `Error performing request. Setting bad session to true\n${JSON.stringify(
        err
      )}`
    );

    return null;
  }
};

module.exports = webClient;
