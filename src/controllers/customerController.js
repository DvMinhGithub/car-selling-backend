const customerModel = require("../models/customer");
const bcrypt = require("bcrypt");
const cartModel = require("../models/cart");

const customerController = {
  register: async (req, res) => {
    try {
      const { userName, phoneNumber, email, address, password } = req.body;

      const checkEmail = await customerModel.findOne({ email });
      if (checkEmail) {
        res
          .status(404)
          .json({ success: false, message: "Email already exists" });
      } else {
        const hashPassword = bcrypt.hash(password, 10);
        const customerAcc = await customerModel.create({
          userName,
          email,
          phoneNumber,
          address,
          hashPassword,
        });

        //Khi tạo 1 customer mới sẽ tạo luôn 1 giỏ hàng cho customer đấy
        await cartModel.create({ idCustomer: customerAcc._id });
        res.status(200).json({
          success: true,
          message: "Register success",
          data: customerAcc,
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = customerController;
