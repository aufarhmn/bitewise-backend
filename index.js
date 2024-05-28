const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

// MIDDLEWARE
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan("dev"));

// CORS
app.use(cors());

// ROUTES
app.get("/", (req, res) => {
  res.send("BiteWise Backend");
});

// APP START
app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});