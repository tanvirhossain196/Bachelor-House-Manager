const { validationResult } = require("express-validator");

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }
  next();
};

// Check if user is manager
const requireManager = (req, res, next) => {
  if (req.user.role !== "manager") {
    return res.status(403).json({
      success: false,
      message: "শুধুমাত্র manager এই action করতে পারবেন",
    });
  }
  next();
};

// Check if user belongs to house
const requireSameHouse = (houseCode) => {
  return (req, res, next) => {
    if (req.user.houseCode !== houseCode) {
      return res.status(403).json({
        success: false,
        message: "আপনি শুধু আপনার house এর data access করতে পারবেন",
      });
    }
    next();
  };
};

module.exports = {
  handleValidationErrors,
  requireManager,
  requireSameHouse,
};
