const mongoose = require('mongoose');
const moment = require('moment-timezone');
const { APP, ORDER_STATUS } = require('#configs/constants');

const billModel = new mongoose.Schema({
  timeOrder: {
    type: Date,
    default: () => moment.tz(Date.now(), APP.TIMEZONE).toDate(),
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  idCustomer: {
    type: mongoose.Types.ObjectId,
    ref: 'customer',
    required: true,
  },
  listProduct: [
    {
      idProduct: {
        type: mongoose.Types.ObjectId,
        ref: 'car',
        required: true,
      },
      amountProduct: {
        type: Number,
        default: 1,
        min: 1,
      },
      unitPrice: {
        type: Number,
        required: true,
      },
    },
  ],
  shippingAddress: {
    type: String,
    default: '',
  },
  phoneNumber: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: ORDER_STATUS.PENDING,
    enum: Object.values(ORDER_STATUS),
  },
});

module.exports = mongoose.model('bill', billModel);
