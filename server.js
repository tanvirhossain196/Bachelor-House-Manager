const express = require("express");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/database");
require("dotenv").config();

const app = express();

// Database connection
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

// Middleware
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/houses", require("./routes/houseRoutes"));
app.use("/api/meals", require("./routes/mealRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// API Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Bachelor House Manager API is running!" });
});

// Serve frontend for all other routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "কিছু একটা সমস্যা হয়েছে!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server চলছে http://localhost:${PORT} এ`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
