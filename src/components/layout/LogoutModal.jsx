// src/components/layout/LogoutModal.jsx
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react"; // Import Fragment for Transition
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-md"
            aria-hidden="true"
          />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-2xl transition-all relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={20} />
              </button>

              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className="p-3 mb-4 bg-red-100 rounded-full">
                  <FaExclamationTriangle size={32} className="text-red-600" />
                </div>

                {/* Title */}
                <DialogTitle
                  as="h3"
                  className="text-xl font-bold text-gray-800"
                >
                  Confirm Logout
                </DialogTitle>

                {/* Message */}
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to sign out of your account?
                </p>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6 w-full">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="w-full px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
