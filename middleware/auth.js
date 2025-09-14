const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Valid token নেই।",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token নেই।",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Token valid নয় বা user active নেই",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    res.status(401).json({
      success: false,
      message: "Token verification failed",
    });
  }
};

const requireManager = (req, res, next) => {
  if (req.user.role !== "manager") {
    return res.status(403).json({
      success: false,
      message: "শুধুমাত্র manager এই action করতে পারবেন",
    });
  }
  next();
};

const requireSameHouse = (req, res, next) => {
  const { houseCode } = req.params;

  if (houseCode && req.user.houseCode !== houseCode.toUpperCase()) {
    return res.status(403).json({
      success: false,
      message: "আপনি শুধু আপনার house এর data access করতে পারবেন",
    });
  }
  next();
};

module.exports = {
  auth,
  requireManager,
  requireSameHouse,
};
