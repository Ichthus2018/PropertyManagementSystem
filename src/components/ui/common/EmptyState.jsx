// src/components/ui/common/EmptyState.jsx

import { DocumentMagnifyingGlassIcon } from "@heroicons/react/24/outline";

const EmptyState = ({
  icon: Icon = DocumentMagnifyingGlassIcon,
  title = "No Items Found",
  description = "There are no items to display at this time.",
  children,
}) => {
  return (
    <div className="text-center bg-white border-2 border-dashed border-gray-200 rounded-lg p-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-8 w-8 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
        {description}
      </p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default EmptyState;
