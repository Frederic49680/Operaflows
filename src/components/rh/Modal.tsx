"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden flex flex-col z-50 border border-gray-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec gradient */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  );
}

