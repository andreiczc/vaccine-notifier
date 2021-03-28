const { MongoClient, Db, InsertOneWriteOpResult } = require("mongodb");
const unload = require("unload");

const { logMessage } = require("./logger.js");
const credentials = require("../etc/credentials.json");

const client = new MongoClient(credentials.uri, { useUnifiedTopology: true });

unload.add(() => {
  console.log("closing connection");
  client.close();
});

let mongoClient = {};

/**
 *
 * @param {string} dbName
 * @returns {Db} database
 */
mongoClient.getDb = async (dbName) => {
  if (!client.isConnected()) {
    await client.connect();
    logMessage("INFO", "Connected to database", true);
  }

  return client.db(dbName);
};

/**
 *
 * @param {Db} database
 * @param {string} collectionName
 * @param {any} data
 * @returns {any} insert results
 */
mongoClient.insertIntoDb = async (database, collectionName, data) => {
  let result = {};

  if (Array.isArray(data)) {
    result = await database.collection(collectionName).insertMany(data);
  } else {
    result = await database.collection(collectionName).insertOne(data);
  }

  return result;
};

/**
 *
 * @param {Db} database
 * @param {string} collectionName
 * @param {any} filter
 * @returns {any} query result
 */
mongoClient.listRecords = async (database, collectionName, filter = {}) => {
  const result = await database
    .collection(collectionName)
    .find(filter)
    .toArray();

  return result;
};

module.exports = mongoClient;
