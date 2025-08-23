// src/components/tables/FacilityTable.jsx

import React, { useCallback, useEffect, useState } from "react";

import AddFacilityModal from "../../components/modals/FacilityModal/AddFacilityModal";

// A loading skeleton component for a better UX
const TableSkeleton = () => (
  <>
    {[...Array(3)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
          <div className="flex items-center">
            <div className="h-11 w-11 flex-shrink-0 rounded-full bg-gray-200"></div>
            <div className="ml-4">
              <div className="h-4 w-32 rounded bg-gray-200"></div>
            </div>
          </div>
        </td>
        <td className="px-3 py-4 text-sm text-gray-500">
          <div className="flex flex-wrap gap-1">
            <div className="h-5 w-20 rounded-md bg-gray-200"></div>
            <div className="h-5 w-24 rounded-md bg-gray-200"></div>
          </div>
        </td>
        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
          <div className="h-4 w-8 rounded bg-gray-200"></div>
        </td>
      </tr>
    ))}
  </>
);

export default function FacilityPage() {
  const [facilities, setFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to fetch data
  const fetchFacilities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This is the key Supabase query. It fetches facilities
      // and for each facility, it fetches the related units.
      const { data, error: queryError } = await supabase.from("facilities")
        .select(`
          id,
          name,
          image_url,
          units (
            id,
            name
          )
        `);

      if (queryError) throw queryError;

      setFacilities(data || []);
    } catch (err) {
      console.error("Error fetching facilities:", err);
      setError("Could not fetch facilities data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  return (
    <>
      <AddFacilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchFacilities} // Pass the fetch function to refetch data on success
      />
      <div className="px-4 sm:px-6 lg:px-8 font-sans">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold leading-6 text-gray-900">
              Facilities Management
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all facilities and the units they are assigned to.
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
                    {isLoading ? (
                      <TableSkeleton />
                    ) : error ? (
                      <tr>
                        <td
                          colSpan="3"
                          className="text-center py-10 text-red-500"
                        >
                          {error}
                        </td>
                      </tr>
                    ) : facilities.length === 0 ? (
                      <tr>
                        <td
                          colSpan="3"
                          className="text-center py-10 text-gray-500"
                        >
                          No facilities found. Click "Add Facility" to get
                          started.
                        </td>
                      </tr>
                    ) : (
                      facilities.map((facility) => (
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
                                <div className="font-medium text-gray-900">
                                  {facility.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {facility.units.length > 0 ? (
                                facility.units.map((unit) => (
                                  <span
                                    key={unit.id}
                                    className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                                  >
                                    {unit.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">
                                  Not assigned
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <a
                              href="#"
                              className="text-orange-600 hover:text-orange-900"
                            >
                              Edit
                              <span className="sr-only">, {facility.name}</span>
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
