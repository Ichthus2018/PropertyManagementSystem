// src/pages/Properties.jsx
import { useState, Suspense, lazy } from "react";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { useAuthStore } from "../../store/useAuthStore";
import supabase from "../../lib/supabase";

// Lightweight reusable components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import DataTable from "../../components/ui/common/DataTable";
import LoadingSpinner from "../../components/ui/LoadingSpinner"; // fallback for lazy components

// Lazy-load heavy feature components
const PropertiesTable = lazy(() =>
  import("../../components/pages/properties/PropertiesTable")
);
const PropertyCard = lazy(() =>
  import("../../components/pages/properties/PropertyCard")
);

// Lazy-load modals
const AddPropertyModal = lazy(() =>
  import("../../components/modals/PropertyModal/AddPropertyModal")
);
const EditPropertyModal = lazy(() =>
  import("../../components/modals/PropertyModal/EditPropertyModal")
);
const DeletePropertyModal = lazy(() =>
  import("../../components/modals/PropertyModal/DeletePropertyModal")
);

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const userProfile = useAuthStore((state) => state.userProfile);

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

  const getCreatorDisplay = (property) => {
    if (!userProfile) return "Loading...";
    return property.created_by === userProfile.id
      ? "You"
      : `User ${property.created_by.substring(0, 8)}...`;
  };

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
          renderTable={(data) => (
            <Suspense fallback={<LoadingSpinner />}>
              <PropertiesTable
                properties={data}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                formatAddress={formatAddress}
                getCreatorDisplay={getCreatorDisplay}
              />
            </Suspense>
          )}
          renderCards={(data) => (
            <Suspense fallback={<LoadingSpinner />}>
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
            </Suspense>
          )}
          emptyStateTitle="No Properties Yet"
          emptyStateDescription='Click "Add New Property" to get started.'
        />
      </div>

      <Suspense fallback={null}>
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
      </Suspense>
    </>
  );
};

export default Properties;
