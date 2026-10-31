
const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      city: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
    },

    pricePerNight: {
      type: Number,
      required: true,
      min: 1,
    },

    images: {
      type: [String],
      required: true,
      validate: {
        validator: (images) => images.length > 0,
        message: "At least one property image is required.",
      },
    },

    propertyType: {
      type: String,
      enum: [
        "Apartment",
        "House",
        "Villa",
        "Cabin",
        "Guesthouse",
        "Other",
      ],
      default: "Other",
    },

    maxGuests: {
      type: Number,
      required: true,
      min: 1,
    },

    // Used to serialize concurrent booking transactions.
    bookingVersion: {
      type: Number,
      default: 0,
    },

    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },

    bathrooms: {
      type: Number,
      required: true,
      min: 0,
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    hostName: {
      type: String,
      required: true,
      trim: true,
    },

    isSuperhost: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Listing", listingSchema);
