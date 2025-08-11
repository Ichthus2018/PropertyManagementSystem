import React, { useState } from "react";
import UnitModal from "../../components/modals/PropertyModal";

const Units = () => {
  // State to control if the modal is open or closed
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // This is the sample data that will be passed to the modal
  const samplePropertyData = {
    propertyId: "SYS-PROP-00123",
    propertyName: "Downtown Plaza",
    address: {
      country: "Philippines",
      region: "National Capital Region (NCR)",
      province: "Metro Manila",
      city: "Makati City",
      barangay: "San Lorenzo",
      street: "123 Ayala Avenue",
    },
    businessLicense: {
      fileName: "business-permit-2024.pdf",
      notes: "Permit No. B-12345, Exp: Dec 31, 2024",
    },
    cor: {
      fileName: "bir-cor-downtown-plaza.pdf",
      notes: "TIN: 123-456-789-000",
    },
    totalSqm: 550,
    units: [
      {
        id: 1,
        name: "Suite 201",
        sqm: 150,
        type: "Office",
        lease: "Commercial",
        category: "Premium",
      },
      {
        id: 2,
        name: "Apt 305",
        sqm: 75,
        type: "Residential",
        lease: "Long-term",
        category: "Standard",
      },
      {
        id: 3,
        name: "Retail Space A",
        sqm: 200,
        type: "Retail",
        lease: "Commercial",
        category: "Ground Floor",
      },
    ],
  };

  return (
    <div className="bg-gray-100 min-h-screen ">
      <div>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          Edit "Downtown Plaza"
        </button>
      </div>

      {/* The Modal Component */}
      <UnitModal
        isOpen={isModalOpen}
        onClose={closeModal}
        propertyData={samplePropertyData}
      />
    </div>
  );
};

export default Units;
