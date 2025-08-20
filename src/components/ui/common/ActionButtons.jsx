// src/components/common/ActionButtons.jsx
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";

const ActionButtons = ({ onEdit, onDelete }) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onEdit}
        className="text-orange-600 hover:text-orange-900 p-1"
        aria-label="Edit item"
      >
        <PencilIcon className="h-5 w-5" />
      </button>
      <button
        onClick={onDelete}
        className="text-red-600 hover:text-red-900 p-1"
        aria-label="Delete item"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ActionButtons;
