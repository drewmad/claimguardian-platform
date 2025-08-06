/**
 * @fileMetadata
 * @owner mobile-team
 * @purpose "Assessment Creation Wizard - multi-step wizard for creating damage assessments"
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
  Switch,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSelector, useDispatch } from 'react-redux'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import {
  selectProperties,
  selectUser,
  selectLocation
} from '../../../shared/store'
import {
  createAssessment
} from '../../../shared/store/slices/assessmentsSlice'
import type { AppDispatch } from '../../../shared/store'
import type { Property, DamageAssessment } from '../../../shared/types'

interface WizardStep {
  id: number
  title: string
  description: string
  completed: boolean
}

interface AssessmentFormData {
  weather_conditions: string
  temperature: number
  wind_speed: string
  visibility: string
  overall_condition: DamageAssessment['overall_condition']
  estimated_total_damage: number
  priority_level: DamageAssessment['priority_level']
  notes: string
  safety_concerns: boolean
  access_issues: boolean
  utility_concerns: boolean
  immediate_action_needed: boolean
}

const INITIAL_FORM_DATA: AssessmentFormData = {
  weather_conditions: 'Clear',
  temperature: 75,
  wind_speed: 'Calm',
  visibility: 'Clear',
  overall_condition: 'good',
  estimated_total_damage: 0,
  priority_level: 'medium',
  notes: '',
  safety_concerns: false,
  access_issues: false,
  utility_concerns: false,
  immediate_action_needed: false
}

const WEATHER_CONDITIONS = [
  'Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Heavy Rain',
  'Thunderstorm', 'Fog', 'Windy', 'Humid', 'Hot', 'Cold'
]

const WIND_SPEEDS = [
  'Calm (0-5 mph)', 'Light Breeze (6-15 mph)', 'Moderate Breeze (16-25 mph)',
  'Strong Breeze (26-35 mph)', 'High Wind (36+ mph)'
]

const VISIBILITY_OPTIONS = [
  'Clear', 'Light Haze', 'Moderate Haze', 'Heavy Haze', 'Fog', 'Limited'
]

const OVERALL_CONDITIONS: Array<{ value: DamageAssessment['overall_condition']; label: string; color: string }> = [
  { value: 'excellent', label: 'Excellent', color: '#10B981' },
  { value: 'good', label: 'Good', color: '#3B82F6' },
  { value: 'fair', label: 'Fair', color: '#F59E0B' },
  { value: 'poor', label: 'Poor', color: '#EF4444' },
  { value: 'severe', label: 'Severe', color: '#DC2626' }
]

const PRIORITY_LEVELS: Array<{ value: DamageAssessment['priority_level']; label: string; color: string }> = [
  { value: 'low', label: 'Low Priority', color: '#6B7280' },
  { value: 'medium', label: 'Medium Priority', color: '#F59E0B' },
  { value: 'high', label: 'High Priority', color: '#EF4444' },
  { value: 'critical', label: 'Critical', color: '#DC2626' }
]

export default function AssessmentCreationWizard() {
  const { property_id } = useLocalSearchParams<{ property_id: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const properties = useSelector(selectProperties)
  const user = useSelector(selectUser)
  const location = useSelector(selectLocation)

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<AssessmentFormData>(INITIAL_FORM_DATA)
  const [showWeatherModal, setShowWeatherModal] = useState(false)
  const [showConditionModal, setShowConditionModal] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const property = properties.items.find(p => p.id === property_id)

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

  const steps: WizardStep[] = [
    {
      id: 1,
      title: 'Assessment Info',
      description: 'Basic assessment details',
      completed: currentStep > 1
    },
    {
      id: 2,
      title: 'Weather Conditions',
      description: 'Current weather and environment',
      completed: currentStep > 2
    },
    {
      id: 3,
      title: 'Property Condition',
      description: 'Overall condition assessment',
      completed: currentStep > 3
    },
    {
      id: 4,
      title: 'Priority & Notes',
      description: 'Priority level and additional notes',
      completed: currentStep > 4
    },
    {
      id: 5,
      title: 'Review & Create',
      description: 'Review and create assessment',
      completed: false
    }
  ]

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      router.back()
    }
  }

  const handleCreateAssessment = async () => {
    if (isCreating) return

    setIsCreating(true)
    try {
      const assessmentData: Omit<DamageAssessment, 'id' | 'created_at' | 'updated_at' | 'synced'> = {
        property_id: property.id,
        assessor_id: user.current?.id || 'current_user',
        assessment_date: new Date().toISOString(),
        weather_conditions: `${formData.weather_conditions} | Temp: ${formData.temperature}°F | Wind: ${formData.wind_speed} | Visibility: ${formData.visibility}`,
        overall_condition: formData.overall_condition,
        estimated_total_damage: formData.estimated_total_damage,
        priority_level: formData.priority_level,
        notes: [
          formData.notes,
          formData.safety_concerns ? '⚠️ Safety concerns noted' : '',
          formData.access_issues ? '🚧 Access issues present' : '',
          formData.utility_concerns ? '⚡ Utility concerns' : '',
          formData.immediate_action_needed ? '🚨 Immediate action required' : ''
        ].filter(Boolean).join('\n')
      }

      const result = await dispatch(createAssessment(assessmentData)).unwrap()
      
      Alert.alert(
        'Assessment Created',
        'Your assessment has been created successfully.',
        [
          {
            text: 'View Assessment',
            onPress: () => {
              router.replace(`/assessment/${result.id}`)
            }
          }
        ]
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to create assessment. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const formatPropertyType = (type: Property['type']) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(currentStep / 5) * 100}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of 5</Text>
    </View>
  )

  const renderStepIndicator = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.stepsContainer}
      contentContainerStyle={styles.stepsContent}
    >
      {steps.map((step) => (
        <View key={step.id} style={styles.stepIndicator}>
          <View style={[
            styles.stepCircle,
            {
              backgroundColor: step.completed ? '#10B981' : 
                             currentStep === step.id ? '#3B82F6' : '#374151'
            }
          ]}>
            {step.completed ? (
              <MaterialCommunityIcons name="check" size={16} color="white" />
            ) : (
              <Text style={styles.stepNumber}>{step.id}</Text>
            )}
          </View>
          <Text style={[
            styles.stepTitle,
            {
              color: step.completed ? '#10B981' :
                     currentStep === step.id ? '#3B82F6' : '#9CA3AF'
            }
          ]}>
            {step.title}
          </Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </View>
      ))}
    </ScrollView>
  )

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeaderTitle}>Assessment Information</Text>
      <Text style={styles.stepHeaderSubtitle}>
        Starting assessment for {property.name}
      </Text>

      <View style={styles.propertyCard}>
        <View style={styles.propertyCardHeader}>
          <MaterialCommunityIcons name="home" size={24} color="#3B82F6" />
          <View style={styles.propertyCardInfo}>
            <Text style={styles.propertyCardName}>{property.name}</Text>
            <Text style={styles.propertyCardType}>{formatPropertyType(property.type)}</Text>
            <Text style={styles.propertyCardAddress}>
              {property.street1}, {property.city}, {property.state} {property.zip}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Assessment Details</Text>
        
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={20} color="#9CA3AF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Date & Time</Text>
            <Text style={styles.infoValue}>
              {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account" size={20} color="#9CA3AF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Assessor</Text>
            <Text style={styles.infoValue}>{user.current?.email || 'Current User'}</Text>
          </View>
        </View>

        {location.current && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#9CA3AF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>GPS Location</Text>
              <Text style={styles.infoValue}>
                {location.current.latitude.toFixed(6)}, {location.current.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.tipBox}>
        <MaterialCommunityIcons name="lightbulb" size={20} color="#F59E0B" />
        <Text style={styles.tipText}>
          Ensure you're at the property location and have good lighting before proceeding with the assessment.
        </Text>
      </View>
    </View>
  )

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeaderTitle}>Weather Conditions</Text>
      <Text style={styles.stepHeaderSubtitle}>
        Document current environmental conditions
      </Text>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Current Weather</Text>
        
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={() => setShowWeatherModal(true)}
        >
          <Text style={styles.selectLabel}>Weather Conditions</Text>
          <View style={styles.selectRow}>
            <Text style={styles.selectValue}>{formData.weather_conditions}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Temperature (°F)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.temperature.toString()}
            onChangeText={(text) => {
              const temp = parseInt(text) || 0
              setFormData({ ...formData, temperature: temp })
            }}
            keyboardType="numeric"
            placeholder="75"
            placeholderTextColor="#6B7280"
          />
        </View>

        <View style={styles.selectRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Wind Speed</Text>
            <TouchableOpacity 
              style={styles.selectInput}
              onPress={() => {
                Alert.alert(
                  'Select Wind Speed',
                  '',
                  WIND_SPEEDS.map(speed => ({
                    text: speed,
                    onPress: () => setFormData({ ...formData, wind_speed: speed })
                  }))
                )
              }}
            >
              <Text style={styles.selectText}>{formData.wind_speed}</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Visibility</Text>
            <TouchableOpacity 
              style={styles.selectInput}
              onPress={() => {
                Alert.alert(
                  'Select Visibility',
                  '',
                  VISIBILITY_OPTIONS.map(visibility => ({
                    text: visibility,
                    onPress: () => setFormData({ ...formData, visibility })
                  }))
                )
              }}
            >
              <Text style={styles.selectText}>{formData.visibility}</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeaderTitle}>Property Condition</Text>
      <Text style={styles.stepHeaderSubtitle}>
        Assess the overall condition of the property
      </Text>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Overall Condition Rating</Text>
        
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={() => setShowConditionModal(true)}
        >
          <Text style={styles.selectLabel}>Current Condition</Text>
          <View style={styles.selectRow}>
            <View style={styles.conditionPreview}>
              <View style={[
                styles.conditionDot,
                { backgroundColor: OVERALL_CONDITIONS.find(c => c.value === formData.overall_condition)?.color || '#6B7280' }
              ]} />
              <Text style={styles.selectValue}>
                {OVERALL_CONDITIONS.find(c => c.value === formData.overall_condition)?.label || 'Good'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Estimated Total Damage ($)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.estimated_total_damage.toString()}
            onChangeText={(text) => {
              const amount = parseInt(text.replace(/[^0-9]/g, '')) || 0
              setFormData({ ...formData, estimated_total_damage: amount })
            }}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
          <Text style={styles.inputHelper}>
            Current estimate: ${formData.estimated_total_damage.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Safety & Access Concerns</Text>
        
        <View style={styles.switchGroup}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Safety Concerns</Text>
              <Text style={styles.switchDescription}>Immediate safety hazards present</Text>
            </View>
            <Switch
              value={formData.safety_concerns}
              onValueChange={(value) => setFormData({ ...formData, safety_concerns: value })}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={formData.safety_concerns ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Access Issues</Text>
              <Text style={styles.switchDescription}>Difficulty accessing areas</Text>
            </View>
            <Switch
              value={formData.access_issues}
              onValueChange={(value) => setFormData({ ...formData, access_issues: value })}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={formData.access_issues ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Utility Concerns</Text>
              <Text style={styles.switchDescription}>Power, water, or gas issues</Text>
            </View>
            <Switch
              value={formData.utility_concerns}
              onValueChange={(value) => setFormData({ ...formData, utility_concerns: value })}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={formData.utility_concerns ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>
      </View>
    </View>
  )

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeaderTitle}>Priority & Notes</Text>
      <Text style={styles.stepHeaderSubtitle}>
        Set priority level and add additional notes
      </Text>

      <View style={styles.formSection}>
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={() => setShowPriorityModal(true)}
        >
          <Text style={styles.selectLabel}>Priority Level</Text>
          <View style={styles.selectRow}>
            <View style={styles.conditionPreview}>
              <View style={[
                styles.conditionDot,
                { backgroundColor: PRIORITY_LEVELS.find(p => p.value === formData.priority_level)?.color || '#6B7280' }
              ]} />
              <Text style={styles.selectValue}>
                {PRIORITY_LEVELS.find(p => p.value === formData.priority_level)?.label || 'Medium Priority'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        <View style={styles.switchGroup}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Immediate Action Needed</Text>
              <Text style={styles.switchDescription}>Requires urgent attention</Text>
            </View>
            <Switch
              value={formData.immediate_action_needed}
              onValueChange={(value) => setFormData({ ...formData, immediate_action_needed: value })}
              trackColor={{ false: '#374151', true: '#EF4444' }}
              thumbColor={formData.immediate_action_needed ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Additional Notes</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Add any additional observations, concerns, or details..."
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>
    </View>
  )

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeaderTitle}>Review & Create</Text>
      <Text style={styles.stepHeaderSubtitle}>
        Review your assessment details before creating
      </Text>

      <ScrollView style={styles.reviewContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Property Information</Text>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Property</Text>
            <Text style={styles.reviewValue}>{property.name}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Address</Text>
            <Text style={styles.reviewValue}>
              {property.street1}, {property.city}, {property.state}
            </Text>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Weather Conditions</Text>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Weather</Text>
            <Text style={styles.reviewValue}>{formData.weather_conditions}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Temperature</Text>
            <Text style={styles.reviewValue}>{formData.temperature}°F</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Wind</Text>
            <Text style={styles.reviewValue}>{formData.wind_speed}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Visibility</Text>
            <Text style={styles.reviewValue}>{formData.visibility}</Text>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Assessment Results</Text>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Overall Condition</Text>
            <View style={styles.conditionPreview}>
              <View style={[
                styles.conditionDot,
                { backgroundColor: OVERALL_CONDITIONS.find(c => c.value === formData.overall_condition)?.color || '#6B7280' }
              ]} />
              <Text style={styles.reviewValue}>
                {OVERALL_CONDITIONS.find(c => c.value === formData.overall_condition)?.label || 'Good'}
              </Text>
            </View>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Estimated Damage</Text>
            <Text style={styles.reviewValue}>${formData.estimated_total_damage.toLocaleString()}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Priority Level</Text>
            <View style={styles.conditionPreview}>
              <View style={[
                styles.conditionDot,
                { backgroundColor: PRIORITY_LEVELS.find(p => p.value === formData.priority_level)?.color || '#6B7280' }
              ]} />
              <Text style={styles.reviewValue}>
                {PRIORITY_LEVELS.find(p => p.value === formData.priority_level)?.label || 'Medium Priority'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Concerns & Notes</Text>
          {formData.safety_concerns && (
            <View style={styles.concernRow}>
              <MaterialCommunityIcons name="alert" size={16} color="#EF4444" />
              <Text style={styles.concernText}>Safety concerns noted</Text>
            </View>
          )}
          {formData.access_issues && (
            <View style={styles.concernRow}>
              <MaterialCommunityIcons name="road-variant" size={16} color="#F59E0B" />
              <Text style={styles.concernText}>Access issues present</Text>
            </View>
          )}
          {formData.utility_concerns && (
            <View style={styles.concernRow}>
              <MaterialCommunityIcons name="flash" size={16} color="#EF4444" />
              <Text style={styles.concernText}>Utility concerns</Text>
            </View>
          )}
          {formData.immediate_action_needed && (
            <View style={styles.concernRow}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.concernText}>Immediate action required</Text>
            </View>
          )}
          {formData.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Additional Notes:</Text>
              <Text style={styles.notesText}>{formData.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>New Assessment</Text>
          <Text style={styles.headerSubtitle}>{property.name}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      {renderProgressBar()}

      {/* Steps Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.backButton]}
          onPress={handleBack}
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color="#9CA3AF" />
          <Text style={styles.backButtonText}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={currentStep === 5 ? handleCreateAssessment : handleNext}
          disabled={isCreating}
        >
          {isCreating ? (
            <MaterialCommunityIcons name="loading" size={20} color="white" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === 5 ? 'Create Assessment' : 'Next'}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Weather Modal */}
      <Modal visible={showWeatherModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Weather Conditions</Text>
              <TouchableOpacity onPress={() => setShowWeatherModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {WEATHER_CONDITIONS.map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={[
                    styles.modalOption,
                    formData.weather_conditions === condition && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, weather_conditions: condition })
                    setShowWeatherModal(false)
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    formData.weather_conditions === condition && styles.modalOptionTextSelected
                  ]}>
                    {condition}
                  </Text>
                  {formData.weather_conditions === condition && (
                    <MaterialCommunityIcons name="check" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Condition Modal */}
      <Modal visible={showConditionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Overall Condition</Text>
              <TouchableOpacity onPress={() => setShowConditionModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {OVERALL_CONDITIONS.map((condition) => (
                <TouchableOpacity
                  key={condition.value}
                  style={[
                    styles.modalOption,
                    formData.overall_condition === condition.value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, overall_condition: condition.value })
                    setShowConditionModal(false)
                  }}
                >
                  <View style={styles.modalOptionContent}>
                    <View style={[styles.conditionDot, { backgroundColor: condition.color }]} />
                    <Text style={[
                      styles.modalOptionText,
                      formData.overall_condition === condition.value && styles.modalOptionTextSelected
                    ]}>
                      {condition.label}
                    </Text>
                  </View>
                  {formData.overall_condition === condition.value && (
                    <MaterialCommunityIcons name="check" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Priority Modal */}
      <Modal visible={showPriorityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Priority Level</Text>
              <TouchableOpacity onPress={() => setShowPriorityModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {PRIORITY_LEVELS.map((priority) => (
                <TouchableOpacity
                  key={priority.value}
                  style={[
                    styles.modalOption,
                    formData.priority_level === priority.value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, priority_level: priority.value })
                    setShowPriorityModal(false)
                  }}
                >
                  <View style={styles.modalOptionContent}>
                    <View style={[styles.conditionDot, { backgroundColor: priority.color }]} />
                    <Text style={[
                      styles.modalOptionText,
                      formData.priority_level === priority.value && styles.modalOptionTextSelected
                    ]}>
                      {priority.label}
                    </Text>
                  </View>
                  {formData.priority_level === priority.value && (
                    <MaterialCommunityIcons name="check" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
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
  header: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  stepsContainer: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
  },
  stepsContent: {
    paddingHorizontal: 20,
    gap: 20,
  },
  stepIndicator: {
    alignItems: 'center',
    minWidth: 80,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stepHeaderSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  propertyCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  propertyCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  propertyCardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  propertyCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  propertyCardType: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 8,
  },
  propertyCardAddress: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingLeft: 4,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  tipBox: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tipText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginLeft: 12,
    lineHeight: 20,
    flex: 1,
  },
  formSection: {
    marginBottom: 32,
  },
  selectButton: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputHelper: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  selectInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  selectText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  switchGroup: {
    gap: 16,
  },
  switchRow: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  conditionPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reviewContainer: {
    flex: 1,
  },
  reviewSection: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
  reviewValue: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 1,
  },
  concernRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  concernText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  notesBox: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  navigation: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  backButton: {
    backgroundColor: '#374151',
  },
  backButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
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
  modalOptions: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalOptionSelected: {
    backgroundColor: '#374151',
  },
  modalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  modalOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
})