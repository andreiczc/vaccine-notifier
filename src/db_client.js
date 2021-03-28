// eslint-disable-next-line no-unused-vars
const { MongoClient, Db, InsertOneWriteOpResult } = require("mongodb");
const unload = require("unload");

const { logMessage } = require("./logger.js");
const credentials = require("../etc/credentials.json");

const client = new MongoClient(credentials.db.uri, {
  useUnifiedTopology: true,
});

unload.add(() => {
  console.log("closing connection");
  client.close();
});

let mongoClient = {};

/**
 *
 * @param {string} dbName
 * @returns {Db} db
 */
mongoClient.getDb = async (dbName) => {
  if (!client.isConnected()) {
    await client.connect();
    logMessage("INFO", "Connected to database");
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
  let result = {};

  if (Array.isArray(data)) {
    result = await db.collection(collectionName).insertMany(data);
  } else {
    result = await db.collection(collectionName).insertOne(data);
  }

  return result;
};

/**
 *
 * @param {Db} db
 * @param {string} collectionName
 * @param {any} filter
 * @returns {any} query result
 */
mongoClient.listRecords = async (db, collectionName, filter = {}) => {
  const result = await db.collection(collectionName).find(filter).toArray();

  return result;
};

module.exports = mongoClient;
