const express = require('express');
const routes = express.Router();

const adminRouter = require('./v1/admin.route');
const billRouter = require('./v1/bill.route');
const carRouter = require('./v1/car.route');
const cartRouter = require('./v1/cart.route');
const customerRouter = require('./v1/customer.route');

routes.use('/api/v1/admins', adminRouter);
routes.use('/api/v1/bills', billRouter);
routes.use('/api/v1/cars', carRouter);
routes.use('/api/v1/carts', cartRouter);
routes.use('/api/v1/customers', customerRouter);

module.exports = routes;
