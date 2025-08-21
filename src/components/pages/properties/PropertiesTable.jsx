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
  const [imageErrors, setImageErrors] = useState({});

  const openViewer = (files, title) => {
    if (!files || files.length === 0) return;
    const imageUrls = files.map((file) => file.url);
    setViewerConfig({ images: imageUrls, title });
    setImageErrors({}); // Reset errors when opening viewer
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
  };

  const handleImageError = (imageUrl) => {
    setImageErrors((prev) => ({
      ...prev,
      [imageUrl]: true,
    }));
  };

  // Function to determine if a URL is an AVIF image
  const isAvifImage = (url) => {
    return url.toLowerCase().includes(".avif");
  };

  // Function to get a fallback URL for AVIF images
  const getFallbackUrl = (url) => {
    if (!isAvifImage(url)) return url;

    // Try to replace .avif with .jpg or .png as fallbacks
    const jpgUrl = url.replace(/\.avif$/i, ".jpg");
    const pngUrl = url.replace(/\.avif$/i, ".png");

    // Return the first fallback that exists in our images array
    if (viewerConfig.images.includes(jpgUrl)) return jpgUrl;
    if (viewerConfig.images.includes(pngUrl)) return pngUrl;

    return url; // Return original if no fallback found
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
        overlayClassName="fixed inset-0 bg-black/75 z-50 flex items-center justify-center"
      >
        <div className="relative w-full max-w-4xl mx-auto max-h-[90vh]">
          <button
            onClick={closeViewer}
            className="absolute top-4 right-4 text-white text-3xl z-10"
          >
            &times;
          </button>
          <div className="bg-white rounded-lg p-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{viewerConfig.title}</h2>
            <Carousel showThumbs={true}>
              {viewerConfig.images.map((image, index) => {
                const avifSrc = image.replace(/\.(jpg|jpeg|png)$/i, ".avif");
                return (
                  <div
                    key={index}
                    className="w-full h-full flex flex-col items-center justify-center"
                  >
                    <picture>
                      <source srcSet={avifSrc} type="image/avif" />
                      <img
                        src={image}
                        alt={`${viewerConfig.title} ${index + 1}`}
                        className="max-w-full max-h-[75vh] object-contain"
                        loading="lazy"
                        onError={() => handleImageError(image)}
                      />
                    </picture>
                    {isAvifImage(image) && (
                      <div className="mt-2 text-xs text-gray-500 bg-yellow-50 px-2 py-1 rounded-full">
                        AVIF format – May not display in all browsers
                      </div>
                    )}
                  </div>
                );
              })}
            </Carousel>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PropertiesTable;
