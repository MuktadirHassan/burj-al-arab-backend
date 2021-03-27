const express = require("express");
const app = express();
const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

const MongoClient = require("mongodb").MongoClient;
const uri =
  "mongodb+srv://ghost:agentk@cluster0.nisgx.mongodb.net/db?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  console.log("Database Connection Errors:", err);
  const bookingCollection = client.db("db").collection("bookings");

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookingCollection
      .insertOne(newBooking)
      .then((result) => res.send(result.insertedCount > 0))
      .catch((err) => console.log(err));
  });
  app.get("/getBookings", (req, res) => {
    // console.log(req.headers.Authorization);
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      const idToken = req.headers.authorization.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          if (decodedToken.email == req.query.email) {
            bookingCollection
              .find({
                email: req.query.email,
              })
              .toArray((err, documents) => {
                res.send(documents);
              });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      res.status(401).send({
        code: 401,
        status: "unauthorizd access",
      });
    }
  });
});

app.listen(5000, () => console.log("Server runnig at 5000"));
