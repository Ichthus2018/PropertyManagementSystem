// src/components/common/DataTable.jsx
import { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";
import LoadingSpinner from "../../ui/LoadingSpinner";

const DataTable = ({
  isLoading,
  error,
  data,
  totalCount,
  pageCount,
  currentPage,
  onPageChange,
  pageSize,
  activeSearchTerm,
  renderTable, // A function that returns the table JSX
  renderCards, // A function that returns the cards JSX
  emptyStateTitle,
  emptyStateDescription,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handlePageClick = (event) => {
    if (onPageChange) {
      onPageChange(event.selected + 1);
    }
  };

  const renderContent = () => {
    if (isLoading && !totalCount) {
      return (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 px-4 text-red-500">
          <p className="font-semibold">An error occurred</p>
          <p className="text-sm">{error.message}</p>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-10 px-4 text-gray-500">
          <h4 className="font-semibold">
            {activeSearchTerm ? "No Results Found" : emptyStateTitle}
          </h4>
          <p className="text-sm mt-1">
            {activeSearchTerm
              ? "Try a different search term or clear the search."
              : emptyStateDescription}
          </p>
        </div>
      );
    }

    return isMobile ? renderCards(data) : renderTable(data);
  };

  return (
    <div className="bg-white   rounded-lg">
      {renderContent()}
      {totalCount > pageSize && (
        <div className="p-4 md:p-6 border-t border-gray-200">
          <ReactPaginate
            breakLabel="..."
            nextLabel="›"
            onPageChange={handlePageClick}
            pageRangeDisplayed={3}
            pageCount={pageCount}
            previousLabel="‹"
            renderOnZeroPageCount={null}
            forcePage={currentPage - 1}
            containerClassName="flex items-center justify-center gap-1 text-sm md:text-base font-medium"
            pageLinkClassName="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200"
            activeLinkClassName="bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
            previousLinkClassName="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200"
            nextLinkClassName="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200"
            disabledClassName="opacity-50 cursor-not-allowed"
            breakLinkClassName="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-400"
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;
