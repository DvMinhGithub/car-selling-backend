const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (token) {
    const accessToken = token.split(" ")[1];
    jwt.verify(accessToken, process.env.ACCESS_TOKEN, (err, data) => {
      if (err) {
        res.status(403).json("Token is not valid!");
      }
      req.data = data;
      next();
    });
  } else {
    res.status(401).json("You're not authenticated");
  }
};


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
