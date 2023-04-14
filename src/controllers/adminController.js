const adminModel = require("../models/admin");
const bcrypt = require("bcrypt");

const adminController = {
  createAdminAcc: async (req, res) => {
    try {
      const { userName, email, password } = req.body;
      const checkEmail = await adminModel.findOne(email);
      if (checkEmail) {
        return res
          .status(404)
          .json({ success: false, message: "Email already exists" });
      } else {
        const hashPassword = bcrypt.hash(password, 10);
        await adminModel.create({ userName, email, hashPassword });
        return res
          .status(200)
          .json({ success: true, message: "Register admin success" });
      }
    } catch (error) {
      res.send(error);
    }
  },
};

module.exports = adminController;
