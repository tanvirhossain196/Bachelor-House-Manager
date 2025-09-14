const mongoose = require("mongoose");

const expenseEntrySchema = new mongoose.Schema(
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
    description: {
      type: String,
      required: true,
      trim: true,
    },
    expenses: [
      {
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
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

expenseEntrySchema.index({ houseCode: 1, month: 1, date: -1 });

expenseEntrySchema.pre("save", function (next) {
  this.totalAmount = this.expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );
  next();
});

module.exports = mongoose.model("ExpenseEntry", expenseEntrySchema);
