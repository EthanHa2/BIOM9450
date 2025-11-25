"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  clinician_id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore user from localStorage (non-sensitive snapshot for UX only)
    const storedUser =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    // Only store non-sensitive data on client
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      // Call backend to destroy PHP session & log logout
      await fetch(
        "api/logout", // <-- change to your actual path
        {
          method: "POST",
          credentials: "include", // send PHP session cookie
        }
      );
    } catch (err) {
      console.error("Logout request failed:", err);
      // Even if backend fails, still clear client state to prevent access
    }

    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
