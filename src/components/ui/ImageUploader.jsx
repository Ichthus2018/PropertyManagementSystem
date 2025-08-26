import { useState, useRef, useEffect } from "react";
import { XMarkIcon, ArrowUpTrayIcon } from "@heroicons/react/20/solid";
import { v4 as uuidv4 } from "uuid";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

// --- CHANGE: The entire client-side conversion function is removed ---
// const convertToAVIF = (...) => { ... };

const ImageUploader = ({
  label,
  files,
  setFiles,
  description,
  setDescription,
  maxFiles = 5,
}) => {
  const [dragActive, setDragActive] = useState(false);
  // --- CHANGE: isConverting state is no longer needed ---
  // const [isConverting, setIsConverting] = useState(false);
  const inputRef = useRef(null);

  // Cleanup object URLs on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  const handleFileChange = async (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;

    const MAX_FILE_SIZE_MB = 5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    const incomingFiles = Array.from(newFiles);

    const validFiles = incomingFiles.filter(
      (file) => file.size <= MAX_FILE_SIZE_BYTES
    );
    const oversizedFiles = incomingFiles.filter(
      (file) => file.size > MAX_FILE_SIZE_BYTES
    );

    if (oversizedFiles.length > 0) {
      const oversizedFileNames = oversizedFiles.map((f) => f.name).join(", ");
      alert(
        `The following files are larger than ${MAX_FILE_SIZE_MB}MB and were not added:\n\n${oversizedFileNames}`
      );
    }

    if (validFiles.length === 0) return;

    const filesToProcess = validFiles.slice(0, maxFiles - files.length);

    if (filesToProcess.length === 0) {
      if (validFiles.length > 0) {
        alert(
          `You have reached the maximum of ${maxFiles} files. No new files were added.`
        );
      }
      return;
    }

    // --- CHANGE: Simplified logic. No more conversion. ---
    // We just package the original file for the parent component.
    const filesToAdd = filesToProcess.map((file) => ({
      id: uuidv4(),
      file: file, // The 'file' property is now the original file (e.g., a JPG or PNG)
      preview: URL.createObjectURL(file), // Create a preview from the original
      source: "new",
    }));

    setFiles([...files, ...filesToAdd]);

    // Clear the file input to allow re-selecting the same file later
    if (inputRef.current) {
      inputRef.current.value = "";
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

  const isDisabled = files.length >= maxFiles; // No more isConverting

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
        <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 group-hover:scale-105 transition" />
        <p className="text-sm text-center text-gray-700 leading-tight">
          <span className="font-semibold text-orange-600">Tap to upload</span>{" "}
          or drag and drop
        </p>
        {/* --- CHANGE: Updated descriptive text --- */}
        <p className="text-xs text-gray-500">
          Images are automatically optimized for web.
        </p>
        <p className="text-xs text-gray-500">
          {files.length} / {maxFiles} files added
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png, image/jpeg, image/gif, image/webp"
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
