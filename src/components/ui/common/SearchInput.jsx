// src/components/common/SearchInput.jsx
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/20/solid";

const SearchInput = ({
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  onSearch,
  onClear,
  placeholder,
}) => {
  return (
    <form onSubmit={onSearch} className="flex items-center gap-2 w-full">
      <div className="relative flex-grow">
        <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 pl-3 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder || "Search..."}
          className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
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
          onClick={onClear}
          className="p-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          aria-label="Clear search"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </form>
  );
};

export default SearchInput;
