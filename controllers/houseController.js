const House = require("../models/House");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// Get house members
const getHouseMembers = async (req, res) => {
  try {
    const members = await User.findHouseMembers(req.user.houseCode);

    res.json({
      success: true,
      members,
      houseCode: req.user.houseCode,
      totalMembers: members.length,
    });
  } catch (error) {
    console.error("Get house members error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Add new member (manager only)
const addMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Data validation error",
        errors: errors.array(),
      });
    }

    const { fullName, email, phone, tempPassword } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "এই email দিয়ে আগে থেকেই account আছে",
      });
    }

    // Create new member
    const newUser = new User({
      email,
      fullName,
      phone,
      password: tempPassword,
      role: "member",
      houseCode: req.user.houseCode,
    });

    await newUser.save();

    // Add to house
    const house = await House.findOne({ houseCode: req.user.houseCode });
    if (house) {
      house.members.push(newUser._id);
      await house.save();
    }

    res.status(201).json({
      success: true,
      message: `Member সফলভাবে add হয়েছে! Temporary password: ${tempPassword}`,
      member: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        houseCode: newUser.houseCode,
      },
    });
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Delete member (manager only)
const deleteMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const memberToDelete = await User.findById(memberId);
    if (!memberToDelete) {
      return res.status(404).json({
        success: false,
        message: "Member পাওয়া যায়নি",
      });
    }

    if (memberToDelete.role === "manager") {
      return res.status(400).json({
        success: false,
        message: "Manager কে delete করা যাবে না",
      });
    }

    if (memberToDelete.houseCode !== req.user.houseCode) {
      return res.status(403).json({
        success: false,
        message: "আপনি শুধু আপনার house এর member delete করতে পারবেন",
      });
    }

    // Delete user
    await User.findByIdAndDelete(memberId);

    // Remove from house
    const house = await House.findOne({ houseCode: req.user.houseCode });
    if (house) {
      house.members = house.members.filter(
        (member) => member.toString() !== memberId
      );
      await house.save();
    }

    res.json({
      success: true,
      message: "Member সফলভাবে delete হয়েছে",
    });
  } catch (error) {
    console.error("Delete member error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

module.exports = {
  getHouseMembers,
  addMember,
  deleteMember,
};
