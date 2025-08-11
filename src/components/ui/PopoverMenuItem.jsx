import React from "react";
import { Link, useLocation } from "react-router-dom";

const PopoverMenuItem = ({ to, icon, label, close }) => {
  const location = useLocation();
  // Check if the current URL path matches the link's destination
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={close} // Close the popover when a link is clicked
      className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors duration-200 rounded-md mx-2 ${
        isActive
          ? "bg-orange-100 text-orange-600 font-semibold"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <div className={isActive ? "text-orange-500" : "text-gray-400"}>
        {icon}
      </div>
      <span className="ml-3">{label}</span>
    </Link>
  );
};

export default PopoverMenuItem;
