// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import supabase from "./lib/supabase.js";
import { useAuthStore } from "./store/useAuthStore.js";

// Initialize the auth state once when the app loads
useAuthStore.getState().checkSession();

// Listen for auth changes and update the store
supabase.auth.onAuthStateChange((_event, session) => {
  // We need to re-fetch the profile when the session changes
  useAuthStore.getState().checkSession();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
