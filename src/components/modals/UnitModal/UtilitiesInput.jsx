import { useState } from "react";

import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";

const suggestedUtilitiesList = [
  "Water",
  "Electricity",
  "Internet",
  "Cable TV",
  "Gas",
  "Trash Collection",
];

export default function UtilitiesInput({
  selectedUtilities,
  setSelectedUtilities,
}) {
  const [customUtility, setCustomUtility] = useState("");

  const handleAdd = (utility) => {
    const trimmed = utility.trim();

    if (trimmed && !selectedUtilities.includes(trimmed)) {
      setSelectedUtilities([...selectedUtilities, trimmed]);
    }
  };

  const handleRemove = (utilityToRemove) => {
    setSelectedUtilities(
      selectedUtilities.filter((u) => u !== utilityToRemove)
    );
  };

  const handleCustomAdd = () => {
    handleAdd(customUtility);

    setCustomUtility("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      handleCustomAdd();
    }
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor="utilities"
        className="block text-sm font-medium text-neutral-700"
      >
        Utilities
      </label>

      <div className="flex flex-wrap gap-2 rounded-md p-2 min-h-[44px] border border-neutral-200 bg-white">
        {selectedUtilities.map((utility) => (
          <span
            key={utility}
            className="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
          >
            {utility}

            <button
              type="button"
              onClick={() => handleRemove(utility)}
              className="-mr-0.5 h-5 w-5 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-200 hover:text-blue-700 focus:outline-none"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="utilities"
          type="text"
          value={customUtility}
          onChange={(e) => setCustomUtility(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a custom utility"
          className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />

        <button
          type="button"
          onClick={handleCustomAdd}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 whitespace-nowrap"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {suggestedUtilitiesList.map((utility) => (
          <button
            key={utility}
            type="button"
            onClick={() => handleAdd(utility)}
            disabled={selectedUtilities.includes(utility)}
            className="inline-flex items-center gap-x-1 rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlusIcon className="h-4 w-4 text-gray-500" />

            {utility}
          </button>
        ))}
      </div>
    </div>
  );
}
