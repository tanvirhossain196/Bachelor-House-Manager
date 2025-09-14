const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  getCurrentUser,
  updateNickname,
  changePassword,
  logout,
} = require("../controllers/authController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Register route
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email চাই"),
    body("fullName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name কমপক্ষে ২ অক্ষরের হতে হবে"),
    body("phone")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Phone number সঠিক নয়"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password কমপক্ষে ৬ অক্ষরের হতে হবে"),
    body("role")
      .isIn(["manager", "member"])
      .withMessage("Role manager বা member হতে হবে"),
    body("houseCode")
      .optional()
      .isLength({ min: 8, max: 8 })
      .withMessage("House code ৮ অক্ষরের হতে হবে"),
  ],
  register
);

// Login route
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email চাই"),
    body("password").exists().withMessage("Password চাই"),
    body("role")
      .isIn(["manager", "member"])
      .withMessage("Role manager বা member হতে হবে"),
  ],
  login
);

// Get current user
router.get("/me", auth, getCurrentUser);

// Update nickname
router.put(
  "/nickname",
  auth,
  [
    body("nickname")
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage("Nickname ৫০ অক্ষরের বেশি হতে পারবে না"),
  ],
  updateNickname
);

// Change password
router.put(
  "/password",
  auth,
  [
    body("currentPassword").exists().withMessage("বর্তমান password চাই"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("নতুন password কমপক্ষে ৬ অক্ষরের হতে হবে"),
  ],
  changePassword
);

// Logout
router.post("/logout", auth, logout);

module.exports = router;
