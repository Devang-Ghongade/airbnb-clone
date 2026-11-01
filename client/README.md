# Airbnb Clone — Property Rental and Booking Platform

A full-stack property rental and booking web application inspired by Airbnb. The application allows users to explore property listings, search for accommodation, manage favorites, and create and manage reservations.

## Features

- **Property Listings:** Browse properties and view detailed information.
- **Destination Search:** Search for properties by destination.
- **Guest Filtering:** Filter properties based on guest capacity.
- **Availability Search:** Search for properties using check-in and check-out dates.
- **User Authentication:** Register, log in, and access protected pages.
- **Favorites:** Save and remove favorite properties.
- **Booking Management:** Create bookings, view booking history, and cancel reservations.
- **Booking Validation:** Validate dates, guest capacity, and booking conflicts.
- **Responsive UI:** Interface designed for desktop and mobile screens.

## Technology Stack

### Frontend
- React
- Vite
- React Router
- Context API
- JavaScript
- CSS

### Backend
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
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── App.css
├── server/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── index.js
│   └── seedListings.js
└── .gitignore
```

## Prerequisites

- Node.js and npm
- MongoDB Atlas account or a compatible MongoDB deployment
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd airbnb-clone
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the actual repository URL.

### 2. Configure and start the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
```

Use your own database connection string and a strong, unique JWT secret. Never commit environment files or credentials to GitHub.

Start the backend:

```bash
npm run dev
```

### 3. Configure and start the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Available Scripts

### Frontend (`client/`)

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Generate the production build |
| `npm run preview` | Preview the production build |

### Backend (`server/`)

Use the scripts defined in `server/package.json`. The development server can be started using `npm run dev` if configured.

## Security Considerations

- Keep environment variables and credentials out of version control.
- Passwords are hashed before storage.
- Protected endpoints require authentication.
- Booking prices are calculated by the backend.
- Confirmed bookings are checked for overlapping dates.

## Project Status

The application has been developed and tested locally. The frontend lint and production build have completed successfully.

Production deployment and hosting configuration must be verified separately.

## License

No license has been specified yet.
