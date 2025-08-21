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
import ImageUploader from "../../ui/ImageUploader";
import { v4 as uuidv4 } from "uuid";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { IoMdClose } from "react-icons/io";
import Stepper from "../../ui/common/Stepper";
import axios from "axios";

// --- New Philippine Address API Functions ---
const fetchAddressData = (jsonPathName) =>
  axios.get(
    `https://isaacdarcilla.github.io/philippine-addresses/${jsonPathName}.json`
  );

/**
 * @returns all regions
 */
const getRegions = async () => {
  try {
    const response = await fetchAddressData("region");
    return response.data.map((region) => ({
      id: region.id,
      psgc_code: region.psgc_code,
      region_name: region.region_name,
      region_code: region.region_code,
    }));
  } catch (e) {
    console.error("Error fetching regions:", e.message);
    throw e;
  }
};

/**
 * @param {string} regionCode
 * @returns all provinces based on region code parameter.
 */
const getProvinces = async (regionCode) => {
  try {
    const response = await fetchAddressData("province");
    return response.data
      .filter((province) => province.region_code === regionCode)
      .map((filtered) => ({
        psgc_code: filtered.psgc_code,
        province_name: filtered.province_name,
        province_code: filtered.province_code,
        region_code: filtered.region_code,
      }));
  } catch (e) {
    console.error("Error fetching provinces:", e.message);
    throw e;
  }
};

/**
 * @param {string} provinceCode
 * @returns all cities based on province code parameter.
 */
const getCities = async (provinceCode) => {
  try {
    const response = await fetchAddressData("city");
    return response.data
      .filter((city) => city.province_code === provinceCode)
      .map((filtered) => ({
        city_name: filtered.city_name,
        city_code: filtered.city_code,
        province_code: filtered.province_code,
        region_desc: filtered.region_desc,
      }));
  } catch (e) {
    console.error("Error fetching cities:", e.message);
    throw e;
  }
};

/**
 * @param {string} cityCode
 * @returns all barangays based on city code parameter.
 */
const getBarangays = async (cityCode) => {
  try {
    const response = await fetchAddressData("barangay");
    return response.data
      .filter((barangay) => barangay.city_code === cityCode)
      .map((filtered) => ({
        brgy_name: filtered.brgy_name,
        brgy_code: filtered.brgy_code,
        province_code: filtered.province_code,
        region_code: filtered.region_code,
      }));
  } catch (e) {
    console.error("Error fetching barangays:", e.message);
    throw e;
  }
};
// --- End of New Address Functions ---

// --- Helper components and functions ---
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

const changeFileExtension = (filename, newExtension) => {
  const lastDot = filename.lastIndexOf(".");
  const baseName = lastDot === -1 ? filename : filename.substring(0, lastDot);
  return `${baseName}.${newExtension}`;
};

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

