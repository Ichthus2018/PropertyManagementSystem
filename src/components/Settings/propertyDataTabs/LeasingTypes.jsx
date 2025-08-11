import { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";

// Import your new hook
import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";

// Import other components
import EditLeasingTypeModal from "../../modals/Settings/LeasingTypeModal/EditLeasingTypeModal";
import DeleteLeasingTypeConfirmationModal from "../../modals/Settings/LeasingTypeModal/DeleteLeasingTypeConfirmationModal";
import AddLeasingTypeModal from "../../modals/Settings/LeasingTypeModal/AddLeasingTypeModal";
import LoadingSpinner from "../../ui/LoadingSpinner";
import supabase from "../../../lib/supabase"; // Keep for delete operation

const LeasingTypes = () => {
  // --- Local UI state (for modals and mobile view) remains ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLeasingType, setSelectedLeasingType] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Use the custom hook to manage all data, pagination, and search logic
  const {
    data: leasingTypes, // Renamed 'data' to 'leasingTypes' for clarity
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
    tableName: "leasing_types",
    selectQuery: `
      id,
      leasing_type,
      created_at,
      profiles (first_name, last_name)
    `,
    searchColumn: "leasing_type",
    initialPageSize: 5,
  });

  // --- No changes needed for this effect ---
  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Pagination handler for react-paginate
  const handlePageClick = (event) => {
    // react-paginate is 0-indexed, so we add 1
    setCurrentPage(event.selected + 1);
  };

  // --- Modal and Action Handlers (Now using values from the hook) ---

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);

    // Always mutate to ensure fresh data
    mutate();

    // If we're not on page 1 or searching, reset to page 1 and clear search
    if (currentPage !== 1 || activeSearchTerm) {
      setCurrentPage(1);
      setSearchTerm("");
      setActiveSearchTerm("");
    }
  };

  const openEditModal = (leasingType) => {
    setSelectedLeasingType(leasingType);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedLeasingType(null);
    // Tell SWR to re-fetch the data for the current page
    mutate();
  };

  const openDeleteModal = (leasingType) => {
    setSelectedLeasingType(leasingType);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLeasingType) return;

    setIsProcessing(true);
    try {
      const { error: deleteError } = await supabase
        .from("leasing_types")
        .delete()
        .eq("id", selectedLeasingType.id);

      if (deleteError) throw deleteError;

      // If we deleted the last item on the current page, go to the previous page.
      if (leasingTypes.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        // Otherwise, just re-fetch the current page's data.
        mutate();
      }
    } catch (err) {
      console.error("Failed to delete leasing type:", err);
      // You can add a toast notification here
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedLeasingType(null);
    }
  };

  // --- Rendering Logic (Mostly unchanged, just uses variables from the hook) ---

  const renderDesktopTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Leasing Type
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Created By
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leasingTypes.map((leasingType) => {
            const creatorName = leasingType.profiles
              ? `${leasingType.profiles.first_name} ${leasingType.profiles.last_name}`
              : "Unknown User";
            return (
              <tr key={leasingType.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {leasingType.leasing_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {creatorName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => openEditModal(leasingType)}
                    className="text-orange-600 hover:text-orange-900 p-1"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(leasingType)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderMobileCards = () => (
    <div className="space-y-4">
      {leasingTypes.map((leasingType) => {
        const creatorName = leasingType.profiles
          ? `${leasingType.profiles.first_name} ${leasingType.profiles.last_name}`
          : "Unknown User";
        return (
          <div
            key={leasingType.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {leasingType.leasing_type}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Created by: {creatorName}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(leasingType)}
                  className="text-orange-600 hover:text-orange-900 p-1"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => openDeleteModal(leasingType)}
                  className="text-red-600 hover:text-red-900 p-1"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderContent = () => {
    if (isLoading && !totalCount) {
      // Show spinner only on initial load
      return (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-10 text-red-500">{error.message}</div>
      );
    }
    if (leasingTypes.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          <h4 className="font-semibold">
            {activeSearchTerm ? "No Results Found" : "No Leasing Types Yet"}
          </h4>
          <p>
            {activeSearchTerm
              ? "Try a different search term or clear the search."
              : 'Click "Add New" to get started.'}
          </p>
        </div>
      );
    }
    return isMobile ? renderMobileCards() : renderDesktopTable();
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-4 md:p-6 max-w-4xl">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Leasing Types
            </h2>
            <p className="text-sm text-gray-600">
              Configure your property leasing types here.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="sm:inline">Add New</span>
          </button>
        </div>

        {/* Search form now uses handlers from the hook */}
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 w-full"
        >
          <div className="relative flex-grow w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by leasing type..."
              className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="hidden sm:flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Search
          </button>
          <button
            type="submit"
            className="sm:hidden p-2 text-white bg-gray-800 rounded-md hover:bg-gray-700"
            aria-label="Search"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
          {activeSearchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </form>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
          {renderContent()}
          {totalCount > pageSize && (
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

      {/* --- Modals --- */}
      <AddLeasingTypeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
      {selectedLeasingType && (
        <>
          <EditLeasingTypeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            leasingType={selectedLeasingType}
          />
          <DeleteLeasingTypeConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isProcessing}
            itemName={selectedLeasingType.leasing_type}
          />
        </>
      )}
    </>
  );
};

export default LeasingTypes;
