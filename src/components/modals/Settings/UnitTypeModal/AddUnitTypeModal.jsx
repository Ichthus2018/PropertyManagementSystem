//src/components/modals/UnitTypeModal/AddUnitTypeModal.jsx
import { useState, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../lib/supabase";
import { PlusIcon } from "@heroicons/react/20/solid";
import { useAuthStore } from "../../../../store/useAuthStore";

const AddUnitTypeModal = ({ isOpen, onClose, onSuccess }) => {
  const [unitTypeName, setUnitTypeName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // In component 1: AddUnitTypeModal.jsx

  const userProfile = useAuthStore((state) => state.userProfile);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = unitTypeName.trim();

    if (!trimmedName) {
      setError("Unit type name cannot be empty.");
      return;
    }
    // Make sure the user is logged in
    if (!userProfile) {
      setError("You must be logged in to add a unit type.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 3. Check for duplicates GLOBALLY (across all users)
      //    We DO NOT filter by user_id here. This is the correct logic.
      const { data: existing, error: checkError } = await supabase
        .from("unit_types")
        .select("unit_type")
        .ilike("unit_type", trimmedName) // Case-insensitive check
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existing) {
        // Use a more accurate error message
        setError("This unit type name has already been taken.");
        setIsSubmitting(false);
        return;
      }

      // 4. Insert the new unit type WITH the creator's user_id
      const { data: newUnit, error: insertError } = await supabase
        .from("unit_types")
        .insert([{ unit_type: trimmedName, user_id: userProfile.id }]) // Use the ID from the store
        .select()
        .single();

      if (insertError) throw insertError;

      onSuccess(newUnit); // Pass new data back to parent
      setUnitTypeName(""); // Reset form
      onClose(); // Close modal
    } catch (err) {
      console.error("Error adding unit type:", err);
      // The DB unique constraint (error code '23505') will now catch global duplicates
      if (err.code === "23505") {
        setError("This unit type name has already been taken.");
      } else {
        setError("Failed to add unit type. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 text-left align-middle shadow-2xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-xl font-semibold leading-6 text-gray-900"
                >
                  Add New Unit Type
                </DialogTitle>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="unit-type"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Unit Type Name
                    </label>
                    <input
                      type="text"
                      id="unit-type"
                      value={unitTypeName}
                      onChange={(e) => setUnitTypeName(e.target.value)}
                      className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                      placeholder="e.g., Apartment, Villa, Studio"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Adding..." : "Add Unit Type"}
                    </button>
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

export default AddUnitTypeModal;
