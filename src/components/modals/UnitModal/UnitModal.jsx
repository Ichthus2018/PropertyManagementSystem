import { Fragment, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";
import Stepper from "../../ui/common/Stepper"; // Adjust path if needed
import { usePropertyUnitData } from "../../../hooks/usePropertyUnitData";

export default function UnitModal({ isOpen, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
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

  // Reset step when modal is closed
  const handleClose = () => {
    setCurrentStep(1);
    handlers.resetState(); // Use the reset handler from the hook
    onClose();
  };

  const handleSaveSuccess = () => {
    if (onSuccess) onSuccess();
    handleClose(); // Also ensure local state is reset
  };

  // Find the selected property object from the dropdown data
  const selectedProperty = dropdownData.properties.find(
    (prop) => prop.id == selectedPropertyId
  );

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
              <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white py-6  px-2 text-left align-middle shadow-2xl transition-all ring-1 ring-neutral-200">
                <DialogTitle
                  as="h3"
                  className="text-2xl font-semibold leading-6 text-neutral-900 flex justify-between items-start md:items-center pb-4 border-b border-neutral-200"
                >
                  <div className="flex-1">
                    Add Property:{" "}
                    <span className="font-bold">
                      {propertyData.property_name || "Select a Property"}
                    </span>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </DialogTitle>

                <Stepper currentStep={currentStep} steps={steps} />

                {isLoading ? (
                  <div className="text-center p-8 text-neutral-600">
                    Loading Available Properties...
                  </div>
                ) : (
                  <>
                    <div className="mt-8">
                      {/* === STEP 1: PROPERTY INFORMATION === */}
                      {currentStep === 1 && (
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

                      {/* === STEP 2: UNIT MANAGEMENT === */}
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
                              {propertyData.units.map((unit, index) => (
                                <div
                                  key={unit.id || `new-unit-${index}`}
                                  className="p-5 border border-neutral-200 rounded-lg shadow-sm bg-white/70 hover:bg-neutral-100 transition-colors duration-200"
                                >
                                  <h5 className="font-bold text-lg text-neutral-800 mb-4 flex items-center">
                                    <BuildingOffice2Icon className="h-5 w-5 mr-2 text-orange-600" />
                                    Unit {index + 1}
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Unit Name
                                      </label>
                                      <input
                                        type="text"
                                        name="name"
                                        value={unit.name || ""}
                                        onChange={(e) =>
                                          handlers.handleUnitChange(index, e)
                                        }
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Sqm (Square Meters)
                                      </label>
                                      <input
                                        type="number"
                                        name="sqm"
                                        value={unit.sqm || 0}
                                        onChange={(e) =>
                                          handlers.handleUnitChange(index, e)
                                        }
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                        min="0"
                                        max={
                                          propertyData.total_sqm -
                                          assignedSqm +
                                          (unit.sqm || 0)
                                        }
                                        step="0.01"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Unit Type
                                      </label>
                                      <select
                                        name="unit_type_id"
                                        value={unit.unit_type_id || ""}
                                        onChange={(e) =>
                                          handlers.handleUnitChange(index, e)
                                        }
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
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
                                        value={unit.leasing_type_id || ""}
                                        onChange={(e) =>
                                          handlers.handleUnitChange(index, e)
                                        }
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                      >
                                        <option value="">-- Select --</option>
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
                                        value={unit.unit_category_id || ""}
                                        onChange={(e) =>
                                          handlers.handleUnitChange(index, e)
                                        }
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                      >
                                        <option value="">-- Select --</option>
                                        {dropdownData.unitCategories.map(
                                          (cat) => (
                                            <option key={cat.id} value={cat.id}>
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
                                        value={unit.unit_category_2_id || ""}
                                        onChange={(e) =>
                                          handlers.handleUnitChange(index, e)
                                        }
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                      >
                                        <option value="">-- Select --</option>
                                        {dropdownData.unitCategories2.map(
                                          (cat) => (
                                            <option key={cat.id} value={cat.id}>
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
                                        value={unit.unit_category_3_id || ""}
                                        onChange={(e) =>
                                          handlers.handleUnitChange(index, e)
                                        }
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                      >
                                        <option value="">-- Select --</option>
                                        {dropdownData.unitCategories3.map(
                                          (cat) => (
                                            <option key={cat.id} value={cat.id}>
                                              {cat.unit_category_3}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* --- Modal Actions / Navigation --- */}
                    <div className="mt-8 flex justify-between items-center">
                      <div>
                        {currentStep > 1 && (
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="px-6 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-full shadow-sm hover:bg-neutral-100 transition-colors duration-200"
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
                            className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-full shadow-lg hover:bg-orange-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors duration-200"
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
                            className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-full shadow-lg hover:bg-orange-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors duration-200"
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
