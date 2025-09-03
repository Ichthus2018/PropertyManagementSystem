// src/components/modals/FacilityModal/AddFacilityModal.jsx

import { Fragment, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { v4 as uuidv4 } from "uuid";
import ImageUploader from "../../ui/ImageUploader";
import supabase from "../../../lib/supabase";
import AmenitiesInput from "./AmenitiesInput"; // Assuming these components exist

export default function AddFacilityModal({ isOpen, onClose, onSuccess }) {
  const [facilityName, setFacilityName] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    setFacilityName("");
    setImageFiles([]);
    setAmenities([]);
    setIsSaving(false);
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    setError(null);
    if (!isFormValid) return;

    setIsSaving(true);
    try {
      const imageFile = imageFiles[0].file;
      const fileName = `${uuidv4()}-${imageFile.name}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("facility-images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("facility-images")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      const { error: facilityError } = await supabase
        .from("facilities")
        .insert({
          name: facilityName,
          image_url: imageUrl,
          amenities: amenities,
        })
        .select()
        .single();

      if (facilityError) throw facilityError;

      // This now calls the special handler in the parent component
      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Failed to save facility:", err);
      setError(`Error: ${err.message}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = facilityName.trim() !== "" && imageFiles.length > 0;

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
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all">
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
                <div className="p-6">
                  <div className="space-y-8">
                    <div>
                      <label
                        htmlFor="facility-name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Facility Name
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="text"
                          id="facility-name"
                          value={facilityName}
                          onChange={(e) => setFacilityName(e.target.value)}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          placeholder="e.g., Swimming Pool"
                        />
                      </div>
                    </div>
                    <AmenitiesInput
                      selectedAmenities={amenities}
                      setSelectedAmenities={setAmenities}
                    />
                    <ImageUploader
                      label="Facility Image"
                      files={imageFiles}
                      setFiles={setImageFiles}
                      maxFiles={5}
                    />
                  </div>
                </div>
                <div className="p-6 bg-neutral-50 border-t border-neutral-200 space-y-3">
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="flex justify-end items-center">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!isFormValid || isSaving}
                      className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-full shadow-lg hover:bg-orange-700 disabled:bg-neutral-400 transition-colors"
                    >
                      {isSaving && (
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {isSaving ? "Saving..." : "Save Facility"}
                    </button>
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
