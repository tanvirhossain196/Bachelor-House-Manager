const ExpenseEntry = require("../models/ExpenseEntry");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// Get expense entries
const getExpenseEntries = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Data validation error",
        errors: errors.array(),
      });
    }

    const { year, month } = req.query;
    const monthKey = `${year}-${month.toString().padStart(2, "0")}`;

    const expenseEntries = await ExpenseEntry.find({
      houseCode: req.user.houseCode,
      month: monthKey,
    })
      .populate("expenses.member", "fullName nickname email")
      .populate("createdBy", "fullName nickname")
      .sort({ date: -1 });

    res.json({
      success: true,
      expenseEntries,
      month: monthKey,
      totalEntries: expenseEntries.length,
    });
  } catch (error) {
    console.error("Get expense entries error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Add expense entry
const addExpenseEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Data validation error",
        errors: errors.array(),
      });
    }

    const { date, description, expenses } = req.body;

    // Create month key
    const entryDate = new Date(date);
    const monthKey = `${entryDate.getFullYear()}-${String(
      entryDate.getMonth() + 1
    ).padStart(2, "0")}`;

    // Format expenses data
    const expenseData = expenses.map((expense) => ({
      member: expense.memberId,
      amount: parseFloat(expense.amount) || 0,
    }));

    const expenseEntry = new ExpenseEntry({
      houseCode: req.user.houseCode,
      date: entryDate,
      description,
      expenses: expenseData,
      month: monthKey,
      createdBy: req.user._id,
    });

    await expenseEntry.save();

    // Populate for response
    await expenseEntry.populate("expenses.member", "fullName nickname email");
    await expenseEntry.populate("createdBy", "fullName nickname");

    res.status(201).json({
      success: true,
      message: "Expense entry সফলভাবে add হয়েছে!",
      expenseEntry,
    });
  } catch (error) {
    console.error("Add expense entry error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Delete expense entry
const deleteExpenseEntry = async (req, res) => {
  try {
    const { entryId } = req.params;

    const expenseEntry = await ExpenseEntry.findById(entryId);
    if (!expenseEntry) {
      return res.status(404).json({
        success: false,
        message: "Expense entry পাওয়া যায়নি",
      });
    }

    if (expenseEntry.houseCode !== req.user.houseCode) {
      return res.status(403).json({
        success: false,
        message: "আপনি শুধু আপনার house এর entry delete করতে পারবেন",
      });
    }

    await ExpenseEntry.findByIdAndDelete(entryId);

    res.json({
      success: true,
      message: "Expense entry সফলভাবে delete হয়েছে",
    });
  } catch (error) {
    console.error("Delete expense entry error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Get expense statistics
const getExpenseStats = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Data validation error",
        errors: errors.array(),
      });
    }

    const { year, month } = req.query;
    const monthKey = `${year}-${month.toString().padStart(2, "0")}`;

    const expenseEntries = await ExpenseEntry.find({
      houseCode: req.user.houseCode,
      month: monthKey,
    }).populate("expenses.member", "fullName nickname email");

    // Calculate statistics
    const memberStats = {};
    let totalExpenses = 0;

    expenseEntries.forEach((entry) => {
      totalExpenses += entry.totalAmount;
      entry.expenses.forEach((expense) => {
        const memberId = expense.member._id.toString();
        if (!memberStats[memberId]) {
          memberStats[memberId] = {
            member: expense.member,
            totalExpenses: 0,
          };
        }
        memberStats[memberId].totalExpenses += expense.amount;
      });
    });

    // Calculate period-specific expenses
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - today.getDay());

    const todayExpenses = expenseEntries
      .filter((entry) => entry.date.toISOString().split("T")[0] === todayStr)
      .reduce((sum, entry) => sum + entry.totalAmount, 0);

    const weekExpenses = expenseEntries
      .filter((entry) => entry.date >= weekStart)
      .reduce((sum, entry) => sum + entry.totalAmount, 0);

    res.json({
      success: true,
      stats: {
        totalExpenses,
        todayExpenses,
        weekExpenses,
        memberStats: Object.values(memberStats),
        totalEntries: expenseEntries.length,
        month: monthKey,
      },
    });
  } catch (error) {
    console.error("Get expense stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

module.exports = {
  getExpenseEntries,
  addExpenseEntry,
  deleteExpenseEntry,
  getExpenseStats,
};
