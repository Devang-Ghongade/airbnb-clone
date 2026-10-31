const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Temporary diagnostic: verify the imported Mongoose model.
console.log(
  "Middleware User model:",
  typeof User.findById,
  typeof User.findOne
);

async function authenticateToken(req, res, next) {
  try {
    // 1. Check the Authorization header.
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    // 2. Extract the token.
    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    // 3. Verify the JWT configuration.
    if (!process.env.JWT_SECRET) {
      console.error("Authentication error: JWT_SECRET is missing.");

      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured.",
      });
    }

    // 4. Verify the token signature and expiration.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // 5. Verify that the expected Mongoose method exists.
    if (typeof User.findById !== "function") {
      console.error(
        "Authentication error: User.findById is not a function."
      );

      return res.status(500).json({
        success: false,
        message: "User model configuration error.",
      });
    }

    // 6. Find the user and exclude the password field.
    const user = await User.findById(decoded.userId)
      .select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    // 7. Attach the authenticated user to the request.
    req.user = user;

    return next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          error.name === "TokenExpiredError"
            ? "Authentication token has expired. Please log in again."
            : "Invalid authentication token.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
    });
  }
}

module.exports = authenticateToken;
