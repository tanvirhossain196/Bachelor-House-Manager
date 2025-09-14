const mongoose = require("mongoose");

const mealEntrySchema = new mongoose.Schema(
  {
    houseCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    date: {
      type: Date,
      required: true,
    },
    bazarPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    meals: [
      {
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        count: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
    ],
    month: {
      type: String,
      required: true, // Format: "YYYY-MM"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

mealEntrySchema.index({ houseCode: 1, month: 1, date: -1 });

module.exports = mongoose.model("MealEntry", mealEntrySchema);
