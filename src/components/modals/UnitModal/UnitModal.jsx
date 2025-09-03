// src/components/modals/UnitModal/UnitModal.jsx

import { Fragment, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";
import Stepper from "../../ui/common/Stepper";
import { usePropertyUnitData } from "../../../hooks/usePropertyUnitData";
import clsx from "clsx"; // <-- Add this import

// Import the new components
import FacilitiesInput from "./FacilitiesInput";
import UtilitiesInput from "./UtilitiesInput";
import ImageUploader from "../../ui/ImageUploader";

export default function UnitModal({ isOpen, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  // --- NEW: State to manage the active tab for each unit by its index ---
  const [activeUnitTabs, setActiveUnitTabs] = useState({});

  const {
    propertyData,
    selectedPropertyId,
    isSqmMatched,
    isStep1Valid,
    assignedSqm,
    dropdownData,
    handlers,
    isLoading,
    isSaving,
  } = usePropertyUnitData();

  const steps = ["Property Information", "Unit Management"];

  const handleClose = () => {
    setCurrentStep(1);
    handlers.resetState();
    onClose();
  };

  const handleSaveSuccess = () => {
    if (onSuccess) onSuccess();
    handleClose();
  };

  const selectedProperty = dropdownData.properties.find(
    (prop) => prop.id == selectedPropertyId
  );

  // Tab configuration for each unit form
  const unitTabsConfig = [
    { id: "details", name: "Unit Details" },
    { id: "classification", name: "Classification" },
    { id: "features", name: "Features & Media" },
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50 font-sans"
        onClose={handleClose}
      >
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-neutral-900/50" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center xs:p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white py-6 px-2 text-left align-middle shadow-2xl transition-all ring-1 ring-neutral-200">
                <DialogTitle
                  as="h3"
                  className="text-2xl font-semibold leading-6 text-neutral-900 flex justify-between items-start md:items-center pb-4 border-b border-neutral-200 px-4"
                >
                  <div className="flex-1">
                    Add Units to:{" "}
                    <span className="font-bold">
                      {propertyData.property_name || "Select a Property"}
                    </span>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-200 focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </DialogTitle>
                <div className="px-4">
                  <Stepper currentStep={currentStep} steps={steps} />
                </div>
                {isLoading ? (
                  <div className="text-center p-8 text-neutral-600">
                    Loading...
                  </div>
                ) : (
                  <>
                    <div className="mt-8 px-4">
                      {currentStep === 1 && (
                        // --- STEP 1: Property Selection (No changes here) ---
                        <div className="space-y-6 animate-fadeIn">
                          <div className="p-6 border border-neutral-200 rounded-lg bg-neutral-50">
                            <h4 className="text-xl font-semibold text-neutral-800 mb-4">
                              Property Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="md:col-span-2">
                                <label
                                  htmlFor="property_select"
                                  className="block text-sm font-medium text-neutral-700 mb-1"
                                >
                                  Select Property (Only properties with
                                  available space are shown)
                                </label>
                                <select
                                  id="property_select"
                                  value={selectedPropertyId || ""}
                                  onChange={handlers.handlePropertySelect}
                                  className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                >
                                  <option value="" disabled>
                                    -- Choose a property --
                                  </option>
                                  {dropdownData.properties.map((prop) => (
                                    <option key={prop.id} value={prop.id}>
                                      {prop.property_name} (Sqm:{" "}
                                      {prop.available_sqm}, Units:{" "}
                                      {prop.available_units})
                                    </option>
                                  ))}
                                </select>
                                {selectedProperty && (
                                  <div className="mt-4 p-4 bg-orange-50 rounded-md border border-orange-200 text-sm text-orange-800">
                                    <p>
                                      <span className="font-bold">
                                        Available Sqm for new units:
                                      </span>{" "}
                                      {selectedProperty.available_sqm}
                                    </p>
                                    <p>
                                      <span className="font-bold">
                                        Available unit slots:
                                      </span>{" "}
                                      {selectedProperty.available_units}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {currentStep === 2 && (
                        <div className="animate-fadeIn">
                          <div className="p-6 border border-neutral-200 rounded-lg bg-neutral-50">
                            <div className="flex flex-wrap justify-between items-baseline gap-4 mb-4 pb-2 border-b border-neutral-200">
                              <h4 className="text-xl font-semibold text-neutral-800">
                                Add {propertyData.number_of_units || 0} New
                                Units
                              </h4>
                              <div
                                className={`font-bold text-base px-3 py-1 rounded-full ${
                                  isSqmMatched
                                    ? "text-green-800 bg-green-100"
                                    : "text-red-800 bg-red-100"
                                }`}
                              >
                                {assignedSqm} / {propertyData.total_sqm || 0}{" "}
                                sqm assigned
                              </div>
                            </div>
                            <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                              {propertyData.units.map((unit, index) => {
                                // Get active tab for this unit, default to the first tab
                                const activeTab =
                                  activeUnitTabs[index] || unitTabsConfig[0].id;

                                return (
                                  <div
                                    key={unit.id || `new-unit-${index}`}
                                    className="p-5 border border-neutral-200 rounded-lg shadow-sm bg-white"
                                  >
                                    <h5 className="font-bold text-lg text-neutral-800 mb-4 flex items-center">
                                      <BuildingOffice2Icon className="h-5 w-5 mr-2 text-orange-600" />
                                      Unit {index + 1}
                                    </h5>

                                    {/* --- NEW: Tab Navigation for Each Unit --- */}
                                    <div className="border-b border-gray-200 mb-6">
                                      <nav
                                        className="-mb-px flex space-x-4"
                                        aria-label="Tabs"
                                      >
                                        {unitTabsConfig.map((tab) => (
                                          <button
                                            key={tab.id}
                                            onClick={() =>
                                              setActiveUnitTabs((prev) => ({
                                                ...prev,
                                                [index]: tab.id,
                                              }))
                                            }
                                            className={clsx(
                                              "whitespace-nowrap border-b-2 py-2 px-3 text-sm font-medium transition-colors duration-200 rounded-t-md",
                                              activeTab === tab.id
                                                ? "border-orange-500 text-orange-600 bg-orange-50"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            )}
                                          >
                                            {tab.name}
                                          </button>
                                        ))}
                                      </nav>
                                    </div>

                                    {/* --- NEW: Tab Content --- */}
                                    <div className="mt-4">
                                      {/* TAB 1: Unit Details (Name & Sqm) */}
                                      {activeTab === "details" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 animate-fadeIn">
                                          <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                              Unit Name
                                            </label>
                                            <input
                                              type="text"
                                              name="name"
                                              value={unit.name || ""}
                                              onChange={(e) =>
                                                handlers.handleUnitChange(
                                                  index,
                                                  e
                                                )
                                              }
                                              className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                              required
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                              Sqm
                                            </label>
                                            <input
                                              type="number"
                                              name="sqm"
                                              value={unit.sqm || ""}
                                              onChange={(e) =>
                                                handlers.handleUnitChange(
                                                  index,
                                                  e
                                                )
                                              }
                                              className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                              min="0"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* TAB 2: Classification (Dropdowns) */}
                                      {activeTab === "classification" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6 animate-fadeIn">
                                          <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                              Unit Type
                                            </label>
                                            <select
                                              name="unit_type_id"
                                              value={unit.unit_type_id || ""}
                                              onChange={(e) =>
                                                handlers.handleUnitChange(
                                                  index,
                                                  e
                                                )
                                              }
                                              className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                              <option value="">
                                                -- Select --
                                              </option>
                                              {dropdownData.unitTypes.map(
                                                (type) => (
                                                  <option
                                                    key={type.id}
                                                    value={type.id}
                                                  >
                                                    {type.unit_type}
                                                  </option>
                                                )
                                              )}
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                              Leasing Type
                                            </label>
                                            <select
                                              name="leasing_type_id"
                                              value={unit.leasing_type_id || ""}
                                              onChange={(e) =>
                                                handlers.handleUnitChange(
                                                  index,
                                                  e
                                                )
                                              }
                                              className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                              <option value="">
                                                -- Select --
                                              </option>
                                              {dropdownData.leasingTypes.map(
                                                (type) => (
                                                  <option
                                                    key={type.id}
                                                    value={type.id}
                                                  >
                                                    {type.leasing_type}
                                                  </option>
                                                )
                                              )}
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                              Unit Category
                                            </label>
                                            <select
                                              name="unit_category_id"
                                              value={
                                                unit.unit_category_id || ""
                                              }
                                              onChange={(e) =>
                                                handlers.handleUnitChange(
                                                  index,
                                                  e
                                                )
                                              }
                                              className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                              <option value="">
                                                -- Select --
                                              </option>
                                              {dropdownData.unitCategories.map(
                                                (cat) => (
                                                  <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                  >
                                                    {cat.unit_category}
                                                  </option>
                                                )
                                              )}
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                              Category 2
                                            </label>
                                            <select
                                              name="unit_category_2_id"
                                              value={
                                                unit.unit_category_2_id || ""
                                              }
                                              onChange={(e) =>
                                                handlers.handleUnitChange(
                                                  index,
                                                  e
                                                )
                                              }
                                              className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                              <option value="">
                                                -- Select --
                                              </option>
                                              {dropdownData.unitCategories2.map(
                                                (cat) => (
                                                  <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                  >
                                                    {cat.unit_category_2}
                                                  </option>
                                                )
                                              )}
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                              Category 3
                                            </label>
                                            <select
                                              name="unit_category_3_id"
                                              value={
                                                unit.unit_category_3_id || ""
                                              }
                                              onChange={(e) =>
                                                handlers.handleUnitChange(
                                                  index,
                                                  e
                                                )
                                              }
                                              className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            >
                                              <option value="">
                                                -- Select --
                                              </option>
                                              {dropdownData.unitCategories3.map(
                                                (cat) => (
                                                  <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                  >
                                                    {cat.unit_category_3}
                                                  </option>
                                                )
                                              )}
                                            </select>
                                          </div>
                                        </div>
                                      )}

                                      {/* TAB 3: Features & Media */}
                                      {activeTab === "features" && (
                                        <div className="space-y-6 animate-fadeIn">
                                          {/* --- Start of New Flexbox Container --- */}
                                          <div className="flex flex-col md:flex-row gap-6">
                                            {/* Column 1 */}
                                            <div className="flex-1">
                                              <FacilitiesInput
                                                selectedFacilities={
                                                  unit.facilities || []
                                                }
                                                setSelectedFacilities={(
                                                  facilities
                                                ) =>
                                                  handlers.handleUnitFieldUpdate(
                                                    index,
                                                    "facilities",
                                                    facilities
                                                  )
                                                }
                                              />
                                            </div>
                                            {/* Column 2 */}
                                            <div className="flex-1">
                                              <UtilitiesInput
                                                selectedUtilities={
                                                  unit.utilities || []
                                                }
                                                setSelectedUtilities={(
                                                  utilities
                                                ) =>
                                                  handlers.handleUnitFieldUpdate(
                                                    index,
                                                    "utilities",
                                                    utilities
                                                  )
                                                }
                                              />
                                            </div>
                                          </div>
                                          <div className="border-t border-neutral-200" />
                                          <ImageUploader
                                            label="Unit Images"
                                            files={unit.unit_images || []}
                                            setFiles={(files) =>
                                              handlers.handleUnitFieldUpdate(
                                                index,
                                                "unit_images",
                                                files
                                              )
                                            }
                                            maxFiles={5}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* --- Modal Actions / Navigation --- */}
                    <div className="mt-8 flex justify-between items-center px-4">
                      <div>
                        {currentStep > 1 && (
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="px-6 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-full shadow-sm hover:bg-neutral-100"
                          >
                            Back
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        {currentStep < steps.length ? (
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            disabled={!isStep1Valid || isLoading}
                            className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-full shadow-lg hover:bg-orange-700 disabled:bg-neutral-400"
                          >
                            Next
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handlers.handleSave(handleSaveSuccess)
                            }
                            disabled={!isSqmMatched || isSaving}
                            className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-full shadow-lg hover:bg-orange-700 disabled:bg-neutral-400"
                          >
                            {isSaving ? "Saving..." : "Save Changes"}
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
