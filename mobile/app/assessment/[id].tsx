/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Assessment Detail Screen with damage item management and photo capture"
 * @dependencies ["expo-router", "react-redux", "@expo/vector-icons"]
 * @status stable
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  selectAssessments,
  selectDamageItems,
  selectProperties,
  selectPhotos,
  selectUser,
} from "../../shared/store";
import {
  updateAssessment,
  removeAssessment,
} from "../../shared/store/slices/assessmentsSlice";
import {
  addDamageItem,
  removeDamageItem,
} from "../../shared/store/slices/damageItemsSlice";
import type { AppDispatch } from "../../shared/store";
import type {
  DamageAssessment,
  DamageItem,
  Property,
} from "../../shared/types";

const { width } = Dimensions.get("window");

interface QuickActionProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

function QuickAction({
  icon,
  label,
  onPress,
  color = "#3B82F6",
  disabled = false,
}: QuickActionProps) {
  return (
    <TouchableOpacity
      style={[styles.quickActionButton, disabled && styles.quickActionDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={disabled ? "#6B7280" : color}
      />
      <Text
        style={[
          styles.quickActionText,
          { color: disabled ? "#6B7280" : "#D1D5DB" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface DamageItemCardProps {
  item: DamageItem;
  onPress: () => void;
  onDelete: () => void;
}

function DamageItemCard({ item, onPress, onDelete }: DamageItemCardProps) {
  const getDamageTypeIcon = (damageType: string) => {
    switch (damageType) {
      case "water":
        return "water";
      case "fire":
        return "fire";
      case "wind":
        return "weather-windy";
      case "hail":
        return "weather-hail";
      case "flood":
        return "waves";
      case "impact":
        return "car-crash";
      case "wear":
        return "clock-outline";
      default:
        return "alert-circle";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "structural":
        return "home-outline";
      case "exterior":
        return "home-variant-outline";
      case "interior":
        return "sofa";
      case "electrical":
        return "flash";
      case "plumbing":
        return "pipe-wrench";
      case "hvac":
        return "air-conditioner";
      default:
        return "wrench";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor":
        return "#10B981";
      case "moderate":
        return "#F59E0B";
      case "major":
        return "#EF4444";
      case "total_loss":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "#6B7280";
      case "medium":
        return "#F59E0B";
      case "high":
        return "#EF4444";
      case "emergency":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  return (
    <TouchableOpacity
      style={styles.damageItemCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.damageItemHeader}>
        <View style={styles.damageItemIcons}>
          <MaterialCommunityIcons
            name={getCategoryIcon(item.category)}
            size={20}
            color="#3B82F6"
          />
          <MaterialCommunityIcons
            name={getDamageTypeIcon(item.damage_type)}
            size={20}
            color="#EF4444"
          />
        </View>

        <TouchableOpacity
          style={styles.damageItemDeleteButton}
          onPress={onDelete}
        >
          <MaterialCommunityIcons name="delete" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.damageItemLocation}>{item.location}</Text>
      <Text style={styles.damageItemDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.damageItemDetails}>
        <View style={styles.damageItemBadges}>
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(item.severity) },
            ]}
          >
            <Text style={styles.badgeText}>
              {item.severity.replace("_", " ").toUpperCase()}
            </Text>
          </View>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.repair_priority) },
            ]}
          >
            <Text style={styles.badgeText}>
              {item.repair_priority.toUpperCase()}
            </Text>
          </View>
        </View>

        {item.estimated_cost > 0 && (
          <Text style={styles.damageItemCost}>
            ${item.estimated_cost.toLocaleString()}
          </Text>
        )}
      </View>

      <View style={styles.damageItemFooter}>
        <Text style={styles.damageItemUpdated}>
          {new Date(item.updated_at).toLocaleDateString()}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#9CA3AF"
        />
      </View>
    </TouchableOpacity>
  );
}

export default function AssessmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const assessments = useSelector(selectAssessments);
  const damageItems = useSelector(selectDamageItems);
  const properties = useSelector(selectProperties);
  const photos = useSelector(selectPhotos);
  const user = useSelector(selectUser);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const assessment = assessments.items.find((a) => a.id === id);
  const property = assessment
    ? properties.items.find((p) => p.id === assessment.property_id)
    : null;
  const assessmentDamageItems = damageItems.items.filter(
    (item) => item.assessment_id === id,
  );
  const assessmentPhotos = photos.items.filter(
    (photo) => photo.assessment_id === id,
  );

  useEffect(() => {
    if (!assessment) {
      Alert.alert(
        "Assessment Not Found",
        "The requested assessment could not be found.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    }
  }, [assessment]);

  if (!assessment || !property) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="clipboard-remove"
          size={64}
          color="#EF4444"
        />
        <Text style={styles.errorText}>Assessment not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    dispatch(removeAssessment(assessment.id));
    setShowDeleteModal(false);
    router.back();
  };

  const handleAddDamageItem = () => {
    const newDamageItem: Omit<
      DamageItem,
      "id" | "created_at" | "updated_at" | "synced"
    > = {
      assessment_id: assessment.id,
      category: "structural",
      location: "New Location",
      damage_type: "other",
      severity: "minor",
      description: "Describe the damage...",
      estimated_cost: 0,
      repair_priority: "medium",
      measurements: null,
    };

    const itemId = `damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    dispatch(
      addDamageItem({
        ...newDamageItem,
        id: itemId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false,
      }),
    );

    // Navigate to damage item edit
    router.push(`/damage-item/${itemId}`);
  };

  const handleDeleteDamageItem = (itemId: string) => {
    Alert.alert(
      "Delete Damage Item",
      "Are you sure you want to delete this damage item? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => dispatch(removeDamageItem(itemId)),
        },
      ],
    );
  };

  const handleTakePhotos = () => {
    router.push(
      `/camera?return_screen=assessment&assessment_id=${assessment.id}`,
    );
  };

  const handleRecordVoice = () => {
    Alert.alert(
      "Coming Soon",
      "Voice recording will be available in the next update",
    );
  };

  const handleGenerateReport = () => {
    Alert.alert(
      "Coming Soon",
      "Report generation will be available in the next update",
    );
  };

  const handleShare = () => {
    Alert.alert("Coming Soon", "Sharing will be available in the next update");
  };

  const formatPropertyType = (type: Property["type"]) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "#6B7280";
      case "medium":
        return "#F59E0B";
      case "high":
        return "#EF4444";
      case "critical":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent":
        return "#10B981";
      case "good":
        return "#3B82F6";
      case "fair":
        return "#F59E0B";
      case "poor":
        return "#EF4444";
      case "severe":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const totalEstimatedDamage = assessmentDamageItems.reduce(
    (total, item) => total + item.estimated_cost,
    0,
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Assessment Details</Text>
          <Text style={styles.headerSubtitle}>{property.name}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete}>
          <MaterialCommunityIcons name="delete" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Assessment Overview */}
        <View style={styles.section}>
          <View style={styles.assessmentHeader}>
            <View style={styles.assessmentIcon}>
              <MaterialCommunityIcons
                name="clipboard-check"
                size={32}
                color="#3B82F6"
              />
            </View>

            <View style={styles.assessmentInfo}>
              <Text style={styles.assessmentDate}>
                {new Date(assessment.assessment_date).toLocaleDateString()}
              </Text>
              <Text style={styles.assessmentTime}>
                {new Date(assessment.assessment_date).toLocaleTimeString()}
              </Text>

              <View style={styles.syncStatus}>
                <View
                  style={[
                    styles.syncIndicator,
                    {
                      backgroundColor: assessment.synced
                        ? "#10B981"
                        : "#F59E0B",
                    },
                  ]}
                />
                <Text style={styles.syncText}>
                  {assessment.synced ? "Synced" : "Pending Sync"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => setShowDetailsModal(true)}
            >
              <MaterialCommunityIcons
                name="information"
                size={20}
                color="#3B82F6"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Assessment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment Summary</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Overall Condition</Text>
              <View style={styles.conditionRow}>
                <View
                  style={[
                    styles.conditionDot,
                    {
                      backgroundColor: getConditionColor(
                        assessment.overall_condition,
                      ),
                    },
                  ]}
                />
                <Text style={styles.summaryValue}>
                  {assessment.overall_condition
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Priority Level</Text>
              <View style={styles.conditionRow}>
                <View
                  style={[
                    styles.conditionDot,
                    {
                      backgroundColor: getPriorityColor(
                        assessment.priority_level,
                      ),
                    },
                  ]}
                />
                <Text style={styles.summaryValue}>
                  {assessment.priority_level
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Damage Items</Text>
              <Text style={styles.summaryValue}>
                {assessmentDamageItems.length}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Photos Captured</Text>
              <Text style={styles.summaryValue}>{assessmentPhotos.length}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Estimated Cost</Text>
              <Text style={[styles.summaryValue, styles.costValue]}>
                $
                {Math.max(
                  totalEstimatedDamage,
                  assessment.estimated_total_damage,
                ).toLocaleString()}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Weather Conditions</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>
                {assessment.weather_conditions}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickAction
              icon="camera"
              label="Take Photos"
              onPress={handleTakePhotos}
              color="#10B981"
            />
            <QuickAction
              icon="microphone"
              label="Voice Notes"
              onPress={handleRecordVoice}
              color="#8B5CF6"
            />
            <QuickAction
              icon="file-document"
              label="Generate Report"
              onPress={handleGenerateReport}
              color="#F59E0B"
            />
            <QuickAction
              icon="share-variant"
              label="Share"
              onPress={handleShare}
              color="#3B82F6"
            />
          </View>
        </View>

        {/* Damage Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Damage Items ({assessmentDamageItems.length})
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddDamageItem}
            >
              <MaterialCommunityIcons name="plus" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {assessmentDamageItems.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="clipboard-plus"
                size={48}
                color="#6B7280"
              />
              <Text style={styles.emptyStateText}>No Damage Items</Text>
              <Text style={styles.emptyStateSubtext}>
                Start documenting damage by adding your first item
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleAddDamageItem}
              >
                <MaterialCommunityIcons name="plus" size={16} color="white" />
                <Text style={styles.emptyStateButtonText}>Add Damage Item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.damageItemsList}>
              {assessmentDamageItems.map((item) => (
                <DamageItemCard
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/damage-item/${item.id}`)}
                  onDelete={() => handleDeleteDamageItem(item.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Assessment Notes */}
        {assessment.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{assessment.notes}</Text>
            </View>
          </View>
        )}

        {/* Property Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Information</Text>
          <View style={styles.propertyInfo}>
            <View style={styles.propertyRow}>
              <MaterialCommunityIcons name="home" size={20} color="#3B82F6" />
              <View style={styles.propertyDetail}>
                <Text style={styles.propertyLabel}>Property Name</Text>
                <Text style={styles.propertyValue}>{property.name}</Text>
              </View>
            </View>

            <View style={styles.propertyRow}>
              <MaterialCommunityIcons
                name="home-variant"
                size={20}
                color="#3B82F6"
              />
              <View style={styles.propertyDetail}>
                <Text style={styles.propertyLabel}>Property Type</Text>
                <Text style={styles.propertyValue}>
                  {formatPropertyType(property.type)}
                </Text>
              </View>
            </View>

            <View style={styles.propertyRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color="#3B82F6"
              />
              <View style={styles.propertyDetail}>
                <Text style={styles.propertyLabel}>Address</Text>
                <Text style={styles.propertyValue}>
                  {property.street1}, {property.city}, {property.state}{" "}
                  {property.zip}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={48}
                color="#EF4444"
              />
            </View>
            <Text style={styles.modalTitle}>Delete Assessment</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this assessment? This action
              cannot be undone and will also delete all associated damage items
              and photos.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal visible={showDetailsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.detailsModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assessment Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  General Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Assessment ID</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {assessment.id}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Assessor</Text>
                  <Text style={styles.detailValue}>
                    {user.current?.email || "Current User"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>
                    {new Date(assessment.assessment_date).toLocaleDateString()}{" "}
                    at{" "}
                    {new Date(assessment.assessment_date).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Updated</Text>
                  <Text style={styles.detailValue}>
                    {new Date(assessment.updated_at).toLocaleDateString()} at{" "}
                    {new Date(assessment.updated_at).toLocaleTimeString()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Assessment Data</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Overall Condition</Text>
                  <Text style={styles.detailValue}>
                    {assessment.overall_condition
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Priority Level</Text>
                  <Text style={styles.detailValue}>
                    {assessment.priority_level
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Weather Conditions</Text>
                  <Text style={styles.detailValue}>
                    {assessment.weather_conditions}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Estimated Total Damage</Text>
                  <Text style={styles.detailValue}>
                    ${assessment.estimated_total_damage.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    Calculated Total Damage
                  </Text>
                  <Text style={styles.detailValue}>
                    ${totalEstimatedDamage.toLocaleString()}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 18,
    marginTop: 16,
  },
  header: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#1F2937",
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  assessmentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  assessmentIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  assessmentInfo: {
    flex: 1,
  },
  assessmentDate: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  assessmentTime: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  syncIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  detailsButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  summaryItem: {
    width: "48%",
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 8,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  costValue: {
    color: "#EF4444",
  },
  conditionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: "#374151",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    gap: 8,
  },
  quickActionDisabled: {
    backgroundColor: "#1F2937",
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  damageItemsList: {
    gap: 12,
  },
  damageItemCard: {
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 16,
  },
  damageItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  damageItemIcons: {
    flexDirection: "row",
    gap: 12,
  },
  damageItemDeleteButton: {
    padding: 4,
  },
  damageItemLocation: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  damageItemDescription: {
    fontSize: 14,
    color: "#D1D5DB",
    lineHeight: 20,
    marginBottom: 12,
  },
  damageItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  damageItemBadges: {
    flexDirection: "row",
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  damageItemCost: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  damageItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  damageItemUpdated: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  notesContainer: {
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: "#D1D5DB",
    lineHeight: 20,
  },
  propertyInfo: {
    gap: 16,
  },
  propertyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  propertyDetail: {
    flex: 1,
  },
  propertyLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  propertyValue: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#D1D5DB",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#374151",
  },
  cancelButtonText: {
    color: "#D1D5DB",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  detailsModal: {
    maxHeight: "80%",
    alignItems: "stretch",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  detailsContent: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  detailLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#FFFFFF",
    flex: 1,
    textAlign: "right",
  },
});
