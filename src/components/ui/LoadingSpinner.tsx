// src/components/ui/LoadingSpinner.tsx (or common/LoadingSpinner.tsx)

import { ScaleLoader } from "react-spinners";

// You can customize the colors and text to match your app's branding.
const LOADER_COLOR = "#FF6347";
const LOADING_TEXT = "Loading";

const LoadingSpinner = () => {
  return (
    // Use fixed positioning to cover the entire screen
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/10 backdrop-blur-sm">
      <ScaleLoader
        color={LOADER_COLOR}
        height={50}
        width={6}
        radius={2}
        margin={3}
      />
      <p className="mt-6 text-xl font-medium text-slate-600 animate-pulse">
        {LOADING_TEXT}
      </p>
    </div>
  );
};

export default LoadingSpinner;
