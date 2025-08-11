"use client";

import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore"; // Adjust import path
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaBuilding,
} from "react-icons/fa";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // State for login errors

  // Get the login function from the store
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      // Navigation will be handled automatically by the App component
    } catch (err) {
      setError(err.message || "Failed to login. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
        <div className="hidden md:block absolute top-0 left-0 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse opacity-70"></div>
        <div className="hidden md:block absolute top-0 right-0 w-96 h-96 bg-red-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse opacity-70 animation-delay-2000"></div>
        <div className="hidden md:block absolute bottom-0 left-1/2 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse opacity-70 animation-delay-4000"></div>
      </div>

      {/* Hero Section (for larger screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div
          className="absolute inset-0 bg-cover bg-center overflow-hidden shadow-2xl"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1470')",
          }}
        />
      </div>

      {/* Form Section */}
      <div className="flex items-center justify-center w-full lg:w-1/2 relative z-10 md:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Login Form Card */}
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              {/* Mobile Header Icon (optional, integrated into card) */}
              <div className="mb-4 flex justify-center lg:hidden">
                {/* Changed icon background and text colors to orange/red */}
                <div className="p-3 bg-orange-100 rounded-full shadow-md">
                  <FaBuilding className="h-10 w-10 text-orange-700" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Access Your Property Management System
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-5 sm:space-y-6" onSubmit={handleLogin}>
              {/* Email Input */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    {/* Changed icon color on focus */}
                    <FaEnvelope className="h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    // Changed focus border and ring colors
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition-all duration-200 text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    {/* Changed icon color on focus */}
                    <FaLock className="h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    // Changed focus border and ring colors
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition-all duration-200 text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    // Changed hover text color
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-red-600 transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-4 w-4" />
                    ) : (
                      <FaEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  // Changed button background, hover, and focus ring colors to orange shades
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer Message */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Your property data is protected and secure 🏢</p>
          </div>
        </div>
      </div>
    </div>
  );
}
