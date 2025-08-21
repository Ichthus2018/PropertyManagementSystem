import { useState, useRef } from "react";
import { XMarkIcon, ArrowUpTrayIcon } from "@heroicons/react/20/solid";
import { v4 as uuidv4 } from "uuid";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

/**
 * Converts an image file to AVIF format using the browser's Canvas API.
 * @param {File} file The original image file.
 * @param {number} quality The quality of the output AVIF image (0.0 to 1.0).
 * @returns {Promise<File>} A promise that resolves with the new AVIF File object.
 */
const convertToAVIF = (file, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    // Create an object URL for the source file
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      // Create a canvas element
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");

      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0);

      // We no longer need the object URL
      URL.revokeObjectURL(objectUrl);

      // Convert the canvas content to an AVIF blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(
              new Error(
                "Canvas to Blob conversion failed. Your browser may not support AVIF encoding."
              )
            );
          }
          // Create a new file name with the .avif extension
          const baseName =
            file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
          const newFileName = `${baseName}.avif`;

          // Create a new File object from the blob
          const avifFile = new File([blob], newFileName, {
            type: "image/avif",
          });
          resolve(avifFile);
        },
        "image/avif", // Specify the desired MIME type
        quality // Specify the desired quality
      );
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };

    img.src = objectUrl;
  });
};

const ImageUploader = ({
  label,
  files,
  setFiles,
  description,
  setDescription,
  maxFiles = 5,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isConverting, setIsConverting] = useState(false); // Optional: for loading state
  const inputRef = useRef(null);

  const handleFileChange = async (newFiles) => {
    if (newFiles && newFiles.length > 0) {
      const filesToProcess = Array.from(newFiles).slice(
        0,
        maxFiles - files.length
      );

      if (filesToProcess.length === 0) return;

      setIsConverting(true); // Start loading/conversion indicator

      try {
        // Create an array of conversion promises
        const conversionPromises = filesToProcess.map((file) =>
          convertToAVIF(file)
        );

        // Wait for all images to be converted
        const convertedFiles = await Promise.all(conversionPromises);

        const filesToAdd = convertedFiles.map((file) => ({
          id: uuidv4(),
          file: file,
          preview: URL.createObjectURL(file),
          source: "new",
        }));

        setFiles((prev) => [...prev, ...filesToAdd]);
      } catch (error) {
        console.error("Failed to convert one or more images:", error);
        // You could show an error toast to the user here
        alert(
          "An error occurred while converting an image to AVIF. Please try a different image or browser."
        );
      } finally {
        setIsConverting(false); // Stop loading/conversion indicator
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(["dragenter", "dragover"].includes(e.type));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileChange(e.dataTransfer.files);
  };

  const removeFile = (id) => {
    const fileToRemove = files.find((f) => f.id === id);
    if (fileToRemove?.preview) URL.revokeObjectURL(fileToRemove.preview);
    setFiles(files.filter((f) => f.id !== id));
  };

  const isDisabled = files.length >= maxFiles || isConverting;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-800">
        {label}
      </label>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isDisabled && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-6 sm:px-6 sm:py-10 rounded-lg transition-all duration-300
      ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
      ${
        dragActive
          ? "border-orange-500 bg-orange-50"
          : "border-gray-300 hover:border-orange-500 hover:bg-orange-50/50"
      }`}
      >
        {isConverting ? (
          <p className="text-sm font-semibold text-gray-600">
            Converting images...
          </p>
        ) : (
          <>
            <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 group-hover:scale-105 transition" />
            <p className="text-sm text-center text-gray-700 leading-tight">
              <span className="font-semibold text-orange-600">
                Tap to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF will be converted to AVIF
            </p>
            <p className="text-xs text-gray-500">
              {files.length} / {maxFiles} files added
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png, image/jpeg, image/gif, image/webp, image/avif"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files)}
          disabled={isDisabled}
        />
      </div>

      {files.length > 0 && (
        <>
          <PhotoProvider>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((item) => (
                <PhotoView key={item.id} src={item.preview || item.url}>
                  <div className="relative group overflow-hidden rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-zoom-in">
                    <img
                      src={item.preview || item.url}
                      alt="Preview"
                      className="w-full h-32 sm:h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(item.id);
                      }}
                      className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 transition"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </PhotoView>
              ))}
            </div>
          </PhotoProvider>

          <div className="mt-3">
            <label
              htmlFor={`${label}-description`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id={`${label}-description`}
              type="text"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ImageUploader;
