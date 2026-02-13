const mongoose = require('mongoose');
const customerModel = new mongoose.Schema({
  userName: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  email: {
    type: String,
  },
  address: {
    type: String,
  },
  addresses: [
    {
      receiverName: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      addressLine: {
        type: String,
        required: true,
      },
      ward: {
        type: String,
        default: '',
      },
      district: {
        type: String,
        default: '',
      },
      city: {
        type: String,
        default: '',
      },
      note: {
        type: String,
        default: '',
      },
      isDefault: {
        type: Boolean,
        default: false,
      },
    },
  ],
  password: {
    type: String,
  },
  idCart: {
    type: mongoose.Types.ObjectId,
    ref: 'cart',
  },
  avatar: {
    type: String,
  },
  //lịch sử mua hàng
  listOrder: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'bill',
    },
  ],
  role: {
    type: String,
    default: 'customer',
  },
  reviewCustomer: [
    {
      idProduct: {
        type: mongoose.Types.ObjectId,
        ref: 'car',
      },
      review: {
        type: String,
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5,
      },
    },
  ],
  refreshToken: { type: String },
});

module.exports = mongoose.model('customer', customerModel);
