import { useState, useEffect, Fragment, useReducer } from "react";
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
import LoadingSpinner from "../../ui/LoadingSpinner";

// --- New Philippine Address API Functions ---
const fetchAddressData = (jsonPathName) =>
  axios.get(
    `https://isaacdarcilla.github.io/philippine-addresses/${jsonPathName}.json`
  );

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

// --- IMAGE OPTIMIZATION: Updated uploadFiles function ---
// In AddPropertyModal.jsx

const uploadFiles = async (files, userId) => {
  if (!userId) throw new Error("User ID is required for uploading files.");

  const uploadPromises = files
    .filter((item) => item.source === "new" && item.file)
    .map(async (item) => {
      // --- CHANGE: item.file is now the ORIGINAL file, not a converted AVIF ---
      const fileToUpload = item.file;
      const filePath = `user_${userId}/${uuidv4()}-${fileToUpload.name}`;

      const { error: uploadError } = await supabase.storage
        .from("property-documents")
        .upload(filePath, fileToUpload);

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw new Error(`Failed to upload ${fileToUpload.name}.`);
      }

      // We get the public URL of the original, high-quality file.
      const { data } = supabase.storage
        .from("property-documents")
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error(`Could not get public URL for ${fileToUpload.name}.`);
      }

      return { url: data.publicUrl, path: filePath };
    });

  return Promise.all(uploadPromises);
};

const steps = ["Property Details", "Location", "Documents"];

// --- Reducer for State Management ---
const initialState = {
  propertyDetails: {
    propertyName: "",
    numberOfUnits: "",
    overallSqm: "",
    totalUnitSqm: "",
  },
  location: {
    street: "",
    zipCode: "",
    regions: { status: "idle", data: [], error: null },
    provinces: { status: "idle", data: [], error: null },
    cities: { status: "idle", data: [], error: null },
    barangays: { status: "idle", data: [], error: null },
    selectedRegionCode: "",
    selectedProvinceCode: "",
    selectedCityCode: "",
    selectedBarangayCode: "",
  },
  documents: {
    businessLicenses: [],
    certificates: [],
    licenseDescription: "",
    certificateDescription: "",
  },
  ui: {
    currentStep: 1,
    isSubmitting: false,
    error: "",
    stepError: "",
  },
};

