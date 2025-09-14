const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const House = require("../models/House");

// House code generate function
const generateHouseCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// JWT token generate
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// User response format
const formatUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  fullName: user.fullName,
  nickname: user.nickname,
  role: user.role,
  houseCode: user.houseCode,
  phone: user.phone,
  createdAt: user.createdAt,
});

// Register controller
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Data validation error",
        errors: errors.array(),
      });
    }

    const { email, fullName, phone, password, role, houseCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "এই email দিয়ে আগে থেকেই account আছে",
      });
    }

    let finalHouseCode;
    let house;

    if (role === "manager") {
      // Generate unique house code for manager
      do {
        finalHouseCode = generateHouseCode();
        house = await House.findOne({ houseCode: finalHouseCode });
      } while (house);

      // Create new house
      house = new House({
        houseCode: finalHouseCode,
        manager: null, // Will be set after user creation
        members: [],
      });
    } else {
      // Member joining existing house
      if (!houseCode) {
        return res.status(400).json({
          success: false,
          message: "Member হলে house code দিতে হবে",
        });
      }

      house = await House.findOne({ houseCode: houseCode.toUpperCase() });
      if (!house) {
        return res.status(400).json({
          success: false,
          message: "House code টি সঠিক নয়",
        });
      }
      finalHouseCode = house.houseCode;
    }

    // Create user
    const user = new User({
      email,
      fullName,
      phone,
      password,
      role,
      houseCode: finalHouseCode,
    });

    await user.save();

    // Update house
    if (role === "manager") {
      house.manager = user._id;
      house.members.push(user._id);
    } else {
      house.members.push(user._id);
    }
    await house.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: formatUserResponse(user),
      message:
        role === "manager"
          ? `House তৈরি হয়েছে! আপনার house code: ${finalHouseCode}`
          : "সফলভাবে house এ যোগ দিয়েছেন!",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Login controller
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Data validation error",
        errors: errors.array(),
      });
    }

    const { email, password, role } = req.body;

    // Find user with matching credentials
    const user = await User.findOne({ email, role, isActive: true });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email, password বা role ভুল",
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Email, password বা role ভুল",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: formatUserResponse(user),
      message: "সফলভাবে login হয়েছেন!",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      user: formatUserResponse(req.user),
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Update nickname
const updateNickname = async (req, res) => {
  try {
    const { nickname } = req.body;

    req.user.nickname = nickname || "";
    await req.user.save();

    res.json({
      success: true,
      message: "Nickname update হয়েছে!",
      user: formatUserResponse(req.user),
    });
  } catch (error) {
    console.error("Update nickname error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Data validation error",
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password to compare
    const user = await User.findById(req.user._id);
    const isCurrentPasswordCorrect = await user.comparePassword(
      currentPassword
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "বর্তমান password ভুল",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password সফলভাবে পরিবর্তন হয়েছে!",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Logout (client-side token removal, but we can add token blacklisting later)
const logout = async (req, res) => {
  try {
    // In a more advanced setup, you might want to blacklist the token
    res.json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateNickname,
  changePassword,
  logout,
};
