
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Routes,
  Route,
  Link,
  Outlet,
  useParams,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "./context/useAuth";

import {
  getUserProfile,
  getListings,
  getAvailableListings,
  getListingById,
  createBooking,
} from "./services/api";

import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Login from "./pages/Login";
import MyBookings from "./pages/MyBookings";

import "./App.css";

// --------------------------------------------------
// Categories
// --------------------------------------------------

const categories = [
  ["🏡", "Amazing views"],
  ["🏖️", "Beachfront"],
  ["🏊", "Amazing pools"],
  ["🌲", "Cabins"],
  ["🏕️", "Countryside"],
  ["🏰", "Castles"],
  ["⛺", "Camping"],
  ["🏙️", "Top cities"],
];

// --------------------------------------------------
// Shared Favorites Context
// --------------------------------------------------

const FavoritesContext = createContext(null);

function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("airbnb-favorites");
      const parsed = saved ? JSON.parse(saved) : [];

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Unable to load favorites:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "airbnb-favorites",
        JSON.stringify(favorites)
      );
    } catch (error) {
      console.error("Unable to save favorites:", error);
    }
  }, [favorites]);

  function toggleFavorite(id) {
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  return (
    <FavoritesContext.Provider
      value={{ favorites, toggleFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error(
      "useFavorites must be used inside FavoritesProvider."
    );
  }

  return context;
}

// --------------------------------------------------
// Shared Navigation
// --------------------------------------------------

function Navbar() {
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        airbnb
      </Link>

      <nav className="nav-center">
        <Link to="/" className="nav-option">
          Stays
        </Link>

        <button className="nav-option" type="button">
          Experiences
        </button>

        <button className="nav-option" type="button">
          Services
        </button>
      </nav>

      <div className="nav-right">
        {user && (
          <Link to="/my-bookings" className="host-button">
            My bookings
          </Link>
        )}

        <Link to="/favorites" className="host-button">
          ♥ Favorites ({favorites.length})
        </Link>

        {user ? (
          <>
            <Link to="/profile" className="host-button">
              Hi, {user.name}
            </Link>

            <button
              className="menu-button"
              type="button"
              onClick={logout}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="host-button">
              Log in
            </Link>

            <Link to="/register" className="menu-button">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

// --------------------------------------------------
// Shared Property Card
// --------------------------------------------------

function ListingCard({ listing }) {
  const { favorites, toggleFavorite } = useFavorites();

  const isFavorite = favorites.includes(listing._id);
  const detailUrl = `/listings/${listing._id}`;

  return (
    <article className="listing-card">
      <div className="listing-image-wrap">
        <Link
          to={detailUrl}
          className="listing-detail-link"
          aria-label={`View ${listing.title}`}
        >
          <img
            className="listing-image"
            src={listing.images?.[0]}
            alt={listing.title}
            loading="lazy"
          />
        </Link>

        {listing.isSuperhost && (
          <span className="guest-favorite">
            Superhost
          </span>
        )}

        <button
          className={`favorite-button ${
            isFavorite ? "saved" : ""
          }`}
          type="button"
          aria-label={
            isFavorite
              ? "Remove from favorites"
              : "Add to favorites"
          }
          aria-pressed={isFavorite}
          onClick={() => toggleFavorite(listing._id)}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="listing-info">
        <div className="listing-title-row">
          <strong>
            {listing.location?.city || "Unknown city"},{" "}
            {listing.location?.country || ""}
          </strong>

          <span>
            ★ {Number(listing.rating ?? 0).toFixed(1)}
          </span>
        </div>

        <p>
          <Link
            to={detailUrl}
            className="listing-title-link"
          >
            {listing.title}
          </Link>
        </p>

        <p>
          {listing.bedrooms} bedroom
          {listing.bedrooms === 1 ? "" : "s"} ·{" "}
          {listing.maxGuests} guests
        </p>

        <p className="listing-price">
          <strong>
            ₹
            {Number(
              listing.pricePerNight ?? 0
            ).toLocaleString("en-IN")}
          </strong>{" "}
          per night
        </p>

        <p>{listing.reviewCount ?? 0} reviews</p>
      </div>
    </article>
  );
}

// --------------------------------------------------
// Property Detail Page and Booking
// URL: /listings/:id
// --------------------------------------------------

function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { favorites, toggleFavorite } = useFavorites();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingSummary, setBookingSummary] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchListing() {
      try {
        setLoading(true);
        setError("");
        setListing(null);

        const data = await getListingById(id);

        if (!cancelled) {
          setListing(data.listing);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load this property."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchListing();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const now = new Date();

  const todayString = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="listing-detail-page">
          <p role="status">Loading property details...</p>
        </main>
      </>
    );
  }

  if (error || !listing) {
    return (
      <>
        <Navbar />
        <main className="listing-detail-page">
          <h1>Property unavailable</h1>

          <p role="alert">
            {error || "This property could not be found."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
          >
            Back to stays
          </button>
        </main>
      </>
    );
  }

  const isFavorite = favorites.includes(listing._id);
  const price = Number(listing.pricePerNight || 0);
  const rating = Number(listing.rating || 0);

  const maxGuests = Math.max(
    1,
    Number(listing.maxGuests || 1)
  );

  const images = Array.isArray(listing.images)
    ? listing.images
    : [];

  async function handleReserve(event) {
    event.preventDefault();

    setBookingMessage("");
    setBookingSummary(null);

    const token = localStorage.getItem("token");

    if (!token || !user) {
      navigate("/login");
      return;
    }

    if (bookingLoading) return;

    if (!checkIn || !checkOut) {
      setBookingMessage(
        "Please select both check-in and check-out dates."
      );
      return;
    }

    if (checkIn < todayString) {
      setBookingMessage(
        "Check-in cannot be in the past."
      );
      return;
    }

    if (checkOut <= checkIn) {
      setBookingMessage(
        "Check-out must be after check-in."
      );
      return;
    }

    const guestCount = Number(guests);

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > maxGuests
    ) {
      setBookingMessage(
        `Choose between 1 and ${maxGuests} guests.`
      );
      return;
    }

    const startDate = new Date(`${checkIn}T00:00:00Z`);
    const endDate = new Date(`${checkOut}T00:00:00Z`);

    const nights =
      (endDate.getTime() - startDate.getTime()) /
      (1000 * 60 * 60 * 24);

    if (!Number.isInteger(nights) || nights < 1) {
      setBookingMessage(
        "Please select a valid date range."
      );
      return;
    }

    try {
      setBookingLoading(true);

      const data = await createBooking(
        {
          listingId: listing._id,
          checkIn,
          checkOut,
          guests: guestCount,
        },
        token
      );

      if (!data.success || !data.booking) {
        throw new Error(
          data.message || "Unable to create your booking."
        );
      }

      const savedBooking = data.booking;

      setBookingSummary({
        id: savedBooking._id,
        checkIn,
        checkOut,
        nights,
        guests: savedBooking.guests,
        pricePerNight: savedBooking.pricePerNight,
        total: savedBooking.totalPrice,
        status: savedBooking.status,
      });

      setBookingMessage(
        data.message || "Booking created successfully."
      );
    } catch (err) {
      setBookingMessage(
        err.message || "Unable to create your booking."
      );
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <div>
      <Navbar />

      <main className="listing-detail-page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="detail-heading">
          <div>
            <h1>{listing.title}</h1>

            <p>
              ★ {rating.toFixed(1)} ·{" "}
              {listing.reviewCount ?? 0} reviews ·{" "}
              {listing.location?.city || "Unknown city"},{" "}
              {listing.location?.country || ""}
            </p>
          </div>

          <button
            type="button"
            className={`favorite-button ${
              isFavorite ? "saved" : ""
            }`}
            aria-label={
              isFavorite
                ? "Remove from favorites"
                : "Add to favorites"
            }
            aria-pressed={isFavorite}
            onClick={() => toggleFavorite(listing._id)}
          >
            {isFavorite ? "♥ Saved" : "♡ Save"}
          </button>
        </div>

        <div className="detail-gallery">
          {images.length > 0 ? (
            images.map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt={`${listing.title} — photo ${index + 1}`}
              />
            ))
          ) : (
            <p>No property photos available.</p>
          )}
        </div>

        <div className="detail-layout">
          <section className="detail-description">
            <h2>
              {listing.propertyType || "Property"} hosted by{" "}
              {listing.hostName || "Host"}
            </h2>

            <p>
              {listing.maxGuests} guests ·{" "}
              {listing.bedrooms} bedrooms ·{" "}
              {listing.bathrooms} bathrooms
            </p>

            {listing.isSuperhost && (
              <p>★ Hosted by a Superhost</p>
            )}

            <hr />

            <h2>About this place</h2>

            <p>
              {listing.description ||
                "No description is available for this property."}
            </p>

            <hr />

            <h2>Property details</h2>

            <p>
              <strong>Location:</strong>{" "}
              {listing.location?.city || "Unknown city"},{" "}
              {listing.location?.country || ""}
            </p>

            <p>
              <strong>Property type:</strong>{" "}
              {listing.propertyType || "Not specified"}
            </p>

            <p>
              <strong>Bedrooms:</strong> {listing.bedrooms ?? 0}
            </p>

            <p>
              <strong>Bathrooms:</strong> {listing.bathrooms ?? 0}
            </p>

            <p>
              <strong>Maximum guests:</strong>{" "}
              {listing.maxGuests ?? 0}
            </p>

            <p>
              <strong>Host:</strong>{" "}
              {listing.hostName || "Not specified"}
            </p>
          </section>

          <aside className="booking-card">
            <h2>
              ₹{price.toLocaleString("en-IN")}{" "}
              <span>per night</span>
            </h2>

            <p>
              ★ {rating.toFixed(1)} ·{" "}
              {listing.reviewCount ?? 0} reviews
            </p>

            <form onSubmit={handleReserve}>
              <label htmlFor="booking-checkin">Check-in</label>

              <input
                id="booking-checkin"
                type="date"
                value={checkIn}
                min={todayString}
                required
                onChange={(event) => {
                  const value = event.target.value;

                  setCheckIn(value);
                  setBookingSummary(null);
                  setBookingMessage("");

                  if (checkOut && value && checkOut <= value) {
                    setCheckOut("");
                  }
                }}
              />

              <label htmlFor="booking-checkout">Check-out</label>

              <input
                id="booking-checkout"
                type="date"
                value={checkOut}
                min={
                  checkIn
                    ? (() => {
                        const date = new Date(
                          `${checkIn}T00:00:00`
                        );

                        date.setDate(date.getDate() + 1);

                        return [
                          date.getFullYear(),
                          String(date.getMonth() + 1).padStart(2, "0"),
                          String(date.getDate()).padStart(2, "0"),
                        ].join("-");
                      })()
                    : todayString
                }
                required
                onChange={(event) => {
                  setCheckOut(event.target.value);
                  setBookingSummary(null);
                  setBookingMessage("");
                }}
              />

              <label htmlFor="booking-guests">Guests</label>

              <select
                id="booking-guests"
                value={guests}
                required
                onChange={(event) => {
                  setGuests(event.target.value);
                  setBookingSummary(null);
                  setBookingMessage("");
                }}
              >
                {Array.from(
                  { length: maxGuests },
                  (_, index) => (
                    <option
                      key={index + 1}
                      value={index + 1}
                    >
                      {index + 1}{" "}
                      {index === 0 ? "guest" : "guests"}
                    </option>
                  )
                )}
              </select>

              <button
                type="submit"
                className="reserve-button"
                disabled={bookingLoading}
              >
                {bookingLoading
                  ? "Creating booking..."
                  : "Confirm booking"}
              </button>
            </form>

            {bookingMessage && (
              <p
                className="booking-note"
                role="status"
                aria-live="polite"
              >
                {bookingMessage}
              </p>
            )}

            {bookingSummary && (
              <div
                className="booking-summary"
                aria-live="polite"
              >
                <hr />
                <h3>Booking summary</h3>

                <p>
                  <strong>Booking ID:</strong>{" "}
                  {bookingSummary.id}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {bookingSummary.status}
                </p>

                <p>
                  <strong>Check-in:</strong>{" "}
                  {bookingSummary.checkIn}
                </p>

                <p>
                  <strong>Check-out:</strong>{" "}
                  {bookingSummary.checkOut}
                </p>

                <p>
                  <strong>Guests:</strong> {bookingSummary.guests}
                </p>

                <p>
                  <strong>Duration:</strong>{" "}
                  {bookingSummary.nights}{" "}
                  {bookingSummary.nights === 1 ? "night" : "nights"}
                </p>

                <hr />

                <p>
                  ₹
                  {Number(
                    bookingSummary.pricePerNight
                  ).toLocaleString("en-IN")}{" "}
                  × {bookingSummary.nights} nights
                </p>

                <h3>
                  Total: ₹
                  {Number(
                    bookingSummary.total
                  ).toLocaleString("en-IN")}
                </h3>

                <p className="booking-note">
                  Your booking has been saved successfully.
                </p>

                <Link to="/my-bookings" className="host-button">
                  View my bookings
                </Link>
              </div>
            )}

            <hr />

            <p>
              <strong>Host:</strong>{" "}
              {listing.hostName || "Not specified"}
            </p>

            <p>
              <strong>Capacity:</strong>{" "}
              {listing.maxGuests ?? 0} guests
            </p>
          </aside>
        </div>
      </main>

      <footer className="footer">
        © 2026 StayFinder · Property details
      </footer>
    </div>
  );
}

// --------------------------------------------------
// Home Page
// --------------------------------------------------

function Home() {
  const [activeCategory, setActiveCategory] =
    useState("Amazing views");

  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState("");
  const [availabilityListings, setAvailabilityListings] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const availabilityRequestId = useRef(0);

  const [destinationInput, setDestinationInput] = useState("");
  const [checkInInput, setCheckInInput] = useState("");
  const [checkOutInput, setCheckOutInput] = useState("");
  const [guestsInput, setGuestsInput] = useState("1");
  const [appliedDestination, setAppliedDestination] = useState("");
  const [appliedGuests, setAppliedGuests] = useState(1);
  const [appliedCheckIn, setAppliedCheckIn] = useState("");
  const [appliedCheckOut, setAppliedCheckOut] = useState("");
  const [searchApplied, setSearchApplied] = useState(false);
  const [searchError, setSearchError] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  function formatSearchDate(value) {
    if (!value) return "";

    const date = new Date(`${value}T00:00:00Z`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchListings() {
      try {
        setListingsLoading(true);
        setListingsError("");

        const data = await getListings();

        if (!cancelled) {
          setListings(data.listings || []);
        }
      } catch (error) {
        if (!cancelled) {
          setListingsError(
            error.message || "Unable to load property listings."
          );
        }
      } finally {
        if (!cancelled) {
          setListingsLoading(false);
        }
      }
    }

    fetchListings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      availabilityRequestId.current += 1;
    },
    []
  );

  const listingsToFilter = availabilityListings ?? listings;
  const filteredListings = listingsToFilter.filter((listing) => {
    const city = listing.location?.city || "";
    const country = listing.location?.country || "";
    const title = listing.title || "";
    const propertyType = listing.propertyType || "";
    const description = listing.description || "";

    const searchText = appliedDestination.trim().toLowerCase();

    const matchesDestination =
      !searchText ||
      city.toLowerCase().includes(searchText) ||
      country.toLowerCase().includes(searchText) ||
      title.toLowerCase().includes(searchText);

    const matchesGuests =
      Number(listing.maxGuests || 0) >= appliedGuests;

    const getCategoryMatches = () => {
      switch (activeCategory) {
        case "Beachfront":
          return /goa|beach|coast|sea/i.test(
            `${city} ${title} ${description}`
          );

        case "Amazing pools":
          return /pool/i.test(`${title} ${description}`);

        case "Cabins":
          return propertyType === "Cabin";

        case "Countryside":
          return /cabin|countryside|rural|farm|village|mountain/i.test(
            `${title} ${city} ${description}`
          );

        case "Castles":
          return /castle|palace|fort/i.test(
            `${title} ${description}`
          );

        case "Camping":
          return /camp|tent|campsite/i.test(
            `${title} ${description} ${propertyType}`
          );

        case "Top cities":
          return /mumbai|pune|delhi|bangalore|bengaluru/i.test(city);

        case "Amazing views":
        default:
          return true;
      }
    };

    return (
      matchesDestination &&
      matchesGuests &&
      getCategoryMatches()
    );
  });
  const hasAvailabilitySearch = Boolean(
    searchApplied && appliedCheckIn && appliedCheckOut
  );

  function handleSearchValidationError(message) {
    setSearchError(message);
    setSearchApplied(false);
    setAvailabilityListings(null);
    setAvailabilityLoading(false);
    setAvailabilityError("");
    setAppliedDestination("");
    setAppliedGuests(1);
    setAppliedCheckIn("");
    setAppliedCheckOut("");
  }

  async function handleSearch(event) {
    event.preventDefault();

    const requestId = ++availabilityRequestId.current;
    setAvailabilityListings([]);
    setAvailabilityLoading(false);
    setAvailabilityError("");
    const normalizedGuests = Number(guestsInput);

    if (!Number.isInteger(normalizedGuests) || normalizedGuests < 1) {
      handleSearchValidationError("Please choose a valid guest count.");
      return;
    }

    if (Boolean(checkInInput) !== Boolean(checkOutInput)) {
      handleSearchValidationError(
        "Please select both check-in and check-out dates."
      );
      return;
    }

    if (checkInInput) {
      const selectedCheckIn = new Date(`${checkInInput}T00:00:00Z`);

      if (
        Number.isNaN(selectedCheckIn.getTime()) ||
        selectedCheckIn.toISOString().slice(0, 10) !== checkInInput
      ) {
        handleSearchValidationError("Please choose a valid check-in date.");
        return;
      }

      if (checkInInput < todayString) {
        handleSearchValidationError("Check-in cannot be in the past.");
        return;
      }
    }

    if (checkOutInput && checkInInput && checkOutInput <= checkInInput) {
      handleSearchValidationError("Check-out must be after check-in.");
      return;
    }

    setSearchError("");
    setAvailabilityError("");
    setAppliedDestination(destinationInput.trim());
    setAppliedGuests(normalizedGuests);
    setAppliedCheckIn(checkInInput);
    setAppliedCheckOut(checkOutInput);
    setSearchApplied(true);

    if (!checkInInput || !checkOutInput) {
      setAvailabilityListings(null);
      setAvailabilityLoading(false);
      return;
    }

    setAvailabilityListings([]);
    setAvailabilityLoading(true);

    try {
      const data = await getAvailableListings({
        checkIn: checkInInput,
        checkOut: checkOutInput,
        guests: normalizedGuests,
      });

      if (requestId !== availabilityRequestId.current) {
        return;
      }

      if (!data.success || !Array.isArray(data.listings)) {
        throw new Error("The availability response was invalid.");
      }

      setAvailabilityListings(data.listings);
    } catch (error) {
      if (requestId === availabilityRequestId.current) {
        setAvailabilityError(
          error.message || "Unable to search available stays."
        );
      }
    } finally {
      if (requestId === availabilityRequestId.current) {
        setAvailabilityLoading(false);
      }
    }
  }

  function resetSearch() {
    availabilityRequestId.current += 1;
    setDestinationInput("");
    setCheckInInput("");
    setCheckOutInput("");
    setGuestsInput("1");
    setAppliedDestination("");
    setAppliedGuests(1);
    setAppliedCheckIn("");
    setAppliedCheckOut("");
    setAvailabilityListings(null);
    setAvailabilityLoading(false);
    setAvailabilityError("");
    setActiveCategory("Amazing views");
    setSearchError("");
    setSearchApplied(false);
  }

  return (
    <div>
      <Navbar />

      <section className="search-section">
        <form className="search-bar" onSubmit={handleSearch}>
          <div className="search-item">
            <label htmlFor="destination">
              <strong>Where</strong>
            </label>

            <input
              id="destination"
              type="text"
              placeholder="Search destinations"
              value={destinationInput}
              onChange={(event) =>
                setDestinationInput(event.target.value)
              }
            />
          </div>

          <div className="search-item search-date-item">
            <label htmlFor="check-in">
              <strong>Check in</strong>
            </label>

            <input
              id="check-in"
              type="date"
              value={checkInInput}
              min={todayString}
              onChange={(event) => {
                const nextValue = event.target.value;
                setCheckInInput(nextValue);
                setSearchError("");

                if (checkOutInput && nextValue && checkOutInput <= nextValue) {
                  setCheckOutInput("");
                }
              }}
            />
          </div>

          <div className="search-item search-date-item">
            <label htmlFor="check-out">
              <strong>Check out</strong>
            </label>

            <input
              id="check-out"
              type="date"
              value={checkOutInput}
              min={
                checkInInput
                  ? (() => {
                      const date = new Date(`${checkInInput}T00:00:00Z`);
                      date.setUTCDate(date.getUTCDate() + 1);

                      return [
                        date.getUTCFullYear(),
                        String(date.getUTCMonth() + 1).padStart(2, "0"),
                        String(date.getUTCDate()).padStart(2, "0"),
                      ].join("-");
                    })()
                  : todayString
              }
              onChange={(event) => {
                setCheckOutInput(event.target.value);
                setSearchError("");
              }}
              disabled={!checkInInput}
            />
          </div>

          <div className="search-item guests-item">
            <div>
              <label htmlFor="guest-count">
                <strong>Who</strong>
              </label>

              <select
                id="guest-count"
                value={guestsInput}
                onChange={(event) => {
                  setGuestsInput(event.target.value);
                  setSearchError("");
                }}
              >
                {Array.from({ length: 10 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1} {index === 0 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="search-button"
              type="submit"
              aria-label="Search stays"
            >
              🔍
            </button>
          </div>
        </form>
      </section>

      <section className="category-section">
        {categories.map(([icon, name]) => (
          <button
            className={`category ${
              activeCategory === name ? "active" : ""
            }`}
            key={name}
            type="button"
            aria-pressed={activeCategory === name}
            onClick={() => setActiveCategory(name)}
          >
            <span className="category-icon">{icon}</span>
            <span>{name}</span>
          </button>
        ))}
      </section>

      <main className="listing-section">
        <div className="section-heading">
          <h1>Explore stays</h1>
          <p>Discover places for your next getaway.</p>
        </div>

        {searchError && (
          <p className="search-validation-message" role="alert">
            {searchError}
          </p>
        )}

        {searchApplied &&
          !availabilityLoading &&
          !availabilityError &&
          (hasAvailabilitySearch || (!listingsLoading && !listingsError)) && (
          <div className="search-results-summary">
            <p>
              {filteredListings.length}{" "}
              {filteredListings.length === 1 ? "stay" : "stays"} found
              {appliedDestination ? ` for "${appliedDestination}"` : ""}
              {appliedCheckIn && appliedCheckOut
                ? ` from ${formatSearchDate(appliedCheckIn)} to ${formatSearchDate(appliedCheckOut)}`
                : ""}
              {" for "}
              {appliedGuests}{" "}
              {appliedGuests === 1 ? "guest" : "guests"}.
            </p>

            <button type="button" onClick={resetSearch}>
              Clear search
            </button>
          </div>
        )}

        {availabilityLoading ? (
          <p role="status">Checking availability for your dates...</p>
        ) : availabilityError ? (
          <div>
            <p role="alert">{availabilityError}</p>
            <button type="button" onClick={resetSearch}>
              Clear search
            </button>
          </div>
        ) : listingsLoading && !hasAvailabilitySearch ? (
          <p role="status">Loading stays...</p>
        ) : listingsError && !hasAvailabilitySearch ? (
          <div>
            <p role="alert">{listingsError}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="empty-results">
            <h2>No stays found</h2>

            <p>
              {hasAvailabilitySearch
                ? "No properties are available for those dates and guest count. Try different dates, fewer guests, or another destination."
                : "Try another destination, select fewer guests, or choose another category."}
            </p>

            <button type="button" onClick={resetSearch}>
              Show all stays
            </button>
          </div>
        ) : (
          <div className="listing-grid">
            {filteredListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        © 2026 StayFinder · Demo project inspired by vacation rental platforms
      </footer>
    </div>
  );
}

// --------------------------------------------------
// Favorites Page
// --------------------------------------------------

function Favorites() {
  const { favorites } = useFavorites();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchListings() {
      try {
        setLoading(true);
        setError("");

        const data = await getListings();

        if (!cancelled) {
          setListings(data.listings || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load saved properties.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchListings();

    return () => {
      cancelled = true;
    };
  }, []);

  const savedListings = listings.filter((listing) =>
    favorites.includes(listing._id)
  );

  return (
    <div>
      <Navbar />

      <main className="listing-section">
        <div className="section-heading">
          <h1>My Favorites ♥</h1>
          <p>Your saved stays, all in one place.</p>
        </div>

        {loading ? (
          <p role="status">Loading your favorites...</p>
        ) : error ? (
          <div>
            <p role="alert">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : savedListings.length === 0 ? (
          <div className="empty-results">
            <h2>No favorites yet</h2>

            <p>
              Tap the heart on a property to save it here. Your saved
              properties will remain after a refresh.
            </p>

            <Link to="/" className="menu-button">
              Explore stays
            </Link>
          </div>
        ) : (
          <>
            <p>
              You have saved {savedListings.length}{" "}
              {savedListings.length === 1 ? "property" : "properties"}.
            </p>

            <div className="listing-grid">
              {savedListings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        © 2026 StayFinder · Your favorite stays
      </footer>
    </div>
  );
}

// --------------------------------------------------
// Profile Page
// --------------------------------------------------

function Profile() {
  const { logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      const token = localStorage.getItem("token");

      if (!token) {
        if (!cancelled) {
          setError(
            "Your session has expired. Please log in again."
          );
          setLoading(false);
        }
        return;
      }

      try {
        const data = await getUserProfile(token);

        if (!cancelled) {
          setProfile(data.user);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load your profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main
        style={{
          maxWidth: 600,
          margin: "40px auto",
          padding: 24,
        }}
      >
        <p>Loading profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          maxWidth: 600,
          margin: "40px auto",
          padding: 24,
        }}
      >
        <h1>Unable to load profile</h1>
        <p role="alert">{error}</p>

        <button type="button" onClick={logout}>
          Log out
        </button>

        <p>
          <Link to="/login">Go to login</Link>
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 600,
        margin: "40px auto",
        padding: 24,
      }}
    >
      <h1>My Profile</h1>
      <p>This page is available only to logged-in users.</p>

      <hr />

      <h2>Account Details</h2>
      <p>
        <strong>Name:</strong> {profile?.name}
      </p>
      <p>
        <strong>Email:</strong> {profile?.email}
      </p>

      <p>
        <Link to="/">Back to homepage</Link>
      </p>

      <button type="button" onClick={logout}>
        Log out
      </button>
    </main>
  );
}

// --------------------------------------------------
// App Layout and Routes
// --------------------------------------------------

function AppLayout() {
  return <Outlet />;
}

export default function App() {
  return (
    <FavoritesProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />

          <Route path="/favorites" element={<Favorites />} />

          <Route
            path="/listings/:id"
            element={<ListingDetail />}
          />

          <Route path="/register" element={<Register />} />

          <Route path="/login" element={<Login />} />

          {/* Protected routes use Outlet-based ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-bookings" element={<MyBookings />} />
          </Route>

          <Route
            path="*"
            element={
              <main
                style={{
                  textAlign: "center",
                  padding: 40,
                }}
              >
                <h1>Page not found</h1>
                <Link to="/">Back to homepage</Link>
              </main>
            }
          />
        </Route>
      </Routes>
    </FavoritesProvider>
  );
}
