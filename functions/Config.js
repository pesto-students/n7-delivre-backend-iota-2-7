// import libs
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const {createTransport} = require("nodemailer");

dotenv.config({silent: process.env.NODE_ENV === "production"});

admin.initializeApp();

const db = admin.firestore();

const sender = process.env.SENDER_EMAIL;
const password = process.env.SENDER_PASSWORD;

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: sender,
    pass: password,
  },
});

const mailOptions = (email) => {
  return {
    from: sender,
    to: email,
    subject: "Order Successful",
    html: `<div><h1>Volla!</h1> 
    <p>Thank you for choosing DELIVRE. Your order has been received. 
    We will update you with the tracking details soon.</p>
    <h3>Thank you,</h3>
    <h4>Team DELIVRE</h4>
    </div>`,
  };
};

module.exports = {db, transporter, mailOptions};
