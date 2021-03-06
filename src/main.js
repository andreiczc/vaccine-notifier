const { logMessage } = require("./logger.js");

const counties = require("../resources/counties.json");
let { processCounty } = require("./utils.js");

async function logicLoop() {
  counties.forEach(async (item) => {
    if (item.search !== "none") {
      await processCounty(item);
    }
  });

  console.log("Sleeping 300 secs");
}

async function main() {
  console.log("Starting main");
  setInterval(logicLoop, 300000);
}

main().catch((error) =>
  logMessage(
    "ERROR",
    `Error escaped from main! Message: ${JSON.stringify(error)}`
  )
);