function formReducer(state, action) {
  switch (action.type) {
    // Generic field update for property details
    case "SET_PROPERTY_DETAIL":
      return {
        ...state,
        propertyDetails: {
          ...state.propertyDetails,
          [action.field]: action.payload,
        },
      };

    // Location selection handlers that reset dependent fields
    case "SET_REGION":
      return {
        ...state,
        location: {
          ...state.location,
          selectedRegionCode: action.payload,
          selectedProvinceCode: "",
          selectedCityCode: "",
          selectedBarangayCode: "",
          provinces: { ...initialState.location.provinces, status: "loading" },
          cities: initialState.location.cities,
          barangays: initialState.location.barangays,
        },
      };
    case "SET_PROVINCE":
      return {
        ...state,
        location: {
          ...state.location,
          selectedProvinceCode: action.payload,
          selectedCityCode: "",
          selectedBarangayCode: "",
          cities: { ...initialState.location.cities, status: "loading" },
          barangays: initialState.location.barangays,
        },
      };
    case "SET_CITY":
      return {
        ...state,
        location: {
          ...state.location,
          selectedCityCode: action.payload,
          selectedBarangayCode: "",
          barangays: { ...initialState.location.barangays, status: "loading" },
        },
      };
    case "SET_BARANGAY":
      return {
        ...state,
        location: { ...state.location, selectedBarangayCode: action.payload },
      };

    // Generic location text field update
    case "SET_LOCATION_FIELD":
      return {
        ...state,
        location: { ...state.location, [action.field]: action.payload },
      };

    // Handlers for async location data fetching
    case "FETCH_REGIONS_SUCCESS":
      return {
        ...state,
        location: {
          ...state.location,
          regions: { status: "success", data: action.payload },
        },
      };
    case "FETCH_PROVINCES_SUCCESS":
      return {
        ...state,
        location: {
          ...state.location,
          provinces: { status: "success", data: action.payload },
        },
      };
    case "FETCH_CITIES_SUCCESS":
      return {
        ...state,
        location: {
          ...state.location,
          cities: { status: "success", data: action.payload },
        },
      };
    case "FETCH_BARANGAYS_SUCCESS":
      return {
        ...state,
        location: {
          ...state.location,
          barangays: { status: "success", data: action.payload },
        },
      };
    case "FETCH_LOCATION_ERROR":
      console.error(`Error fetching ${action.level}:`, action.error);
      return {
        ...state,
        location: {
          ...state.location,
          [action.level]: { status: "error", data: [], error: action.error },
        },
      };

    // Document handlers
    case "SET_DOCUMENTS":
      return {
        ...state,
        documents: { ...state.documents, [action.field]: action.payload },
      };

    // UI state handlers
    case "SET_STEP":
      return {
        ...state,
        ui: { ...state.ui, currentStep: action.payload, stepError: "" },
      };
    case "SET_SUBMITTING":
      return { ...state, ui: { ...state.ui, isSubmitting: action.payload } };
    case "SET_ERROR":
      return {
        ...state,
        ui: { ...state.ui, error: action.payload, stepError: "" },
      };
    case "SET_STEP_ERROR":
      return {
        ...state,
        ui: { ...state.ui, stepError: action.payload, error: "" },
      };

    case "RESET_FORM":
      return {
        ...initialState,
        location: { ...initialState.location, regions: state.location.regions },
      }; // Keep regions data on reset

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// --- Main Modal Component ---
const AddPropertyModal = ({ isOpen, onClose, onSuccess }) => {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const userProfile = useAuthStore((state) => state.userProfile);

  const { propertyDetails, location, documents, ui } = state;
  const { currentStep, isSubmitting, error, stepError } = ui;

  // --- DERIVED STATE FOR SQM CALCULATION ---
  const parsedOverallSqm = parseFloat(propertyDetails.overallSqm || 0);
  const parsedTotalUnitSqm = parseFloat(propertyDetails.totalUnitSqm || 0);
  const unusedSqm = parsedOverallSqm - parsedTotalUnitSqm;

  // --- Effects for fetching address data (Now simplified) ---
  useEffect(() => {
    getRegions()
      .then((regionsData) =>
        dispatch({ type: "FETCH_REGIONS_SUCCESS", payload: regionsData })
      )
      .catch((e) =>
        dispatch({
          type: "FETCH_LOCATION_ERROR",
          level: "regions",
          error: e.message,
        })
      );
  }, []);

  useEffect(() => {
    if (location.selectedRegionCode) {
      getProvinces(location.selectedRegionCode)
        .then((provincesData) =>
          dispatch({ type: "FETCH_PROVINCES_SUCCESS", payload: provincesData })
        )
        .catch((e) =>
          dispatch({
            type: "FETCH_LOCATION_ERROR",
            level: "provinces",
            error: e.message,
          })
        );
    }
  }, [location.selectedRegionCode]);

  useEffect(() => {
    if (location.selectedProvinceCode) {
      getCities(location.selectedProvinceCode)
        .then((citiesData) =>
          dispatch({ type: "FETCH_CITIES_SUCCESS", payload: citiesData })
        )
        .catch((e) =>
          dispatch({
            type: "FETCH_LOCATION_ERROR",
            level: "cities",
            error: e.message,
          })
        );
    }
  }, [location.selectedProvinceCode]);

  useEffect(() => {
    if (location.selectedCityCode) {
      getBarangays(location.selectedCityCode)
        .then((barangaysData) =>
          dispatch({ type: "FETCH_BARANGAYS_SUCCESS", payload: barangaysData })
        )
        .catch((e) =>
          dispatch({
            type: "FETCH_LOCATION_ERROR",
            level: "barangays",
            error: e.message,
          })
        );
    }
  }, [location.selectedCityCode]);

  const handleClose = () => {
    dispatch({ type: "RESET_FORM" });
    onClose();
  };

  const handleNext = () => {
    let isValid = true;
    if (currentStep === 1) {
      if (!propertyDetails.propertyName.trim()) {
        dispatch({
          type: "SET_STEP_ERROR",
          payload: "Property Name is a required field.",
        });
        isValid = false;
      }
      if (unusedSqm < 0) {
        dispatch({
          type: "SET_STEP_ERROR",
          payload:
            "Total Unit SQM cannot be greater than the Overall Property SQM.",
        });
        isValid = false;
      }
    }
    if (currentStep === 2) {
      if (!location.selectedRegionCode) {
        dispatch({
          type: "SET_STEP_ERROR",
          payload: "Region is a required field.",
        });
        isValid = false;
      } else if (!location.selectedProvinceCode) {
        dispatch({
          type: "SET_STEP_ERROR",
          payload: "Province is a required field.",
        });
        isValid = false;
      } else if (!location.selectedCityCode) {
        dispatch({
          type: "SET_STEP_ERROR",
          payload: "City / Municipality is a required field.",
        });
        isValid = false;
      } else if (!location.selectedBarangayCode) {
        dispatch({
          type: "SET_STEP_ERROR",
          payload: "Barangay is a required field.",
        });
        isValid = false;
      }
    }
    if (isValid) {
      if (currentStep < steps.length) {
        dispatch({ type: "SET_STEP", payload: currentStep + 1 });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      dispatch({ type: "SET_STEP", payload: currentStep - 1 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== steps.length) return;
    if (unusedSqm < 0) {
      dispatch({
        type: "SET_ERROR",
        payload: "Cannot save: Total Unit SQM exceeds Overall Property SQM.",
      });
      return;
    }
    if (!userProfile?.id) {
      dispatch({
        type: "SET_ERROR",
        payload: "You must be logged in to add a property.",
      });
      return;
    }

    dispatch({ type: "SET_SUBMITTING", payload: true });
    dispatch({ type: "SET_ERROR", payload: "" });

    try {
      // --- Optimization: Parallel uploads ---
      const [uploadedLicenseFiles, uploadedCertFiles] = await Promise.all([
        uploadFiles(documents.businessLicenses, userProfile.id),
        uploadFiles(documents.certificates, userProfile.id),
      ]);

      const licenseData = {
        files: uploadedLicenseFiles,
        description: documents.licenseDescription.trim(),
      };
      const certificateData = {
        files: uploadedCertFiles,
        description: documents.certificateDescription.trim(),
      };

      // Find selected names from the lists
      const selectedRegionName = location.regions.data.find(
        (r) => r.region_code === location.selectedRegionCode
      )?.region_name;
      const selectedProvinceName = location.provinces.data.find(
        (p) => p.province_code === location.selectedProvinceCode
      )?.province_name;
      const selectedCityName = location.cities.data.find(
        (c) => c.city_code === location.selectedCityCode
      )?.city_name;
      const selectedBarangayName = location.barangays.data.find(
        (b) => b.brgy_code === location.selectedBarangayCode
      )?.brgy_name;

      const propertyData = {
        created_by: userProfile.id,
        last_edited_by: userProfile.id,
        property_name: propertyDetails.propertyName.trim(),
        number_of_units: propertyDetails.numberOfUnits
          ? parseInt(propertyDetails.numberOfUnits, 10)
          : null,
        total_sqm: propertyDetails.totalUnitSqm
          ? parseFloat(propertyDetails.totalUnitSqm)
          : null,
        overall_sqm: propertyDetails.overallSqm
          ? parseFloat(propertyDetails.overallSqm)
          : null,
        address_country: "Philippines",
        address_country_iso: "PH",
        address_street: location.street.trim(),
        address_zip_code: location.zipCode.trim() || null,
        address_region: selectedRegionName || null,
        address_province: selectedProvinceName || null,
        address_city_municipality: selectedCityName || null,
        address_barangay: selectedBarangayName || null,
        business_licenses: licenseData,
        certificates_of_registration: certificateData,
      };

      const { error: insertError } = await supabase
        .from("properties")
        .insert([propertyData]);
      if (insertError) throw insertError;

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error adding property:", err);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to add property: ${err.message}`,
      });
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
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
                <div className="flex items-center justify-between">
                  <DialogTitle
                    as="h3"
                    className="text-2xl font-bold leading-6 text-gray-900"
                  >
                    Add New Property
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
                  Fill in the details below to register your property.
                </p>

                <Stepper currentStep={currentStep} steps={steps} />

                <form onSubmit={handleSubmit} className="mt-6">
                  {isSubmitting && (
                    <div className="flex justify-center py-20">
                      <LoadingSpinner />
                    </div>
                  )}
                  <div className="min-h-[350px]">
                    {/* --- Step 1: Property Details --- */}
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
                              value={propertyDetails.propertyName}
                              onChange={(e) =>
                                dispatch({
                                  type: "SET_PROPERTY_DETAIL",
                                  field: "propertyName",
                                  payload: e.target.value,
                                })
                              }
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
                              value={propertyDetails.overallSqm}
                              onChange={(e) =>
                                dispatch({
                                  type: "SET_PROPERTY_DETAIL",
                                  field: "overallSqm",
                                  payload: e.target.value,
                                })
                              }
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
                                value={propertyDetails.numberOfUnits}
                                onChange={(e) =>
                                  dispatch({
                                    type: "SET_PROPERTY_DETAIL",
                                    field: "numberOfUnits",
                                    payload: e.target.value,
                                  })
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
                                value={propertyDetails.totalUnitSqm}
                                onChange={(e) =>
                                  dispatch({
                                    type: "SET_PROPERTY_DETAIL",
                                    field: "totalUnitSqm",
                                    payload: e.target.value,
                                  })
                                }
                                className={inputStyles}
                              />
                            </FormInputGroup>
                          </div>
                        </div>

                        {propertyDetails.overallSqm > 0 &&
                          propertyDetails.totalUnitSqm > 0 && (
                            <div
                              className={`mt-6 p-4 rounded-lg text-sm ${
                                unusedSqm < 0
                                  ? "bg-red-50 text-red-800 border-red-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              } border transition-colors`}
                            >
                              <h5 className="font-bold mb-2">
                                Area Calculation
                              </h5>
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
                    {/* --- Step 2: Location --- */}
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

                          {/* Philippines-specific address fields */}
                          <div className="relative">
                            <FormInputGroup label="Region*">
                              <select
                                value={location.selectedRegionCode}
                                onChange={(e) =>
                                  dispatch({
                                    type: "SET_REGION",
                                    payload: e.target.value,
                                  })
                                }
                                className={selectStyles}
                                required
                              >
                                <option value="" disabled>
                                  {location.regions.status === "loading"
                                    ? "Loading regions..."
                                    : "Select a region..."}
                                </option>
                                {location.regions.data.map((region) => (
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
                                value={location.selectedProvinceCode}
                                onChange={(e) =>
                                  dispatch({
                                    type: "SET_PROVINCE",
                                    payload: e.target.value,
                                  })
                                }
                                className={selectStyles}
                                disabled={
                                  !location.selectedRegionCode ||
                                  location.provinces.status !== "success"
                                }
                                required
                              >
                                <option value="" disabled>
                                  {location.provinces.status === "loading"
                                    ? "Loading provinces..."
                                    : "Select a province..."}
                                </option>
                                {location.provinces.data.map((province) => (
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
                                value={location.selectedCityCode}
                                onChange={(e) =>
                                  dispatch({
                                    type: "SET_CITY",
                                    payload: e.target.value,
                                  })
                                }
                                className={selectStyles}
                                disabled={
                                  !location.selectedProvinceCode ||
                                  location.cities.status !== "success"
                                }
                                required
                              >
                                <option value="" disabled>
                                  {location.cities.status === "loading"
                                    ? "Loading cities..."
                                    : "Select a city/municipality..."}
                                </option>
                                {location.cities.data.map((city) => (
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
                                value={location.selectedBarangayCode}
                                onChange={(e) =>
                                  dispatch({
                                    type: "SET_BARANGAY",
                                    payload: e.target.value,
                                  })
                                }
                                className={selectStyles}
                                disabled={
                                  !location.selectedCityCode ||
                                  location.barangays.status !== "success"
                                }
                                required
                              >
                                <option value="" disabled>
                                  {location.barangays.status === "loading"
                                    ? "Loading barangays..."
                                    : "Select a barangay..."}
                                </option>
                                {location.barangays.data.map((barangay) => (
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
                              value={location.street}
                              onChange={(e) =>
                                dispatch({
                                  type: "SET_LOCATION_FIELD",
                                  field: "street",
                                  payload: e.target.value,
                                })
                              }
                              className={inputStyles}
                            />
                          </FormInputGroup>
                          <FormInputGroup label="Zip / Postal Code">
                            <input
                              type="text"
                              placeholder="e.g., 1605"
                              value={location.zipCode}
                              onChange={(e) =>
                                dispatch({
                                  type: "SET_LOCATION_FIELD",
                                  field: "zipCode",
                                  payload: e.target.value,
                                })
                              }
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
                        <p className="text-sm text-gray-600">
                          Uploading documents is optional but recommended for
                          faster verification.
                        </p>
                        <div className="space-y-6">
                          <ImageUploader
                            label="Business License(s)"
                            files={documents.businessLicenses}
                            setFiles={(files) =>
                              dispatch({
                                type: "SET_DOCUMENTS",
                                field: "businessLicenses",
                                payload: files,
                              })
                            }
                            description={documents.licenseDescription}
                            setDescription={(desc) =>
                              dispatch({
                                type: "SET_DOCUMENTS",
                                field: "licenseDescription",
                                payload: desc,
                              })
                            }
                          />
                          <ImageUploader
                            label="Certificate(s) of Registration"
                            files={documents.certificates}
                            setFiles={(files) =>
                              dispatch({
                                type: "SET_DOCUMENTS",
                                field: "certificates",
                                payload: files,
                              })
                            }
                            description={documents.certificateDescription}
                            setDescription={(desc) =>
                              dispatch({
                                type: "SET_DOCUMENTS",
                                field: "certificateDescription",
                                payload: desc,
                              })
                            }
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
                        {isSubmitting ? "Adding Property..." : "Add Property"}
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

export default AddPropertyModal;
