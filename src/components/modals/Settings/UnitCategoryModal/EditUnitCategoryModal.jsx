import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../lib/supabase";

const EditUnitCategoryModal = ({ isOpen, onClose, onSuccess, category }) => {
  const [unitCategoryName, setUnitCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (category) {
      setUnitCategoryName(category.unit_category);
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = unitCategoryName.trim();

    if (!trimmedName) {
      setError("Unit category name cannot be empty.");
      return;
    }

    if (!category || !category.id) {
      setError("Invalid unit category data. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { data: existing, error: checkError } = await supabase
        .from("unit_categories")
        .select("id")
        .ilike("unit_category", trimmedName)
        .neq("id", category.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existing) {
        setError("This unit category name has already been taken.");
        setIsSubmitting(false);
        return;
      }

      const { data, error: updateError } = await supabase
        .from("unit_categories")
        .update({ unit_category: trimmedName })
        .eq("id", category.id)
        .select()
        .single();

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating unit category:", err);
      setError("Failed to update unit category. Please try again.");
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
                  Edit Unit Category
                </DialogTitle>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="edit-unit-category"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Unit Category Name
                    </label>
                    <input
                      type="text"
                      id="edit-unit-category"
                      value={unitCategoryName}
                      onChange={(e) => setUnitCategoryName(e.target.value)}
                      className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                      placeholder="e.g., Standard, Premium"
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
                      {isSubmitting ? "Saving..." : "Save Changes"}
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

export default EditUnitCategoryModal;
