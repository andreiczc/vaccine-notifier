// eslint-disable-next-line no-unused-vars
const credentials = require("../resources/credentials.json").db;

const { logMessage } = require("./logger");

const { MongoClient } = require("mongodb");
const unload = require("unload");

const client = new MongoClient(credentials.uri, {
  useUnifiedTopology: true,
});

unload.add(() => {
  logMessage("INFO", "DB connection closed");
  client.close();
});

let mongoClient = {};

const connectToDb = async () => {
  try {
    await client.connect();
    logMessage("INFO", "Connected to database");
  } catch (err) {
    logMessage(
      "ERROR",
      `Error connecting to DB client.\n${JSON.stringify(err)}`
    );
  }
};

/**
 *
 * @param {string} dbName
 * @returns {Db} db
 */
mongoClient.getDb = async (dbName) => {
  if (!client.isConnected()) {
    await connectToDb();
  }

  return client.db(dbName);
};

/**
 *
 * @param {Db} db
 * @param {string} collectionName
 * @param {any} data
 * @returns {any} insert results
 */
mongoClient.insertIntoDb = async (db, collectionName, data) => {
  try {
    let result = {};

    if (Array.isArray(data)) {
      result = await db.collection(collectionName).insertMany(data);
    } else {
      result = await db.collection(collectionName).insertOne(data);
    }

    return result;
  } catch (err) {
    logMessage(
      "ERROR",
      `Error inserting records into db.\n${JSON.stringify(JSON.stringify(err))}`
    );

    return null;
  }
};

/**
 *
 * @param {Db} db
 * @param {string} collectionName
 * @param {any} filter
 * @returns {any} query result
 */
mongoClient.listRecords = async (db, collectionName, filter = {}) => {
  try {
    const result = await db.collection(collectionName).find(filter).toArray();

    return result;
  } catch (err) {
    logMessage("ERROR", `Error retrieving records.\n${JSON.stringify(err)}`);
  }
};

module.exports = mongoClient;
