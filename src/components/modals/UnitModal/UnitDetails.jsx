// src/components/pages/units/UnitDetails.jsx

import { useState } from "react";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  ShareIcon,
  CheckCircleIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";

const UnitDetails = ({ unit, onBack, onEdit, onDelete }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // No longer need to combine features here

  const images =
    unit.unit_images && unit.unit_images.length > 0
      ? unit.unit_images
      : ["https://placehold.co/800x600.png?text=No+Image+Available"]; // Fallback image

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Property Details
            </h2>
            <p className="text-sm text-gray-500">
              View and manage property information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(unit)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <PencilSquareIcon className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => onDelete(unit)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700"
          >
            <TrashIcon className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        {/* Image Carousel */}
        <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden group mb-6">
          <img
            src={images[currentImageIndex]}
            alt={`${unit.name} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-800" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-800" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? "bg-white" : "bg-white/50"
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Info Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{unit.name}</h1>
          <div className="flex items-center gap-2 text-gray-500 mt-2">
            <MapPinIcon className="h-5 w-5" />
            <span>{unit.properties?.property_name || "Unknown Location"}</span>
          </div>
        </div>

        {/* Key Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-4">
            <ArrowsPointingOutIcon className="h-8 w-8 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-xl font-semibold">{unit.sqm || 0} sqm</p>
              <p className="text-sm text-gray-500">Area</p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-4">
            <BuildingOfficeIcon className="h-8 w-8 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-xl font-semibold">
                {unit.unit_types?.unit_type || "N/A"}
              </p>
              <p className="text-sm text-gray-500">Property Type</p>
            </div>
          </div>
        </div>

        {/* ▼▼▼ REPLACEMENT SECTION START ▼▼▼ */}
        {/* --- Features (from Facilities) --- */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Features</h3>
          {unit.facilities && unit.facilities.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-gray-800 mt-4">
              {unit.facilities.map((facility) => (
                <div key={facility} className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{facility}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 px-4 py-6 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">
                No specific features have been listed for this unit.
              </p>
            </div>
          )}
        </div>

        {/* --- Amenities (from Utilities) --- */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">
            Amenities
          </h3>
          {unit.utilities && unit.utilities.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-gray-800 mt-4">
              {unit.utilities.map((utility) => (
                <div key={utility} className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{utility}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 px-4 py-6 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">
                No specific amenities have been listed for this unit.
              </p>
            </div>
          )}
        </div>
        {/* ▲▲▲ REPLACEMENT SECTION END ▲▲▲ */}
      </div>
    </div>
  );
};

export default UnitDetails;
