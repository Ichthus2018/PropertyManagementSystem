// src/pages/Properties.jsx

import { useState } from "react";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { useAuthStore } from "../../store/useAuthStore";
import supabase from "../../lib/supabase";

// Import common reusable components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import DataTable from "../../components/ui/common/DataTable";

// Import NEW feature-specific components
import PropertiesTable from "../../components/pages/properties/PropertiesTable";
import PropertyCard from "../../components/pages/properties/PropertyCard";

// Import Modals
import AddPropertyModal from "../../components/modals/PropertyModal/AddPropertyModal";
import EditPropertyModal from "../../components/modals/PropertyModal/EditPropertyModal";
import DeletePropertyModal from "../../components/modals/PropertyModal/DeletePropertyModal";

// Helper function remains here as it's part of the page's logic, passed down as a prop
const formatAddress = (p) => {
  const addressParts =
    p.address_country_iso === "PH"
      ? [
          p.address_street,
          p.address_barangay,
          p.address_city_municipality,
          p.address_province,
          p.address_zip_code,
          p.address_country,
        ]
      : [
          p.address_street,
          p.address_state,
          p.address_zip_code,
          p.address_country,
        ];
  return addressParts.filter(Boolean).join(", ") || "N/A";
};

const Properties = () => {
  // --- State for modals and actions (No changes here) ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const userProfile = useAuthStore((state) => state.userProfile);

  // --- Data fetching and management hook (No changes here) ---
  const {
    data: properties,
    totalCount,
    isLoading,
    error,
    mutate,
    currentPage,
    setCurrentPage,
    pageCount,
    pageSize,
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
    handleSearch,
    clearSearch,
  } = useSupabaseQuery({
    tableName: "properties",
    selectQuery: `id, property_name, number_of_units, total_sqm, business_licenses, certificates_of_registration, created_by, address_country, address_country_iso, address_street, address_zip_code, address_state, address_state_iso, address_region, address_province, address_city_municipality, address_barangay, overall_sqm`,
    searchColumn: "property_name",
    initialPageSize: 5,
  });

  // --- Action Handlers (No changes here) ---
  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    mutate();
    if (currentPage !== 1 || activeSearchTerm) {
      setCurrentPage(1);
      clearSearch(false);
    }
  };

  const openEditModal = (property) => {
    setSelectedProperty(property);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedProperty(null);
    mutate();
  };

  const openDeleteModal = (property) => {
    setSelectedProperty(property);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProperty) return;
    setIsProcessing(true);
    try {
      const pathsToDelete = [
        ...(selectedProperty.business_licenses?.files || []),
        ...(selectedProperty.certificates_of_registration?.files || []),
      ]
        .map((file) => file.path)
        .filter(Boolean);

      if (pathsToDelete.length > 0) {
        await supabase.storage.from("property-documents").remove(pathsToDelete);
      }
      const { error: deleteError } = await supabase
        .from("properties")
        .delete()
        .eq("id", selectedProperty.id);
      if (deleteError) throw deleteError;

      if (properties.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        mutate();
      }
    } catch (err) {
      console.error("Failed to delete property:", err);
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedProperty(null);
    }
  };

  // This helper stays here because it depends on the userProfile from the store
  const getCreatorDisplay = (property) => {
    if (!userProfile) return "Loading...";
    return property.created_by === userProfile.id
      ? "You"
      : `User ${property.created_by.substring(0, 8)}...`;
  };

  // --- NEW: Render functions now simply call the dedicated components ---

  const renderDesktopTable = (data) => (
    <PropertiesTable
      properties={data}
      onEdit={openEditModal}
      onDelete={openDeleteModal}
      formatAddress={formatAddress}
      getCreatorDisplay={getCreatorDisplay}
    />
  );

  const renderMobileCards = (data) => (
    <div className="space-y-4 p-4">
      {data.map((p) => (
        <PropertyCard
          key={p.id}
          property={p}
          onEdit={() => openEditModal(p)}
          onDelete={() => openDeleteModal(p)}
          formatAddress={formatAddress}
        />
      ))}
    </div>
  );

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-4 pt-15 md:p-6 max-w-[95rem] xl:px-12">
        <PageHeader
          title="Manage Properties"
          description="Add, edit, and manage your properties here."
          buttonText="Add New Property"
          onButtonClick={() => setIsAddModalOpen(true)}
        />

        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          onSearch={handleSearch}
          onClear={clearSearch}
          placeholder="Search by property name..."
        />

        <DataTable
          isLoading={isLoading}
          error={error}
          data={properties}
          totalCount={totalCount}
          pageCount={pageCount}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          activeSearchTerm={activeSearchTerm}
          renderTable={renderDesktopTable}
          renderCards={renderMobileCards}
          emptyStateTitle="No Properties Yet"
          emptyStateDescription='Click "Add New Property" to get started.'
        />
      </div>

      {/* --- Modals (No changes here) --- */}
      <AddPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {selectedProperty && (
        <>
          <EditPropertyModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            property={selectedProperty}
          />
          <DeletePropertyModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={selectedProperty.property_name}
          />
        </>
      )}
    </>
  );
};

export default Properties;
