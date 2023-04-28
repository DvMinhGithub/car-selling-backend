require("dotenv").config();

const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const routes = require("./src/routes");
const connectDb = require("./src/configs/db");
const app = express();

connectDb();

// Mdiddleware configuration
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  morgan("dev", {
    skip: function (req, res) { return res.statusCode < 400 }
  })
);

app.use("/", express.static("public"));

app.use(routes);

const { PORT } = process.env || 8080;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
