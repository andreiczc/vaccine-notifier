const counties = require("../etc/counties.json");
let { performRequest, parseResponse } = require("./utils.js");

async function logicLoop() {
  counties.forEach(async function (item) {
    if (item.search !== "none") {
      let pageNo = 0;
      while (true) {
        let response = await performRequest(item.id, pageNo);

        if (parseResponse(response.data)) {
          break;
        }

        ++pageNo;
      }
    }
  });

  console.log("Sleeping 15 secs");
}

async function main() {
  console.log("Starting main");
  setInterval(logicLoop, 15000);
}

main().catch((error) => console.log(error));
