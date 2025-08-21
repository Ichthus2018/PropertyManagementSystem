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
// OPTIMIZED: Removed static imports for country-state-city and barangay
// import { Country, State } from "country-state-city";
// import barangay from "barangay";
import ImageUploader from "../../ui/ImageUploader";
import { v4 as uuidv4 } from "uuid";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { IoMdClose } from "react-icons/io";
import Stepper from "../../ui/common/Stepper";
// --- Helper components and functions (Consistent with AddPropertyModal) ---
const FormInputGroup = ({ label, children, description }) => (
  <div>
    <label className="block mb-1.5 text-sm font-medium text-gray-700">
      {label}
    </label>
    {children}
    {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
  </div>
);
const inputStyles =
  "block w-full text-sm rounded-lg border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-orange-500 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-60";
const selectStyles = `${inputStyles} appearance-none`;

// --- MISSING HELPER FUNCTION FROM COMPONENT 1 ---
const changeFileExtension = (filename, newExtension) => {
  const lastDot = filename.lastIndexOf(".");
  const baseName = lastDot === -1 ? filename : filename.substring(0, lastDot);
  return `${baseName}.${newExtension}`;
};

// --- MISSING IMAGE CONVERSION FUNCTION FROM COMPONENT 1 ---
const convertImageToAvif = (file, options = { quality: 0.8 }) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    if (
      typeof canvas.toDataURL !== "function" ||
      canvas.toDataURL("image/avif").indexOf("data:image/avif") < 0
    ) {
      console.warn(
        "AVIF conversion not supported by this browser. Uploading original file."
      );
      resolve(file); // Fallback to original file
      return;
    }
    const blobURL = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(blobURL); // Clean up memory
          if (blob && blob.type === "image/avif") {
            const newFileName = changeFileExtension(file.name, "avif");
            const avifFile = new File([blob], newFileName, {
              type: "image/avif",
            });
            console.log(
              `Converted ${file.name} (${(file.size / 1024).toFixed(
                2
              )} KB) to ${avifFile.name} (${(avifFile.size / 1024).toFixed(
                2
              )} KB)`
            );
            resolve(avifFile);
          } else {
            // Fallback if conversion fails for any reason
            resolve(file);
          }
        },
        "image/avif",
        options.quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobURL);
      console.error(
        "Could not load image for conversion. Uploading original file."
      );
      resolve(file); // Fallback to original file
    };
    img.src = blobURL;
  });
};

// --- UPDATED UPLOAD FILES FUNCTION WITH IMAGE CONVERSION ---
const uploadFiles = async (files, userId) => {
  if (!userId) {
    throw new Error("User ID is required for uploading files.");
  }
  const uploadedFileData = [];
  for (const item of files) {
    if (item.source === "new" && item.file) {
      let fileToUpload = item.file;
      // Check if the file is an image and convert it to AVIF if possible
      if (item.file.type.startsWith("image/")) {
        try {
          fileToUpload = await convertImageToAvif(item.file);
        } catch (conversionError) {
          console.error(
            "Image conversion failed, uploading original:",
            conversionError
          );
          fileToUpload = item.file; // Ensure fallback on error
        }
      }
      // The filePath uses the name of the file being uploaded (which might now be .avif)
      const filePath = `user_${userId}/${uuidv4()}-${fileToUpload.name}`;
      const { error: uploadError } = await supabase.storage
        .from("property-documents")
        .upload(filePath, fileToUpload); // Use the (potentially converted) file
      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw new Error(`Failed to upload ${fileToUpload.name}.`);
      }
      const { data } = supabase.storage
        .from("property-documents")
        .getPublicUrl(filePath);
      if (!data?.publicUrl) {
        throw new Error(`Could not get public URL for ${fileToUpload.name}.`);
      }
      uploadedFileData.push({ url: data.publicUrl, path: filePath });
    }
  }
  return uploadedFileData;
};

