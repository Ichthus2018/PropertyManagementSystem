// src/pages/facilities/FacilityPage.jsx (or similar path)
import React, { useState } from "react";
import ReactPaginate from "react-paginate";

// Import your hook and components
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import AddFacilityModal from "../../components/modals/FacilityModal/AddFacilityModal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import SearchInput from "../../components/ui/common/SearchInput";
import DeleteFacilityModal from "../../components/modals/FacilityModal/DeleteFacilityModal";
import supabase from "../../lib/supabase";
import EditFacilityModal from "../../components/modals/FacilityModal/EditFacilityModal";

export default function FacilityPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // 2. ADD state for edit modal
  const [facilityToEdit, setFacilityToEdit] = useState(null); //    and the selected facility

  // Use the custom hook for all data management
  const {
    data: facilities,
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
    tableName: "facilities",
    selectQuery: `id, name, image_url, created_at`,
    searchColumn: "name",
    initialPageSize: 5, // Display 5 facilities per page
  });

  const handlePageClick = (event) => {
    setCurrentPage(event.selected + 1);
  };

  const handleEditSuccess = () => {
    // 3. ADD a success handler for editing
    setIsEditModalOpen(false);
    setFacilityToEdit(null);
    mutate(); // Just refetch the current page data
  };

  // --- EDIT MODAL HANDLERS ---
  const handleOpenEditModal = (facility) => {
    // 4. ADD handlers to open/close the edit modal
    setFacilityToEdit(facility);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setFacilityToEdit(null);
  };

  const handleAddSuccess = () => {
    setIsModalOpen(false);
    // If we are on a page other than 1 or searching,
    // reset to page 1 to see the newly added item.
    if (currentPage !== 1 || activeSearchTerm) {
      clearSearch(); // This will also trigger a refetch
    } else {
      mutate(); // Otherwise, just refetch the current page
    }
  };

  const handleOpenDeleteModal = (facility) => {
    setFacilityToDelete(facility);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setFacilityToDelete(null); // Clear selection on close
  };

  const handleConfirmDelete = async () => {
    if (!facilityToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("facilities")
        .delete()
        .eq("id", facilityToDelete.id);

      if (error) {
        throw error;
      }

      // Success! Close modal and refresh data.
      handleCloseDeleteModal();

      // If we deleted the last item on a page that isn't page 1, go back one page.
      if (facilities.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        mutate();
      }
      // You could add a success toast notification here
    } catch (error) {
      console.error("Error deleting facility:", error.message);
      // You could add an error toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  const renderContent = () => {
    if (isLoading && !facilities.length) {
      return (
        <tr>
          <td colSpan="3" className="py-10 text-center">
            <LoadingSpinner />
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td colSpan="3" className="text-center py-10 text-red-500">
            {error}
          </td>
        </tr>
      );
    }
    if (facilities.length === 0) {
      return (
        <tr>
          <td colSpan="3" className="text-center py-10 text-gray-500">
            <h4 className="font-semibold">
              {activeSearchTerm ? "No Facilities Found" : "No Facilities Yet"}
            </h4>
            <p className="text-sm">
              {activeSearchTerm
                ? "Try a different search term or clear the search."
                : 'Click "Add Facility" to get started.'}
            </p>
          </td>
        </tr>
      );
    }
    return facilities.map((facility) => (
      <tr key={facility.id}>
        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
          <div className="flex items-center">
            <div className="h-11 w-11 flex-shrink-0">
              <img
                className="h-11 w-11 rounded-full object-cover"
                src={facility.image_url}
                alt={facility.name}
              />
            </div>
            <div className="ml-4">
              <div className="font-medium text-gray-900">{facility.name}</div>
            </div>
          </div>
        </td>
        <td className="px-3 py-4 text-sm text-gray-500">
          <span className="text-xs text-gray-400">Not assigned</span>
        </td>
        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
          <button
            onClick={() => handleOpenEditModal(facility)}
            className="text-orange-600 hover:text-orange-900"
          >
            Edit<span className="sr-only">, {facility.name}</span>
          </button>
          <button
            onClick={() => handleOpenDeleteModal(facility)}
            className="ml-4 text-red-600 hover:text-red-900"
          >
            Delete<span className="sr-only">, {facility.name}</span>
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <>
      <AddFacilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
      {facilityToEdit && (
        <EditFacilityModals
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          facility={facilityToEdit}
        />
      )}
      <DeleteFacilityModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        itemName={facilityToDelete?.name || ""}
      />
      <div className="space-y-6 w-full mx-auto p-4 pt-15 md:p-6 max-w-[95rem] xl:px-12">
        {/* Page Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold leading-6 text-gray-900">
              Facilities Management
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all available facilities in the property.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              onClick={() => setIsModalOpen(true)}
              type="button"
              className="block rounded-md bg-orange-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              Add Facility
            </button>
          </div>
        </div>

        {/* --- 2. Replace the old search form with the SearchInput component --- */}
        <div className="flex items-center gap-2 w-full0">
          <SearchInput
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeSearchTerm={activeSearchTerm}
            onSearch={handleSearch}
            onClear={clearSearch}
            placeholder="Search by facility name..."
          />
        </div>
        {/* --- End of replacement --- */}

        {/* Table Container */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Facility
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Assigned Units
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Edit</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {renderContent()}
                  </tbody>
                </table>
                {/* Pagination Controls */}
                {totalCount > pageSize && (
                  <div className="p-4 border-t border-gray-200">
                    <ReactPaginate
                      breakLabel="..."
                      nextLabel="›"
                      onPageChange={handlePageClick}
                      pageRangeDisplayed={3}
                      pageCount={pageCount}
                      previousLabel="‹"
                      renderOnZeroPageCount={null}
                      forcePage={currentPage - 1} // Sync react-paginate's state
                      containerClassName="flex items-center justify-center gap-2 text-sm font-medium"
                      pageLinkClassName="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-900 hover:bg-gray-100 transition"
                      activeLinkClassName="bg-orange-600 text-white border-orange-600 hover:bg-orange-700"
                      previousLinkClassName="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-900 hover:bg-gray-100 transition"
                      nextLinkClassName="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-900 hover:bg-gray-100 transition"
                      disabledClassName="opacity-50 cursor-not-allowed"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
