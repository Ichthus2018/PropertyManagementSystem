// hooks/usePropertyUnitData.js
import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import supabase from "../lib/supabase";

const fetcher = async ({ table, columns = "*" }) => {
  const { data, error } = await supabase.from(table).select(columns); // Use the columns parameter
  if (error) throw new Error(error.message);
  return data;
};

// Initial state for the form data, not the property selection itself
const getInitialFormData = () => ({
  id: null,
  property_name: "",
  number_of_units: 0,
  total_sqm: 0,
  units: [],
});

export function usePropertyUnitData() {
  // Fetch ALL properties and ALL units to determine availability
  const { data: allProperties, isLoading: isPropertiesLoading } = useSWR(
    { table: "properties" },
    fetcher
  );
  // Key change: We need all units to calculate usage. SWR will cache this.
  const { data: allUnits, isLoading: isUnitsLoading } = useSWR(
    { table: "units", columns: "property_id, sqm" }, // <-- CHANGE THIS LINE
    fetcher
  );

  // SWR hooks for other dropdowns (no changes here)
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

  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // 1. Calculate the current usage (units and sqm) for each property
  const propertyUsage = useMemo(() => {
    if (!allUnits) return {};
    return allUnits.reduce((acc, unit) => {
      const propId = unit.property_id;
      if (!acc[propId]) {
        acc[propId] = { usedUnits: 0, usedSqm: 0 };
      }
      acc[propId].usedUnits += 1;
      acc[propId].usedSqm += Number(unit.sqm || 0);
      return acc;
    }, {});
  }, [allUnits]);

  // 2. Create the list of properties available for the dropdown
  const availableProperties = useMemo(() => {
    if (!allProperties) return [];
    return allProperties
      .map((prop) => {
        const usage = propertyUsage[prop.id] || { usedUnits: 0, usedSqm: 0 };
        const available_units = prop.number_of_units - usage.usedUnits;
        // Use toFixed to handle potential floating point inaccuracies
        const available_sqm = parseFloat(
          (prop.total_sqm - usage.usedSqm).toFixed(2)
        );

        return {
          ...prop, // Keep original data like id, name, total_sqm etc.
          available_units,
          available_sqm,
        };
      })
      .filter((prop) => prop.available_units > 0); // Only show properties with at least one empty unit slot
  }, [allProperties, propertyUsage]);

  // Find the selected property object from our new available list
  const selectedProperty = useMemo(() => {
    if (!selectedPropertyId || !availableProperties) return null;
    return availableProperties.find((p) => p.id == selectedPropertyId);
  }, [selectedPropertyId, availableProperties]);

  // 3. When a property is selected, populate the form based on AVAILABLE space
  useEffect(() => {
    if (selectedProperty) {
      // The number of new units to create is the available count
      const targetUnitCount = selectedProperty.available_units || 0;
      const units = [];
      for (let i = 0; i < targetUnitCount; i++) {
        units.push({
          id: `new_${Date.now()}_${i}`,
          name: `${selectedProperty.property_name} Unit ${i + 1}`,
          sqm: 0,
          unit_type_id: "",
          leasing_type_id: "",
          unit_category_id: "",
          unit_category_2_id: "",
          unit_category_3_id: "",
        });
      }
      setFormData({
        id: selectedProperty.id,
        property_name: selectedProperty.property_name,
        number_of_units: selectedProperty.available_units, // Use available units for form state
        total_sqm: selectedProperty.available_sqm, // Use available sqm for form state
        units,
      });
    } else {
      setFormData(getInitialFormData()); // Reset if deselected
    }
  }, [selectedProperty]);

  const assignedSqm = useMemo(
    () => formData.units.reduce((sum, unit) => sum + Number(unit.sqm || 0), 0),
    [formData.units]
  );

  const isSqmMatched = useMemo(() => {
    // Comparison needs to be tolerant of floating point math
    return (
      Math.abs(formData.total_sqm - assignedSqm) < 0.01 &&
      formData.total_sqm > 0
    );
  }, [formData.total_sqm, assignedSqm]);

  const isStep1Valid = useMemo(() => !!selectedProperty, [selectedProperty]);

  const handlePropertySelect = (e) => {
    setSelectedPropertyId(e.target.value);
  };

  // (handleUnitChange, resetState, handleSave are unchanged and correct)
  // ... rest of the existing handlers

  const handleUnitChange = (index, e) => {
    const { name, value } = e.target;
    const newUnits = [...formData.units];
    newUnits[index] = { ...newUnits[index], [name]: value };
    setFormData((prev) => ({ ...prev, units: newUnits }));
  };

  const handleUnitFieldUpdate = (index, fieldName, value) => {
    const newUnits = [...formData.units];
    newUnits[index] = { ...newUnits[index], [fieldName]: value };
    setFormData((prev) => ({ ...prev, units: newUnits }));
  };

  const resetState = () => {
    setSelectedPropertyId(null);
    setFormData(getInitialFormData());
  };

  const handleSave = async (onSuccess) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to save units.");

      // This is the main change. We use Promise.all to handle all the async uploads
      // before we try to insert the data into the database.
      const unitsToSave = await Promise.all(
        formData.units.map(async (unit, unitIndex) => {
          const imageUrls = [];

          // Check if there are any images to upload
          if (unit.unit_images && unit.unit_images.length > 0) {
            // Loop through each file object using .entries() to get its index
            for (const [imageIndex, imageFile] of unit.unit_images.entries()) {
              if (
                imageFile.source === "new" &&
                imageFile.file instanceof File
              ) {
                const file = imageFile.file;
                const fileExt = file.name.split(".").pop();
                const propertyId = formData.id;
                const timestamp = Date.now();

                // 1. Create a unique, non-random filename using the propertyId
                const fileName = `${propertyId}-unit${unitIndex}-img${imageIndex}-${timestamp}.${fileExt}`;
                const filePath = `${user.id}/${propertyId}/${fileName}`;

                // 2. Upload the file to Supabase Storage
                const { error: uploadError } = await supabase.storage
                  .from("unit-images") // <-- IMPORTANT: Replace with your actual bucket name!
                  .upload(filePath, file);

                if (uploadError) {
                  console.error("Error uploading image:", uploadError);
                  // Decide how to handle a failed upload. Here we'll just skip it.
                  continue;
                }

                // 3. Get the public URL for the uploaded file
                const { data: urlData } = supabase.storage
                  .from("unit-images") // <-- IMPORTANT: Replace with your actual bucket name!
                  .getPublicUrl(filePath);

                if (urlData.publicUrl) {
                  imageUrls.push(urlData.publicUrl);
                }
              } else if (imageFile.source === "existing") {
                // Logic for handling files that were already uploaded (if you add editing)
                imageUrls.push(imageFile.preview); // Assuming preview holds the existing URL
              }
            }
          }

          // 4. Create the final object for the 'units' table
          return {
            name: unit.name,
            sqm: unit.sqm || 0,
            property_id: formData.id,
            user_id: user.id,
            unit_type_id: unit.unit_type_id || null,
            leasing_type_id: unit.leasing_type_id || null,
            unit_category_id: unit.unit_category_id || null,
            unit_category_2_id: unit.unit_category_2_id || null,
            unit_category_3_id: unit.unit_category_3_id || null,
            facilities: unit.facilities || [],
            utilities: unit.utilities || [],
            unit_images: imageUrls,
          };
        })
      );

      // Now `unitsToSave` is an array of objects ready for the database
      const { error } = await supabase.from("units").insert(unitsToSave);
      if (error) throw error;

      if (onSuccess) onSuccess();
      resetState();
    } catch (err) {
      console.error("Failed to save units:", err);
      setSaveError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    propertyData: formData,
    selectedPropertyId,
    isSqmMatched,
    isStep1Valid,
    assignedSqm,
    isSaving,
    saveError,
    dropdownData: {
      // 4. Pass the final calculated list to the modal
      properties: availableProperties,
      unitTypes: unitTypes || [],
      leasingTypes: leasingTypes || [],
      unitCategories: unitCategories || [],
      unitCategories2: unitCategories2 || [],
      unitCategories3: unitCategories3 || [],
    },
    handlers: {
      handlePropertySelect,
      handleUnitChange,
      handleSave,
      resetState,
      handleUnitFieldUpdate,
    },
    // The loading state now depends on both fetches
    isLoading: isPropertiesLoading || isUnitsLoading,
  };
}
