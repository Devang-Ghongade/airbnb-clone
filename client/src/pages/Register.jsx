
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";
import { useAuth } from "../context/useAuth";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const normalizedName = form.name.trim();
    const normalizedEmail = form.email.trim();

    if (!normalizedName || !normalizedEmail || !form.password) {
      setMessage("Name, email, and password are required.");
      return;
    }

    if (form.password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser({
        name: normalizedName,
        email: normalizedEmail,
        password: form.password,
      });

      // Save the session only when registration returns
      // both a token and user object.
      if (data.token && data.user) {
        saveSession(data);
        navigate("/");
        return;
      }

      // If registration doesn't log the user in automatically,
      // send them to login instead of pretending they're logged in.
      setMessage(
        data.message ||
          "Account created successfully. Please log in."
      );

      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      navigate("/login", {
        state: {
          message:
            data.message ||
            "Account created successfully. Please log in.",
          email: normalizedEmail,
        },
      });
    } catch (error) {
      setMessage(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create an account</h1>
        <p>Join us to discover your next stay.</p>

        <label htmlFor="name">Full name</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Enter your full name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          value={form.password}
          onChange={handleChange}
          required
        />

        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          minLength={8}
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>

        {message && (
          <p className="auth-message" role="status">
            {message}
          </p>
        )}

        <p className="auth-note">
          By signing up, you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </main>
  );
}
