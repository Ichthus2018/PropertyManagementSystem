import { useState, useRef } from "react";
import { XMarkIcon, ArrowUpTrayIcon } from "@heroicons/react/20/solid";
import { v4 as uuidv4 } from "uuid";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

const ImageUploader = ({
  label,
  files,
  setFiles,
  description,
  setDescription,
  maxFiles = 5,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (newFiles) => {
    if (newFiles && newFiles.length > 0) {
      const filesToAdd = Array.from(newFiles)
        .slice(0, maxFiles - files.length)
        .map((file) => ({
          id: uuidv4(),
          file: file,
          preview: URL.createObjectURL(file),
          source: "new",
        }));
      setFiles((prev) => [...prev, ...filesToAdd]);
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
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-6 sm:px-6 sm:py-10 rounded-lg transition-all duration-300 cursor-pointer
      ${
        dragActive
          ? "border-orange-500 bg-orange-50"
          : "border-gray-300 hover:border-orange-500 hover:bg-orange-50/50"
      }
      ${files.length >= maxFiles ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 group-hover:scale-105 transition" />
        <p className="text-sm text-center text-gray-700 leading-tight">
          <span className="font-semibold text-orange-600">Tap to upload</span>{" "}
          or drag and drop
        </p>
        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
        <p className="text-xs text-gray-500">
          {files.length} / {maxFiles} files added
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files)}
          disabled={files.length >= maxFiles}
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