const steps = ["Property Details", "Location", "Documents"];
// --- Main Modal Component ---
const EditPropertyModal = ({ isOpen, onClose, onSuccess, property }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [stepError, setStepError] = useState("");
  const userProfile = useAuthStore((state) => state.userProfile);
  // Form State
  const [propertyName, setPropertyName] = useState("");
  const [numberOfUnits, setNumberOfUnits] = useState("");
  const [overallSqm, setOverallSqm] = useState("");
  const [totalUnitSqm, setTotalUnitSqm] = useState("");
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
  const [filesToDelete, setFilesToDelete] = useState([]);
  // --- DERIVED STATE FOR SQM CALCULATION ---
  const parsedOverallSqm = parseFloat(overallSqm || 0);
  const parsedTotalUnitSqm = parseFloat(totalUnitSqm || 0);
  const unusedSqm = parsedOverallSqm - parsedTotalUnitSqm;
  // OPTIMIZED: Effect to populate form when property data is available and modal opens.
  // This now dynamically loads all necessary location data at once.
  useEffect(() => {
    const populateForm = async () => {
      if (!property) return;
      // Step 1 Fields
      setPropertyName(property.property_name || "");
      setNumberOfUnits(property.number_of_units || "");
      setOverallSqm(property.overall_sqm || "");
      setTotalUnitSqm(property.total_sqm || "");
      // Step 2 Fields
      setStreet(property.address_street || "");
      setZipCode(property.address_zip_code || "");
      // Dynamically load libraries
      const { Country, State } = await import("country-state-city");
      // Populate country list and set selected country
      const allCountries = Country.getAllCountries();
      setCountries(allCountries);
      const initialCountry =
        allCountries.find((c) => c.isoCode === property.address_country_iso) ||
        null;
      setSelectedCountry(initialCountry);
      // Populate location dropdowns based on property's country
      if (property.address_country_iso === "PH") {
        const { default: barangay } = await import("barangay");
        const region = property.address_region || "";
        const province = property.address_province || "";
        const city = property.address_city_municipality || "";
        // Load all dropdown lists based on existing data
        setPhRegionsList(barangay());
        if (region) setPhProvincesList(barangay(region));
        if (region && province) setPhCitiesList(barangay(region, province));
        if (region && province && city)
          setPhBarangaysList(barangay(region, province, city));
        // Set selected values
        setSelectedRegion(region);
        setSelectedProvince(province);
        setSelectedCity(city);
        setSelectedBarangay(property.address_barangay || "");
      } else if (initialCountry) {
        setStates(State.getStatesOfCountry(initialCountry.isoCode));
        setSelectedState(property.address_state_iso || "");
      }
      // Step 3 Fields
      const mapExistingFiles = (doc) => {
        if (!doc || !Array.isArray(doc.files)) return [];
        return doc.files.map((f) => ({
          ...f,
          id: f.path,
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
      // Reset internal state
      setFilesToDelete([]);
      setError("");
      setStepError("");
      setCurrentStep(1);
    };
    if (isOpen) {
      populateForm();
    }
  }, [property, isOpen]);
  // OPTIMIZED: Location-based useEffects now only load data.
  // State clearing is handled by user interaction in `onChange` handlers to prevent race conditions.
  useEffect(() => {
    const loadStates = async () => {
      if (selectedCountry && selectedCountry.isoCode !== "PH") {
        const { State } = await import("country-state-city");
        setStates(State.getStatesOfCountry(selectedCountry.isoCode));
      } else {
        setStates([]);
      }
    };
    if (isOpen) loadStates();
  }, [selectedCountry, isOpen]);
  useEffect(() => {
    const loadProvinces = async () => {
      if (selectedRegion) {
        try {
          const { default: barangay } = await import("barangay");
          setPhProvincesList(barangay(selectedRegion));
        } catch (e) {
          console.error(`Failed to load provinces for ${selectedRegion}:`, e);
          setPhProvincesList([]);
        }
      } else {
        setPhProvincesList([]);
      }
    };
    if (isOpen) loadProvinces();
  }, [selectedRegion, isOpen]);
  useEffect(() => {
    const loadCities = async () => {
      if (selectedRegion && selectedProvince) {
        try {
          const { default: barangay } = await import("barangay");
          setPhCitiesList(barangay(selectedRegion, selectedProvince));
        } catch (e) {
          console.error(`Failed to load cities for ${selectedProvince}:`, e);
          setPhCitiesList([]);
        }
      } else {
        setPhCitiesList([]);
      }
    };
    if (isOpen) loadCities();
  }, [selectedRegion, selectedProvince, isOpen]);
  useEffect(() => {
    const loadBarangays = async () => {
      if (selectedRegion && selectedProvince && selectedCity) {
        try {
          const { default: barangay } = await import("barangay");
          setPhBarangaysList(
            barangay(selectedRegion, selectedProvince, selectedCity)
          );
        } catch (e) {
          console.error(`Failed to load barangays for ${selectedCity}:`, e);
          setPhBarangaysList([]);
        }
      } else {
        setPhBarangaysList([]);
      }
    };
    if (isOpen) loadBarangays();
  }, [selectedRegion, selectedProvince, selectedCity, isOpen]);
  // --- Form Handlers ---
  const handleClose = () => {
    onClose();
  };
  const handleNext = () => {
    setStepError("");
    let isValid = true;
    if (currentStep === 1) {
      if (!propertyName.trim()) {
        setStepError("Property Name is a required field.");
        isValid = false;
      }
      if (unusedSqm < 0) {
        setStepError(
          "Total Unit SQM cannot be greater than the Overall Property SQM."
        );
        isValid = false;
      }
    }
    if (currentStep === 2) {
      if (!selectedCountry) {
        setStepError("Country is a required field.");
        isValid = false;
      } else if (selectedCountry.isoCode === "PH") {
        if (!selectedRegion) {
          setStepError("Region is required for properties in the Philippines.");
          isValid = false;
        } else if (!selectedProvince) {
          setStepError(
            "Province is required for properties in the Philippines."
          );
          isValid = false;
        } else if (!selectedCity) {
          setStepError(
            "City / Municipality is required for properties in the Philippines."
          );
          isValid = false;
        } else if (!selectedBarangay) {
          setStepError(
            "Barangay is required for properties in the Philippines."
          );
          isValid = false;
        }
      } else if (states.length > 0 && !selectedState) {
        setStepError("State / Province is required.");
        isValid = false;
      }
    }
    if (isValid) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };
  const handleBack = () => {
    setStepError("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== steps.length) return;
    if (unusedSqm < 0) {
      setError("Cannot save: Total Unit SQM exceeds Overall Property SQM.");
      return;
    }
    if (!property || !userProfile?.id) {
      setError("Cannot update property. Missing required data.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    setStepError("");
    try {
      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from("property-documents")
          .remove(filesToDelete);
        if (deleteError) {
          console.error("Error deleting old files:", deleteError);
        }
      }
      const uploadedLicenseFiles = await uploadFiles(
        businessLicenses,
        userProfile.id
      );
      const uploadedCertFiles = await uploadFiles(certificates, userProfile.id);
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
      const propertyUpdateData = {
        last_edited_by: userProfile.id,
        property_name: propertyName.trim(),
        number_of_units: numberOfUnits ? parseInt(numberOfUnits, 10) : null,
        total_sqm: totalUnitSqm ? parseFloat(totalUnitSqm) : null,
        overall_sqm: overallSqm ? parseFloat(overallSqm) : null,
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
              address_state: null,
              address_state_iso: null,
            }
          : {
              address_state: stateName,
              address_state_iso: selectedState || null,
              address_region: null,
              address_province: null,
              address_city_municipality: null,
              address_barangay: null,
            }),
        business_licenses: licenseData,
        certificates_of_registration: certificateData,
      };
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
  const createSetFilesWithDeletion = (filesState, setFilesState) => {
    return (newFiles) => {
      const currentFileIds = new Set(newFiles.map((f) => f.id));
      const removedFiles = filesState.filter((f) => !currentFileIds.has(f.id));
      const existingFilesToRemove = removedFiles
        .filter((f) => f.source === "existing")
        .map((f) => f.path);
      if (existingFilesToRemove.length > 0) {
        setFilesToDelete((prev) => [...prev, ...existingFilesToRemove]);
      }
      setFilesState(newFiles);
    };
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
                  Update the details for "
                  {property?.property_name || "your property"}".
                </p>
                <Stepper currentStep={currentStep} steps={steps} />
                <form onSubmit={handleSubmit} className="mt-6">
                  <div className="min-h-[350px]">
                    {/* Step 1 & 3 are unchanged */}
                    {currentStep === 1 && (
                      <div className="space-y-4 animate-fadeIn">
                        {/* ... (Step 1 JSX remains identical) ... */}
                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          Property Details
                        </h4>
                        <div className="md:col-span-3">
                          <FormInputGroup label="Property Name*">
                            <input
                              type="text"
                              placeholder="e.g., The Grand Residences"
                              value={propertyName}
                              onChange={(e) => setPropertyName(e.target.value)}
                              className={inputStyles}
                              required
                            />
                          </FormInputGroup>
                        </div>
                        <div>
                          <FormInputGroup
                            label="Overall Property SQM"
                            description="The total physical size of the property, including common areas like hallways."
                          >
                            <input
                              type="number"
                              step="0.01"
                              placeholder="e.g., 1500"
                              value={overallSqm}
                              onChange={(e) => setOverallSqm(e.target.value)}
                              className={inputStyles}
                            />
                          </FormInputGroup>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          Units Details
                        </h4>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div>
                            <FormInputGroup label="Number of Units">
                              <input
                                type="number"
                                placeholder="e.g., 50"
                                value={numberOfUnits}
                                onChange={(e) =>
                                  setNumberOfUnits(e.target.value)
                                }
                                className={inputStyles}
                                min="0"
                              />
                            </FormInputGroup>
                          </div>
                          <div>
                            <FormInputGroup
                              label="Total Unit SQM"
                              description="The sum of the area of all rentable units. This will be used for unit allocation."
                            >
                              <input
                                type="number"
                                step="0.01"
                                placeholder="e.g., 1200.50"
                                value={totalUnitSqm}
                                onChange={(e) =>
                                  setTotalUnitSqm(e.target.value)
                                }
                                className={inputStyles}
                              />
                            </FormInputGroup>
                          </div>
                        </div>
                        {overallSqm > 0 && totalUnitSqm > 0 && (
                          <div
                            className={`mt-6 p-4 rounded-lg text-sm ${
                              unusedSqm < 0
                                ? "bg-red-50 text-red-800 border-red-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            } border transition-colors`}
                          >
                            <h5 className="font-bold mb-2">Area Calculation</h5>
                            <div className="space-y-1">
                              <p>
                                Overall Property Area:{" "}
                                <span className="font-semibold">
                                  {parsedOverallSqm.toLocaleString()} sqm
                                </span>
                              </p>
                              <p>
                                - Total Unit Area:{" "}
                                <span className="font-semibold">
                                  {parsedTotalUnitSqm.toLocaleString()} sqm
                                </span>
                              </p>
                              <hr className="my-1" />
                              <p
                                className={`font-bold ${
                                  unusedSqm < 0 ? "text-red-600" : ""
                                }`}
                              >
                                = Common/Unused Area:{" "}
                                <span>{unusedSqm.toLocaleString()} sqm</span>
                              </p>
                            </div>
                            {unusedSqm < 0 && (
                              <p className="mt-2 font-semibold">
                                Warning: The total unit area cannot be larger
                                than the overall property area.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {/* --- Step 2: Location (OPTIMIZED)--- */}
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
                                // OPTIMIZED: onChange handler to dynamically load lib and clear children states
                                onChange={async (e) => {
                                  const { Country } = await import(
                                    "country-state-city"
                                  );
                                  setSelectedCountry(
                                    Country.getCountryByCode(e.target.value)
                                  );
                                  setSelectedState("");
                                  setSelectedRegion("");
                                  setSelectedProvince("");
                                  setSelectedCity("");
                                  setSelectedBarangay("");
                                }}
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
                                    // OPTIMIZED: onChange handler to clear children states
                                    onChange={(e) => {
                                      setSelectedRegion(e.target.value);
                                      setSelectedProvince("");
                                      setSelectedCity("");
                                      setSelectedBarangay("");
                                    }}
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
                                    // OPTIMIZED: onChange handler to clear children states
                                    onChange={(e) => {
                                      setSelectedProvince(e.target.value);
                                      setSelectedCity("");
                                      setSelectedBarangay("");
                                    }}
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
                                    // OPTIMIZED: onChange handler to clear children states
                                    onChange={(e) => {
                                      setSelectedCity(e.target.value);
                                      setSelectedBarangay("");
                                    }}
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
                    {currentStep === 3 && (
                      <div className="space-y-4 animate-fadeIn">
                        {/* ... (Step 3 JSX remains identical) ... */}
                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          Supporting Documents
                        </h4>
                        <p className="text-sm text-gray-600">
                          Add, remove, or update supporting documents for this
                          property.
                        </p>
                        <div className="space-y-6">
                          // In the JSX for Step 3, update the ImageUploader
                          components
                          <ImageUploader
                            label="Business License(s)"
                            files={businessLicenses}
                            setFiles={setBusinessLicenses}
                            description={licenseDescription}
                            setDescription={setLicenseDescription}
                          />
                          <ImageUploader
                            label="Certificate(s) of Registration"
                            files={certificates}
                            setFiles={setCertificates}
                            description={certificateDescription}
                            setDescription={setCertificateDescription}
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
