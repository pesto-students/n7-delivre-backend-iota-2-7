// import libs
const orderid = require("order-id")("mysecret");
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const {transporter, mailOptions} = require("./Config");
const {
  isExistingUser,
  addToCollection,
  getDataFromDocument,
  handle,
  fetchById,
  updateToCollection,
  fetchVolunteerById,
} = require("./Utils");

dotenv.config({silent: process.env.NODE_ENV === "production"});

const stripe = require("stripe")(process.env.STRIPE_API_KEY);

// create app
const app = express();

// cross origin request
app.use(cors({origin: true}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// endpoints
app.post("/login", async (request, response) => {
  const body = request.body;
  console.info("Request Body", body);

  const created = new Date();

  const user = await isExistingUser(body.id, "users");

  console.info("Existing User", user);

  if (user) {
    console.info("existing user id#", user.id);
    return response.status(200).json(user);
  } else {
    const newUser = {id: body.id, name: body.name, email: body.email, created};
    const [data, err] = await handle(addToCollection("users", newUser));

    console.info("Document: ", data, "Error: ", err);

    if (!err) {
      const userInfo = await getDataFromDocument(data);
      console.info("UserInfo", userInfo);
      return response.status(200).json(userInfo);
    }

    return response.status(404).send({
      error: "unable to store",
      err,
    });
  }
});
app.post("/create-payment-intent", async (req, res) => {
  const body = req.body;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: body.price,
    currency: "inr",
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

const transport = (error, info) => {
  error ? console.log(error) : console.log(info);
};

app.post("/sendMail", (req, res) => {
  const email = req.body.receipt_email;
  transporter.sendMail(mailOptions(email), transport);
  res.send({status: 200});
});

app.get("/orders/:id", async (request, response) => {
  const id = request.params.id;
  const orders = await fetchById("orders", id, "equal");
  return response.status(200).json(orders);
});

app.post("/orders", async (request, response) => {
  const body = request.body;
  console.info("Request Body", body);

  const created = new Date().toDateString();

  const id = orderid.generate();

  const obj = Object.assign(
      {},
      body,
      {created, id, status: "Assigned"});

  console.log("Object", obj);

  const [data, err] = await handle(addToCollection("orders", obj));

  console.info("Data: ", data);

  if (data) return response.status(200).json(obj);

  return response.status(404).send({
    error: "unable to store",
    err,
  });
});
app.put("/orders", async (request, response) => {
  const body = request.body;
  console.info("Request Body", body);

  const obj = Object.assign({}, body);

  console.log("Object", obj);

  const [data, err] = await handle(updateToCollection("orders", obj));

  console.info("Data: ", data);

  if (data) return response.status(200).json(obj);

  return response.status(404).send({
    error: "unable to update",
    err,
  });
});

app.get("/travel/:id", async (request, response) => {
  const id = request.params.id;
  const travel = await fetchById("travel", id, "equal");
  return response.status(200).json(travel);
});

app.post("/travel", async (request, response) => {
  const body = request.body;
  console.info("Request Body", body);

  const created = new Date().toDateString();

  const id = orderid.generate();

  const obj = Object.assign({}, body, {created, id, status: "Active"});

  console.log("Object", obj);

  const [data, err] = await handle(addToCollection("travel", obj));

  console.info("Data: ", data);

  if (data) return response.status(200).json(obj);

  return response.status(404).send({
    error: "unable to store",
    err,
  });
});

app.get("/delivery/:id", async (request, response) => {
  const id = request.params.id;
  console.log(id);
  const orders = await fetchById("orders", id, "notequal");
  return response.status(200).json(orders);
});

app.get("/volunteer/:id", async (request, response) => {
  const id = request.params.id;
  console.info(id);
  const orders = await fetchVolunteerById("orders", id);
  return response.status(200).json(orders);
});

// export app to firebase
const api = functions
    .runWith({
    // Ensure the function has enough memory and time
    // to process large files
      timeoutSeconds: 300,
      memory: "1GB",
    })
    .https.onRequest(app);

module.exports = {api};
