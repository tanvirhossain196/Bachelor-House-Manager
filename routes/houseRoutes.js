const express = require("express");
const { body } = require("express-validator");
const {
  getHouseMembers,
  addMember,
  deleteMember,
} = require("../controllers/houseController");
const { auth, requireManager } = require("../middleware/auth");

const router = express.Router();

// Get house members
router.get("/members", auth, getHouseMembers);

// Add new member (manager only)
router.post(
  "/members",
  auth,
  requireManager,
  [
    body("fullName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name কমপক্ষে ২ অক্ষরের হতে হবে"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email চাই"),
    body("phone")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Phone number সঠিক নয়"),
    body("tempPassword")
      .isLength({ min: 6 })
      .withMessage("Password কমপক্ষে ৬ অক্ষরের হতে হবে"),
  ],
  addMember
);

// Delete member (manager only)
router.delete("/members/:memberId", auth, requireManager, deleteMember);

module.exports = router;
