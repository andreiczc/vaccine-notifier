const { MongoClient, Db, InsertOneWriteOpResult } = require("mongodb");
const unload = require("unload");

const credentials = require("./credentials.json");

const client = new MongoClient(credentials.uri, { useUnifiedTopology: true });

unload.add(() => {
  console.log("closing connection");
  client.close();
});

/**
 *
 * @param {string} dbName
 * @returns {Db} database
 */
async function getDb(dbName) {
  if (!client.isConnected()) {
    await client.connect();
  }

  return client.db(dbName);
}

/**
 *
 * @param {Db} database
 * @param {string} collectionName
 * @param {any} record
 * @returns {InsertOneWriteOpResult} insert results
 */
async function insertIntoDb(database, collectionName, record) {
  const result = await database.collection(collectionName).insertOne(record);

  return result;
}

/**
 *
 * @param {Db} database
 * @param {string} collectionName
 * @param {any} filter
 * @returns {any} query result
 */
async function listRecords(database, collectionName, filter = {}) {
  const result = await database
    .collection(collectionName)
    .find(filter)
    .toArray();

  return result;
}

module.exports = {
  getDb,
  insertIntoDb,
  listRecords,
};
