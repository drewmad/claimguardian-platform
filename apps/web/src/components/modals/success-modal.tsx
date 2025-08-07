/**
 * @fileMetadata
 * @purpose "Reusable success and confirmation modals for various actions"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/stores/modal-store"]
 * @exports ["SuccessModal", "ConfirmationModal"]
 * @complexity low
 * @tags ["modal", "success", "confirmation", "feedback"]
 * @status stable
 */
"use client";

import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useModalStore } from "@/stores/modal-store";

type ModalVariant = "success" | "warning" | "error" | "info";

interface ModalConfig {
  variant: ModalVariant;
  title: string;
  message: string;
  actions?: {
    primary?: {
      label: string;
      onClick: () => void;
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  autoClose?: number; // Auto close after X milliseconds
}

const variantStyles = {
  success: {
    icon: CheckCircle,
    iconBg: "from-green-500 to-emerald-500",
    iconColor: "text-white",
    borderColor: "border-green-500/20",
    bgColor: "bg-green-500/10",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "from-yellow-500 to-orange-500",
    iconColor: "text-white",
    borderColor: "border-yellow-500/20",
    bgColor: "bg-yellow-500/10",
  },
  error: {
    icon: XCircle,
    iconBg: "from-red-500 to-rose-500",
    iconColor: "text-white",
    borderColor: "border-red-500/20",
    bgColor: "bg-red-500/10",
  },
  info: {
    icon: Info,
    iconBg: "from-blue-500 to-cyan-500",
    iconColor: "text-white",
    borderColor: "border-blue-500/20",
    bgColor: "bg-blue-500/10",
  },
};

export function SuccessModal() {
  const { activeModal, modalData, closeModal } = useModalStore();
  const [isClosing, setIsClosing] = useState(false);

  const config = modalData as unknown as ModalConfig | null;

  useEffect(() => {
    if (activeModal === "success" && config?.autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, config.autoClose);
      return () => clearTimeout(timer);
    }
  }, [activeModal, config?.autoClose]);

  if (activeModal !== "success" || !config) return null;

  const styles = variantStyles[config.variant || "success"];
  const Icon = styles.icon;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      closeModal();
      setIsClosing(false);
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? "animate-fadeOut" : "animate-fadeIn"}`}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        className={`relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all duration-200 ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 pointer-events-none" />

        <div className="relative p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div
              className={`w-16 h-16 bg-gradient-to-br ${styles.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-scaleIn`}
            >
              <Icon className={`w-8 h-8 ${styles.iconColor}`} />
            </div>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              {config.title}
            </h2>

            <p className="text-gray-300 mb-6">{config.message}</p>

            {config.actions && (
              <div className="space-y-3">
                {config.actions.primary && (
                  <button
                    onClick={() => {
                      config.actions!.primary!.onClick();
                      handleClose();
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl"
                  >
                    {config.actions.primary.label}
                  </button>
                )}

                {config.actions.secondary && (
                  <button
                    onClick={() => {
                      config.actions!.secondary!.onClick();
                      handleClose();
                    }}
                    className="w-full py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
                  >
                    {config.actions.secondary.label}
                  </button>
                )}
              </div>
            )}

            {!config.actions && (
              <button
                onClick={handleClose}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl"
              >
                Got it!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmationModal() {
  const { activeModal, modalData, closeModal } = useModalStore();
  const [isClosing, setIsClosing] = useState(false);

  const config = modalData as {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    variant?: "danger" | "warning" | "normal";
  } | null;

  if (activeModal !== "confirmation" || !config) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      closeModal();
      setIsClosing(false);
    }, 200);
  };

  const handleConfirm = async () => {
    await config.onConfirm();
    handleClose();
  };

  const handleCancel = () => {
    if (config.onCancel) {
      config.onCancel();
    }
    handleClose();
  };

  const getConfirmButtonStyles = () => {
    switch (config.variant) {
      case "danger":
        return "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700";
      case "warning":
        return "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700";
      default:
        return "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700";
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? "animate-fadeOut" : "animate-fadeIn"}`}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      <div
        className={`relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all duration-200 ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 pointer-events-none" />

        <div className="relative p-6">
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              {config.title}
            </h2>

            <p className="text-gray-300 mb-6">{config.message}</p>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-gray-300 hover:text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                {config.cancelLabel || "Cancel"}
              </button>

              <button
                onClick={handleConfirm}
                className={`flex-1 py-3 px-4 ${getConfirmButtonStyles()} text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl`}
              >
                {config.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
