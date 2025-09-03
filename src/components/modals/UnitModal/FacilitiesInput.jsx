// src/components/ui/common/FacilitiesInput.jsx
import { useState } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";

const suggestedFacilitiesList = [
  "Swimming Pool",
  "Gym",
  "Playground",
  "24/7 Security",
  "Parking",
  "Clubhouse",
];

export default function FacilitiesInput({
  selectedFacilities,
  setSelectedFacilities,
}) {
  const [customFacility, setCustomFacility] = useState("");

  const handleAdd = (facility) => {
    const trimmed = facility.trim();
    if (trimmed && !selectedFacilities.includes(trimmed)) {
      setSelectedFacilities([...selectedFacilities, trimmed]);
    }
  };

  const handleRemove = (facilityToRemove) => {
    setSelectedFacilities(
      selectedFacilities.filter((f) => f !== facilityToRemove)
    );
  };

  const handleCustomAdd = () => {
    handleAdd(customFacility);
    setCustomFacility("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCustomAdd();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">
        Facilities
      </label>
      <div className="flex flex-wrap gap-2 rounded-md p-2 min-h-[44px] border border-neutral-200 bg-white">
        {selectedFacilities.map((facility) => (
          <span
            key={facility}
            className="inline-flex items-center gap-x-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800"
          >
            {facility}
            <button
              type="button"
              onClick={() => handleRemove(facility)}
              className="-mr-0.5 h-5 w-5 rounded-full flex items-center justify-center text-orange-500 hover:bg-orange-200 hover:text-orange-700 focus:outline-none"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customFacility}
          onChange={(e) => setCustomFacility(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a custom facility"
          className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
        />
        <button
          type="button"
          onClick={handleCustomAdd}
          className="rounded-md bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 whitespace-nowrap"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {suggestedFacilitiesList.map((facility) => (
          <button
            key={facility}
            type="button"
            onClick={() => handleAdd(facility)}
            disabled={selectedFacilities.includes(facility)}
            className="inline-flex items-center gap-x-1 rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlusIcon className="h-4 w-4 text-gray-500" />
            {facility}
          </button>
        ))}
      </div>
    </div>
  );
}
