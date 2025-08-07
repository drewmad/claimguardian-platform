/**
 * @fileMetadata
 * @owner @frontend-team
 * @purpose "Search and filter bar for insurance dashboard"
 * @dependencies ["react", "lucide-react"]
 * @status stable
 */
"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  X,
  Calendar,
  DollarSign,
  Shield,
  SortAsc,
  SortDesc,
  Building,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card-variants";
import { slideInRight, fadeInUp } from "@/lib/animations";

export interface FilterOptions {
  search: string;
  policyTypes: string[];
  carriers: string[];
  status: string[];
  sortBy: "premium" | "coverage" | "expiration" | "name";
  sortOrder: "asc" | "desc";
  dateRange: {
    start?: Date;
    end?: Date;
  };
}

interface SearchFilterBarProps {
  onFiltersChange: (filters: FilterOptions) => void;
  availableCarriers?: string[];
  availablePolicyTypes?: string[];
  className?: string;
}

export function SearchFilterBar({
  onFiltersChange,
  availableCarriers = [],
  availablePolicyTypes = [],
  className,
}: SearchFilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    policyTypes: [],
    carriers: [],
    status: [],
    sortBy: "name",
    sortOrder: "asc",
    dateRange: {},
  });

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleArrayFilter = (
    key: "policyTypes" | "carriers" | "status",
    value: string,
  ) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    handleFilterChange(key, updated);
  };

  const clearFilters = () => {
    const clearedFilters: FilterOptions = {
      search: "",
      policyTypes: [],
      carriers: [],
      status: [],
      sortBy: "name",
      sortOrder: "asc",
      dateRange: {},
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFilterCount =
    filters.policyTypes.length +
    filters.carriers.length +
    filters.status.length +
    (filters.dateRange.start ? 1 : 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search policies, properties, or carriers..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "gap-2 border-gray-700",
              isFilterOpen && "bg-gray-700",
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full"
                >
                  {activeFilterCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Sort Options */}
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split("-") as [
              FilterOptions["sortBy"],
              FilterOptions["sortOrder"],
            ];
            setFilters({ ...filters, sortBy, sortOrder });
            onFiltersChange({ ...filters, sortBy, sortOrder });
          }}
        >
          <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="premium-asc">Premium (Low to High)</SelectItem>
            <SelectItem value="premium-desc">Premium (High to Low)</SelectItem>
            <SelectItem value="coverage-asc">Coverage (Low to High)</SelectItem>
            <SelectItem value="coverage-desc">
              Coverage (High to Low)
            </SelectItem>
            <SelectItem value="expiration-asc">Expiration (Soonest)</SelectItem>
            <SelectItem value="expiration-desc">Expiration (Latest)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            variants={slideInRight}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card variant="insurance">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Policy Types */}
                  <div>
                    <Label className="text-white mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Policy Types
                    </Label>
                    <div className="space-y-2">
                      {[
                        "Homeowners",
                        "Flood",
                        "Wind",
                        "Auto",
                        "Umbrella",
                        "Other",
                      ].map((type) => (
                        <div key={type} className="flex items-center gap-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={filters.policyTypes.includes(type)}
                            onCheckedChange={() =>
                              toggleArrayFilter("policyTypes", type)
                            }
                          />
                          <Label
                            htmlFor={`type-${type}`}
                            className="text-sm text-gray-300 cursor-pointer"
                          >
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <Label className="text-white mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Status
                    </Label>
                    <div className="space-y-2">
                      {["Active", "Expiring Soon", "Expired", "Pending"].map(
                        (status) => (
                          <div key={status} className="flex items-center gap-2">
                            <Checkbox
                              id={`status-${status}`}
                              checked={filters.status.includes(status)}
                              onCheckedChange={() =>
                                toggleArrayFilter("status", status)
                              }
                            />
                            <Label
                              htmlFor={`status-${status}`}
                              className="text-sm text-gray-300 cursor-pointer"
                            >
                              {status}
                            </Label>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Carriers */}
                  <div>
                    <Label className="text-white mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Insurance Carriers
                    </Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableCarriers.length > 0 ? (
                        availableCarriers.map((carrier) => (
                          <div
                            key={carrier}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`carrier-${carrier}`}
                              checked={filters.carriers.includes(carrier)}
                              onCheckedChange={() =>
                                toggleArrayFilter("carriers", carrier)
                              }
                            />
                            <Label
                              htmlFor={`carrier-${carrier}`}
                              className="text-sm text-gray-300 cursor-pointer"
                            >
                              {carrier}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400">
                          No carriers available
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <Label className="text-white mb-3">Coverage Period</Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label
                        htmlFor="date-start"
                        className="text-sm text-gray-400"
                      >
                        From
                      </Label>
                      <Input
                        id="date-start"
                        type="date"
                        value={
                          filters.dateRange.start
                            ?.toISOString()
                            .split("T")[0] || ""
                        }
                        onChange={(e) =>
                          handleFilterChange("dateRange", {
                            ...filters.dateRange,
                            start: e.target.value
                              ? new Date(e.target.value)
                              : undefined,
                          })
                        }
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor="date-end"
                        className="text-sm text-gray-400"
                      >
                        To
                      </Label>
                      <Input
                        id="date-end"
                        type="date"
                        value={
                          filters.dateRange.end?.toISOString().split("T")[0] ||
                          ""
                        }
                        onChange={(e) =>
                          handleFilterChange("dateRange", {
                            ...filters.dateRange,
                            end: e.target.value
                              ? new Date(e.target.value)
                              : undefined,
                          })
                        }
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-between">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="text-gray-400 hover:text-white"
                    >
                      Clear All Filters
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => setIsFilterOpen(false)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Apply Filters
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export for type usage
export type { FilterOptions as InsuranceFilterOptions };
