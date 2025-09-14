const express = require("express");
const { body } = require("express-validator");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendManagerSwitchRequest,
  handleManagerSwitchResponse,
  getUnreadCount,
} = require("../controllers/notificationController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Get all notifications
router.get("/", auth, getNotifications);

// Get unread count
router.get("/unread-count", auth, getUnreadCount);

// Mark notification as read
router.put("/:notificationId/read", auth, markAsRead);

// Mark all notifications as read
router.put("/mark-all-read", auth, markAllAsRead);

// Send manager switch request
router.post(
  "/manager-switch-request",
  auth,
  [
    body("targetMemberEmail")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email চাই"),
    body("currentPassword").exists().withMessage("Current password চাই"),
  ],
  sendManagerSwitchRequest
);

// Handle manager switch response
router.post(
  "/manager-switch-response",
  auth,
  [
    body("notificationId").isMongoId().withMessage("Valid notification ID চাই"),
    body("action")
      .isIn(["approve", "reject"])
      .withMessage("Action approve বা reject হতে হবে"),
  ],
  handleManagerSwitchResponse
);

module.exports = router;
