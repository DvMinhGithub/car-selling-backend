const adminModel = require("../models/admin");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const adminController = {
  createAdminAcc: async (req, res) => {
    try {
      const { userName, email, password } = req.body;
      const checkEmail = await adminModel.findOne({ email });

      if (checkEmail) {
        res
          .status(404)
          .json({ success: false, message: "Email already exists" });
      } else {
        const hashPassword = bcrypt.hash(password, 10);
        await adminModel.create({ userName, email, hashPassword });
        res
          .status(200)
          .json({ success: true, message: "Register admin success" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  updateAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const currentAdmin = await adminModel.findById(id);
      const currentAvatarUrl = currentAdmin.avatar;

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

      const updatedAdmin = await adminModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      res.status(200).json({
        success: true,
        message: "Update success ",
        data: updatedAdmin,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = adminController;
