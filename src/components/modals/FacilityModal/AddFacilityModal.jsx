import { Fragment, useState, useRef } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  XMarkIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { v4 as uuidv4 } from "uuid";
import { useFacilityUnits } from "../../../hooks/useFacilityUnits";
import ImageUploader from "../../ui/ImageUploader";
import supabase from "../../../lib/supabase";

const Stepper = ({ currentStep, steps }) => (
  <nav aria-label="Progress" className="p-6 border-b border-neutral-200">
    <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
      {steps.map((step, index) => (
        <li key={step} className="md:flex-1">
          {currentStep > index + 1 ? (
            <div className="group flex w-full flex-col border-l-4 border-orange-600 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
              <span className="text-sm font-medium text-orange-600 transition-colors">{`Step ${
                index + 1
              }`}</span>
              <span className="text-sm font-medium">{step}</span>
            </div>
          ) : currentStep === index + 1 ? (
            <div
              className="flex w-full flex-col border-l-4 border-orange-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
              aria-current="step"
            >
              <span className="text-sm font-medium text-orange-600">{`Step ${
                index + 1
              }`}</span>
              <span className="text-sm font-medium">{step}</span>
            </div>
          ) : (
            <div className="group flex w-full flex-col border-l-4 border-gray-200 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
              <span className="text-sm font-medium text-gray-500 transition-colors">{`Step ${
                index + 1
              }`}</span>
              <span className="text-sm font-medium">{step}</span>
            </div>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

export default function AddFacilityModal({ isOpen, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [facilityName, setFacilityName] = useState("");
  const [imageFiles, setImageFiles] = useState([]); // Use the state from ImageUploader
  const [selectedUnitIds, setSelectedUnitIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const {
    units,
    isLoading: isLoadingUnits,
    error: unitsError,
  } = useFacilityUnits();

  const steps = ["Facility Details", "Assign to Units"];

  const handleClose = () => {
    setCurrentStep(1);
    setFacilityName("");
    setImageFiles([]);
    setSelectedUnitIds(new Set());
    setSearchTerm("");
    setIsSaving(false);
    setError(null);
    onClose();
  };

  const handleUnitSelection = (unitId) => {
    setSelectedUnitIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
      return newSet;
    });
  };

  const filteredUnits = units.filter((unit) =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedUnitIds.size === filteredUnits.length) {
      setSelectedUnitIds(new Set()); // Deselect all
    } else {
      setSelectedUnitIds(new Set(filteredUnits.map((u) => u.id))); // Select all filtered
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!isStep1Valid || !isStep2Valid) return;

    setIsSaving(true);
    try {
      // 1. Upload Image to Supabase Storage
      const imageFile = imageFiles[0].file;
      const fileName = `${uuidv4()}-${imageFile.name}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("facility-images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 2. Get Public URL of the uploaded image
      const { data: urlData } = supabase.storage
        .from("facility-images")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      // 3. Insert new facility into the 'facilities' table
      const { data: facilityData, error: facilityError } = await supabase
        .from("facilities")
        .insert({ name: facilityName, image_url: imageUrl })
        .select()
        .single();

      if (facilityError) throw facilityError;

      const newFacilityId = facilityData.id;

      // 4. Prepare and insert links into the 'facility_units' join table
      const linksToInsert = Array.from(selectedUnitIds).map((unitId) => ({
        facility_id: newFacilityId,
        unit_id: unitId,
      }));

      const { error: linkError } = await supabase
        .from("facility_units")
        .insert(linksToInsert);

      if (linkError) throw linkError;

      // 5. Success
      onSuccess(); // This will trigger a refetch on the main page
      handleClose();
    } catch (err) {
      console.error("Failed to save facility:", err);
      setError(`Error: ${err.message}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const isStep1Valid = facilityName.trim() !== "" && imageFiles.length > 0;
  const isStep2Valid = selectedUnitIds.size > 0;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50 font-sans"
        onClose={handleClose}
      >
        {/* Dialog Overlay */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </TransitionChild>

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
              <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all">
                <DialogTitle
                  as="h3"
                  className="flex justify-between items-center p-6 text-2xl font-semibold leading-6 text-neutral-900 border-b border-neutral-200"
                >
                  Add New Facility
                  <button
                    onClick={handleClose}
                    className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </DialogTitle>

                <Stepper currentStep={currentStep} steps={steps} />

                <div className="p-6 min-h-[450px]">
                  {/* Step 1 */}
                  {currentStep === 1 && (
                    <div className="animate-fadeIn space-y-6">
                      <div>
                        <label
                          htmlFor="facility-name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Facility Name
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <BuildingOfficeIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </div>
                          <input
                            type="text"
                            id="facility-name"
                            value={facilityName}
                            onChange={(e) => setFacilityName(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            placeholder="e.g., Swimming Pool"
                          />
                        </div>
                      </div>
                      <ImageUploader
                        label="Facility Image"
                        files={imageFiles}
                        setFiles={setImageFiles}
                        maxFiles={1}
                      />
                    </div>
                  )}

                  {/* Step 2 */}
                  {currentStep === 2 && (
                    <div className="animate-fadeIn space-y-4">
                      {isLoadingUnits ? (
                        <div className="text-center py-10">
                          <ArrowPathIcon className="mx-auto h-8 w-8 text-neutral-400 animate-spin" />
                          <p className="mt-2 text-sm text-neutral-500">
                            Loading Units...
                          </p>
                        </div>
                      ) : unitsError ? (
                        <div className="text-center py-10 text-red-600">
                          <ExclamationTriangleIcon className="mx-auto h-8 w-8" />
                          <p className="mt-2">Failed to load units.</p>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Search units..."
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="flex justify-between items-center px-2">
                            <p className="text-sm text-gray-500">
                              {selectedUnitIds.size} of {filteredUnits.length}{" "}
                              selected
                            </p>
                            <button
                              onClick={handleSelectAll}
                              className="text-sm font-medium text-orange-600 hover:text-orange-800"
                            >
                              {selectedUnitIds.size === filteredUnits.length
                                ? "Deselect All"
                                : "Select All"}
                            </button>
                          </div>
                          <div className="border rounded-lg max-h-80 overflow-y-auto custom-scrollbar">
                            <ul className="divide-y divide-gray-200">
                              {filteredUnits.map((unit) => (
                                <li
                                  key={unit.id}
                                  className="p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                                  onClick={() => handleUnitSelection(unit.id)}
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {unit.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {unit.type}
                                    </p>
                                  </div>
                                  <input
                                    type="checkbox"
                                    readOnly
                                    checked={selectedUnitIds.has(unit.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6 bg-neutral-50 border-t border-neutral-200 space-y-3">
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className={`px-6 py-2 text-sm font-medium rounded-full shadow-sm border border-neutral-300 hover:bg-neutral-100 ${
                        currentStep === 1 && "invisible"
                      }`}
                    >
                      Back
                    </button>
                    <div>
                      {currentStep < steps.length ? (
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          disabled={!isStep1Valid}
                          className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-full shadow-lg hover:bg-orange-700 disabled:bg-neutral-400 transition-colors"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={!isStep2Valid || isSaving}
                          className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-full shadow-lg hover:bg-orange-700 disabled:bg-neutral-400 transition-colors"
                        >
                          {isSaving && (
                            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                          )}
                          {isSaving ? "Saving..." : "Save Facility"}
                        </button>
                      )}
                    </div>
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
