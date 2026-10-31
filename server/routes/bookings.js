
const express = require("express");
const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Listing = require("../models/Listing");
const authenticateToken = require("../middleware/auth");
const { parseDate } = require("../utils/date");

const router = express.Router();

// Create an error with an HTTP status code.
function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// POST /api/bookings
// Create a booking for the authenticated user.
router.post("/", authenticateToken, async (req, res) => {
  let session;

  try {
    const { listingId, checkIn, checkOut, guests } = req.body;

    // Validate listing ID.
    if (
      typeof listingId !== "string" ||
      !mongoose.Types.ObjectId.isValid(listingId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid listing ID is required.",
      });
    }

    // Validate dates.
    const startDate = parseDate(checkIn);
    const endDate = parseDate(checkOut);

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message:
          "Provide valid check-in and check-out dates in YYYY-MM-DD format.",
      });
    }

    // Check that check-in is not in the past.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in cannot be in the past.",
      });
    }

    // Check that check-out is after check-in.
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out must be after check-in.",
      });
    }

    // Validate guest count.
    if (!Number.isInteger(guests) || guests < 1) {
      return res.status(400).json({
        success: false,
        message: "Guests must be a positive whole number.",
      });
    }

    // Start MongoDB transaction.
    session = await mongoose.startSession();

    let createdBooking;

    await session.withTransaction(
      async () => {
        /*
         * IMPORTANT:
         * Incrementing bookingVersion writes to the listing document.
         * Concurrent booking transactions for the same listing now
         * compete to write to this same document.
         *
         * MongoDB will abort/retry a transaction when a write conflict
         * occurs, allowing the retried transaction to check availability
         * against the latest committed bookings.
         */
        const listing = await Listing.findOneAndUpdate(
          { _id: listingId },
          { $inc: { bookingVersion: 1 } },
          {
            new: true,
            session,
          }
        );

        if (!listing) {
          throw createHttpError(404, "Property not found.");
        }

        // Check guest capacity.
        if (guests > listing.maxGuests) {
          throw createHttpError(
            400,
            `This property allows a maximum of ${listing.maxGuests} guests.`
          );
        }

        // Check for overlapping confirmed bookings.
        const conflictingBooking = await Booking.findOne({
          listing: listing._id,
          status: "confirmed",
          checkIn: { $lt: endDate },
          checkOut: { $gt: startDate },
        }).session(session);

        if (conflictingBooking) {
          throw createHttpError(
            409,
            "This property is already booked for some or all of those dates."
          );
        }

        // Calculate price on the server.
        const millisecondsPerDay = 24 * 60 * 60 * 1000;

        const nights =
          (endDate.getTime() - startDate.getTime()) /
          millisecondsPerDay;

        const pricePerNight = Number(listing.pricePerNight);

        if (
          !Number.isFinite(pricePerNight) ||
          pricePerNight < 0
        ) {
          throw createHttpError(
            500,
            "The property's price is invalid."
          );
        }

        const totalPrice = nights * pricePerNight;

        // Create booking inside the same transaction.
        const bookings = await Booking.create(
          [
            {
              user: req.user._id,
              listing: listing._id,
              checkIn: startDate,
              checkOut: endDate,
              guests,
              pricePerNight,
              totalPrice,
              status: "confirmed",
            },
          ],
          { session }
        );

        createdBooking = bookings[0];
      },
      {
        readPreference: "primary",
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      }
    );

    return res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking: createdBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Unable to create booking.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

// GET /api/bookings
// Retrieve only the authenticated user's bookings.
router.get("/", authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
    })
      .populate(
        "listing",
        "title location images pricePerNight"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve bookings.",
    });
  }
});

// PATCH /api/bookings/:id/cancel
// Cancel a booking owned by the authenticated user.
router.patch(
  "/:id/cancel",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate booking ID.
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "A valid booking ID is required.",
        });
      }

      // Find a booking belonging to this user only.
      const booking = await Booking.findOne({
        _id: id,
        user: req.user._id,
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      // Prevent repeated cancellation.
      if (booking.status === "cancelled") {
        return res.status(409).json({
          success: false,
          message: "This booking has already been cancelled.",
        });
      }

      // Update status without deleting the record.
      booking.status = "cancelled";
      await booking.save();

      return res.status(200).json({
        success: true,
        message: "Booking cancelled successfully.",
        booking,
      });
    } catch (error) {
      console.error("Cancel booking error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to cancel booking.",
      });
    }
  }
);

module.exports = router;
