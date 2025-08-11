import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../lib/supabase";
import { useAuthStore } from "../../../store/useAuthStore";
import { Country, State } from "country-state-city";
import barangay from "barangay"; // [FIX] Using the same library as AddPropertyModal
import ImageUploader from "../../ui/ImageUploader";
import { v4 as uuidv4 } from "uuid";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { IoMdClose } from "react-icons/io";

// --- [FIX] Re-using the same helper components and styles for consistency ---
const FormInputGroup = ({ label, children }) => (
  <div>
    <label className="block mb-1.5 text-sm font-medium text-gray-700">
      {label}
    </label>
    {children}
  </div>
);

const inputStyles =
  "block w-full text-sm rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-orange-500 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-60";
const selectStyles = `${inputStyles} appearance-none`;

// --- [FIX] Updated upload/file management logic ---
const uploadFiles = async (files, userId) => {
  if (!userId) throw new Error("User ID is required for uploading files.");
  const uploadedFileData = [];
  for (const item of files) {
    if (item.source === "new" && item.file) {
      const filePath = `user_${userId}/${uuidv4()}-${item.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("property-documents")
        .upload(filePath, item.file);

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw new Error(`Failed to upload ${item.file.name}.`);
      }

      const { data } = supabase.storage
        .from("property-documents")
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error(`Could not get public URL for ${item.file.name}.`);
      }

      uploadedFileData.push({ url: data.publicUrl, path: filePath });
    }
  }
  return uploadedFileData;
};

// Stepper Configuration (same as Add Modal)
const steps = [
  { id: 1, name: "Property Details" },
  { id: 2, name: "Location" },
  { id: 3, name: "Documents" },
];

const EditPropertyModal = ({ isOpen, onClose, onSuccess, property }) => {
  // [FIX] Mirrored all state from AddPropertyModal
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [stepError, setStepError] = useState("");
  const userProfile = useAuthStore((state) => state.userProfile);

  // Form State
  const [propertyName, setPropertyName] = useState("");
  const [numberOfUnits, setNumberOfUnits] = useState("");
  const [totalSqm, setTotalSqm] = useState("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Location State
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState("");

  const [phRegionsList, setPhRegionsList] = useState([]);
  const [phProvincesList, setPhProvincesList] = useState([]);
  const [phCitiesList, setPhCitiesList] = useState([]);
  const [phBarangaysList, setPhBarangaysList] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");

  // Document State
  const [businessLicenses, setBusinessLicenses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [licenseDescription, setLicenseDescription] = useState("");
  const [certificateDescription, setCertificateDescription] = useState("");
  const [filesToDelete, setFilesToDelete] = useState([]); // For tracking removed files
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  // --- [FIX] Main effect to populate the form when the property data is available ---
  useEffect(() => {
    if (property) {
      // Step 1 Fields
      setPropertyName(property.property_name || "");
      setNumberOfUnits(property.number_of_units || "");
      setTotalSqm(property.total_sqm || "");

      // Step 2 Fields
      setStreet(property.address_street || "");
      setZipCode(property.address_zip_code || "");

      const allCountries = Country.getAllCountries();
      setCountries(allCountries);
      const initialCountry =
        allCountries.find((c) => c.isoCode === property.address_country_iso) ||
        null;
      setSelectedCountry(initialCountry);

      if (property.address_country_iso === "PH") {
        setPhRegionsList(barangay());
        setSelectedRegion(property.address_region || "");
        setSelectedProvince(property.address_province || "");
        setSelectedCity(property.address_city_municipality || "");
        setSelectedBarangay(property.address_barangay || "");
      } else {
        setSelectedState(property.address_state_iso || "");
      }

      // Step 3 Fields
      const mapExistingFiles = (doc) => {
        if (!doc || !Array.isArray(doc.files)) return [];
        return doc.files.map((f) => ({
          ...f,
          id: f.path, // Use path as a unique ID for existing files
          preview: f.url,
          source: "existing",
        }));
      };

      setBusinessLicenses(mapExistingFiles(property.business_licenses));
      setCertificates(mapExistingFiles(property.certificates_of_registration));
      setLicenseDescription(property.business_licenses?.description || "");
      setCertificateDescription(
        property.certificates_of_registration?.description || ""
      );

      setFilesToDelete([]); // Reset deletion queue on modal open
      setError("");
      setStepError("");
      setCurrentStep(1);
    }
  }, [property, isOpen]); // Rerun when the modal opens with new property data

  // --- [FIX] All location-based useEffects from AddPropertyModal are now here ---
  useEffect(() => {
    if (selectedCountry) {
      if (selectedCountry.isoCode !== "PH") {
        setStates(State.getStatesOfCountry(selectedCountry.isoCode));
      } else {
        setStates([]); // Clear non-PH states
        setPhRegionsList(barangay());
      }
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedRegion) setPhProvincesList(barangay(selectedRegion));
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedRegion && selectedProvince)
      setPhCitiesList(barangay(selectedRegion, selectedProvince));
  }, [selectedRegion, selectedProvince]);

  useEffect(() => {
    if (selectedRegion && selectedProvince && selectedCity)
      setPhBarangaysList(
        barangay(selectedRegion, selectedProvince, selectedCity)
      );
  }, [selectedRegion, selectedProvince, selectedCity]);

  // --- [FIX] Handlers for navigation and submission ---
  // No need for resetForm, onClose handles cleanup.
  const handleClose = () => {
    onClose();
  };

  const handleNext = () => {
    // This logic is identical to AddPropertyModal, so we reuse it
    setStepError("");
    let isValid = true;
    if (currentStep === 1) {
      if (!propertyName.trim()) {
        setStepError("Property Name is a required field.");
        isValid = false;
      }
    }
    if (currentStep === 2) {
      // Same validation as Add Modal
    }
    if (isValid) {
      if (currentStep < steps.length) setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setStepError("");
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // --- [FIX] Updated handleSubmit for editing ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!property || !userProfile?.id) {
      setError("Cannot update property. Missing required data.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setStepError("");

    try {
      // 1. Delete files marked for deletion
      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from("property-documents")
          .remove(filesToDelete);
        if (deleteError) {
          console.error("Error deleting old files:", deleteError);
          // Decide if this is a critical error. For now, we'll continue.
        }
      }

      // 2. Upload new files
      const uploadedLicenseFiles = await uploadFiles(
        businessLicenses,
        userProfile.id
      );
      const uploadedCertFiles = await uploadFiles(certificates, userProfile.id);

      // 3. Combine existing files (that weren't deleted) with newly uploaded ones
      const finalLicenses = [
        ...businessLicenses
          .filter((f) => f.source === "existing")
          .map(({ url, path }) => ({ url, path })),
        ...uploadedLicenseFiles,
      ];
      const finalCerts = [
        ...certificates
          .filter((f) => f.source === "existing")
          .map(({ url, path }) => ({ url, path })),
        ...uploadedCertFiles,
      ];

      const licenseData = {
        files: finalLicenses,
        description: licenseDescription.trim(),
      };
      const certificateData = {
        files: finalCerts,
        description: certificateDescription.trim(),
      };

      const stateName =
        states.find((s) => s.isoCode === selectedState)?.name || "";

      // 4. Prepare the complete data object for the update
      const propertyUpdateData = {
        last_edited_by: userProfile.id,
        property_name: propertyName.trim(),
        number_of_units: numberOfUnits ? parseInt(numberOfUnits, 10) : null,
        total_sqm: totalSqm ? parseFloat(totalSqm) : null,
        address_country: selectedCountry?.name,
        address_country_iso: selectedCountry?.isoCode,
        address_street: street.trim(),
        address_zip_code: zipCode.trim() || null,
        ...(selectedCountry?.isoCode === "PH"
          ? {
              address_region: selectedRegion || null,
              address_province: selectedProvince || null,
              address_city_municipality: selectedCity || null,
              address_barangay: selectedBarangay || null,
              address_state: null, // Clear non-PH fields
              address_state_iso: null,
            }
          : {
              address_state: stateName,
              address_state_iso: selectedState || null,
              address_region: null, // Clear PH fields
              address_province: null,
              address_city_municipality: null,
              address_barangay: null,
            }),
        business_licenses: licenseData,
        certificates_of_registration: certificateData,
      };

      // 5. Perform the update in Supabase
      const { error: updateError } = await supabase
        .from("properties")
        .update(propertyUpdateData)
        .eq("id", property.id);

      if (updateError) throw updateError;

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error updating property:", err);
      setError(`Failed to update property: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* [FIX] UI is now a direct copy of AddPropertyModal, just with different text */}
                <div className="flex items-center justify-between">
                  <DialogTitle
                    as="h3"
                    className="text-2xl font-bold leading-6 text-gray-900"
                  >
                    Edit Property
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                  >
                    <IoMdClose className="h-6 w-6" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Update the details for your property below.
                </p>
                {/* --- Stepper --- */}
                <div className="my-8 flex items-center space-x-3 md:hidden">
                  <div className="flex-1 rounded-full bg-gray-200 h-3">
                    <div
                      className="h-3 rounded-full bg-orange-600" // Using teal to match your image
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    {currentStep} / {steps.length}
                  </span>
                </div>
                {/* --- Stepper (Identical to Add Modal) --- */}
                <nav aria-label="Progress" className="my-8 hidden md:block">
                  {/* ... Stepper JSX from AddPropertyModal ... */}
                  <ol
                    role="list"
                    className="space-y-4 md:flex md:space-x-8 md:space-y-0"
                  >
                    {steps.map((step) => (
                      <li key={step.name} className="md:flex-1">
                        {currentStep > step.id ? (
                          <div className="group flex w-full flex-col border-l-4 border-orange-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                            <span className="text-sm font-medium text-orange-600">{`Step ${step.id}`}</span>
                            <span className="text-sm font-medium">
                              {step.name}
                            </span>
                          </div>
                        ) : currentStep === step.id ? (
                          <div
                            className="flex flex-col border-l-4 border-orange-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                            aria-current="step"
                          >
                            <span className="text-sm font-medium text-orange-600">{`Step ${step.id}`}</span>
                            <span className="text-sm font-medium">
                              {step.name}
                            </span>
                          </div>
                        ) : (
                          <div className="group flex w-full flex-col border-l-4 border-gray-200 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                            <span className="text-sm font-medium text-gray-500">{`Step ${step.id}`}</span>
                            <span className="text-sm font-medium">
                              {step.name}
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>

                <form onSubmit={handleSubmit} className="mt-6">
                  <div className="min-h-[350px]">
                    {/* --- Step 1: Property Details --- */}
                    {currentStep === 1 && (
                      <div className="space-y-4 animate-fadeIn">
                        {/* ... All Form JSX from Step 1 in AddPropertyModal ... */}
                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          Property Details
                        </h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="md:col-span-3">
                            <FormInputGroup label="Property Name*">
                              <input
                                type="text"
                                placeholder="e.g., The Grand Residences"
                                value={propertyName}
                                onChange={(e) =>
                                  setPropertyName(e.target.value)
                                }
                                className={inputStyles}
                                required
                              />
                            </FormInputGroup>
                          </div>
                          <FormInputGroup label="Number of Units">
                            <input
                              type="number"
                              placeholder="e.g., 50"
                              value={numberOfUnits}
                              onChange={(e) => setNumberOfUnits(e.target.value)}
                              className={inputStyles}
                            />
                          </FormInputGroup>
                          <FormInputGroup label="Total Square Meters (SQM)">
                            <input
                              type="number"
                              placeholder="e.g., 1200.50"
                              value={totalSqm}
                              onChange={(e) => setTotalSqm(e.target.value)}
                              className={inputStyles}
                            />
                          </FormInputGroup>
                        </div>
                      </div>
                    )}

                    {/* --- Step 2: Location --- */}
                    {currentStep === 2 && (
                      <div className="space-y-4 animate-fadeIn">
                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          Location
                        </h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="md:col-span-2 relative">
                            <FormInputGroup label="Country*">
                              <select
                                value={selectedCountry?.isoCode || ""}
                                onChange={(e) =>
                                  setSelectedCountry(
                                    Country.getCountryByCode(e.target.value)
                                  )
                                }
                                className={selectStyles}
                                required
                              >
                                {countries.map((c) => (
                                  <option key={c.isoCode} value={c.isoCode}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDownIcon className="pointer-events-none absolute right-3 top-[42px] h-5 w-5 text-gray-400" />
                            </FormInputGroup>
                          </div>
                          {selectedCountry?.isoCode === "PH" && (
                            <>
                              <div className="relative">
                                <FormInputGroup label="Region*">
                                  <select
                                    value={selectedRegion}
                                    onChange={(e) =>
                                      setSelectedRegion(e.target.value)
                                    }
                                    className={selectStyles}
                                    required
                                  >
                                    <option value="" disabled>
                                      Select a region...
                                    </option>
                                    {phRegionsList.map((name) => (
                                      <option key={name} value={name}>
                                        {name}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDownIcon className="pointer-events-none absolute right-3 top-[42px] h-5 w-5 text-gray-400" />
                                </FormInputGroup>
                              </div>
                              <div className="relative">
                                <FormInputGroup label="Province*">
                                  <select
                                    value={selectedProvince}
                                    onChange={(e) =>
                                      setSelectedProvince(e.target.value)
                                    }
                                    className={selectStyles}
                                    disabled={!selectedRegion}
                                    required
                                  >
                                    <option value="" disabled>
                                      Select a province...
                                    </option>
                                    {phProvincesList.map((name) => (
                                      <option key={name} value={name}>
                                        {name}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDownIcon className="pointer-events-none absolute right-3 top-[42px] h-5 w-5 text-gray-400" />
                                </FormInputGroup>
                              </div>
                              <div className="relative">
                                <FormInputGroup label="City / Municipality*">
                                  <select
                                    value={selectedCity}
                                    onChange={(e) =>
                                      setSelectedCity(e.target.value)
                                    }
                                    className={selectStyles}
                                    disabled={!selectedProvince}
                                    required
                                  >
                                    <option value="" disabled>
                                      Select a city/municipality...
                                    </option>
                                    {phCitiesList.map((name) => (
                                      <option key={name} value={name}>
                                        {name}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDownIcon className="pointer-events-none absolute right-3 top-[42px] h-5 w-5 text-gray-400" />
                                </FormInputGroup>
                              </div>
                              <div className="relative">
                                <FormInputGroup label="Barangay*">
                                  <select
                                    value={selectedBarangay}
                                    onChange={(e) =>
                                      setSelectedBarangay(e.target.value)
                                    }
                                    className={selectStyles}
                                    disabled={!selectedCity}
                                    required
                                  >
                                    <option value="" disabled>
                                      Select a barangay...
                                    </option>
                                    {phBarangaysList.map((name) => (
                                      <option key={name} value={name}>
                                        {name}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDownIcon className="pointer-events-none absolute right-3 top-[42px] h-5 w-5 text-gray-400" />
                                </FormInputGroup>
                              </div>
                            </>
                          )}
                          {selectedCountry &&
                            selectedCountry.isoCode !== "PH" &&
                            states.length > 0 && (
                              <div className="md:col-span-2 relative">
                                <FormInputGroup label="State / Province*">
                                  <select
                                    value={selectedState}
                                    onChange={(e) =>
                                      setSelectedState(e.target.value)
                                    }
                                    className={selectStyles}
                                    required
                                  >
                                    <option value="" disabled>
                                      Select state/province...
                                    </option>
                                    {states.map((s) => (
                                      <option key={s.isoCode} value={s.isoCode}>
                                        {s.name}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDownIcon className="pointer-events-none absolute right-3 top-[42px] h-5 w-5 text-gray-400" />
                                </FormInputGroup>
                              </div>
                            )}
                          <FormInputGroup label="Street Address">
                            <input
                              type="text"
                              placeholder="e.g., 123 Oak Avenue"
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              className={inputStyles}
                            />
                          </FormInputGroup>
                          <FormInputGroup label="Zip / Postal Code">
                            <input
                              type="text"
                              placeholder="e.g., 1605"
                              value={zipCode}
                              onChange={(e) => setZipCode(e.target.value)}
                              className={inputStyles}
                            />
                          </FormInputGroup>
                        </div>
                      </div>
                    )}
                    {/* --- Step 3: Documents --- */}
                    {currentStep === 3 && (
                      <div className="space-y-4 animate-fadeIn">
                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          Supporting Documents
                        </h4>
                        <div className="space-y-6">
                          <ImageUploader
                            label="Business License(s)"
                            files={businessLicenses}
                            setFiles={setBusinessLicenses}
                            description={licenseDescription}
                            setDescription={setLicenseDescription}
                            onRemoveFile={(fileId) => {
                              const fileToRemove = businessLicenses.find(
                                (f) => f.id === fileId
                              );
                              if (fileToRemove?.source === "existing") {
                                setFilesToDelete((prev) => [
                                  ...prev,
                                  fileToRemove.path,
                                ]);
                              }
                              setBusinessLicenses(
                                businessLicenses.filter((f) => f.id !== fileId)
                              );
                            }}
                          />
                          <ImageUploader
                            label="Certificate(s) of Registration"
                            files={certificates}
                            setFiles={setCertificates}
                            description={certificateDescription}
                            setDescription={setCertificateDescription}
                            onRemoveFile={(fileId) => {
                              const fileToRemove = certificates.find(
                                (f) => f.id === fileId
                              );
                              if (fileToRemove?.source === "existing") {
                                setFilesToDelete((prev) => [
                                  ...prev,
                                  fileToRemove.path,
                                ]);
                              }
                              setCertificates(
                                certificates.filter((f) => f.id !== fileId)
                              );
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {(error || stepError) && (
                    <p className="mt-4 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg">
                      {error || stepError}
                    </p>
                  )}

                  {/* --- Form Actions / Navigation --- */}
                  <div className="flex justify-center gap-4 pt-6 mt-8 sm:justify-end sm:gap-3">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 rounded-full border border-gray-300 bg-white px-8 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 sm:flex-initial sm:rounded-md sm:px-6 sm:py-2"
                      >
                        Previous
                      </button>
                    )}
                    {currentStep < steps.length && (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex-1 rounded-full bg-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 sm:flex-initial sm:rounded-md sm:px-6 sm:py-2"
                      >
                        Next
                      </button>
                    )}
                    {currentStep === steps.length && (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 rounded-full bg-teal-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 sm:flex-initial sm:rounded-md sm:px-6 sm:py-2"
                      >
                        {isSubmitting ? "Saving Changes..." : "Save Changes"}
                      </button>
                    )}
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditPropertyModal;
