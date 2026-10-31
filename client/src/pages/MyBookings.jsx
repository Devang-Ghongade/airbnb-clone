
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  getMyBookings,
  cancelBooking,
} from "../services/api";

export default function MyBookings() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      const token = localStorage.getItem("token");

      if (!token || !user) {
        if (!cancelled) {
          setError("Please log in to view your bookings.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getMyBookings(token);

        if (!cancelled) {
          setBookings(data.bookings || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load your bookings."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleCancelBooking(bookingId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setActionError("Please log in again to cancel your booking.");
      return;
    }

    try {
      setCancellingId(bookingId);
      setActionError("");
      setActionMessage("");

      await cancelBooking(bookingId, token);

      // Update the displayed status after successful cancellation.
      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: "cancelled" }
            : booking
        )
      );

      setActionMessage("Booking cancelled successfully.");
    } catch (err) {
      setActionError(
        err.message || "Unable to cancel this booking."
      );
    } finally {
      setCancellingId("");
    }
  }

  return (
    <main className="my-bookings-page">
      <div className="my-bookings-heading">
        <div>
          <h1>My bookings</h1>
          <p>
            Manage your stays and review your reservation details.
          </p>
        </div>

        <Link to="/" className="bookings-browse-link">
          Explore stays
        </Link>
      </div>

      {actionMessage && (
        <p role="status" className="booking-action-success">
          {actionMessage}
        </p>
      )}

      {actionError && (
        <p role="alert" className="booking-action-error">
          {actionError}
        </p>
      )}

      {loading ? (
        <p role="status">Loading your bookings...</p>
      ) : error ? (
        <section className="bookings-message">
          <h2>Unable to load bookings</h2>
          <p role="alert">{error}</p>
          <Link to="/login">Go to login</Link>
        </section>
      ) : bookings.length === 0 ? (
        <section className="bookings-message">
          <h2>No bookings yet</h2>
          <p>
            When you book a stay, your reservation will appear here.
          </p>
          <Link to="/">Find your next stay</Link>
        </section>
      ) : (
        <div className="my-bookings-list">
          {bookings.map((booking) => {
            const listing = booking.listing;
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);

            const formatDate = (date) =>
              date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              });

            const status = booking.status || "confirmed";
            const isCancelling = cancellingId === booking._id;

            return (
              <article
                className="my-booking-card"
                key={booking._id}
              >
                {listing?.images?.[0] ? (
                  <img
                    className="my-booking-image"
                    src={listing.images[0]}
                    alt={listing.title || "Booked property"}
                  />
                ) : (
                  <div className="my-booking-image booking-image-placeholder">
                    No image available
                  </div>
                )}

                <div className="my-booking-details">
                  <div className="my-booking-title-row">
                    <div>
                      <h2>{listing?.title || "Property"}</h2>

                      <p className="my-booking-location">
                        {listing?.location?.city || ""}
                        {listing?.location?.country
                          ? `, ${listing.location.country}`
                          : ""}
                      </p>
                    </div>

                    <span className={`booking-status ${status}`}>
                      {status}
                    </span>
                  </div>

                  <div className="my-booking-info">
                    <p>
                      <strong>Check-in</strong>
                      <span>{formatDate(checkIn)}</span>
                    </p>

                    <p>
                      <strong>Check-out</strong>
                      <span>{formatDate(checkOut)}</span>
                    </p>

                    <p>
                      <strong>Guests</strong>
                      <span>{booking.guests}</span>
                    </p>

                    <p>
                      <strong>Price per night</strong>
                      <span>
                        ₹
                        {Number(
                          booking.pricePerNight || 0
                        ).toLocaleString("en-IN")}
                      </span>
                    </p>
                  </div>

                  <div className="my-booking-footer">
                    <p>
                      <strong>Total price</strong>
                      <span>
                        ₹
                        {Number(
                          booking.totalPrice || 0
                        ).toLocaleString("en-IN")}
                      </span>
                    </p>

                    <small>Booking ID: {booking._id}</small>
                  </div>

                  {status === "confirmed" && (
                    <button
                      type="button"
                      className="cancel-booking-button"
                      onClick={() =>
                        handleCancelBooking(booking._id)
                      }
                      disabled={Boolean(cancellingId)}
                    >
                      {isCancelling
                        ? "Cancelling..."
                        : "Cancel booking"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
