// hooks/useUnitForm.js
import { useState, useEffect } from "react";
import useSWR from "swr";
import supabase from "../lib/supabase";

const fetcher = async ({ table }) => {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(error.message);
  return data;
};

export function useUnitForm(initialUnit) {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // --- DATA FETCHING (No changes needed) ---
  const { data: unitTypes } = useSWR({ table: "unit_types" }, fetcher);
  const { data: leasingTypes } = useSWR({ table: "leasing_types" }, fetcher);
  const { data: unitCategories } = useSWR(
    { table: "unit_categories" },
    fetcher
  );
  const { data: unitCategories2 } = useSWR(
    { table: "unit_categories_2" },
    fetcher
  );
  const { data: unitCategories3 } = useSWR(
    { table: "unit_categories_3" },
    fetcher
  );

  // --- INITIALIZATION ---
  // This part correctly prepares the form state with strings for the UI.
  useEffect(() => {
    if (initialUnit) {
      setFormData({
        name: initialUnit.name ?? "",
        sqm: initialUnit.sqm ?? 0,
        unit_type_id: initialUnit.unit_type_id?.toString() ?? "",
        leasing_type_id: initialUnit.leasing_type_id?.toString() ?? "",
        unit_category_id: initialUnit.unit_category_id?.toString() ?? "",
        unit_category_2_id: initialUnit.unit_category_2_id?.toString() ?? "",
        unit_category_3_id: initialUnit.unit_category_3_id?.toString() ?? "",
      });
    }
  }, [initialUnit]);

  // --- HANDLERS ---
  // This simple handler is correct. It stores string values from the form.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // **THE FIX IS HERE**
  // We will construct the payload exactly like in the reference hook.
  const handleSave = async (onSuccess) => {
    if (!initialUnit?.id) {
      setSaveError("No unit ID provided. Cannot save.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);

    try {
      // Create the payload using the `|| null` pattern from your reference.
      // This correctly handles converting empty strings to null for the database.
      const dataToSave = {
        name: formData.name,
        // The `sqm` field is disabled in the form, so we do not include it
        // in the update payload to prevent accidental changes.
        unit_type_id: formData.unit_type_id || null,
        leasing_type_id: formData.leasing_type_id || null,
        unit_category_id: formData.unit_category_id || null,
        unit_category_2_id: formData.unit_category_2_id || null,
        unit_category_3_id: formData.unit_category_3_id || null,
      };

      const { error } = await supabase
        .from("units")
        .update(dataToSave) // Use the correctly formatted payload
        .eq("id", initialUnit.id);

      if (error) throw error;
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to update unit:", err);
      setSaveError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData,
    isSaving,
    saveError,
    dropdownData: {
      unitTypes: unitTypes || [],
      leasingTypes: leasingTypes || [],
      unitCategories: unitCategories || [],
      unitCategories2: unitCategories2 || [],
      unitCategories3: unitCategories3 || [],
    },
    handlers: {
      handleInputChange,
      handleSave,
    },
    isLoading: !unitTypes || !leasingTypes,
  };
}
