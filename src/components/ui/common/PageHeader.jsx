// src/components/common/PageHeader.jsx
import { PlusIcon } from "@heroicons/react/20/solid";

const PageHeader = ({ title, description, buttonText, onButtonClick }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      {buttonText && onButtonClick && (
        <button
          onClick={onButtonClick}
          className="inline-flex items-center justify-center gap-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="sm:inline">{buttonText}</span>
        </button>
      )}
    </div>
  );
};

export default PageHeader;
