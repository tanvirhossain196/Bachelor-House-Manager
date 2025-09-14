const express = require("express");
const { body, query } = require("express-validator");
const {
  getMealEntries,
  addMealEntry,
  deleteMealEntry,
  getMealStats,
} = require("../controllers/mealController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Get meal entries
router.get(
  "/",
  auth,
  [
    query("year").isInt({ min: 2020, max: 2030 }).withMessage("Valid year চাই"),
    query("month").isInt({ min: 1, max: 12 }).withMessage("Valid month চাই"),
  ],
  getMealEntries
);

// Get meal statistics
router.get(
  "/stats",
  auth,
  [
    query("year").isInt({ min: 2020, max: 2030 }).withMessage("Valid year চাই"),
    query("month").isInt({ min: 1, max: 12 }).withMessage("Valid month চাই"),
  ],
  getMealStats
);

// Add meal entry
router.post(
  "/",
  auth,
  [
    body("date").isISO8601().withMessage("Valid date চাই"),
    body("bazarPerson").isMongoId().withMessage("Valid bazar person চাই"),
    body("meals").isArray().withMessage("Meals array চাই"),
  ],
  addMealEntry
);

// Delete meal entry
router.delete("/:entryId", auth, deleteMealEntry);

module.exports = router;
