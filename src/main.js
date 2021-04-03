const { logMessage } = require("./logger.js");

const counties = require("../resources/counties.json");
let { processCounty } = require("./utils.js");

async function logicLoop() {
  counties.forEach(async function (item) {
    if (item.search !== "none") {
      await processCounty(item);
    }
  });

  console.log("Sleeping 15 secs");
}

async function main() {
  console.log("Starting main");
  setInterval(logicLoop, 15000);
}

main().catch((error) =>
  logMessage("ERROR", `Error escaped from main! Message: ${error}`, true, true)
);
