const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email চাই"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Valid email address চাই",
      ],
    },
    fullName: {
      type: String,
      required: [true, "Full name চাই"],
      trim: true,
      minlength: [2, "Name কমপক্ষে ২ অক্ষরের হতে হবে"],
      maxlength: [100, "Name ১০০ অক্ষরের বেশি হতে পারবে না"],
    },
    nickname: {
      type: String,
      trim: true,
      maxlength: [50, "Nickname ৫০ অক্ষরের বেশি হতে পারবে না"],
      default: "",
    },
    phone: {
      type: String,
      required: [true, "Phone number চাই"],
      trim: true,
      minlength: [10, "Phone number কমপক্ষে ১০ digit হতে হবে"],
      maxlength: [15, "Phone number ১৫ digit এর বেশি হতে পারবে না"],
    },
    password: {
      type: String,
      required: [true, "Password চাই"],
      minlength: [6, "Password কমপক্ষে ৬ অক্ষরের হতে হবে"],
    },
    role: {
      type: String,
      enum: {
        values: ["manager", "member"],
        message: "Role শুধু manager বা member হতে পারে",
      },
      required: [true, "Role চাই"],
    },
    houseCode: {
      type: String,
      required: [true, "House code চাই"],
      uppercase: true,
      minlength: [8, "House code ৮ অক্ষরের হতে হবে"],
      maxlength: [8, "House code ৮ অক্ষরের হতে হবে"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
// userSchema.index({ email: 1 });

userSchema.index({ houseCode: 1, role: 1 });
userSchema.index({ houseCode: 1, isActive: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  return await this.save();
};

// Get display name (nickname or full name)
userSchema.methods.getDisplayName = function () {
  return this.nickname || this.fullName;
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static method to find house members
userSchema.statics.findHouseMembers = function (houseCode) {
  return this.find({
    houseCode: houseCode.toUpperCase(),
    isActive: true,
  })
    .select("-password")
    .sort({ role: -1, fullName: 1 });
};

// Static method to find house manager
userSchema.statics.findHouseManager = function (houseCode) {
  return this.findOne({
    houseCode: houseCode.toUpperCase(),
    role: "manager",
    isActive: true,
  }).select("-password");
};

module.exports = mongoose.model("User", userSchema);
