// src/hooks/useFacilityUnits.js
import { useSupabaseQuery } from "./useSupabaseQuery"; // Adjust path to your hook file

export const useFacilityUnits = () => {
  const { data, isLoading, error, mutate } = useSupabaseQuery({
    tableName: "units",
    selectQuery: "id, name, type", // We only need these fields for the modal
    searchColumn: "name", // Although we filter client-side, this could be used for server-side search
    initialPageSize: 1000, // Set a high limit to fetch all units
  });

  return {
    units: data, // Rename 'data' to 'units' for better readability in the component
    isLoading,
    error,
    mutateUnits: mutate, // Rename 'mutate' for clarity
  };
};
