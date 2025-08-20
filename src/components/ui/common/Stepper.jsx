import React, { Fragment } from "react";

const Stepper = ({ currentStep, steps }) => {
  if (!steps || steps.length === 0) {
    return null;
  }

  // --- Mobile Stepper Logic ---
  const progressPercentage =
    steps.length > 1
      ? ((currentStep - 1) / (steps.length - 1)) * 100
      : currentStep === 1
      ? 100
      : 0;

  return (
    <>
      <div className="my-8 flex items-center space-x-3 md:hidden">
        <div className="flex-1 rounded-full bg-gray-200 h-3">
          <div
            className="h-3 rounded-full bg-orange-600 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-800">
          {currentStep} / {steps.length}
        </span>
      </div>

      {/* --- DESKTOP STEPPER (Hidden on sm, visible on md and up) --- */}
      <div className="hidden md:flex items-center w-full my-8">
        <div className="flex items-center w-full mb-8 px-2 mt-6 ">
          {steps.map((step, index) => (
            <Fragment key={index}>
              <div className="flex flex-col items-center text-center w-32">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transition-all duration-300
                ${
                  index + 1 < currentStep
                    ? "bg-gradient-to-br from-green-500 to-emerald-600"
                    : ""
                }
                ${
                  index + 1 === currentStep
                    ? "bg-gradient-to-br from-orange-500 to-red-600 scale-110"
                    : ""
                }
                ${index + 1 > currentStep ? "bg-gray-300" : ""}
              `}
                >
                  {index + 1 < currentStep ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <p
                  className={`mt-2 text-sm font-semibold transition-all duration-300
                ${index + 1 <= currentStep ? "text-gray-800" : "text-gray-400"}
              `}
                >
                  {step}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-auto h-1 transition-colors duration-500
                ${
                  index + 1 < currentStep
                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                    : "bg-gray-200"
                }
              `}
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </>
  );
};

export default Stepper;
