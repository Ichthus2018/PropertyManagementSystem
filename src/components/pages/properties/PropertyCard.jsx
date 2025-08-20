// src/components/properties/PropertyCard.jsx

// Change the import from ActionButtons to your new ActionMenu
import ActionMenu from "../../ui/common/ActionMenu";

const PropertyCard = ({ property, onEdit, onDelete, formatAddress }) => {
  // Define a placeholder handler for the new "Export" action
  const handleExport = () => {
    // You can implement your export logic here, e.g., downloading a CSV
    alert(`Exporting data for ${property.property_name}...`);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-medium text-gray-900 break-words">
            {property.property_name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {formatAddress(property)}
          </p>
          <div className="text-sm text-gray-500 mt-2">
            <span>
              Units: <strong>{property.number_of_units || "N/A"}</strong>
            </span>
            <span className="mx-2" aria-hidden="true">
              |
            </span>
            <span>
              SQM: <strong>{property.total_sqm || "N/A"}</strong>
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {/* Replace ActionButtons with the new ActionMenu */}
          <ActionMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
