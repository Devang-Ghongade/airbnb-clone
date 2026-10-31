
require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("./models/Listing");

const sampleListings = [
  {
    title: "Modern Apartment in the City",
    description:
      "A comfortable modern apartment close to restaurants and local attractions.",
    location: {
      city: "Mumbai",
      country: "India",
    },
    pricePerNight: 3500,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
    ],
    propertyType: "Apartment",
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    rating: 4.8,
    reviewCount: 124,
    hostName: "Aarav",
    isSuperhost: true,
  },
  {
    title: "Peaceful Mountain Cabin",
    description:
      "A cozy cabin surrounded by nature, ideal for a relaxing getaway.",
    location: {
      city: "Manali",
      country: "India",
    },
    pricePerNight: 4200,
    images: [
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8",
    ],
    propertyType: "Cabin",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    rating: 4.9,
    reviewCount: 86,
    hostName: "Priya",
    isSuperhost: true,
  },
  {
    title: "Luxury Villa with a Private Pool",
    description:
      "A spacious villa with a private pool for families and groups.",
    location: {
      city: "Goa",
      country: "India",
    },
    pricePerNight: 8500,
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
    ],
    propertyType: "Villa",
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 3,
    rating: 4.7,
    reviewCount: 65,
    hostName: "Rohan",
    isSuperhost: false,
  },
  {
    title: "Minimalist Studio Stay",
    description:
      "A stylish studio with a simple design and everything needed for a short stay.",
    location: {
      city: "Pune",
      country: "India",
    },
    pricePerNight: 2200,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
    ],
    propertyType: "Apartment",
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    rating: 4.6,
    reviewCount: 43,
    hostName: "Neha",
    isSuperhost: false,
  },
];

async function seedListings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully.");

    const existingCount = await Listing.countDocuments();

    if (existingCount > 0) {
      console.log(
        `Seeding skipped: ${existingCount} listing(s) already exist.`
      );
      return;
    }

    await Listing.insertMany(sampleListings);

    console.log(
      `Successfully inserted ${sampleListings.length} sample listings.`
    );
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

seedListings();