const uploadFiles = async (files, userId) => {
  if (!userId) {
    throw new Error("User ID is required for uploading files.");
  }
  const uploadedFileData = [];
  for (const item of files) {
    if (item.source === "new" && item.file) {
      let fileToUpload = item.file;
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
      const filePath = `user_${userId}/${uuidv4()}-${fileToUpload.name}`;
      const { error: uploadError } = await supabase.storage
        .from("property-documents")
        .upload(filePath, fileToUpload);
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

  // Location State (Philippines Only) - Stores arrays of objects
  const [phRegionsList, setPhRegionsList] = useState([]);
  const [phProvincesList, setPhProvincesList] = useState([]);
  const [phCitiesList, setPhCitiesList] = useState([]);
  const [phBarangaysList, setPhBarangaysList] = useState([]);

  // Location State - Stores the selected CODE for each level
  const [selectedRegionCode, setSelectedRegionCode] = useState("");
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [selectedCityCode, setSelectedCityCode] = useState("");
  const [selectedBarangayCode, setSelectedBarangayCode] = useState("");

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

  // --- Effects for fetching address data ---
  // Fetch Regions on component mount
  useEffect(() => {
    const loadInitialPhRegions = async () => {
      try {
        const regionsData = await getRegions();
        setPhRegionsList(regionsData);
      } catch (e) {
        console.error("Failed to load Philippine regions:", e);
        setPhRegionsList([]);
      }
    };
    loadInitialPhRegions();
  }, []);

  // Fetch Provinces when a Region is selected
  useEffect(() => {
    // FIX: Clear province list and reset selections immediately when region changes.
    setPhProvincesList([]);
    setSelectedProvinceCode("");
    const loadProvinces = async () => {
      if (selectedRegionCode) {
        try {
          const provincesData = await getProvinces(selectedRegionCode);
          setPhProvincesList(provincesData);
        } catch (e) {
          console.error(
            `Failed to load provinces for ${selectedRegionCode}:`,
            e
          );
          setPhProvincesList([]);
        }
      }
    };
    loadProvinces();
  }, [selectedRegionCode]);

  // Fetch Cities when a Province is selected
  useEffect(() => {
    // FIX: Clear city list and reset selections immediately when province changes.
    setPhCitiesList([]);
    setSelectedCityCode("");
    const loadCities = async () => {
      if (selectedProvinceCode) {
        try {
          const citiesData = await getCities(selectedProvinceCode);
          setPhCitiesList(citiesData);
        } catch (e) {
          console.error(
            `Failed to load cities for ${selectedProvinceCode}:`,
            e
          );
          setPhCitiesList([]);
        }
      }
    };
    loadCities();
  }, [selectedProvinceCode]);

  // Fetch Barangays when a City is selected
  useEffect(() => {
    // FIX: Clear barangay list and reset selection immediately when city changes.
    setPhBarangaysList([]);
    setSelectedBarangayCode("");
    const loadBarangays = async () => {
      if (selectedCityCode) {
        try {
          const barangaysData = await getBarangays(selectedCityCode);
          setPhBarangaysList(barangaysData);
        } catch (e) {
          console.error(`Failed to load barangays for ${selectedCityCode}:`, e);
          setPhBarangaysList([]);
        }
      }
    };
    loadBarangays();
  }, [selectedCityCode]);

  // Effect to populate form when property data is available and modal opens.
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

      // Load regions first
      try {
        const regionsData = await getRegions();
        setPhRegionsList(regionsData);

        // Find the region code from the property data
        const regionName = property.address_region;
        const region = regionsData.find((r) => r.region_name === regionName);

        if (region) {
          setSelectedRegionCode(region.region_code);

          // Load provinces for this region
          const provincesData = await getProvinces(region.region_code);
          setPhProvincesList(provincesData);

          // Find the province code from the property data
          const provinceName = property.address_province;
          const province = provincesData.find(
            (p) => p.province_name === provinceName
          );

          if (province) {
            setSelectedProvinceCode(province.province_code);

            // Load cities for this province
            const citiesData = await getCities(province.province_code);
            setPhCitiesList(citiesData);

            // Find the city code from the property data
            const cityName = property.address_city_municipality;
            const city = citiesData.find((c) => c.city_name === cityName);

            if (city) {
              setSelectedCityCode(city.city_code);

              // Load barangays for this city
              const barangaysData = await getBarangays(city.city_code);
              setPhBarangaysList(barangaysData);

              // Find the barangay code from the property data
              const barangayName = property.address_barangay;
              const barangay = barangaysData.find(
                (b) => b.brgy_name === barangayName
              );

              if (barangay) {
                setSelectedBarangayCode(barangay.brgy_code);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to populate address data:", e);
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
      if (!selectedRegionCode) {
        setStepError("Region is a required field.");
        isValid = false;
      } else if (!selectedProvinceCode) {
        setStepError("Province is a required field.");
        isValid = false;
      } else if (!selectedCityCode) {
        setStepError("City / Municipality is a required field.");
        isValid = false;
      } else if (!selectedBarangayCode) {
        setStepError("Barangay is a required field.");
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

      // Find the selected names from the lists using the stored codes
      const selectedRegionName = phRegionsList.find(
        (r) => r.region_code === selectedRegionCode
      )?.region_name;
      const selectedProvinceName = phProvincesList.find(
        (p) => p.province_code === selectedProvinceCode
      )?.province_name;
      const selectedCityName = phCitiesList.find(
        (c) => c.city_code === selectedCityCode
      )?.city_name;
      const selectedBarangayName = phBarangaysList.find(
        (b) => b.brgy_code === selectedBarangayCode
      )?.brgy_name;

      const propertyUpdateData = {
        last_edited_by: userProfile.id,
        property_name: propertyName.trim(),
        number_of_units: numberOfUnits ? parseInt(numberOfUnits, 10) : null,
        total_sqm: totalUnitSqm ? parseFloat(totalUnitSqm) : null,
        overall_sqm: overallSqm ? parseFloat(overallSqm) : null,
        address_country: "Philippines",
        address_country_iso: "PH",
        address_street: street.trim(),
        address_zip_code: zipCode.trim() || null,
        address_region: selectedRegionName || null,
        address_province: selectedProvinceName || null,
        address_city_municipality: selectedCityName || null,
        address_barangay: selectedBarangayName || null,
        address_state: null, // Clear out non-PH fields
        address_state_iso: null, // Clear out non-PH fields
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
        setFilesToDelete((prev) => [
          ...new Set([...prev, ...existingFilesToRemove]),
        ]);
      }
      setFilesState(newFiles);
    };
  };

  // Create wrapped state setters for ImageUploaders
  const setBusinessLicensesWithDeletion = createSetFilesWithDeletion(
    businessLicenses,
    setBusinessLicenses
  );
  const setCertificatesWithDeletion = createSetFilesWithDeletion(
    certificates,
    setCertificates
  );

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
                    {currentStep === 1 && (
                      <div className="space-y-4 animate-fadeIn">
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
                    {/* --- Step 2: Location (Philippines Only)--- */}
                    {currentStep === 2 && (
                      <div className="space-y-4 animate-fadeIn">
                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          Location
                        </h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <FormInputGroup label="Country*">
                              <input
                                type="text"
                                value="Philippines"
                                className={inputStyles}
                                disabled
                                readOnly
                              />
                            </FormInputGroup>
                          </div>
                          <div className="relative">
                            <FormInputGroup label="Region*">
                              <select
                                value={selectedRegionCode}
                                onChange={(e) =>
                                  setSelectedRegionCode(e.target.value)
                                }
                                className={selectStyles}
                                required
                              >
                                <option value="" disabled>
                                  Select a region...
                                </option>
                                {phRegionsList.map((region) => (
                                  <option
                                    key={region.region_code}
                                    value={region.region_code}
                                  >
                                    {region.region_name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDownIcon className="pointer-events-none absolute right-3 top-[42px] h-5 w-5 text-gray-400" />
                            </FormInputGroup>
                          </div>
                          <div className="relative">
                            <FormInputGroup label="Province*">
                              <select
                                value={selectedProvinceCode}
                                onChange={(e) =>
                                  setSelectedProvinceCode(e.target.value)
                                }
                                className={selectStyles}
                                disabled={!selectedRegionCode}
                                required
                              >
                                <option value="" disabled>
                                  Select a province...
                                </option>
                                {phProvincesList.map((province) => (
                                  <option
                                    key={province.province_code}
                                    value={province.province_code}
                                  >
                                    {province.province_name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDownIcon className="pointer-events-none absolute right-3 top-[42px] h-5 w-5 text-gray-400" />
                            </FormInputGroup>
                          </div>
                          <div className="relative">
                            <FormInputGroup label="City / Municipality*">
                              <select
                                value={selectedCityCode}
                                onChange={(e) =>
                                  setSelectedCityCode(e.target.value)
                                }
                                className={selectStyles}
                                disabled={!selectedProvinceCode}
                                required
                              >
                                <option value="" disabled>
                                  Select a city/municipality...
                                </option>
                                {phCitiesList.map((city) => (
                                  <option
                                    key={city.city_code}
                                    value={city.city_code}
                                  >
                                    {city.city_name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDownIcon className="pointer-events-none absolute right-3 top-[42px] h-5 w-5 text-gray-400" />
                            </FormInputGroup>
                          </div>
                          <div className="relative">
                            <FormInputGroup label="Barangay*">
                              <select
                                value={selectedBarangayCode}
                                onChange={(e) =>
                                  setSelectedBarangayCode(e.target.value)
                                }
                                className={selectStyles}
                                disabled={!selectedCityCode}
                                required
                              >
                                <option value="" disabled>
                                  Select a barangay...
                                </option>
                                {phBarangaysList.map((barangay) => (
                                  <option
                                    key={barangay.brgy_code}
                                    value={barangay.brgy_code}
                                  >
                                    {barangay.brgy_name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDownIcon className="pointer-events-none absolute right-3 top-[42px] h-5 w-5 text-gray-400" />
                            </FormInputGroup>
                          </div>
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
                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          Supporting Documents
                        </h4>
                        <p className="text-sm text-gray-600">
                          Add, remove, or update supporting documents for this
                          property.
                        </p>
                        <div className="space-y-6">
                          <ImageUploader
                            label="Business License(s)"
                            files={businessLicenses}
                            setFiles={setBusinessLicensesWithDeletion}
                            description={licenseDescription}
                            setDescription={setLicenseDescription}
                          />
                          <ImageUploader
                            label="Certificate(s) of Registration"
                            files={certificates}
                            setFiles={setCertificatesWithDeletion}
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
