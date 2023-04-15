const customerModel = require("../models/customer");
const bcrypt = require("bcrypt");
const cartModel = require("../models/cart");
const fs = require("fs");
const path = require("path");

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
  updateCustomer: async (req, res) => {
    try {
      const { id } = req.params;

      const currentCustomer = await customerModel.findById(id);
      const currentAvatarUrl = currentCustomer.avatar;

      const newAvatarUrl =
        req.file &&
        `http://localhost:${process.env.PORT}/images/${req.file.filename}`;

      const updateData = { ...req.body };
      if (newAvatarUrl) {
        updateData.avatar = newAvatarUrl;

        if (currentAvatarUrl && currentAvatarUrl !== newAvatarUrl) {
          const oldAvatarPath = path.join(
            __dirname,
            "../../public",
            currentAvatarUrl.replace(`http://localhost:${process.env.PORT}`, "")
          );
          if (fs.existsSync(oldAvatarPath)) fs.unlinkSync(oldAvatarPath);
        }
      }

      const updatedCustomer = await customerModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Update success ",
        data: updatedCustomer,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = customerController;
