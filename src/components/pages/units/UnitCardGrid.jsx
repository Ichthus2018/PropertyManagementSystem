import {
  PencilSquareIcon,
  TrashIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  ArrowsPointingOutIcon,
  // BuildingLibraryIcon, // No longer needed
  // RectangleGroupIcon,  // No longer needed
} from "@heroicons/react/24/outline";

// Helper function for formatting numbers with commas

const UnitCardGrid = ({ units, onEdit, onDelete, onViewDetails }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {units.map((unit) => {
        // Combine facilities and utilities into a single array for easier mapping
        const features = [
          ...(unit.facilities || []),
          ...(unit.utilities || []),
        ];

        return (
          <div
            key={unit.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
          >
            {/* --- Image Section --- */}
            <div className="relative">
              <img
                src={
                  unit.unit_images && unit.unit_images.length > 0
                    ? unit.unit_images[0]
                    : "https://placehold.co/800x600.png?text=No+Image+Available"
                }
                alt={unit.name}
                className="w-full h-52 object-cover aspect-video transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <span
                  className={`px-3 py-1 text-xs font-bold text-white rounded-full ${
                    unit.leasing_types?.leasing_type === "Rent-to-Own"
                      ? "bg-green-600"
                      : "bg-blue-600"
                  }`}
                >
                  {unit.leasing_types?.leasing_type || "N/A"}
                </span>
              </div>
            </div>

            {/* --- Content Section --- */}
            <div className="p-5 flex flex-col flex-grow">
              {/* Title */}
              <h3 className="font-bold text-lg text-gray-800 leading-tight pr-2 mb-2">
                {unit.name}
              </h3>

              {/* Location and Type */}
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{unit.properties?.property_name || "N/A"}</span>
                </div>
                <div className="flex items-center">
                  <BuildingOffice2Icon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{unit.unit_types?.unit_type || "N/A"}</span>
                </div>
              </div>

              {/* ▼▼▼ REPLACEMENT SECTION START ▼▼▼ */}
              {/* --- Stats & Features --- */}
              <div className="space-y-3">
                {/* SQM Stat */}
                <div className="flex items-center text-sm text-gray-800">
                  <ArrowsPointingOutIcon className="h-5 w-5 mr-1.5 text-gray-500" />
                  <span className="font-medium">{unit.sqm || "N/A"} sqm</span>
                </div>

                {/* Dynamic Features (Facilities & Utilities) */}
                <div className="flex flex-wrap gap-2">
                  {features.length > 0 ? (
                    <>
                      {features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                      {features.length > 3 && (
                        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full">
                          + {features.length - 3} more
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">
                      No features listed.
                    </span>
                  )}
                </div>
              </div>
              {/* ▲▲▲ REPLACEMENT SECTION END ▲▲▲ */}

              {/* --- Footer Actions --- */}
              <div className="mt-auto pt-5">
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(unit)}
                      className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-orange-600 transition-colors"
                      title="Edit Unit"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(unit)}
                      className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-600 transition-colors"
                      title="Delete Unit"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => onViewDetails(unit)}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UnitCardGrid;
