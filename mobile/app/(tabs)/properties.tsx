/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Properties list screen with search, filters, and grid/list view toggles"
 * @dependencies ["expo-router", "react-redux", "@expo/vector-icons"]
 * @status stable
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  selectProperties,
  selectNetwork,
  selectSync,
  selectUser,
} from "../../shared/store";
import {
  setSearchQuery,
  setPropertyTypeFilter,
  setCountyFilter,
  setSortBy,
  clearFilters,
  addProperty,
} from "../../shared/store/slices/propertiesSlice";
import { performFullSync } from "../../shared/store/slices/syncSlice";
import type { AppDispatch } from "../../shared/store";
import type { Property } from "../../shared/types";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 2; // Two cards per row with margins

interface PropertyCardProps {
  property: Property;
  viewMode: "grid" | "list";
  onPress: () => void;
}

function PropertyCard({ property, viewMode, onPress }: PropertyCardProps) {
  const getPropertyTypeIcon = (type: Property["type"]) => {
    switch (type) {
      case "single_family":
        return "home";
      case "condo":
        return "office-building";
      case "townhouse":
        return "home-group";
      case "mobile_home":
        return "caravan";
      case "commercial":
        return "store";
      default:
        return "home";
    }
  };

  const formatPropertyType = (type: Property["type"]) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (viewMode === "grid") {
    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.syncIndicator,
            { backgroundColor: property.synced ? "#10B981" : "#F59E0B" },
          ]}
        />

        <View style={styles.cardHeader}>
          <View style={styles.propertyIcon}>
            <MaterialCommunityIcons
              name={getPropertyTypeIcon(property.type)}
              size={24}
              color="#3B82F6"
            />
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#9CA3AF"
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.propertyName} numberOfLines={2}>
            {property.name}
          </Text>
          <Text style={styles.propertyType}>
            {formatPropertyType(property.type)}
          </Text>
          <Text style={styles.propertyAddress} numberOfLines={2}>
            {property.street1}
            {property.street2 ? `, ${property.street2}` : ""}
          </Text>
          <Text style={styles.propertyCityState}>
            {property.city}, {property.state} {property.zip}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.lastUpdated}>
            {new Date(property.updated_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // List view
  return (
    <TouchableOpacity
      style={styles.listCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.listSyncIndicator,
          { backgroundColor: property.synced ? "#10B981" : "#F59E0B" },
        ]}
      />

      <View style={styles.listIcon}>
        <MaterialCommunityIcons
          name={getPropertyTypeIcon(property.type)}
          size={32}
          color="#3B82F6"
        />
      </View>

      <View style={styles.listContent}>
        <View style={styles.listHeader}>
          <Text style={styles.listPropertyName} numberOfLines={1}>
            {property.name}
          </Text>
          <Text style={styles.listPropertyType}>
            {formatPropertyType(property.type)}
          </Text>
        </View>

        <Text style={styles.listPropertyAddress} numberOfLines={1}>
          {property.street1}
          {property.street2 ? `, ${property.street2}` : ""}
        </Text>
        <Text style={styles.listCityState}>
          {property.city}, {property.state} {property.zip}
        </Text>

        <Text style={styles.listLastUpdated}>
          Updated: {new Date(property.updated_at).toLocaleDateString()}
        </Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function PropertiesScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const properties = useSelector(selectProperties);
  const network = useSelector(selectNetwork);
  const sync = useSelector(selectSync);
  const user = useSelector(selectUser);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredProperties = properties.items.filter((property) => {
    let matches = true;

    // Search query filter
    if (properties.filters.searchQuery) {
      const query = properties.filters.searchQuery.toLowerCase();
      matches =
        matches &&
        (property.name.toLowerCase().includes(query) ||
          property.street1.toLowerCase().includes(query) ||
          property.city.toLowerCase().includes(query) ||
          property.county.toLowerCase().includes(query));
    }

    // Property type filter
    if (properties.filters.propertyType) {
      matches = matches && property.type === properties.filters.propertyType;
    }

    // County filter
    if (properties.filters.county) {
      matches = matches && property.county === properties.filters.county;
    }

    return matches;
  });

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    const { sortBy, sortOrder } = properties.filters;
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "created_at":
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "updated_at":
        comparison =
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
    }

    return sortOrder === "desc" ? -comparison : comparison;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (network.isConnected) {
        await dispatch(performFullSync()).unwrap();
      }
    } catch (error) {
      Alert.alert(
        "Sync Failed",
        "Unable to sync properties. Please try again later.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handlePropertyPress = (property: Property) => {
    router.push(`/property/${property.id}`);
  };

  const handleAddProperty = () => {
    // Create a new property with demo data
    const newProperty: Property = {
      id: `property_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.current?.id || "demo_user",
      name: "New Property",
      type: "single_family",
      street1: "123 Main Street",
      street2: "",
      city: "Fort Myers",
      state: "FL",
      zip: "33901",
      county: "Lee",
      latitude: 26.1224,
      longitude: -81.7937,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false,
    };

    dispatch(addProperty(newProperty));
    router.push(`/property/${newProperty.id}`);
  };

  const uniqueCounties = [
    ...new Set(properties.items.map((p) => p.county)),
  ].sort();
  const propertyTypes: Property["type"][] = [
    "single_family",
    "condo",
    "townhouse",
    "mobile_home",
    "commercial",
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.screenTitle}>Properties</Text>
            <Text style={styles.screenSubtitle}>
              {sortedProperties.length} of {properties.items.length} properties
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              <MaterialCommunityIcons
                name={viewMode === "grid" ? "view-list" : "view-grid"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <MaterialCommunityIcons
                name="filter-variant"
                size={20}
                color={showFilters ? "#3B82F6" : "#9CA3AF"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddProperty}
            >
              <MaterialCommunityIcons name="plus" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            placeholderTextColor="#6B7280"
            value={properties.filters.searchQuery}
            onChangeText={(text) => dispatch(setSearchQuery(text))}
          />
          {properties.filters.searchQuery ? (
            <TouchableOpacity onPress={() => dispatch(setSearchQuery(""))}>
              <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !properties.filters.propertyType && styles.filterChipActive,
                ]}
                onPress={() => dispatch(setPropertyTypeFilter(null))}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    !properties.filters.propertyType &&
                      styles.filterChipTextActive,
                  ]}
                >
                  All Types
                </Text>
              </TouchableOpacity>

              {propertyTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    properties.filters.propertyType === type &&
                      styles.filterChipActive,
                  ]}
                  onPress={() => dispatch(setPropertyTypeFilter(type))}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      properties.filters.propertyType === type &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.countyFilters}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !properties.filters.county && styles.filterChipActive,
                ]}
                onPress={() => dispatch(setCountyFilter(null))}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    !properties.filters.county && styles.filterChipTextActive,
                  ]}
                >
                  All Counties
                </Text>
              </TouchableOpacity>

              {uniqueCounties.map((county) => (
                <TouchableOpacity
                  key={county}
                  style={[
                    styles.filterChip,
                    properties.filters.county === county &&
                      styles.filterChipActive,
                  ]}
                  onPress={() => dispatch(setCountyFilter(county))}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      properties.filters.county === county &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {county} County
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => dispatch(clearFilters())}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sync Status */}
      {!network.isConnected && (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons
            name="cloud-off-outline"
            size={16}
            color="#F59E0B"
          />
          <Text style={styles.offlineBannerText}>Working Offline</Text>
        </View>
      )}

      {/* Properties List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={
          viewMode === "grid" ? styles.gridContainer : styles.listContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            title="Pull to refresh"
            titleColor="#9CA3AF"
          />
        }
      >
        {sortedProperties.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="home-plus"
              size={64}
              color="#6B7280"
            />
            <Text style={styles.emptyStateTitle}>
              {properties.filters.searchQuery ||
              properties.filters.propertyType ||
              properties.filters.county
                ? "No Properties Found"
                : "No Properties Yet"}
            </Text>
            <Text style={styles.emptyStateDescription}>
              {properties.filters.searchQuery ||
              properties.filters.propertyType ||
              properties.filters.county
                ? "Try adjusting your search or filters"
                : "Add your first property to get started with damage assessments"}
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={handleAddProperty}
            >
              <MaterialCommunityIcons name="plus" size={20} color="white" />
              <Text style={styles.emptyStateButtonText}>Add Property</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sortedProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              viewMode={viewMode}
              onPress={() => handlePropertyPress(property)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    backgroundColor: "#1F2937",
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    padding: 0,
  },
  filtersContainer: {
    gap: 12,
  },
  filterChip: {
    backgroundColor: "#374151",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#4B5563",
  },
  filterChipActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterChipText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  countyFilters: {
    marginTop: 8,
  },
  clearFiltersButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  clearFiltersText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "500",
  },
  offlineBanner: {
    backgroundColor: "#F59E0B",
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  offlineBannerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 16,
  },
  listContainer: {
    padding: 20,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    overflow: "hidden",
    position: "relative",
  },
  syncIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 12,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  propertyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  propertyType: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
    marginBottom: 8,
  },
  propertyAddress: {
    fontSize: 14,
    color: "#D1D5DB",
    marginBottom: 4,
    lineHeight: 18,
  },
  propertyCityState: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#6B7280",
  },
  listCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  listSyncIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  listContent: {
    flex: 1,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  listPropertyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 8,
  },
  listPropertyType: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
  },
  listPropertyAddress: {
    fontSize: 14,
    color: "#D1D5DB",
    marginBottom: 2,
  },
  listCityState: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  listLastUpdated: {
    fontSize: 12,
    color: "#6B7280",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
