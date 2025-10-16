"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

export const CONFIRMATION_TYPES = {
  DANGER: "danger",
  WARNING: "warning",
  INFO: "info",
  SUCCESS: "success",
};

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = CONFIRMATION_TYPES.INFO,
  isLoading = false,
}) {
  const [isLoadingState, setIsLoadingState] = useState(false);

  const handleConfirm = async () => {
    setIsLoadingState(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done by the parent component
    } finally {
      setIsLoadingState(false);
    }
  };

  const getIcon = () => {
    const iconClass = "h-6 w-6";

    switch (type) {
      case CONFIRMATION_TYPES.DANGER:
        return <XCircle className={`${iconClass} text-red-600`} />;
      case CONFIRMATION_TYPES.WARNING:
        return <AlertTriangle className={`${iconClass} text-orange-600`} />;
      case CONFIRMATION_TYPES.SUCCESS:
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case CONFIRMATION_TYPES.INFO:
      default:
        return <Info className={`${iconClass} text-blue-600`} />;
    }
  };

  const getConfirmButtonStyles = () => {
    switch (type) {
      case CONFIRMATION_TYPES.DANGER:
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case CONFIRMATION_TYPES.WARNING:
        return "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500";
      case CONFIRMATION_TYPES.SUCCESS:
        return "bg-green-600 hover:bg-green-700 focus:ring-green-500";
      case CONFIRMATION_TYPES.INFO:
      default:
        return "bg-primary-600 hover:bg-primary-700 focus:ring-primary-500";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            {getIcon()}
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 mt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isLoadingState}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || isLoadingState}
            className={`${getConfirmButtonStyles()} text-white`}
          >
            {isLoading || isLoadingState ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easy confirmation dialogs
export function useConfirmation() {
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: CONFIRMATION_TYPES.INFO,
    onConfirm: null,
    confirmText: "Confirm",
    cancelText: "Cancel",
  });

  const confirm = (options) => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title: options.title || "Confirm Action",
        message: options.message || "Are you sure you want to proceed?",
        type: options.type || CONFIRMATION_TYPES.INFO,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        onConfirm: () => {
          resolve(true);
          setDialog((prev) => ({ ...prev, isOpen: false }));
        },
      });
    });
  };

  const close = () => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    dialog,
    confirm,
    close,
  };
}
