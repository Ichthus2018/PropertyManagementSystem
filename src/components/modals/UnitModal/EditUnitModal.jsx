import { Fragment, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";
import { useUnitForm } from "../../../hooks/useUnitForm";
import clsx from "clsx";

// Import components for the third tab
import FacilitiesInput from "./FacilitiesInput";
import UtilitiesInput from "./UtilitiesInput";
import ImageUploader from "../../ui/ImageUploader";

export default function EditUnitModal({ isOpen, onClose, onSuccess, unit }) {
  const { formData, isSaving, saveError, dropdownData, handlers, isLoading } =
    useUnitForm(unit);

  // --- NEW: State to manage the active tab ---
  const [activeTab, setActiveTab] = useState("details");

  const handleSaveAndClose = () => {
    handlers.handleSave(onSuccess);
  };

  // --- NEW: Tab configuration for the unit form ---
  const unitTabsConfig = [
    { id: "details", name: "Unit Details" },
    { id: "classification", name: "Classification" },
    { id: "features", name: "Features & Media" },
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 font-sans" onClose={onClose}>
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
                  className="text-2xl font-semibold leading-6 text-neutral-900 flex justify-between items-start md:items-center pb-4 border-b border-neutral-200 px-6"
                >
                  <div className="flex-1">
                    Edit Unit:{" "}
                    <span className="font-bold">{formData.name}</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </DialogTitle>

                {isLoading ? (
                  <div className="text-center p-8 text-neutral-600">
                    Loading Form Data...
                  </div>
                ) : (
                  <>
                    <div className="mt-8 px-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      <div className="p-6 border border-neutral-200 rounded-lg bg-neutral-50 ">
                        {/* --- NEW: Tab Navigation --- */}
                        <div className="border-b border-gray-200 mb-6">
                          <nav
                            className="-mb-px flex space-x-4"
                            aria-label="Tabs"
                          >
                            {unitTabsConfig.map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
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

                        {/* --- NEW: Conditional Tab Content --- */}
                        <div className="mt-4">
                          {/* TAB 1: Unit Details */}
                          {activeTab === "details" && (
                            <div className="animate-fadeIn">
                              <h5 className="font-bold text-lg text-neutral-800 mb-4 flex items-center">
                                <BuildingOffice2Icon className="h-5 w-5 mr-2 text-orange-600" />
                                Core Information
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Unit Name
                                  </label>
                                  <input
                                    type="text"
                                    name="name"
                                    value={formData.name ?? ""}
                                    onChange={handlers.handleInputChange}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Sqm
                                  </label>
                                  <input
                                    type="number"
                                    name="sqm"
                                    value={formData.sqm ?? 0}
                                    onChange={handlers.handleInputChange}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-gray-100 cursor-not-allowed"
                                    disabled
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* TAB 2: Classification */}
                          {activeTab === "classification" && (
                            <div className="animate-fadeIn">
                              <h5 className="font-bold text-lg text-neutral-800 mb-4 flex items-center">
                                <BuildingOffice2Icon className="h-5 w-5 mr-2 text-orange-600" />
                                Unit Classification
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Unit Type
                                  </label>
                                  <select
                                    name="unit_type_id"
                                    value={formData.unit_type_id ?? ""}
                                    onChange={handlers.handleInputChange}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value="">-- Select --</option>
                                    {dropdownData.unitTypes.map((type) => (
                                      <option key={type.id} value={type.id}>
                                        {type.unit_type}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Leasing Type
                                  </label>
                                  <select
                                    name="leasing_type_id"
                                    value={formData.leasing_type_id ?? ""}
                                    onChange={handlers.handleInputChange}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value="">-- Select --</option>
                                    {dropdownData.leasingTypes.map((type) => (
                                      <option key={type.id} value={type.id}>
                                        {type.leasing_type}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Unit Category
                                  </label>
                                  <select
                                    name="unit_category_id"
                                    value={formData.unit_category_id ?? ""}
                                    onChange={handlers.handleInputChange}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value="">-- Select --</option>
                                    {dropdownData.unitCategories.map((cat) => (
                                      <option key={cat.id} value={cat.id}>
                                        {cat.unit_category}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Category 2
                                  </label>
                                  <select
                                    name="unit_category_2_id"
                                    value={formData.unit_category_2_id ?? ""}
                                    onChange={handlers.handleInputChange}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value="">-- Select --</option>
                                    {dropdownData.unitCategories2.map((cat) => (
                                      <option key={cat.id} value={cat.id}>
                                        {cat.unit_category_2}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Category 3
                                  </label>
                                  <select
                                    name="unit_category_3_id"
                                    value={formData.unit_category_3_id ?? ""}
                                    onChange={handlers.handleInputChange}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value="">-- Select --</option>
                                    {dropdownData.unitCategories3.map((cat) => (
                                      <option key={cat.id} value={cat.id}>
                                        {cat.unit_category_3}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* TAB 3: Features & Media */}
                          {activeTab === "features" && (
                            <div className="space-y-6 animate-fadeIn">
                              <FacilitiesInput
                                selectedFacilities={formData.facilities || []}
                                setSelectedFacilities={(facilities) =>
                                  handlers.handleFieldChange(
                                    "facilities",
                                    facilities
                                  )
                                }
                              />
                              <div className="border-t border-neutral-200" />
                              <UtilitiesInput
                                selectedUtilities={formData.utilities || []}
                                setSelectedUtilities={(utilities) =>
                                  handlers.handleFieldChange(
                                    "utilities",
                                    utilities
                                  )
                                }
                              />
                              <div className="border-t border-neutral-200" />
                              <ImageUploader
                                label="Unit Images"
                                files={formData.unit_images || []}
                                setFiles={(files) =>
                                  handlers.handleFieldChange(
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
                    </div>

                    {saveError && (
                      <div className="mt-4 px-6 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        <strong>Error:</strong> {saveError}
                      </div>
                    )}

                    <div className="mt-8 px-6 flex justify-end items-center">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-full shadow-sm hover:bg-neutral-100 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAndClose}
                        disabled={isSaving}
                        className="ml-3 px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-full shadow-lg hover:bg-orange-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
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
