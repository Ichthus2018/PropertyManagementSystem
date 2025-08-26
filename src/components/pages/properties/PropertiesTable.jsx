// src/components/pages/properties/PropertiesTable.jsx
import React, { useState } from "react";
import {
  FaMapMarkerAlt,
  FaBuilding,
  FaUser,
  FaFileImage,
} from "react-icons/fa";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import Modal from "react-modal";

const PropertiesTable = ({
  properties,
  onEdit,
  onDelete,
  formatAddress,
  getCreatorDisplay,
}) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerConfig, setViewerConfig] = useState({ images: [], title: "" });

  const openViewer = (files, title) => {
    if (!files || files.length === 0) return;
    const imageUrls = files.map((file) => file.url);
    setViewerConfig({ images: imageUrls, title });
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
  };

  Modal.setAppElement("#root");

  return (
    <>
      <div className="space-y-6">
        {properties.map((p) => {
          const hasBusinessLicense = p.business_licenses?.files?.length > 0;
          const hasCertOfReg =
            p.certificates_of_registration?.files?.length > 0;
          return (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200"
            >
              {/* Card Main Content */}
              <div className="p-6">
                {/* Card Header */}
                <div className="flex justify-center mb-6 shadow-sm py-4 rounded-xl bg-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 text-center">
                    {p.property_name}
                  </h2>
                </div>

                {/* Card Body */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-500">Address</p>
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <p className="font-normal text-gray-800">
                        {formatAddress(p)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-bold text-gray-500">
                        Number of Units
                      </p>
                      <div className="flex items-center gap-2">
                        <FaBuilding className="w-5 h-5 text-gray-400" />
                        <p className="font-normal text-gray-800">
                          {p.number_of_units || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500">
                        Total Units Area
                      </p>
                      <p className="font-normal text-gray-800">
                        {p.total_sqm ? `${p.total_sqm} sqm` : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500">
                        Common Area
                      </p>
                      <p className="font-semibold text-green-700">
                        {p.overall_sqm && p.total_sqm
                          ? `${p.overall_sqm - p.total_sqm} sqm`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-500">
                      Created By
                    </p>
                    <div className="flex items-center gap-2">
                      <FaUser className="w-5 h-5 text-gray-400" />
                      <p className="font-normal text-gray-800">
                        {getCreatorDisplay(p)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500">
                        Overall SQM
                      </p>
                      <p className="font-normal text-gray-800">
                        {p.overall_sqm ? `${p.overall_sqm} sqm` : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                {(hasBusinessLicense || hasCertOfReg) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-bold text-gray-500 mb-4">
                      Documents
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-6">
                      {hasBusinessLicense && (
                        <div>
                          <p className="font-medium text-gray-800 mb-2">
                            Business License(s)
                          </p>
                          <button
                            onClick={() =>
                              openViewer(
                                p.business_licenses.files,
                                "Business License(s)"
                              )
                            }
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
                          >
                            <FaFileImage />
                            <span>View Document(s)</span>
                          </button>
                        </div>
                      )}
                      {hasCertOfReg && (
                        <div>
                          <p className="font-medium text-gray-800 mb-2">
                            Certificate(s) of Registration
                          </p>
                          <button
                            onClick={() =>
                              openViewer(
                                p.certificates_of_registration.files,
                                "Certificate(s) of Registration"
                              )
                            }
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-semibold hover:bg-green-200 transition-colors"
                          >
                            <FaFileImage />
                            <span>View Document(s)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="bg-gray-50/75 px-6 py-4 border-t border-gray-200 flex justify-end items-center rounded-b-xl">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => onEdit(p)}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    className="text-sm font-medium text-red-600 hover:text-red-900 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Modal
        isOpen={isViewerOpen}
        onRequestClose={closeViewer}
        contentLabel={viewerConfig.title}
        className="flex items-center justify-center p-4 outline-none"
        overlayClassName="fixed inset-0 bg-black/75 z-50 flex items-center justify-center "
      >
        <div className="relative w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
          <div className="bg-white rounded-lg p-4 ">
            <h2 className="text-xl font-bold mb-4">{viewerConfig.title}</h2>
            {viewerConfig.images.length > 0 && (
              <Carousel showThumbs={false} autoPlay infiniteLoop>
                {viewerConfig.images.map((originalUrl, index) => (
                  <div key={index}>
                    <picture>
                      <source
                        srcSet={`${originalUrl}?transform=w_1200,q_80,f_avif`}
                        type="image/avif"
                      />
                      <source
                        srcSet={`${originalUrl}?transform=w_1200,q_80,f_webp`}
                        type="image/webp"
                      />
                      <img
                        src={originalUrl}
                        alt={`${viewerConfig.title} ${index + 1}`}
                        className="max-w-full max-h-[75vh] object-contain"
                        loading="lazy"
                      />
                    </picture>
                  </div>
                ))}
              </Carousel>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PropertiesTable;
