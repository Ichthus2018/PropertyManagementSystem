import { useState, useMemo, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  BuildingOffice2Icon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

// --- Stepper UI Component ---
const Stepper = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center w-full mb-8 px-2">
      {steps.map((step, index) => (
        <Fragment key={index}>
          <div className="flex flex-col items-center text-center w-32">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transition-all duration-300
                ${
                  index + 1 < currentStep
                    ? "bg-gradient-to-br from-green-500 to-emerald-600"
                    : ""
                }
                ${
                  index + 1 === currentStep
                    ? "bg-gradient-to-br from-orange-500 to-red-600 scale-110"
                    : ""
                }
                ${index + 1 > currentStep ? "bg-gray-300" : ""}
              `}
            >
              {index + 1 < currentStep ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <p
              className={`mt-2 text-sm font-semibold transition-all duration-300
                ${index + 1 <= currentStep ? "text-gray-800" : "text-gray-400"}
              `}
            >
              {step}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-auto h-1 transition-colors duration-500
                ${
                  index + 1 < currentStep
                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                    : "bg-gray-200"
                }
              `}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};

export default function UnitModal({ isOpen, onClose, propertyData }) {
  // --- STATE MANAGEMENT ---
  const [currentStep, setCurrentStep] = useState(1);

  // Use a function for useState to perform this logic only on the initial render
  const [property, setProperty] = useState(() => {
    // FIX 1: Normalize the initial unit data to prevent errors from props.
    // This ensures every unit object has an 'image' property, even if the incoming data doesn't.
    const normalizedUnits = (propertyData.units || []).map((unit) => ({
      ...unit, // Keep all existing unit data
      image: unit.image || { fileName: "", notes: "" }, // IMPORTANT: Add a default image object if it's missing
    }));

    return {
      ...propertyData,
      units: normalizedUnits, // Use the safe, normalized units
      totalUnits: normalizedUnits.length || 1,
      businessLicense: propertyData.businessLicense || {
        fileName: "",
        notes: "",
      },
      cor: propertyData.cor || { fileName: "", notes: "" },
    };
  });

  const [country, setCountry] = useState(propertyData.address.country);

  // --- DERIVED STATE & VALIDATION ---
  const assignedSqm = useMemo(() => {
    return property.units.reduce((sum, unit) => sum + Number(unit.sqm || 0), 0);
  }, [property.units]);

  const isSqmMatched = useMemo(() => {
    return (
      Number(property.totalSqm) === assignedSqm && Number(property.totalSqm) > 0
    );
  }, [property.totalSqm, assignedSqm]);

  const isStep1Valid = useMemo(() => {
    return (
      property.propertyName && property.totalSqm > 0 && property.totalUnits > 0
    );
  }, [property.propertyName, property.totalSqm, property.totalUnits]);

  // --- HANDLERS ---
  const handlePropertyChange = (e) => {
    const { name, value } = e.target;
    setProperty((prev) => ({ ...prev, [name]: value }));
  };

  const handleTotalUnitsChange = (e) => {
    const newTotal = Math.max(0, parseInt(e.target.value, 10) || 0);

    setProperty((prev) => {
      const currentUnits = prev.units;
      const updatedUnits = [...currentUnits];

      if (newTotal > currentUnits.length) {
        for (let i = currentUnits.length; i < newTotal; i++) {
          updatedUnits.push({
            id: `new_${Date.now()}_${i}`,
            name: `Unit ${i + 1}`,
            sqm: 0,
            unitType: "Residential",
            leasingType: "For Rent",
            unitCategory: "Standard",
            image: { fileName: "", notes: "" }, // This is the crucial part for new units
          });
        }
      } else {
        updatedUnits.splice(newTotal);
      }

      return { ...prev, totalUnits: newTotal, units: updatedUnits };
    });
  };

  const handleUnitChange = (index, e) => {
    const { name, value } = e.target;
    const newUnits = [...property.units];
    newUnits[index] = { ...newUnits[index], [name]: value };
    setProperty((prev) => ({ ...prev, units: newUnits }));
  };

  const handleUnitFileChange = (e, index) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newUnits = [...property.units];
      // Ensure the image object exists before trying to set a property on it
      if (!newUnits[index].image) {
        newUnits[index].image = { fileName: "", notes: "" };
      }
      newUnits[index].image.fileName = file.name;
      setProperty((prev) => ({ ...prev, units: newUnits }));
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setProperty((prev) => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
  };

  const handleFileChange = (e, fieldName) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProperty((prev) => ({
        ...prev,
        [fieldName]: { ...prev[fieldName], fileName: file.name },
      }));
    }
  };

  const handleSave = () => {
    if (isSqmMatched) {
      alert("Data Saved! (In a real app, this would be an API call)");
      console.log("Final Data:", property);
      onClose();
    }
  };

  const steps = ["Property Information", "Unit Management"];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>
        PopoverMenuItem
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-gray-50 p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-xl font-bold leading-6 text-gray-900 flex justify-between items-center"
                >
                  Edit Property: {property.propertyName}
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-600" />
                  </button>
                </DialogTitle>

                <div className="mt-6">
                  <Stepper currentStep={currentStep} steps={steps} />
                </div>

                {/* --- Form Content --- */}
                <div className="mt-4">
                  {/* === STEP 1: PROPERTY INFORMATION === */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="p-5 border border-gray-200 rounded-lg bg-white">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                          Property Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="propertyName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Property Name
                            </label>
                            <input
                              type="text"
                              name="propertyName"
                              id="propertyName"
                              value={property.propertyName}
                              onChange={handlePropertyChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="totalSqm"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Total Sqm (Master Value)
                            </label>
                            <input
                              type="number"
                              name="totalSqm"
                              id="totalSqm"
                              value={property.totalSqm}
                              onChange={handlePropertyChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="totalUnits"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Total Units
                            </label>
                            <input
                              type="number"
                              name="totalUnits"
                              id="totalUnits"
                              value={property.totalUnits}
                              onChange={handleTotalUnitsChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="country"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Country
                            </label>
                            <select
                              id="country"
                              name="country"
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            >
                              <option>United States</option>
                              <option>Canada</option>
                              <option>Philippines</option>
                            </select>
                          </div>
                          {country === "Philippines" ? (
                            <>
                              <div>
                                <label
                                  htmlFor="region"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Region
                                </label>
                                <select
                                  id="region"
                                  name="region"
                                  value={property.address.region}
                                  onChange={handleAddressChange}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                                >
                                  <option>National Capital Region (NCR)</option>
                                </select>
                              </div>
                              <div>
                                <label
                                  htmlFor="province"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Province
                                </label>
                                <select
                                  id="province"
                                  name="province"
                                  value={property.address.province}
                                  onChange={handleAddressChange}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                                >
                                  <option>Metro Manila</option>
                                </select>
                              </div>
                              <div>
                                <label
                                  htmlFor="city"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  City/Municipality
                                </label>
                                <select
                                  id="city"
                                  name="city"
                                  value={property.address.city}
                                  onChange={handleAddressChange}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                                >
                                  <option>Makati City</option>
                                </select>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label
                                  htmlFor="state"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  State/Province
                                </label>
                                <input
                                  type="text"
                                  name="state"
                                  id="state"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                                  placeholder="e.g. California"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="city"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  City
                                </label>
                                <input
                                  type="text"
                                  name="city"
                                  id="city"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                                  placeholder="e.g. San Francisco"
                                />
                              </div>
                            </>
                          )}
                          <div className="md:col-span-2">
                            <label
                              htmlFor="street"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Street Address, Building No.
                            </label>
                            <input
                              type="text"
                              name="street"
                              id="street"
                              value={property.address.street}
                              onChange={handleAddressChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-5 border border-gray-200 rounded-lg bg-white">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                          Legal Documents
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {["businessLicense", "cor"].map((field) => (
                            <div key={field}>
                              <label className="block text-sm font-medium text-gray-700">
                                {field === "businessLicense"
                                  ? "Business License"
                                  : "Certificate of Registration (COR)"}
                              </label>
                              <div className="mt-1 flex items-center space-x-2">
                                <label
                                  htmlFor={`${field}-upload`}
                                  className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                                  {property[field].fileName
                                    ? "Change"
                                    : "Upload"}
                                </label>
                                <input
                                  id={`${field}-upload`}
                                  type="file"
                                  className="sr-only"
                                  onChange={(e) => handleFileChange(e, field)}
                                />
                                {property[field].fileName && (
                                  <div className="flex items-center text-sm text-green-600">
                                    <DocumentCheckIcon className="h-5 w-5 mr-1" />
                                    <span className="truncate max-w-xs">
                                      {property[field].fileName}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <input
                                type="text"
                                name={`${field}-notes`}
                                value={property[field].notes}
                                onChange={(e) =>
                                  setProperty((prev) => ({
                                    ...prev,
                                    [field]: {
                                      ...prev[field],
                                      notes: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Notes / Reference #"
                                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:border-orange-500 focus:ring-orange-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === STEP 2: UNIT MANAGEMENT === */}
                  {currentStep === 2 && (
                    <div className="animate-fadeIn">
                      <div className="p-5 border border-gray-200 rounded-lg bg-white">
                        <div className="flex flex-wrap justify-between items-baseline gap-2 mb-4 border-b pb-2">
                          <h4 className="text-lg font-semibold text-gray-800">
                            Manage {property.totalUnits || 0} Units
                          </h4>
                          <div
                            className={`font-bold text-lg p-2 rounded-md ${
                              isSqmMatched
                                ? "text-green-700 bg-green-100"
                                : "text-red-700 bg-red-100"
                            }`}
                          >
                            {assignedSqm} / {property.totalSqm || 0} sqm
                            <span className="font-medium"> assigned</span>
                          </div>
                        </div>

                        <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                          {property.units.map((unit, index) => (
                            <div
                              key={unit.id}
                              className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50/50"
                            >
                              <h5 className="font-bold text-md text-gray-800 mb-4 flex items-center">
                                <BuildingOffice2Icon className="h-5 w-5 mr-2 text-orange-600" />
                                Unit {index + 1}
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Unit Name
                                  </label>
                                  <input
                                    type="text"
                                    name="name"
                                    value={unit.name}
                                    onChange={(e) => handleUnitChange(index, e)}
                                    className="mt-1 block w-full input-field"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Sqm
                                  </label>
                                  <input
                                    type="number"
                                    name="sqm"
                                    value={unit.sqm}
                                    onChange={(e) => handleUnitChange(index, e)}
                                    className="mt-1 block w-full input-field"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Unit Type
                                  </label>
                                  <select
                                    name="unitType"
                                    value={unit.unitType}
                                    onChange={(e) => handleUnitChange(index, e)}
                                    className="mt-1 block w-full input-field"
                                  >
                                    <option>Residential</option>
                                    <option>Commercial</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Leasing Type
                                  </label>
                                  <select
                                    name="leasingType"
                                    value={unit.leasingType}
                                    onChange={(e) => handleUnitChange(index, e)}
                                    className="mt-1 block w-full input-field"
                                  >
                                    <option>For Rent</option>
                                    <option>For Sale</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">
                                    Unit Category
                                  </label>
                                  <select
                                    name="unitCategory"
                                    value={unit.unitCategory}
                                    onChange={(e) => handleUnitChange(index, e)}
                                    className="mt-1 block w-full input-field"
                                  >
                                    <option>Standard</option>
                                    <option>Premium</option>
                                    <option>Penthouse</option>
                                  </select>
                                </div>
                                <div className="lg:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Unit Image
                                  </label>
                                  <div className="mt-1 flex items-center space-x-2">
                                    <label
                                      htmlFor={`unit-img-${index}`}
                                      className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                      <PhotoIcon className="h-5 w-5 mr-2 text-gray-500" />
                                      {/* FIX 3: Added optional chaining (?.) for UI safety. This prevents a crash if unit.image is ever undefined. */}
                                      {unit.image?.fileName
                                        ? "Change"
                                        : "Upload"}
                                    </label>
                                    <input
                                      id={`unit-img-${index}`}
                                      type="file"
                                      className="sr-only"
                                      onChange={(e) =>
                                        handleUnitFileChange(e, index)
                                      }
                                    />
                                    {/* FIX 3: Added optional chaining here as well for safety. */}
                                    {unit.image?.fileName && (
                                      <span className="truncate max-w-xs text-sm text-green-600">
                                        {unit.image.fileName}
                                      </span>
                                    )}
                                  </div>
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
                        onClick={() => setCurrentStep((prev) => prev - 1)}
                        className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                      >
                        Back
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    {currentStep < steps.length ? (
                      <button
                        type="button"
                        onClick={() => setCurrentStep((prev) => prev + 1)}
                        disabled={!isStep1Valid}
                        className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-md shadow-sm hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={!isSqmMatched}
                        className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-md shadow-sm hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                      >
                        Save Changes
                      </button>
                    )}
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
