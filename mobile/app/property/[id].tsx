/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Property detail screen with edit capabilities and assessment management"
 * @dependencies ["expo-router", "react-redux", "@expo/vector-icons"]
 * @status stable
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Modal,
  Switch
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSelector, useDispatch } from 'react-redux'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import {
  selectProperties,
  selectAssessments,
  selectNetwork,
  selectLocation
} from '../../shared/store'
import {
  updateProperty,
  removeProperty
} from '../../shared/store/slices/propertiesSlice'
import {
  createAssessment
} from '../../shared/store/slices/assessmentsSlice'
import type { AppDispatch } from '../../shared/store'
import type { Property, DamageAssessment } from '../../shared/types'

interface EditModalProps {
  visible: boolean
  property: Property | null
  onSave: (updatedProperty: Property) => void
  onCancel: () => void
}

function EditModal({ visible, property, onSave, onCancel }: EditModalProps) {
  const [editedProperty, setEditedProperty] = useState<Property | null>(null)

  useEffect(() => {
    if (property) {
      setEditedProperty({ ...property })
    }
  }, [property])

  if (!editedProperty) return null

  const handleSave = () => {
    if (!editedProperty.name.trim()) {
      Alert.alert('Error', 'Property name is required')
      return
    }

    if (!editedProperty.street1.trim()) {
      Alert.alert('Error', 'Street address is required')
      return
    }

    onSave({
      ...editedProperty,
      updated_at: new Date().toISOString(),
      synced: false
    })
  }

  const propertyTypes: { value: Property['type']; label: string }[] = [
    { value: 'single_family', label: 'Single Family Home' },
    { value: 'condo', label: 'Condominium' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'mobile_home', label: 'Mobile Home' },
    { value: 'commercial', label: 'Commercial Property' }
  ]

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Property</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSaveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Property Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Property Name</Text>
            <TextInput
              style={styles.formInput}
              value={editedProperty.name}
              onChangeText={(text) => setEditedProperty({ ...editedProperty, name: text })}
              placeholder="Enter property name"
              placeholderTextColor="#6B7280"
            />
          </View>

          {/* Property Type */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Property Type</Text>
            <View style={styles.radioGroup}>
              {propertyTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.radioOption,
                    editedProperty.type === type.value && styles.radioOptionSelected
                  ]}
                  onPress={() => setEditedProperty({ ...editedProperty, type: type.value })}
                >
                  <MaterialCommunityIcons
                    name={editedProperty.type === type.value ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={editedProperty.type === type.value ? '#3B82F6' : '#6B7280'}
                  />
                  <Text style={[
                    styles.radioOptionText,
                    editedProperty.type === type.value && styles.radioOptionTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Street Address</Text>
            <TextInput
              style={styles.formInput}
              value={editedProperty.street1}
              onChangeText={(text) => setEditedProperty({ ...editedProperty, street1: text })}
              placeholder="Street address"
              placeholderTextColor="#6B7280"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Apt/Unit (Optional)</Text>
            <TextInput
              style={styles.formInput}
              value={editedProperty.street2 || ''}
              onChangeText={(text) => setEditedProperty({ ...editedProperty, street2: text })}
              placeholder="Apartment, unit, etc."
              placeholderTextColor="#6B7280"
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 2 }]}>
              <Text style={styles.formLabel}>City</Text>
              <TextInput
                style={styles.formInput}
                value={editedProperty.city}
                onChangeText={(text) => setEditedProperty({ ...editedProperty, city: text })}
                placeholder="City"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>State</Text>
              <TextInput
                style={styles.formInput}
                value={editedProperty.state}
                onChangeText={(text) => setEditedProperty({ ...editedProperty, state: text.toUpperCase() })}
                placeholder="FL"
                placeholderTextColor="#6B7280"
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>ZIP Code</Text>
              <TextInput
                style={styles.formInput}
                value={editedProperty.zip}
                onChangeText={(text) => setEditedProperty({ ...editedProperty, zip: text })}
                placeholder="33901"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={[styles.formGroup, { flex: 2 }]}>
              <Text style={styles.formLabel}>County</Text>
              <TextInput
                style={styles.formInput}
                value={editedProperty.county}
                onChangeText={(text) => setEditedProperty({ ...editedProperty, county: text })}
                placeholder="Lee"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          {/* GPS Coordinates */}
          {(editedProperty.latitude || editedProperty.longitude) && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>GPS Coordinates</Text>
              <View style={styles.coordinatesContainer}>
                <Text style={styles.coordinatesText}>
                  {editedProperty.latitude?.toFixed(6)}, {editedProperty.longitude?.toFixed(6)}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    // Update with current location if available
                    Alert.alert('Update Location', 'This would update with current GPS coordinates')
                  }}
                >
                  <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const properties = useSelector(selectProperties)
  const assessments = useSelector(selectAssessments)
  const network = useSelector(selectNetwork)
  const location = useSelector(selectLocation)

  const [showEditModal, setShowEditModal] = useState(false)

  const property = properties.items.find(p => p.id === id)
  const propertyAssessments = assessments.items.filter(a => a.property_id === id)

  useEffect(() => {
    if (!property) {
      Alert.alert(
        'Property Not Found',
        'The requested property could not be found.',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    }
  }, [property])

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="home-remove" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    )
  }

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleSaveEdit = (updatedProperty: Property) => {
    dispatch(updateProperty(updatedProperty))
    setShowEditModal(false)
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Property',
      `Are you sure you want to delete "${property.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(removeProperty(property.id))
            router.back()
          }
        }
      ]
    )
  }

  const handleStartAssessment = async () => {
    try {
      const assessment: Omit<DamageAssessment, 'id' | 'created_at' | 'updated_at' | 'synced'> = {
        property_id: property.id,
        assessor_id: 'current_user', // Would come from user state
        assessment_date: new Date().toISOString(),
        weather_conditions: 'Clear',
        overall_condition: 'good',
        estimated_total_damage: 0,
        priority_level: 'medium',
        notes: ''
      }

      const result = await dispatch(createAssessment(assessment)).unwrap()
      router.push(`/assessment/${result.id}`)
    } catch (error) {
      Alert.alert('Error', 'Failed to create assessment. Please try again.')
    }
  }

  const formatPropertyType = (type: Property['type']) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getPropertyTypeIcon = (type: Property['type']) => {
    switch (type) {
      case 'single_family': return 'home'
      case 'condo': return 'office-building'
      case 'townhouse': return 'home-group'
      case 'mobile_home': return 'caravan'
      case 'commercial': return 'store'
      default: return 'home'
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Property Header */}
        <View style={styles.propertyHeader}>
          <View style={styles.propertyIcon}>
            <MaterialCommunityIcons
              name={getPropertyTypeIcon(property.type)}
              size={32}
              color="#3B82F6"
            />
          </View>

          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName}>{property.name}</Text>
            <Text style={styles.propertyType}>{formatPropertyType(property.type)}</Text>

            <View style={styles.syncStatus}>
              <View style={[
                styles.syncIndicator,
                { backgroundColor: property.synced ? '#10B981' : '#F59E0B' }
              ]} />
              <Text style={styles.syncText}>
                {property.synced ? 'Synced' : 'Pending Sync'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <MaterialCommunityIcons name="pencil" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#9CA3AF" />
            <Text style={styles.sectionTitle}>Address</Text>
          </View>

          <Text style={styles.addressText}>
            {property.street1}
            {property.street2 && `, ${property.street2}`}
          </Text>
          <Text style={styles.addressText}>
            {property.city}, {property.state} {property.zip}
          </Text>
          <Text style={styles.addressText}>
            {property.county} County
          </Text>

          {property.latitude && property.longitude && (
            <View style={styles.coordinatesRow}>
              <Text style={styles.coordinatesLabel}>GPS:</Text>
              <Text style={styles.coordinatesValue}>
                {property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Assessments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clipboard-list" size={20} color="#9CA3AF" />
            <Text style={styles.sectionTitle}>Damage Assessments</Text>
            <Text style={styles.assessmentCount}>({propertyAssessments.length})</Text>
          </View>

          {propertyAssessments.length === 0 ? (
            <View style={styles.emptyAssessments}>
              <MaterialCommunityIcons name="clipboard-plus" size={48} color="#6B7280" />
              <Text style={styles.emptyAssessmentsText}>No assessments yet</Text>
              <Text style={styles.emptyAssessmentsSubtext}>
                Start your first damage assessment for this property
              </Text>
            </View>
          ) : (
            <View style={styles.assessmentsList}>
              {propertyAssessments.map((assessment) => (
                <TouchableOpacity
                  key={assessment.id}
                  style={styles.assessmentCard}
                  onPress={() => router.push(`/assessment/${assessment.id}`)}
                >
                  <View style={styles.assessmentHeader}>
                    <Text style={styles.assessmentDate}>
                      {new Date(assessment.assessment_date).toLocaleDateString()}
                    </Text>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(assessment.priority_level) }
                    ]}>
                      <Text style={styles.priorityText}>
                        {assessment.priority_level.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.assessmentCondition}>
                    Condition: {assessment.overall_condition.replace(/_/g, ' ')}
                  </Text>

                  {assessment.estimated_total_damage > 0 && (
                    <Text style={styles.assessmentDamage}>
                      Estimated Damage: ${assessment.estimated_total_damage.toLocaleString()}
                    </Text>
                  )}

                  <View style={styles.assessmentFooter}>
                    <Text style={styles.assessmentUpdated}>
                      Updated {new Date(assessment.updated_at).toLocaleDateString()}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.startAssessmentButton}
            onPress={handleStartAssessment}
          >
            <MaterialCommunityIcons name="clipboard-plus" size={20} color="white" />
            <Text style={styles.startAssessmentButtonText}>Start New Assessment</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#9CA3AF" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push(`/camera?return_screen=property&property_id=${property.id}`)}
            >
              <MaterialCommunityIcons name="camera" size={24} color="#3B82F6" />
              <Text style={styles.quickActionText}>Take Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => Alert.alert('Coming Soon', 'Voice notes will be available in the next update')}
            >
              <MaterialCommunityIcons name="microphone" size={24} color="#10B981" />
              <Text style={styles.quickActionText}>Voice Notes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => Alert.alert('Coming Soon', 'Reports will be available in the next update')}
            >
              <MaterialCommunityIcons name="file-document" size={24} color="#8B5CF6" />
              <Text style={styles.quickActionText}>Generate Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Property Metadata */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information" size={20} color="#9CA3AF" />
            <Text style={styles.sectionTitle}>Property Information</Text>
          </View>

          <View style={styles.metadataGrid}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Created</Text>
              <Text style={styles.metadataValue}>
                {new Date(property.created_at).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Last Updated</Text>
              <Text style={styles.metadataValue}>
                {new Date(property.updated_at).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Property ID</Text>
              <Text style={styles.metadataValue} numberOfLines={1}>
                {property.id}
              </Text>
            </View>

            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Sync Status</Text>
              <Text style={[
                styles.metadataValue,
                { color: property.synced ? '#10B981' : '#F59E0B' }
              ]}>
                {property.synced ? 'Synced' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <EditModal
        visible={showEditModal}
        property={property}
        onSave={handleSaveEdit}
        onCancel={() => setShowEditModal(false)}
      />
    </View>
  )
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return '#6B7280'
    case 'medium': return '#F59E0B'
    case 'high': return '#EF4444'
    case 'critical': return '#DC2626'
    default: return '#6B7280'
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    marginTop: 16,
  },
  propertyHeader: {
    backgroundColor: '#1F2937',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  propertyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  propertyType: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 8,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#1F2937',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  assessmentCount: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  addressText: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 4,
    lineHeight: 22,
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  coordinatesLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  coordinatesValue: {
    fontSize: 14,
    color: '#3B82F6',
    fontFamily: 'monospace',
  },
  emptyAssessments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyAssessmentsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyAssessmentsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  assessmentsList: {
    gap: 12,
  },
  assessmentCard: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assessmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  assessmentCondition: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  assessmentDamage: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    marginBottom: 8,
  },
  assessmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assessmentUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  startAssessmentButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  startAssessmentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metadataItem: {
    width: '48%',
  },
  metadataLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCancelButton: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  modalSaveButton: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  radioOptionSelected: {
    // Could add selected styles
  },
  radioOptionText: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  radioOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  coordinatesText: {
    color: '#D1D5DB',
    fontFamily: 'monospace',
  },
})
