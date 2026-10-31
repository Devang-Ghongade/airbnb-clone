
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// Routes and middleware
const authRoutes = require("./routes/auth");
const listingRoutes = require("./routes/listings");
const bookingRoutes = require("./routes/bookings");
const authenticateToken = require("./middleware/auth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes: register and login
app.use("/api/auth", authRoutes);

// Property listings routes
app.use("/api/listings", listingRoutes);

// Booking routes: create and retrieve bookings
app.use("/api/bookings", bookingRoutes);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Airbnb Clone API is running!",
  });
});

// Database health check
app.get("/api/health", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;

  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    api: "running",
    database: dbConnected ? "connected" : "disconnected",
  });
});

// Protected profile route
app.get(
  "/api/auth/profile",
  authenticateToken,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  }
);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from the environment configuration.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
