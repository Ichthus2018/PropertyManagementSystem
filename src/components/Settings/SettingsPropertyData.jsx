import { Fragment, useState } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import UnitTypes from "./propertyDataTabs/UnitTypes";
import LeasingTypes from "./propertyDataTabs/LeasingTypes";
import UnitCategories from "./propertyDataTabs/UnitCategories";
import UnitCategories2 from "./propertyDataTabs/UnitCategories2";
import UnitCategories3 from "./propertyDataTabs/UnitCategories3";

// Mock components for demonstration - no changes here

// Tab configuration - no changes here
const tabs = [
  { name: "Unit Types", component: <UnitTypes /> },
  { name: "Leasing Types", component: <LeasingTypes /> },
  { name: "Unit Categories", component: <UnitCategories /> },
  { name: "Unit Categories 2", component: <UnitCategories2 /> },
  { name: "Unit Categories 3", component: <UnitCategories3 /> },
];

export default function SettingsPropertyData() {
  // --- CHANGE 1: State now holds the entire tab object ---
  const [selectedTab, setSelectedTab] = useState(tabs[0]);

  return (
    <div className="h-full bg-white">
      {/* Header Section */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between pt-10 md:pt-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Property Data
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your property dropdown options and configurations
            </p>
          </div>
        </div>
      </div>

      {/* --- CHANGE 2: Desktop tabs now use the selectedTab object --- */}
      <div className="hidden lg:block border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setSelectedTab(tab)} // Set the whole object
                className={clsx(
                  "whitespace-nowrap border-b-2 py-3 px-4 text-sm font-medium transition-all duration-200 rounded-t-lg -mb-px",
                  selectedTab.name === tab.name
                    ? "border-orange-500 text-white bg-orange-600"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-white"
                )}
                aria-current={
                  selectedTab.name === tab.name ? "page" : undefined
                }
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* --- CHANGE 3: Mobile <select> is replaced with Headless UI Listbox --- */}
      <div className="lg:hidden px-6 py-4 bg-gray-50 border-b border-gray-200">
        <label
          htmlFor="tabs-mobile"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Current Section
        </label>
        <Listbox value={selectedTab} onChange={setSelectedTab}>
          <div className="relative w-full">
            <ListboxButton className="group flex gap-2 w-full bg-white py-3 pl-4 pr-10 text-left shadow-sm rounded-lg cursor-default border border-gray-300 sm:text-sm focus:outline-none focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300">
              <span className="block truncate">{selectedTab.name}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </ListboxButton>

            <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
              {tabs.map((tab) => (
                <ListboxOption
                  key={tab.name}
                  className={({ focus }) =>
                    clsx(
                      "relative cursor-default select-none py-2 pl-10 pr-4",
                      focus ? "bg-orange-100 text-orange-900" : "text-gray-900"
                    )
                  }
                  value={tab}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={clsx(
                          "block truncate",
                          selected ? "font-medium" : "font-normal"
                        )}
                      >
                        {tab.name}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-orange-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
      </div>

      {/* --- CHANGE 4: Content area now uses the selectedTab object --- */}
      <div className="flex-1 py-8">
        <div className="">{selectedTab.component}</div>
      </div>
    </div>
  );
}
