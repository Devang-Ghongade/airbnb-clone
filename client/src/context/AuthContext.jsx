import { useEffect, useState } from "react";
import { getUserProfile } from "../services/api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const data = await getUserProfile(token);

        if (data.success && data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
        } else {
          logout();
        }
      } catch (error) {
        if (error.status === 401) {
          logout();
        } else {
          const savedUser = localStorage.getItem("user");

          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch {
              localStorage.removeItem("user");
              setUser(null);
            }
          }
        }
      } finally {
        setAuthLoading(false);
      }
    }

    verifySession();
  }, []);

  function saveSession(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, saveSession, logout, authLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
