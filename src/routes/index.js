const express = require("express");
const routes = express.Router();

const carRouter = require("./v1/carRoute");

routes.use("/api/v1/cars", carRouter);

module.exports = routes;
