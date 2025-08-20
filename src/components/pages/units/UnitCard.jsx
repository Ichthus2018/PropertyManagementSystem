// src/components/pages/units/UnitCard.jsx
import {
  PencilIcon,
  TrashIcon,
  BuildingOffice2Icon,
  HomeModernIcon,
} from "@heroicons/react/20/solid";

const UnitCard = ({ unit, onEdit, onDelete }) => {
  console.log(unit);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <BuildingOffice2Icon className="h-5 w-5 mr-2 text-orange-600" />
            {unit.name}
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            <span className="font-medium">Size:</span> {unit.sqm} sqm
          </p>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-medium">Type:</span>{" "}
            {unit.unit_types?.unit_type || "N/A"}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(unit)}
            className="text-orange-600 hover:text-orange-900 p-1"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(unit)}
            className="text-red-600 hover:text-red-900 p-1"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitCard;
