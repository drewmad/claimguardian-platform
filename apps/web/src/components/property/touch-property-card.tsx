/**
 * @fileMetadata
 * @purpose "Touch-optimized property card with gesture support and mobile interactions"
 * @owner frontend-team
 * @dependencies ["react", "framer-motion", "next/navigation", "lucide-react"]
 * @exports ["TouchPropertyCard"]
 * @complexity high
 * @tags ["property", "card", "touch", "mobile", "gestures"]
 * @status stable
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MapPin,
  DollarSign,
  Calendar,
  Shield,
  AlertTriangle,
  Star,
  Share,
  Edit,
  Eye,
  MoreVertical,
  Camera,
  FileText,
  TrendingUp,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";

import {
  TouchCard,
  TouchCardHeader,
  TouchCardContent,
  TouchCardFooter,
} from "@/components/ui/touch-card";
import { TouchButton } from "@/components/ui/touch-button";
import { SwipeAction, SwipeActionPresets } from "@/components/ui/swipe-action";
import { Badge } from "@/components/ui/badge";
import { PropertyImage } from "@/components/ui/property-image";
import { cn } from "@/lib/utils";

interface Property {
  id: string;
  name: string;
  address: {
    street1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  type: "single-family" | "condo" | "townhouse" | "multi-family" | "commercial";
  yearBuilt: number;
  squareFootage: number;
  bedrooms?: number;
  bathrooms?: number;
  estimatedValue: number;
  insuranceValue?: number;
  lastInspection?: string;
  riskScore?: number;
  imageUrl?: string;
  isFavorite?: boolean;
  isBookmarked?: boolean;
  tags?: string[];
  status: "active" | "pending" | "needs_attention" | "archived";
}

interface TouchPropertyCardProps {
  property: Property;
  onSelect?: (property: Property) => void;
  onFavorite?: (property: Property, favorited: boolean) => void;
  onBookmark?: (property: Property, bookmarked: boolean) => void;
  onEdit?: (property: Property) => void;
  onShare?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  onViewDetails?: (property: Property) => void;
  selected?: boolean;
  variant?: "default" | "compact" | "detailed";
  enableSwipeActions?: boolean;
  className?: string;
}

const statusColors = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  needs_attention:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const riskColors = {
  low: "text-green-600 dark:text-green-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  high: "text-red-600 dark:text-red-400",
};

export function TouchPropertyCard({
  property,
  onSelect,
  onFavorite,
  onBookmark,
  onEdit,
  onShare,
  onDelete,
  onViewDetails,
  selected = false,
  variant = "default",
  enableSwipeActions = true,
  className,
}: TouchPropertyCardProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [isFavorited, setIsFavorited] = useState(property.isFavorite || false);
  const [isBookmarked, setIsBookmarked] = useState(
    property.isBookmarked || false,
  );

  const getRiskLevel = (score?: number): "low" | "medium" | "high" => {
    if (!score) return "low";
    if (score < 30) return "low";
    if (score < 70) return "medium";
    return "high";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCardTap = () => {
    onSelect?.(property);
    if (!selected) {
      toast.success(`Selected ${property.name}`);
    }
  };

  const handleCardDoubleTap = () => {
    const newFavorited = !isFavorited;
    setIsFavorited(newFavorited);
    onFavorite?.(property, newFavorited);
    toast.success(
      newFavorited ? "Added to favorites" : "Removed from favorites",
    );
  };

  const handleCardLongPress = () => {
    setShowDetails(true);
    toast.info("Property details expanded");
  };

  const handleFavoriteAction = (favorited: boolean) => {
    setIsFavorited(favorited);
    onFavorite?.(property, favorited);
  };

  const handleBookmarkAction = (bookmarked: boolean) => {
    setIsBookmarked(bookmarked);
    onBookmark?.(property, bookmarked);
  };

  const handleEditAction = () => {
    onEdit?.(property);
    toast.info(`Editing ${property.name}`);
  };

  const handleShareAction = () => {
    onShare?.(property);
    toast.success(`Sharing ${property.name}`);
  };

  const handleDeleteAction = () => {
    onDelete?.(property);
    toast.error(`${property.name} deleted`);
  };

  const handleViewDetails = () => {
    onViewDetails?.(property);
    router.push(`/dashboard/properties/${property.id}`);
  };

  const renderPropertyIcon = () => {
    switch (property.type) {
      case "single-family":
        return <Home className="w-4 h-4" />;
      case "condo":
        return <Home className="w-4 h-4" />;
      case "townhouse":
        return <Home className="w-4 h-4" />;
      case "multi-family":
        return <Home className="w-4 h-4" />;
      case "commercial":
        return <Home className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  const renderCompactView = () => (
    <TouchCard
      variant="elevated"
      interactive="both"
      onTap={handleCardTap}
      onDoubleTap={handleCardDoubleTap}
      onLongPress={handleCardLongPress}
      selected={selected}
      favoritable
      onFavorite={handleFavoriteAction}
      shareable
      onShare={handleShareAction}
      showMenu
      onMenuClick={() => setShowDetails(!showDetails)}
      className={cn("h-32", className)}
    >
      <TouchCardContent className="flex items-center gap-4 h-full">
        <div className="flex-shrink-0">
          <PropertyImage
            src={property.imageUrl}
            alt={property.name}
            propertyType={property.type}
            className="w-16 h-16 rounded-lg"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {property.name}
            </h3>
            <Badge className={cn("text-xs", statusColors[property.status])}>
              {property.status.replace("_", " ")}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
            {property.address.street1}, {property.address.city}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              {renderPropertyIcon()}
              {property.type.replace("-", " ")}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {formatCurrency(property.estimatedValue)}
            </span>
          </div>
        </div>
      </TouchCardContent>
    </TouchCard>
  );

  const renderDetailedView = () => (
    <TouchCard
      variant="elevated"
      interactive="both"
      onTap={handleCardTap}
      onDoubleTap={handleCardDoubleTap}
      onLongPress={handleCardLongPress}
      selected={selected}
      favoritable
      onFavorite={handleFavoriteAction}
      bookmarkable
      onBookmark={handleBookmarkAction}
      shareable
      onShare={handleShareAction}
      showMenu
      onMenuClick={() => setShowDetails(!showDetails)}
      className={className}
    >
      <TouchCardHeader>
        <div className="flex items-start gap-4">
          <PropertyImage
            src={property.imageUrl}
            alt={property.name}
            propertyType={property.type}
            className="w-20 h-20 rounded-lg flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {property.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  {property.address.street1}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                  {property.address.city}, {property.address.state}{" "}
                  {property.address.zipCode}
                </div>
              </div>

              <Badge className={cn("text-xs", statusColors[property.status])}>
                {property.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>
      </TouchCardHeader>

      <TouchCardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(property.estimatedValue)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Estimated Value
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {property.squareFootage?.toLocaleString() || "N/A"}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Square Feet
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {property.bedrooms || "N/A"}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Bedrooms</div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {property.bathrooms || "N/A"}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Bathrooms</div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {property.yearBuilt}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Year Built</div>
          </div>
        </div>

        {property.riskScore && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Risk Score
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  riskColors[getRiskLevel(property.riskScore)],
                )}
              >
                {property.riskScore}/100 ({getRiskLevel(property.riskScore)})
              </span>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="space-y-2">
                {property.lastInspection && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Last Inspection
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {property.lastInspection}
                    </span>
                  </div>
                )}
                {property.insuranceValue && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Insurance Value
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatCurrency(property.insuranceValue)}
                    </span>
                  </div>
                )}
                {property.tags && property.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {property.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </TouchCardContent>

      <TouchCardFooter className="flex gap-2">
        <TouchButton
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails();
          }}
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </TouchButton>

        <TouchButton
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            toast.info("Taking photo...");
          }}
        >
          <Camera className="w-4 h-4" />
        </TouchButton>

        <TouchButton
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            toast.info("Generating report...");
          }}
        >
          <FileText className="w-4 h-4" />
        </TouchButton>
      </TouchCardFooter>
    </TouchCard>
  );

  const cardContent =
    variant === "compact" ? renderCompactView() : renderDetailedView();

  if (enableSwipeActions) {
    return (
      <SwipeAction
        leftActions={[
          SwipeActionPresets.edit(handleEditAction),
          SwipeActionPresets.share(handleShareAction),
        ]}
        rightActions={[SwipeActionPresets.delete(handleDeleteAction)]}
        className="rounded-lg overflow-hidden"
      >
        {cardContent}
      </SwipeAction>
    );
  }

  return cardContent;
}
