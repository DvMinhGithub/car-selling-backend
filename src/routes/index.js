const express = require("express");
const routes = express.Router();

const adminRouter = require("./v1/adminRoute");
const carRouter = require("./v1/carRoute");
const customerRouter = require("./v1/customerRoute");

routes.use("/api/v1/admin", adminRouter);
routes.use("/api/v1/cars", carRouter);
routes.use("/api/v1/customers", customerRouter);

module.exports = routes;
