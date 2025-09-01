import React from "react";

const HeroSection = () => {
  return (
    // --- Main Container ---
    // Sets the stage: full-screen height, flex-centered content, and a beautiful background.
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1544984243-ec57ea16fe25?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center p-8 text-center text-white animate-fade-in-up">
        <div className="mb-6 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold tracking-wide text-neutral-200 backdrop-blur-md">
          The Future of Property Management 2
        </div>

        {/* --- Main Heading --- */}
        {/* Bold, impactful, with a drop-shadow for excellent readability. */}
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
          Effortless Property Management Starts Here
        </h1>

        {/* --- Sub-heading --- */}
        {/* Clear, concise, and with increased line-height for better readability. */}
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-neutral-300 md:text-xl">
          Streamline your rentals, track finances, and manage tenants with ease.
          Your all-in-one solution for landlords and property managers.
        </p>
      </div>
    </div>
  );
};

export default HeroSection;
