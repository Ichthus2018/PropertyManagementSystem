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
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";

// Import other components and hooks
import AddPropertyModal from "../../components/modals/PropertyModal/AddPropertyModal";
import EditPropertyModal from "../../components/modals/PropertyModal/EditPropertyModal";
import DeletePropertyModal from "../../components/modals/PropertyModal/DeletePropertyModal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { useAuthStore } from "../../store/useAuthStore";
import supabase from "../../lib/supabase"; // Keep for the custom delete operation

const Properties = () => {
  // --- Local UI state (for modals and mobile view) remains ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Get user profile from store to display creator info
  const userProfile = useAuthStore((state) => state.userProfile);

  // Use the custom hook to manage all data, pagination, and search logic
  const {
    data: properties, // Renamed 'data' to 'properties' for clarity
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
    selectQuery: `
      id, property_name, number_of_units, total_sqm,
      business_licenses, certificates_of_registration,
      created_by, 
      address_country, address_country_iso,
      address_street,
      address_zip_code,
      address_state,
      address_state_iso,
      address_region,
      address_province,
      address_city_municipality,
      address_barangay
    `,
    searchColumn: "property_name",
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

  const openEditModal = (property) => {
    setSelectedProperty(property);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedProperty(null);
    // Tell SWR to re-fetch the data for the current page
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
      const licenseFiles = selectedProperty.business_licenses?.files || [];
      const certFiles =
        selectedProperty.certificates_of_registration?.files || [];
      const pathsToDelete = [...licenseFiles, ...certFiles]
        .map((file) => file.path)
        .filter(Boolean);

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("property-documents")
          .remove(pathsToDelete);
        if (storageError) {
          console.error(
            "Could not delete some files from storage:",
            storageError
          );
        }
      }

      const { error: deleteError } = await supabase
        .from("properties")
        .delete()
        .eq("id", selectedProperty.id);

      if (deleteError) throw deleteError;

      // Update UI using state and methods from the hook
      if (properties.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        mutate();
      }
    } catch (err) {
      console.error("Failed to delete property:", err);
      // You can add a toast notification here
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
      setSelectedProperty(null);
    }
  };

  // --- Helper Functions (Unchanged) ---
  const formatAddress = (p) => {
    let addressParts;
    if (p.address_country_iso === "PH") {
      addressParts = [
        p.address_street,
        p.address_barangay,
        p.address_city_municipality,
        p.address_province,
        p.address_zip_code,
        p.address_country,
      ];
    } else {
      addressParts = [
        p.address_street,
        p.address_state,
        p.address_zip_code,
        p.address_country,
      ];
    }
    return addressParts.filter(Boolean).join(", ") || "N/A";
  };

  const getCreatorDisplay = (property) => {
    if (!userProfile) return "Loading...";
    if (property.created_by === userProfile.id) {
      return "You";
    }
    return `User ${property.created_by.substring(0, 8)}...`;
  };

  const renderDesktopTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Property Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Address
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Units
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Total SQM
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Created By
            </th>
            <th
              scope="col"
              className="sticky right-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Action
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {properties.map((property) => (
            <tr key={property.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {property.property_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatAddress(property)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {property.number_of_units || "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {property.total_sqm || "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getCreatorDisplay(property)}
              </td>
              <td className="sticky right-0 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => openEditModal(property)}
                  className="text-orange-600 hover:text-orange-900 p-1"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => openDeleteModal(property)}
                  className="text-red-600 hover:text-red-900 p-1"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMobileCards = () => (
    <div className="space-y-4">
      {properties.map((property) => (
        <div
          key={property.id}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {property.property_name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {formatAddress(property)}
              </p>
              <div className="text-sm text-gray-500 mt-2">
                <span>
                  Units: <strong>{property.number_of_units || "N/A"}</strong>
                </span>
                <span className="mx-2">|</span>
                <span>
                  SQM: <strong>{property.total_sqm || "N/A"}</strong>
                </span>
              </div>
            </div>
            <div className="flex flex-col space-y-2 flex-shrink-0 ml-4">
              <button
                onClick={() => openEditModal(property)}
                className="text-orange-600 hover:text-orange-900 p-1"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => openDeleteModal(property)}
                className="text-red-600 hover:text-red-900 p-1"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (isLoading && !totalCount) {
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
    if (properties.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          <h4 className="font-semibold">
            {activeSearchTerm ? "No Results Found" : "No Properties Yet"}
          </h4>
          <p>
            {activeSearchTerm
              ? "Try a different search term or clear the search."
              : 'Click "Add New Property" to get started.'}
          </p>
        </div>
      );
    }
    return isMobile ? renderMobileCards() : renderDesktopTable();
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-4 md:p-6 max-w-[120rem] xl:px-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Properties
            </h2>
            <p className="text-sm text-gray-600">
              Add, edit, and manage your properties here.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="sm:inline">Add New Property</span>
          </button>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 w-full"
        >
          <div className="relative flex-grow">
            <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 pl-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by property name..."
              className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset  sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700"
          >
            Search
          </button>
          {activeSearchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
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
