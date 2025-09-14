// Helper functions

// Generate house code
const generateHouseCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Format user response
const formatUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  fullName: user.fullName,
  nickname: user.nickname,
  role: user.role,
  houseCode: user.houseCode,
  createdAt: user.createdAt,
});

// Calculate meal rate
const calculateMealRate = (totalExpenses, totalMeals) => {
  return totalMeals > 0 ? totalExpenses / totalMeals : 0;
};

// Generate month key
const generateMonthKey = (year, month) => {
  return `${year}-${String(month).padStart(2, "0")}`;
};

// Get current month key
const getCurrentMonthKey = () => {
  const now = new Date();
  return generateMonthKey(now.getFullYear(), now.getMonth() + 1);
};

// Validate date range
const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

// Format currency (Bangladeshi Taka)
const formatCurrency = (amount) => {
  return `৳${amount.toLocaleString("bn-BD")}`;
};

// Generate temporary password
const generateTempPassword = () => {
  return Math.random().toString(36).substring(2, 10);
};

module.exports = {
  generateHouseCode,
  formatUserResponse,
  calculateMealRate,
  generateMonthKey,
  getCurrentMonthKey,
  isValidDateRange,
  formatCurrency,
  generateTempPassword,
};
