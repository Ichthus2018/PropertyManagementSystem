// hooks/useUnitForm.js
import { useState, useEffect } from "react";
import useSWR from "swr";
import supabase from "../lib/supabase";

const fetcher = async ({ table }) => {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(error.message);
  return data;
};

// A helper function to extract the file path from a Supabase storage URL
const getPathFromUrl = (url) => {
  try {
    const urlObject = new URL(url);
    // The path we want is after `/object/public/`
    const path = urlObject.pathname.split("/public/")[1];
    return path;
  } catch (error) {
    console.error("Invalid URL for storage path extraction:", url, error);
    return null;
  }
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

  // --- INITIALIZATION (UPDATED) ---
  // This now handles all fields, including arrays for Tab 3.
  useEffect(() => {
    if (initialUnit) {
      // Transform the array of image URLs into the object structure
      // that the ImageUploader component expects.
      const existingImages = (initialUnit.unit_images || []).map((url) => ({
        source: "existing",
        preview: url,
      }));

      setFormData({
        // Tab 1 & 2
        name: initialUnit.name ?? "",
        sqm: initialUnit.sqm ?? 0,
        unit_type_id: initialUnit.unit_type_id?.toString() ?? "",
        leasing_type_id: initialUnit.leasing_type_id?.toString() ?? "",
        unit_category_id: initialUnit.unit_category_id?.toString() ?? "",
        unit_category_2_id: initialUnit.unit_category_2_id?.toString() ?? "",
        unit_category_3_id: initialUnit.unit_category_3_id?.toString() ?? "",
        // Tab 3
        facilities: initialUnit.facilities || [],
        utilities: initialUnit.utilities || [],
        unit_images: existingImages, // Use the transformed array
      });
    }
  }, [initialUnit]);

  // --- HANDLERS (UPDATED) ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Generic handler for fields that are not standard inputs (e.g., arrays)
  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // --- SAVE LOGIC (COMPLETELY REBUILT) ---
  // Handles image uploads, deletions, and data updates.
  const handleSave = async (onSuccess) => {
    if (!initialUnit?.id) {
      setSaveError("No unit ID provided. Cannot save.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to save units.");

      // --- 1. Handle Image Deletions ---
      const initialImageUrls = initialUnit.unit_images || [];
      const currentImageUrls = formData.unit_images
        .filter((img) => img.source === "existing")
        .map((img) => img.preview);

      const imagesToDelete = initialImageUrls.filter(
        (url) => !currentImageUrls.includes(url)
      );

      if (imagesToDelete.length > 0) {
        const pathsToDelete = imagesToDelete
          .map(getPathFromUrl)
          .filter(Boolean);
        if (pathsToDelete.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from("unit-images") // <-- Your bucket name
            .remove(pathsToDelete);
          if (deleteError) {
            console.error("Error deleting old images:", deleteError);
            // Decide if you want to stop the save process here
          }
        }
      }

      // --- 2. Handle Image Uploads and build final URL list ---
      const finalImageUrls = [...currentImageUrls];
      const newImagesToUpload = formData.unit_images.filter(
        (img) => img.source === "new" && img.file instanceof File
      );

      for (const imageFile of newImagesToUpload) {
        const file = imageFile.file;
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${
          initialUnit.id
        }/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("unit-images") // <-- Your bucket name
          .upload(fileName, file);

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          continue; // Skip this file and continue
        }

        const { data: urlData } = supabase.storage
          .from("unit-images") // <-- Your bucket name
          .getPublicUrl(fileName);

        if (urlData.publicUrl) {
          finalImageUrls.push(urlData.publicUrl);
        }
      }

      // --- 3. Prepare final data payload for the database ---
      const dataToSave = {
        name: formData.name,
        // Convert empty strings to null for foreign keys
        unit_type_id: formData.unit_type_id || null,
        leasing_type_id: formData.leasing_type_id || null,
        unit_category_id: formData.unit_category_id || null,
        unit_category_2_id: formData.unit_category_2_id || null,
        unit_category_3_id: formData.unit_category_3_id || null,
        // Add fields from Tab 3
        facilities: formData.facilities || [],
        utilities: formData.utilities || [],
        unit_images: finalImageUrls,
      };

      // --- 4. Update the database record ---
      const { error } = await supabase
        .from("units")
        .update(dataToSave)
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
      handleFieldChange, // <-- Export the new handler
      handleSave,
    },
    isLoading: !unitTypes || !leasingTypes, // Keep loading state simple
  };
}
