const MealEntry = require("../models/MealEntry");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// Get meal entries for a month
const getMealEntries = async (req, res) => {
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

    const mealEntries = await MealEntry.find({
      houseCode: req.user.houseCode,
      month: monthKey,
    })
      .populate("bazarPerson", "fullName nickname")
      .populate("meals.member", "fullName nickname email")
      .populate("createdBy", "fullName nickname")
      .sort({ date: -1 });

    res.json({
      success: true,
      mealEntries,
      month: monthKey,
      totalEntries: mealEntries.length,
    });
  } catch (error) {
    console.error("Get meal entries error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Add meal entry
const addMealEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Data validation error",
        errors: errors.array(),
      });
    }

    const { date, bazarPerson, meals } = req.body;

    // Create month key
    const entryDate = new Date(date);
    const monthKey = `${entryDate.getFullYear()}-${String(
      entryDate.getMonth() + 1
    ).padStart(2, "0")}`;

    // Verify bazar person is from same house
    const bazarPersonUser = await User.findOne({
      _id: bazarPerson,
      houseCode: req.user.houseCode,
      isActive: true,
    });

    if (!bazarPersonUser) {
      return res.status(400).json({
        success: false,
        message: "Bazar person আপনার house এর member নয়",
      });
    }

    // Format meals data
    const mealData = meals.map((meal) => ({
      member: meal.memberId,
      count: parseFloat(meal.count) || 0,
    }));

    const mealEntry = new MealEntry({
      houseCode: req.user.houseCode,
      date: entryDate,
      bazarPerson,
      meals: mealData,
      month: monthKey,
      createdBy: req.user._id,
    });

    await mealEntry.save();

    // Populate for response
    await mealEntry.populate("bazarPerson", "fullName nickname");
    await mealEntry.populate("meals.member", "fullName nickname email");
    await mealEntry.populate("createdBy", "fullName nickname");

    res.status(201).json({
      success: true,
      message: "Meal entry সফলভাবে add হয়েছে!",
      mealEntry,
    });
  } catch (error) {
    console.error("Add meal entry error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Delete meal entry
const deleteMealEntry = async (req, res) => {
  try {
    const { entryId } = req.params;

    const mealEntry = await MealEntry.findById(entryId);
    if (!mealEntry) {
      return res.status(404).json({
        success: false,
        message: "Meal entry পাওয়া যায়নি",
      });
    }

    if (mealEntry.houseCode !== req.user.houseCode) {
      return res.status(403).json({
        success: false,
        message: "আপনি শুধু আপনার house এর entry delete করতে পারবেন",
      });
    }

    await MealEntry.findByIdAndDelete(entryId);

    res.json({
      success: true,
      message: "Meal entry সফলভাবে delete হয়েছে",
    });
  } catch (error) {
    console.error("Delete meal entry error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

// Get meal statistics
const getMealStats = async (req, res) => {
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

    const mealEntries = await MealEntry.find({
      houseCode: req.user.houseCode,
      month: monthKey,
    }).populate("meals.member", "fullName nickname email");

    // Calculate statistics
    const memberStats = {};
    let totalMeals = 0;

    mealEntries.forEach((entry) => {
      entry.meals.forEach((meal) => {
        const memberId = meal.member._id.toString();
        if (!memberStats[memberId]) {
          memberStats[memberId] = {
            member: meal.member,
            totalMeals: 0,
          };
        }
        memberStats[memberId].totalMeals += meal.count;
        totalMeals += meal.count;
      });
    });

    res.json({
      success: true,
      stats: {
        totalMeals,
        memberStats: Object.values(memberStats),
        totalEntries: mealEntries.length,
        month: monthKey,
      },
    });
  } catch (error) {
    console.error("Get meal stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error হয়েছে",
    });
  }
};

module.exports = {
  getMealEntries,
  addMealEntry,
  deleteMealEntry,
  getMealStats,
};
