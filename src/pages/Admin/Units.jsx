// src/pages/Units.jsx

import { useState } from "react";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import supabase from "../../lib/supabase";

import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import DataTable from "../../components/ui/common/DataTable";

import UnitsTable from "../../components/pages/units/UnitsTable";
import UnitCard from "../../components/pages/units/UnitCard";

import UnitModal from "../../components/modals/UnitModal/UnitModal";
import EditUnitModal from "../../components/modals/UnitModal/EditUnitModal";
import DeleteUnitModal from "../../components/modals/UnitModal/DeleteUnitModal";

const Units = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const {
    data: units,
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
    tableName: "units",
    // ====================== THE FIX IS HERE ======================
    // We must select all the foreign key IDs so that the Edit Modal
    // knows which values to pre-select in the dropdowns.
    selectQuery: `
      id, name, sqm, property_id,
      unit_type_id,
      leasing_type_id,
      unit_category_id,
      unit_category_2_id,
      unit_category_3_id,
      properties (property_name, number_of_units, total_sqm), 
      unit_types (unit_type)
    `,
    // =============================================================
    searchColumn: "name",
    initialPageSize: 10,
  });

  // This handler is now passed to the UnitModal to be called on success
  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    mutate(); // Re-fetch all units data
  };

  const openEditModal = (unit) => {
    setSelectedUnit(unit);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedUnit(null);
    mutate(); // Re-fetch data to show the changes
  };

  const openDeleteModal = (unit) => {
    setSelectedUnit(unit);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUnit) return;
    setIsProcessing(true);
    try {
      const { error: deleteError } = await supabase
        .from("units")
        .delete()
        .eq("id", selectedUnit.id);
      if (deleteError) throw deleteError;

      if (units.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        mutate();
      }
    } catch (err) {
      console.error("Failed to delete unit:", err);
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedUnit(null);
    }
  };

  const renderDesktopTable = (data) => (
    <UnitsTable
      units={data}
      onEdit={openEditModal}
      onDelete={openDeleteModal}
    />
  );

  const renderMobileCards = (data) => (
    <div className="space-y-4 p-4">
      {data.map((unit) => (
        <UnitCard
          key={unit.id}
          unit={unit}
          onEdit={() => openEditModal(unit)}
          onDelete={() => openDeleteModal(unit)}
        />
      ))}
    </div>
  );

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-4 pt-15 md:p-6 max-w-[95rem] xl:px-12">
        <PageHeader
          title="Manage Units"
          description="View, edit, and manage all property units."
          buttonText="Add New Units"
          onButtonClick={() => setIsAddModalOpen(true)}
        />

        <SearchInput
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeSearchTerm={activeSearchTerm}
          onSearch={handleSearch}
          onClear={clearSearch}
          placeholder="Search by unit name..."
        />

        <DataTable
          isLoading={isLoading}
          error={error}
          data={units}
          totalCount={totalCount}
          pageCount={pageCount}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          activeSearchTerm={activeSearchTerm}
          renderTable={renderDesktopTable}
          renderCards={renderMobileCards}
          emptyStateTitle="No Units Found"
          emptyStateDescription='Click "Add New Units" to get started.'
        />
      </div>

      {/* --- Modals --- */}
      <UnitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess} // Pass the success handler
      />

      {selectedUnit && (
        <>
          <EditUnitModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            unit={selectedUnit}
          />
          <DeleteUnitModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={selectedUnit.name}
          />
        </>
      )}
    </>
  );
};

export default Units;
