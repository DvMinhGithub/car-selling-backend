require("dotenv").config();

const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const helmet = require("helmet");
const multer = require("multer");
const routes = require("./src/routes");
const connectDb = require("./src/configs/db");

connectDb()
const app = express();
app.use("/", express.static("public"));
const cookieParser = require('cookie-parser')
app.use(cookieParser())
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(routes);

const { PORT } = process.env || 8080;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
