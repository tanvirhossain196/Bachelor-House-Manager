const express = require("express");
const { body, query } = require("express-validator");
const {
  getExpenseEntries,
  addExpenseEntry,
  deleteExpenseEntry,
  getExpenseStats,
} = require("../controllers/expenseController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Get expense entries
router.get(
  "/",
  auth,
  [
    query("year").isInt({ min: 2020, max: 2030 }).withMessage("Valid year চাই"),
    query("month").isInt({ min: 1, max: 12 }).withMessage("Valid month চাই"),
  ],
  getExpenseEntries
);

// Get expense statistics
router.get(
  "/stats",
  auth,
  [
    query("year").isInt({ min: 2020, max: 2030 }).withMessage("Valid year চাই"),
    query("month").isInt({ min: 1, max: 12 }).withMessage("Valid month চাই"),
  ],
  getExpenseStats
);

// Add expense entry
router.post(
  "/",
  auth,
  [
    body("date").isISO8601().withMessage("Valid date চাই"),
    body("description")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Description চাই"),
    body("expenses").isArray().withMessage("Expenses array চাই"),
  ],
  addExpenseEntry
);

// Delete expense entry
router.delete("/:entryId", auth, deleteExpenseEntry);

module.exports = router;
