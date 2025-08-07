/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
"use client";

import {
  ShieldCheck,
  Clock,
  AlertCircle,
  Calendar,
  FileText,
  Phone,
  Mail,
  ExternalLink,
  Package,
  Home,
  Car,
  Tv,
  Smartphone,
  ChevronRight,
  Plus,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function WarrantyWatchPage() {
  const [filter, setFilter] = useState("all");

  const warranties = [
    {
      id: 1,
      item: "Samsung Refrigerator",
      category: "Appliances",
      icon: Package,
      purchaseDate: "2023-03-15",
      warrantyEnd: "2025-03-15",
      status: "active",
      coverage: "Full Parts & Labor",
      monthsRemaining: 14,
      documents: ["receipt.pdf", "warranty.pdf"],
    },
    {
      id: 2,
      item: "HVAC System",
      category: "Home Systems",
      icon: Home,
      purchaseDate: "2021-06-20",
      warrantyEnd: "2024-06-20",
      status: "expiring",
      coverage: "Parts Only",
      monthsRemaining: 5,
      documents: ["installation.pdf", "warranty.pdf"],
    },
    {
      id: 3,
      item: "Tesla Model 3",
      category: "Vehicles",
      icon: Car,
      purchaseDate: "2022-11-10",
      warrantyEnd: "2026-11-10",
      status: "active",
      coverage: "Comprehensive",
      monthsRemaining: 46,
      documents: ["purchase.pdf", "warranty.pdf"],
    },
    {
      id: 4,
      item: "LG OLED TV",
      category: "Electronics",
      icon: Tv,
      purchaseDate: "2023-12-25",
      warrantyEnd: "2024-12-25",
      status: "active",
      coverage: "Limited",
      monthsRemaining: 11,
      documents: ["receipt.pdf"],
    },
    {
      id: 5,
      item: "iPhone 15 Pro",
      category: "Electronics",
      icon: Smartphone,
      purchaseDate: "2023-09-22",
      warrantyEnd: "2024-03-22",
      status: "expired",
      coverage: "AppleCare+",
      monthsRemaining: 0,
      documents: ["receipt.pdf", "applecare.pdf"],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-500/20";
      case "expiring":
        return "text-orange-400 bg-orange-500/20";
      case "expired":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const filteredWarranties =
    filter === "all"
      ? warranties
      : warranties.filter((w) => w.status === filter);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
                Warranty Watch
              </h1>
              <p className="text-gray-400">
                Track and manage all your warranties in one place
              </p>
            </div>
            <button className="mt-4 md:mt-0 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Warranty
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <ShieldCheck className="w-6 h-6 text-green-400" />
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <p className="text-sm text-gray-400">Active Warranties</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <AlertCircle className="w-6 h-6 text-orange-400" />
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <p className="text-sm text-gray-400">Expiring Soon</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-6 h-6 text-red-400" />
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <p className="text-sm text-gray-400">Expired</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-6 h-6 text-blue-400" />
                <span className="text-2xl font-bold text-white">12</span>
              </div>
              <p className="text-sm text-gray-400">Documents Stored</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "all"
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              All Warranties
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "active"
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("expiring")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "expiring"
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              Expiring Soon
            </button>
            <button
              onClick={() => setFilter("expired")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "expired"
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              Expired
            </button>
          </div>

          {/* Warranties List */}
          <div className="space-y-4">
            {filteredWarranties.map((warranty) => {
              const Icon = warranty.icon;
              return (
                <div
                  key={warranty.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {warranty.item}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">
                          {warranty.category}
                        </p>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-400">
                            Purchased:{" "}
                            {new Date(
                              warranty.purchaseDate,
                            ).toLocaleDateString()}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-400">
                            Expires:{" "}
                            {new Date(
                              warranty.warrantyEnd,
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(warranty.status)}`}
                          >
                            {warranty.status.charAt(0).toUpperCase() +
                              warranty.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-400">
                            {warranty.coverage}
                          </span>
                          {warranty.monthsRemaining > 0 && (
                            <span className="text-sm text-gray-400">
                              {warranty.monthsRemaining} months remaining
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 mt-4">
                          <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            View Documents
                          </button>
                          <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            Contact Support
                          </button>
                          {warranty.status === "expiring" && (
                            <button className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Set Reminder
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-cyan-400" />
                    <span className="text-white">Upload Warranty Document</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-white">Set Renewal Reminders</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-green-400" />
                    <span className="text-white">Export Warranty Report</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Extended Coverage
              </h3>
              <p className="text-gray-400 mb-4">
                Protect your investments with extended warranty options
              </p>
              <div className="space-y-3">
                <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                  <p className="text-cyan-300 font-medium">
                    Home Systems Protection
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Cover all major home systems
                  </p>
                  <button className="mt-3 text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    Learn More <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 font-medium">
                    Electronics Care Plan
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Comprehensive electronics coverage
                  </p>
                  <button className="mt-3 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    Learn More <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
