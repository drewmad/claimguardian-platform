"use client";

import { useState } from "react";
import { CheckCircle, MapPin, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddressVerificationModalProps {
  isOpen: boolean;
  address: string;
  parsedAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
}

export function AddressVerificationModal({
  isOpen,
  address,
  parsedAddress,
  onConfirm,
  onEdit,
  onClose,
}: AddressVerificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Verify Property Address
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">
              Is this your correct address?
            </p>
            <p className="text-lg font-semibold text-white">{address}</p>
          </div>

          {parsedAddress && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Address Components:</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900/30 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Street</p>
                  <p className="text-sm text-white font-medium">
                    {parsedAddress.street}
                  </p>
                </div>
                <div className="bg-gray-900/30 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-sm text-white font-medium">
                    {parsedAddress.city}
                  </p>
                </div>
                <div className="bg-gray-900/30 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">State</p>
                  <p className="text-sm text-white font-medium">
                    {parsedAddress.state}
                  </p>
                </div>
                <div className="bg-gray-900/30 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">ZIP Code</p>
                  <p className="text-sm text-white font-medium">
                    {parsedAddress.zipCode}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-300">
              Please verify this address is correct. This will be used for all
              property-related services and claims.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex gap-3">
          <Button
            onClick={onEdit}
            variant="outline"
            className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-700"
          >
            Edit Address
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Address
          </Button>
        </div>
      </div>
    </div>
  );
}
