// AmenitiesInput.jsx
import { useState } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";

const suggestedAmenitiesList = [
  "Wi-Fi",
  "Air Conditioning",
  "TV",
  "Mini Bar",
  "Hair Dryer",
  "Room Service",
  "Breakfast Included",
  "Swimming Pool",
  "Gym",
  "Free Parking",
];

export default function AmenitiesInput({
  selectedAmenities,
  setSelectedAmenities,
}) {
  const [customAmenity, setCustomAmenity] = useState("");

  const handleAddAmenity = (amenity) => {
    const trimmedAmenity = amenity.trim();
    if (trimmedAmenity && !selectedAmenities.includes(trimmedAmenity)) {
      setSelectedAmenities([...selectedAmenities, trimmedAmenity]);
    }
  };

  const handleRemoveAmenity = (amenityToRemove) => {
    setSelectedAmenities(
      selectedAmenities.filter((amenity) => amenity !== amenityToRemove)
    );
  };

  const handleCustomAdd = () => {
    handleAddAmenity(customAmenity);
    setCustomAmenity("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCustomAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1.5">
          Amenities
        </label>
        {/* Selected Amenities */}
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-500 mb-2">
            Selected Amenities:
          </p>
          <div className="flex flex-wrap gap-2 rounded-md min-h-[44px]">
            {selectedAmenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-x-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => handleRemoveAmenity(amenity)}
                  className="-mr-0.5 h-5 w-5 rounded-full flex items-center justify-center text-orange-500 hover:bg-orange-200 hover:text-orange-700 focus:outline-none"
                >
                  <span className="sr-only">Remove {amenity}</span>
                  <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Amenity Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customAmenity}
          onChange={(e) => setCustomAmenity(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a custom amenity"
          className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
        />
        <button
          type="button"
          onClick={handleCustomAdd}
          className="rounded-md bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline  focus-visible:outline-offset-2 focus-visible:outline-orange-600 whitespace-nowrap"
        >
          Add
        </button>
      </div>

      {/* Suggested Amenities */}
      <div>
        <p className="text-sm font-medium text-gray-500 mb-2">
          Suggested Amenities:
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestedAmenitiesList.map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() => handleAddAmenity(amenity)}
              disabled={selectedAmenities.includes(amenity)}
              className="inline-flex items-center gap-x-1 rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PlusIcon className="h-4 w-4 text-gray-500" />
              {amenity}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
