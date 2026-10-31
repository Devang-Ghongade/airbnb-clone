
const express = require("express");
const mongoose = require("mongoose");
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const { parseDate } = require("../utils/date");

const router = express.Router();

// GET /api/listings
// Fetch all property listings
router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Fetch listings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch property listings.",
    });
  }
});

// GET /api/listings/availability
// Return properties with capacity and availability for the requested dates.
router.get("/availability", async (req, res) => {
  try {
    const { checkIn, checkOut, guests } = req.query;

    if (!checkIn || !checkOut || guests === undefined) {
      return res.status(400).json({
        success: false,
        message: "Check-in, check-out, and guests are required.",
      });
    }

    const startDate = parseDate(checkIn);
    const endDate = parseDate(checkOut);

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message:
          "Provide valid check-in and check-out dates in YYYY-MM-DD format.",
      });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in cannot be in the past.",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out must be after check-in.",
      });
    }

    if (
      typeof guests !== "string" ||
      !/^\d+$/.test(guests) ||
      !Number.isSafeInteger(Number(guests)) ||
      Number(guests) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Guests must be a positive whole number.",
      });
    }

    const guestCount = Number(guests);
    const unavailableListingIds = await Booking.distinct("listing", {
      status: "confirmed",
      checkIn: { $lt: endDate },
      checkOut: { $gt: startDate },
    });

    const listings = await Listing.find({
      maxGuests: { $gte: guestCount },
      _id: { $nin: unavailableListingIds },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Fetch available listings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available property listings.",
    });
  }
});

// GET /api/listings/:id
// Fetch one property listing by MongoDB ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing ID.",
      });
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
      });
    }

    return res.status(200).json({
      success: true,
      listing,
    });
  } catch (error) {
    console.error("Fetch single listing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch property listing.",
    });
  }
});

module.exports = router;
