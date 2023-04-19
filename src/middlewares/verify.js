const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    res.status(401).json("Bạn chưa được xác thực");

  try {
    const {data} = jwt.verify(token, process.env.ACCESS_TOKEN)
    console.log("🚀 ~ file: verify.js:10 ~ verifyToken ~ decode:", data)
    req.data = data;
    next()
  } catch (error) {
    res.status(403).json("Token không hợp lệ!");
  }
}


const verifyTokenCustomer = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.data.role.includes("customer")) {
      next();
    } else {
      res.status(403).json("You're not allowed to do that!");
    }
  });
};

const verifyTokenAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.data.role.includes("admin")) {
      next();
    } else {
      res.status(403).json("You're not allowed to do that!");
    }
  });
};

const verifyTokenAllRole = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.data.role.includes("admin") || req.data.role.includes('customer')) {
      next();
    } else {
      res.status(403).json("You're not allowed to do that!");
    }
  });
};

module.exports = {
  verifyTokenAdmin,
  verifyTokenCustomer,
  verifyTokenAllRole
};
