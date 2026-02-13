const mongoose = require('mongoose');

const carReviewSchema = new mongoose.Schema(
  {
    idCustomer: {
      type: mongoose.Types.ObjectId,
      ref: 'customer',
    },
    nameCustomer: {
      type: String,
      trim: true,
    },
    review: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
  },
  {
    timestamps: true,
  },
);

const carModel = new mongoose.Schema({
  name: {
    type: String,
  },
  price: {
    type: Number,
  },
  discount: {
    type: Number,
  },

  //Giá sau khi giảm
  amountPrice: {
    type: Number,
  },
  model: {
    type: String,
  },
  company: {
    type: String,
  },
  carImage: {
    type: String,
  },
  color: {
    type: String,
  },
  description: {
    type: String,
  },

  //Số lượng còn lại
  quantity: {
    type: Number,
  },

  //Đánh giá từ khách hàng
  reviewsCustomer: [carReviewSchema],
});

module.exports = mongoose.model('car', carModel);
