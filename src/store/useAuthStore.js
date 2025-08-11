// store/useAuthStore.js
import { create } from "zustand";
import supabase from "../lib/supabase"; // Adjust path if needed

export const useAuthStore = create((set, get) => ({
  session: null,
  userProfile: null,
  loading: true, // Start as true to check session on load
  isAdmin: false,

  // Fetches the user's profile from the 'profiles' table
  fetchUserProfile: async (userId) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(`*`) // Select all fields from the profile
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      // Log out if profile doesn't exist (e.g., user deleted)
      get().logout();
      return;
    }

    set({
      userProfile: profile,
      isAdmin: profile.role === "Admin", // Check if the user is an admin
    });
  },

  // Handles login
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // On successful login, fetch the associated profile
    if (data.user) {
      await get().fetchUserProfile(data.user.id);
    }
    set({ session: data.session });
  },

  // Handles logout
  logout: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      userProfile: null,
      isAdmin: false,
      loading: false,
    });
  },

  // Checks for an existing session on app load
  checkSession: async () => {
    set({ loading: true });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      set({ session });
      await get().fetchUserProfile(session.user.id);
    }
    set({ loading: false });
  },

  // Update user password (for the current user)
  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },
}));
