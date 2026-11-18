import { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { registerDynamicUser } from "../data/users.js";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "imsorry_site_auth_user";

// Fixed preset accounts:
// Perru: ID "Perru", Password "12345"
// Tej (You): ID "tej", Password "12345"
export const ACCOUNTS = [
  {
    username: "Perru",
    password: "12345",
    id: "anu",
    role: "perru",
    displayName: "Perru (Aarri) 🌸",
    pfp: "/pfp/anu.svg",
    house: "Gryffindor",
    status: "approved",
    approved: true,
  },
  {
    username: "tej",
    password: "12345",
    id: "sin",
    role: "admin",
    displayName: "Tej ⚡",
    pfp: "/pfp/sin.svg",
    house: "Slytherin",
    status: "approved",
    approved: true,
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        registerDynamicUser(parsed);
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Ensure current user is in dynamic store
  useEffect(() => {
    if (user) {
      registerDynamicUser(user);
    }
  }, [user]);

  /**
   * Log in an existing user (checks preset first, then Cloud Firestore)
   */
  const login = async (usernameInput, passwordInput) => {
    const cleanUser = usernameInput?.trim().toLowerCase();
    const cleanPass = passwordInput?.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: "Please enter both ID and Password" };
    }

    // 1. Check preset accounts (Perru and Tej are pre-approved)
    const preset = ACCOUNTS.find(
      (acc) =>
        acc.username.toLowerCase() === cleanUser &&
        acc.password === cleanPass
    );

    if (preset) {
      setUser(preset);
      registerDynamicUser(preset);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(preset));
      localStorage.setItem("chat-user", preset.id);
      return { success: true, user: preset };
    }

    // 2. Query Cloud Firestore
    try {
      const userDocRef = doc(db, "users", cleanUser);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const cloudUser = userDocSnap.data();
        if (cloudUser.password === cleanPass) {
          // Check admin approval!
          if (cloudUser.status === "pending" || cloudUser.approved === false) {
            return {
              success: false,
              pending: true,
              error: "⏳ Access Pending: Your account is waiting for approval from Tej. Once approved, you can log in.",
            };
          }
          if (cloudUser.status === "rejected") {
            return {
              success: false,
              error: "❌ This account request was not approved.",
            };
          }

          // Approved! Log in normally
          setUser(cloudUser);
          registerDynamicUser(cloudUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(cloudUser));
          localStorage.setItem("chat-user", cloudUser.id);
          return { success: true, user: cloudUser };
        } else {
          return { success: false, error: "Invalid Password! Please check your credentials." };
        }
      }
    } catch (err) {
      console.warn("Firestore login check fallback:", err);
      return { success: false, error: "Cloud connection error. Please try again." };
    }

    return { success: false, error: "User ID not found. Please register first." };
  };

  /**
   * Register a new user with 'pending' status — requires Tej's approval before login
   */
  const register = async ({ username, displayName, email, password, pfp, house = "Gryffindor" }) => {
    const cleanUser = username?.trim().toLowerCase().replace(/\s+/g, "_");
    const cleanPass = password?.trim();
    const cleanName = displayName?.trim() || username?.trim();
    const cleanEmail = email?.trim().toLowerCase() || "";

    if (!cleanUser || cleanUser.length < 2) {
      return { success: false, error: "ID must be at least 2 characters" };
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address so we can notify you upon approval" };
    }
    if (!cleanPass || cleanPass.length < 3) {
      return { success: false, error: "Password must be at least 3 characters" };
    }

    // Check if reserved
    if (ACCOUNTS.some((a) => a.username.toLowerCase() === cleanUser)) {
      return { success: false, error: "This ID is reserved! Please choose another." };
    }

    try {
      const userDocRef = doc(db, "users", cleanUser);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        return { success: false, error: "This ID is already taken! Please choose another." };
      }

      const newUser = {
        id: "usr_" + cleanUser,
        username: cleanUser,
        displayName: cleanName,
        email: cleanEmail,
        password: cleanPass,
        pfp: pfp || "/pfp/guest.svg",
        house: house,
        role: "member",
        status: "pending", // Waiting for Tej's permission!
        approved: false,
        createdAt: new Date().toISOString(),
      };

      // Save to Firebase Firestore Cloud
      await setDoc(userDocRef, newUser);

      // Do NOT log in immediately!
      return { 
        success: true, 
        pending: true,
        username: cleanUser,
        message: "Account requested successfully! Please wait for Tej to approve your account." 
      };
    } catch (err) {
      console.error("Firestore register error:", err);
      return { success: false, error: "Account creation failed: " + (err.message || "Cloud connection error") };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("chat-user");
  };

  const isAdmin = Boolean(
    user && (user.role === "admin" || user.id === "sin" || user.username?.toLowerCase() === "tej")
  );

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: Boolean(user), isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
