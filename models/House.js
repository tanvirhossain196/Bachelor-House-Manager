const mongoose = require("mongoose");

const houseSchema = new mongoose.Schema(
  {
    houseCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 8,
      maxlength: 8,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("House", houseSchema);
