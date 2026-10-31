
const API_BASE_URL = "http://localhost:5000/api";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.message || "Something went wrong."
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

// Register a new user
export const registerUser = (userData) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });

// Log in an existing user
export const loginUser = (credentials) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

// Fetch the logged-in user's profile
export const getUserProfile = (token) =>
  apiRequest("/auth/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// Fetch property listings from MongoDB
export const getListings = () =>
  apiRequest("/listings");

// Fetch properties available for the requested dates and guest count.
export const getAvailableListings = ({ checkIn, checkOut, guests }) => {
  const params = new URLSearchParams({
    checkIn,
    checkOut,
    guests: String(guests),
  });

  return apiRequest(`/listings/availability?${params}`);
};

// Fetch one property by ID
export const getListingById = (id) =>
  apiRequest(`/listings/${id}`);

// Create a booking for the authenticated user
export const createBooking = (bookingData, token) =>
  apiRequest("/bookings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(bookingData),
  });

// Fetch bookings for the authenticated user
export const getMyBookings = (token) =>
  apiRequest("/bookings", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });


 // Cancel a booking for the authenticated user
export const cancelBooking = (id, token) =>
  apiRequest(`/bookings/${id}/cancel`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
