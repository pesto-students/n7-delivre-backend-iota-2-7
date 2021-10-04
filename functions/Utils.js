const {db} = require("./Config");

const readData = async (collectionName) => {
  return db.collection(collectionName).get();
};

const isExistingUser = async (id, collectionName) => {
  const data = await readData(collectionName);
  let user = null;
  data.forEach((doc) => {
    console.info(doc.id, "=>", doc.data());
    console.info(doc.data().id + " " + id);

    if (doc.data().id === id) {
      console.info("found");
      user = doc.data();
    }
  });
  return user;
};

const handle = (promise) => {
  return promise
      .then((data) => [data, undefined])
      .catch((err) => Promise.resolve([undefined, err]));
};

const addToCollection = (collectionName, data) => {
  return db.collection(collectionName).add(data);
};

const updateToCollection = async (collectionName, data) => {
  let response = {};
  const snapshot = await db
      .collection(collectionName)
      .where("id", "==", data.id)
      .get();
  if (snapshot.empty) {
    console.log("No matching documents.");
    return response;
  }

  snapshot.forEach(async (doc) => {
    console.log(doc.id, "=>", doc.data());
    const updatedTime = await db
        .collection(collectionName)
        .doc(doc.id)
        .update(data);
    if (updatedTime) response = doc.data();
    console.log("Response after updating", response);
  });
  return response;
};

const getDataFromDocument = async (collectionName, ref, operator) => {
  const doc = await db.collection(collectionName).doc(ref).get();
  return doc.data();
};

const fetchById = async (collectionName, id, op) => {
  const operator = op == "equal" ? "==" : "!=";
  const snapshot = await db
      .collection(collectionName)
      .where("user", operator, id)
      .get();
  const response = [];
  if (snapshot.empty) {
    console.log("No matching documents.");
    return response;
  }

  snapshot.forEach((doc) => {
    console.log(doc.id, "=>", doc.data());
    response.push(doc.data());
  });
  return response;
};

const fetchVolunteerById = async (collectionName, id) => {
  const response = [];
  const snapshot = await db
      .collection(collectionName)
      .where("volunteer", "==", id)
      .get();
  if (snapshot.empty) {
    console.log("No matching Documents");
    return response;
  }
  snapshot.forEach((doc) => {
    console.log((doc.id, "=>", doc.data()));
    if (
      doc.data().status === "Payment" ||
      doc.data().status === "Track" ||
      doc.data().status === "Completed"
    ) {
      response.push(doc.data());
    }
  });
  return response;
};
module.exports = {
  isExistingUser,
  addToCollection,
  getDataFromDocument,
  updateToCollection,
  handle,
  fetchById,
  fetchVolunteerById,
};
