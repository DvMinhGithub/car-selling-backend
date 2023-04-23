const customerModel = require("../models/customer");
const bcrypt = require("bcrypt");
const cartModel = require("../models/cart");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const arrRefreshToken = [];
//Tạo 1 mảng chứa refreshToken để lát đối chiếu

const customerController = {
  register: async (req, res) => {
    try {
      const { userName, phoneNumber, email, address, password } = req.body;

      const checkEmail = await customerModel.findOne({ email });
      if (checkEmail) {
        return res
          .status(404)
          .json({ success: false, message: "Email đã tồn tại" });
      } else {
        const hashPassword = await bcrypt.hash(password, 10);
        const customerAcc = await customerModel.create({
          userName,
          email,
          phoneNumber,
          address,
          password: hashPassword,
        });

        //Khi tạo 1 customer mới sẽ tạo luôn 1 giỏ hàng cho customer đấy
        await cartModel.create({ idCustomer: customerAcc._id });

        return res.status(200).json({
          success: true,
          message: "Đăng ký thành công",
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
        message: "Cập nhật thành công",
        data: updatedCustomer,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await customerModel.findOne({ email });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Tên đăng nhập không tồn tại" });
      }
      const checkPassword = await bcrypt.compare(password, user.password);
      if (!checkPassword) {
        return res
          .status(404)
          .json({ success: false, message: "Mật khẩu không đúng" });
      }
      const data = await customerModel.findById(user._id).select("-password");

      const token = jwt.sign({ data }, process.env.ACCESS_TOKEN, {
        expiresIn: "20m",
      });
      const refreshToken = jwt.sign({ data }, process.env.REFRESH_TOKEN, {
        expiresIn: "24h",
      });
      arrRefreshToken.push(refreshToken);
      //Lưu refreshToken vào cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
      });

      const userData = await customerModel
        .findById(user._id)
        .select("-password");

      return res.status(200).json({ success: true, token, userData });
    } catch (error) {
      res.send(error);
    }
  },
  refreshToken: async (req, res) => {
    try {
      const refreshToken = req.cookie.refreshToken;
      //lấy token trong cookie

      if (!refreshToken) {
        return res
          .status(404)
          .json({ success: false, message: "Bạn không có quyền truy cập" });
      }
      if (!arrRefreshToken.includes(refreshToken)) {
        return res
          .status(404)
          .json({ success: false, message: "Bạn không có quyền truy cập" });
      }
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, data) => {
        if (err) {
          next(err);
        }
        arrRefreshToken = arrRefreshToken.filter(
          (token) => token !== refreshToken
        );
        // tạo ra access, refresh token mới
        const newAccessToken = jwt.sign(data, process.env.ACCESS_TOKEN, {
          expiresIn: "20m",
        });
        const newRefreshToken = jwt.sign(data, process.env.REFRESH_TOKEN, {
          expiresIn: "24h",
        });

        arrRefreshToken.push(newRefreshToken);
        // lưu refresh token ms vào cookie
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: false,
          path: "/",
          sameSite: "strict",
        });
        res.status(200).json({
          success: true,
          data: [
            {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            },
          ],
        });
      });
    } catch (error) {
      res.send(error);
    }
  },
  logOut: async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refreshToken;

      // clear cookie khi logout
      arrRefreshToken = arrRefreshToken.filter(
        (token) => token !== refreshToken
      );
      res.clearCookie("refreshToken");
      console.log(arrRefreshToken);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = customerController;
