const mongoose = require("mongoose");

const adminModel = new mongoose.Schema({
  userName: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  role: {
    default: "admin",
  },
  avatar: {
    type: String,
  },
});
module.exports = mongoose.model("admin", adminModel);
