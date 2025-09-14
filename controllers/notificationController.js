const Notification = require("../models/Notification");
const User = require("../models/User");
const House = require("../models/House");
const { validationResult } = require("express-validator");

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ to: req.user._id })
      .populate("from", "fullName nickname email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications,
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification পাওয়া যায়নি",
      });
    }

    if (notification.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "আপনি এই notification access করতে পারবেন না",
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: "Notification mark as read হয়েছে",
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { to: req.user._id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: "সব notification mark as read হয়েছে",
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Send manager switch request
const sendManagerSwitchRequest = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "শুধুমাত্র manager switch request পাঠাতে পারবেন",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Data validation error",
        errors: errors.array(),
      });
    }

    const { targetMemberEmail, currentPassword } = req.body;

    // Verify current password
    const currentUser = await User.findById(req.user._id);
    const isPasswordCorrect = await currentUser.comparePassword(
      currentPassword
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password ভুল",
      });
    }

    // Find target member
    const targetMember = await User.findOne({
      email: targetMemberEmail.toLowerCase(),
      houseCode: req.user.houseCode,
      role: "member",
      isActive: true,
    });

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: "Target member পাওয়া যায়নি বা valid নয়",
      });
    }

    // Check if there's already a pending request
    const existingRequest = await Notification.findOne({
      type: "manager_request",
      from: req.user._id,
      to: targetMember._id,
      read: false,
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "এই member এর কাছে আগে থেকেই একটি request pending আছে",
      });
    }

    // Create notification
    const notification = new Notification({
      type: "manager_request",
      from: req.user._id,
      to: targetMember._id,
      title: "Manager Switch Request",
      message: `${
        req.user.nickname || req.user.fullName
      } আপনাকে Manager role switch করতে চান।`,
      houseCode: req.user.houseCode,
      data: {
        requesterId: req.user._id,
        targetId: targetMember._id,
      },
    });

    await notification.save();

    res.json({
      success: true,
      message: "Manager switch request পাঠানো হয়েছে!",
    });
  } catch (error) {
    console.error("Send manager switch request error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Handle manager switch response
const handleManagerSwitchResponse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Data validation error",
        errors: errors.array(),
      });
    }

    const { notificationId, action } = req.body;

    const notification = await Notification.findById(notificationId).populate(
      "from",
      "fullName nickname email role"
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification পাওয়া যায়নি",
      });
    }

    if (notification.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "আপনি এই notification access করতে পারবেন না",
      });
    }

    if (notification.type !== "manager_request") {
      return res.status(400).json({
        success: false,
        message: "এটি manager request notification নয়",
      });
    }

    if (action === "approve") {
      // Switch roles
      const requester = await User.findById(notification.from._id);

      if (!requester) {
        return res.status(404).json({
          success: false,
          message: "Requester পাওয়া যায়নি",
        });
      }

      // Current user becomes manager, requester becomes member
      req.user.role = "manager";
      requester.role = "member";

      await req.user.save();
      await requester.save();

      // Update house manager
      await House.findOneAndUpdate(
        { houseCode: req.user.houseCode },
        { manager: req.user._id }
      );

      // Send confirmation notification to requester
      const confirmNotification = new Notification({
        type: "manager_approved",
        from: req.user._id,
        to: notification.from._id,
        title: "Manager Switch Approved",
        message: `${
          req.user.nickname || req.user.fullName
        } manager role accept করেছেন। আপনি এখন member হয়েছেন।`,
        houseCode: req.user.houseCode,
      });

      await confirmNotification.save();

      res.json({
        success: true,
        message: "আপনি এখন Manager হয়েছেন!",
      });
    } else if (action === "reject") {
      // Send rejection notification
      const rejectNotification = new Notification({
        type: "manager_rejected",
        from: req.user._id,
        to: notification.from._id,
        title: "Manager Switch Rejected",
        message: `${
          req.user.nickname || req.user.fullName
        } manager switch request decline করেছেন।`,
        houseCode: req.user.houseCode,
      });

      await rejectNotification.save();

      res.json({
        success: true,
        message: "Manager switch request reject করা হয়েছে",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Action approve বা reject হতে হবে",
      });
    }

    // Mark original notification as read and delete
    await Notification.findByIdAndDelete(notificationId);
  } catch (error) {
    console.error("Handle manager switch response error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      to: req.user._id,
      read: false,
    });

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendManagerSwitchRequest,
  handleManagerSwitchResponse,
  getUnreadCount,
};
