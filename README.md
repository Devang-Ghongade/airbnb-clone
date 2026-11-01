# Airbnb Clone — Property Rental and Booking Platform

A full-stack property rental and booking web application inspired by Airbnb. Users can explore property listings, search based on travel dates and guest capacity, manage favorites, and book available properties.

## Features

### User Features
- User registration and login.
- JWT-based authentication.
- Browse property listings.
- View detailed property information.
- Search properties by destination, check-in/check-out dates, and guest count.
- Add and remove properties from favorites.
- Create and view bookings.
- Cancel existing bookings.
- Manage user profile.
- Protected routes for authenticated users.

### Booking and Availability
- Server-side booking validation.
- Automatic booking price calculation.
- Prevention of overlapping confirmed bookings.
- Availability-based property search.
- Booking cancellation and rebooking support.

## Technology Stack

**Frontend**
- React
- Vite
- JavaScript
- React Router
- Context API
- CSS

**Backend**
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs

## Project Structure

```text
airbnb-clone/
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
├── server/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── utils/
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js
- npm
- MongoDB Atlas account or MongoDB instance
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd airbnb-clone
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret_key
```

### 3. Start the Backend

```bash
npm run dev
```

The backend runs at:

`http://localhost:5000`

### 4. Install Frontend Dependencies

Open a second terminal:

```bash
cd client
npm install
```

### 5. Start the Frontend

```bash
npm run dev
```

The frontend runs at:

`http://localhost:5173`

## Development Commands

### Frontend

```bash
npm run dev
npm run lint
npm run build
```

### Backend

```bash
npm run dev
```

## Security Considerations

- Passwords are hashed using bcryptjs.
- Authentication uses JWT.
- Environment variables are used for sensitive configuration.
- Booking validation and pricing are handled by the backend.
- Environment files and dependencies are excluded from version control.

## Project Status

The core frontend and backend functionality has been implemented, including authentication, property listings, favorites, availability search, and booking management.

Further improvements may include deployment, additional security hardening, and expanded automated testing.

---

**Project Name:** Airbnb Clone  
**Project Type:** Full-Stack Web Application  
**Purpose:** Property Rental and Booking Platform