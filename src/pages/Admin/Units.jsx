import { useState, Suspense, lazy } from "react";
import ReactPaginate from "react-paginate";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import supabase from "../../lib/supabase";

// Lightweight components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/common/EmptyState";
import { useSWRConfig } from "swr";
import UnitDetails from "../../components/modals/UnitModal/UnitDetails";

const UnitCardGrid = lazy(() =>
  import("../../components/pages/units/UnitCardGrid")
);
const UnitModal = lazy(() =>
  import("../../components/modals/UnitModal/UnitModal")
);
const EditUnitModal = lazy(() =>
  import("../../components/modals/UnitModal/EditUnitModal")
);
const DeleteUnitModal = lazy(() =>
  import("../../components/modals/UnitModal/DeleteUnitModal")
);

const Units = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  const { mutate: globalMutate } = useSWRConfig();
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
    selectQuery: `
      id,
      name,
      sqm,
      unit_type_id,
      leasing_type_id,
      unit_category_id,
      unit_category_2_id,
      unit_category_3_id,
      facilities,
      utilities,
      unit_images,
      properties (property_name), 
      unit_types (unit_type),
      leasing_types (leasing_type)
    `,
    searchColumn: "name",
    initialPageSize: 9,
  });

  // Modal handler functions
  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    mutate();
  };
  const openEditModal = (unit) => {
    setSelectedUnit(unit);
    setIsEditModalOpen(true);
  };
  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedUnit(null);
    mutate();
  };
  const openDeleteModal = (unit) => {
    setSelectedUnit(unit);
    setIsDeleteModalOpen(true);
  };

  const handleViewDetails = (unit) => {
    setSelectedUnit(unit);
    setViewingDetails(true);
  };
  const handleBackToGrid = () => {
    setSelectedUnit(null);
    setViewingDetails(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUnit) return;
    setIsProcessing(true);

    // Optimistic update for the current page view
    const updatedUnits = units.filter((unit) => unit.id !== selectedUnit.id);
    await mutate(
      { data: updatedUnits, count: totalCount - 1 },
      { revalidate: false }
    );

    try {
      // 1. Delete associated images from Supabase Storage first
      if (selectedUnit.unit_images && selectedUnit.unit_images.length > 0) {
        // The database stores the full URL. We need to extract the path for the remove function.
        const filePathsToDelete = selectedUnit.unit_images.map((url) => {
          // Split the URL by the bucket name and take the part after it.
          const path = url.split("/unit-images/")[1];
          return path;
        });

        // Remove the files from the 'unit-images' bucket
        const { error: storageError } = await supabase.storage
          .from("unit-images")
          .remove(filePathsToDelete);

        if (storageError) {
          console.error("Error deleting files from storage:", storageError);
          // Throw the error to stop the database deletion and trigger the catch block
          throw storageError;
        }
      }

      // 2. If image deletion is successful, delete the unit from the database
      const { error: deleteError } = await supabase
        .from("units")
        .delete()
        .eq("id", selectedUnit.id);

      if (deleteError) throw deleteError;

      // 3. Revalidate global SWR keys to update available space in the Add modal
      globalMutate({ table: "units", columns: "property_id, sqm" });
      globalMutate({ table: "properties" });
    } catch (err) {
      console.error("Failed to delete unit:", err);
      // If any part of the deletion fails, revert the optimistic update
      mutate();
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedUnit(null);
    }
  };

  // Pagination handler for react-paginate
  const handlePageClick = (event) => {
    // react-paginate is 0-indexed, so we add 1
    setCurrentPage(event.selected + 1);
  };

  // Render logic
  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    if (error) {
      return (
        <div className="text-center py-10 text-red-500">
          Error loading units: {error.message}
        </div>
      );
    }
    if (viewingDetails && selectedUnit) {
      // 👈 Conditional rendering for UnitDetails
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <UnitDetails
            unit={selectedUnit}
            onBack={handleBackToGrid}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />
        </Suspense>
      );
    }
    if (!units || units.length === 0) {
      return (
        <EmptyState
          title="No Units Found"
          description={
            activeSearchTerm
              ? `No units found for "${activeSearchTerm}".`
              : 'Click "Add New Units" to get started.'
          }
        />
      );
    }
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <UnitCardGrid
          units={units}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onViewDetails={handleViewDetails} // 👈 Pass the new handler
        />
      </Suspense>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen ">
        {/* Only show PageHeader and SearchInput in the main grid view */}
        {!viewingDetails && (
          <>
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
          </>
        )}

        <div className="overflow-hidden">
          <div className="p-4 sm:p-6">{renderContent()}</div>
          {totalCount > pageSize &&
            !viewingDetails && ( // 👈 Hide pagination when viewing details
              <div className="p-6 border-t border-gray-200">
                <ReactPaginate
                  breakLabel="..."
                  nextLabel="›"
                  onPageChange={handlePageClick}
                  pageRangeDisplayed={3}
                  pageCount={pageCount}
                  previousLabel="‹"
                  renderOnZeroPageCount={null}
                  forcePage={currentPage - 1}
                  containerClassName="flex items-center justify-center gap-2 text-base font-medium"
                  pageClassName=""
                  pageLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
                  activeClassName=""
                  activeLinkClassName="bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                  previousClassName=""
                  previousLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
                  nextClassName=""
                  nextLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
                  disabledClassName="opacity-50 cursor-not-allowed"
                  breakClassName=""
                  breakLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-400"
                />
              </div>
            )}
        </div>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        <UnitModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleAddSuccess}
        />

        {/* Edit and Delete modals should still work regardless of the view */}
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
      </Suspense>
    </>
  );
};

export default Units;
