"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Shield,
  Home,
  User,
  Building,
  AlertTriangle,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { ExtractedPolicyDataEnhanced } from "@/lib/services/enhanced-document-extraction";
// import { formatCurrency, formatDate } from '@claimguardian/utils'
// Temporary fix - define inline
const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
const formatDate = (date: string) => new Date(date).toLocaleDateString();

interface EnhancedExtractionReviewProps {
  extractedData: ExtractedPolicyDataEnhanced;
  documentName: string;
  confidence: number;
  onApprove: (data: ExtractedPolicyDataEnhanced) => Promise<void>;
  onReject: () => void;
  onEdit: (field: string, value: any) => void;
  validationErrors?: string[];
  suggestions?: string[];
}

export function EnhancedExtractionReview({
  extractedData,
  documentName,
  confidence,
  onApprove,
  onReject,
  onEdit,
  validationErrors = [],
  suggestions = [],
}: EnhancedExtractionReviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(extractedData);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic", "coverage"]),
  );
  const [isApproving, setIsApproving] = useState(false);

  // Calculate field completion statistics
  const totalFields = editedData.extractedFields?.length || 0;
  const missingFields = editedData.missingCriticalFields?.length || 0;
  const completionRate =
    totalFields > 0 ? ((totalFields - missingFields) / totalFields) * 100 : 0;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleFieldEdit = (field: string, value: any) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
    onEdit(field, value);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(editedData);
    } finally {
      setIsApproving(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return "text-green-500";
    if (score >= 0.7) return "text-yellow-500";
    return "text-red-500";
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 0.9) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (score >= 0.7)
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with Overview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                AI Document Extraction Review
              </CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                {documentName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getConfidenceIcon(confidence)}
              <span
                className={`font-semibold ${getConfidenceColor(confidence)}`}
              >
                {(confidence * 100).toFixed(0)}% Confidence
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Extraction Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-gray-400 text-sm">Fields Extracted</div>
              <div className="text-2xl font-bold text-white">{totalFields}</div>
            </div>
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-gray-400 text-sm">Missing Fields</div>
              <div className="text-2xl font-bold text-yellow-500">
                {missingFields}
              </div>
            </div>
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-gray-400 text-sm">Completion Rate</div>
              <div className="text-2xl font-bold text-white">
                {completionRate.toFixed(0)}%
              </div>
            </div>
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-gray-400 text-sm">Processing Method</div>
              <div className="text-lg font-semibold text-white capitalize">
                {editedData.extractionMethod || "Vision"}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Extraction Completeness</span>
              <span className="text-white">{completionRate.toFixed(0)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>

          {/* Validation Alerts */}
          {validationErrors.length > 0 && (
            <Alert className="bg-red-900/20 border-red-800 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                <strong>Validation Issues:</strong>
                <ul className="list-disc ml-4 mt-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <Alert className="bg-blue-900/20 border-blue-800 mb-4">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-400">
                <strong>AI Suggestions:</strong>
                <ul className="list-disc ml-4 mt-1">
                  {suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Extracted Data Sections */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-6 w-full bg-gray-900">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="coverage">Coverage</TabsTrigger>
              <TabsTrigger value="deductibles">Deductibles</TabsTrigger>
              <TabsTrigger value="premium">Premium</TabsTrigger>
              <TabsTrigger value="property">Property</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Policy Information
                  </h3>
                  <div className="space-y-2">
                    <DataField
                      label="Policy Number"
                      value={editedData.policyNumber}
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("policyNumber", v)}
                      required
                    />
                    <DataField
                      label="Carrier Name"
                      value={editedData.carrierName}
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("carrierName", v)}
                      required
                    />
                    <DataField
                      label="Policy Type"
                      value={editedData.policyType}
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("policyType", v)}
                    />
                    <DataField
                      label="NAIC Code"
                      value={editedData.carrierNAIC}
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("carrierNAIC", v)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Insured Information
                  </h3>
                  <div className="space-y-2">
                    <DataField
                      label="Primary Insured"
                      value={editedData.primaryInsuredName}
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("primaryInsuredName", v)}
                    />
                    <DataField
                      label="Mortgage Company"
                      value={editedData.mortgageCompany}
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("mortgageCompany", v)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Important Dates
                  </h3>
                  <div className="space-y-2">
                    <DataField
                      label="Effective Date"
                      value={editedData.effectiveDate}
                      type="date"
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("effectiveDate", v)}
                      required
                    />
                    <DataField
                      label="Expiration Date"
                      value={editedData.expirationDate}
                      type="date"
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("expirationDate", v)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Premium Summary
                  </h3>
                  <div className="space-y-2">
                    <DataField
                      label="Annual Premium"
                      value={editedData.annualPremium}
                      type="currency"
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("annualPremium", v)}
                    />
                    <DataField
                      label="Monthly Premium"
                      value={editedData.monthlyPremium}
                      type="currency"
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("monthlyPremium", v)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Coverage Tab */}
            <TabsContent value="coverage" className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Primary Coverages
                  </h3>
                  <div className="space-y-2">
                    <DataField
                      label="Dwelling (Coverage A)"
                      value={editedData.dwellingCoverage}
                      type="currency"
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("dwellingCoverage", v)}
                      required
                    />
                    <DataField
                      label="Other Structures (Coverage B)"
                      value={editedData.otherStructuresCoverage}
                      type="currency"
                      isEditing={isEditing}
                      onEdit={(v) =>
                        handleFieldEdit("otherStructuresCoverage", v)
                      }
                    />
                    <DataField
                      label="Personal Property (Coverage C)"
                      value={editedData.personalPropertyCoverage}
                      type="currency"
                      isEditing={isEditing}
                      onEdit={(v) =>
                        handleFieldEdit("personalPropertyCoverage", v)
                      }
                    />
                    <DataField
                      label="Loss of Use (Coverage D)"
                      value={editedData.lossOfUseCoverage}
                      type="currency"
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("lossOfUseCoverage", v)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Liability Coverages
                  </h3>
                  <div className="space-y-2">
                    <DataField
                      label="Personal Liability (Coverage E)"
                      value={editedData.personalLiabilityCoverage}
                      type="currency"
                      isEditing={isEditing}
                      onEdit={(v) =>
                        handleFieldEdit("personalLiabilityCoverage", v)
                      }
                    />
                    <DataField
                      label="Medical Payments (Coverage F)"
                      value={editedData.medicalPaymentsCoverage}
                      type="currency"
                      isEditing={isEditing}
                      onEdit={(v) =>
                        handleFieldEdit("medicalPaymentsCoverage", v)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Additional Coverages */}
              {editedData.endorsements &&
                editedData.endorsements.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Endorsements & Riders
                    </h3>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="space-y-2">
                        {editedData.endorsements.map((endorsement, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center"
                          >
                            <div>
                              <span className="text-white font-medium">
                                {endorsement.code}
                              </span>
                              <span className="text-gray-400 ml-2">
                                {endorsement.description}
                              </span>
                            </div>
                            {endorsement.premium && (
                              <span className="text-green-400">
                                {formatCurrency(endorsement.premium)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
            </TabsContent>

            {/* Deductibles Tab */}
            <TabsContent value="deductibles" className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Standard Deductibles
                  </h3>
                  <div className="space-y-2">
                    <DataField
                      label="All Perils Deductible"
                      value={editedData.allPerilsDeductible}
                      type="currency"
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("allPerilsDeductible", v)}
                    />
                    <DataField
                      label="Flood Deductible"
                      value={editedData.floodDeductible}
                      type="currency"
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("floodDeductible", v)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Wind/Storm Deductibles
                  </h3>
                  <div className="space-y-2">
                    <DataField
                      label="Hurricane Deductible"
                      value={editedData.hurricaneDeductible}
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("hurricaneDeductible", v)}
                    />
                    <DataField
                      label="Wind/Hail Deductible"
                      value={editedData.windHailDeductible}
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("windHailDeductible", v)}
                    />
                    <DataField
                      label="Named Storm Deductible"
                      value={editedData.namedStormDeductible}
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("namedStormDeductible", v)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Premium Tab */}
            <TabsContent value="premium" className="mt-6 space-y-4">
              {editedData.premiumBreakdown && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Premium Breakdown
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="space-y-2">
                      {Object.entries(editedData.premiumBreakdown).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center"
                          >
                            <span className="text-gray-400 capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span className="text-white font-medium">
                              {typeof value === "number"
                                ? formatCurrency(value)
                                : value}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}

              {editedData.discounts && editedData.discounts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Discounts Applied
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="space-y-2">
                      {editedData.discounts.map((discount, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center"
                        >
                          <div>
                            <span className="text-white font-medium">
                              {discount.type}
                            </span>
                            <span className="text-gray-400 ml-2">
                              {discount.description}
                            </span>
                          </div>
                          <span className="text-green-400">
                            -
                            {discount.percentage
                              ? `${discount.percentage}%`
                              : formatCurrency(discount.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Property Tab */}
            <TabsContent value="property" className="mt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Property Details
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    {editedData.propertyAddress && (
                      <>
                        <DataField
                          label="Street Address"
                          value={editedData.propertyAddress.street1}
                          isEditing={isEditing}
                          onEdit={(v) =>
                            handleFieldEdit("propertyAddress.street1", v)
                          }
                        />
                        <DataField
                          label="City"
                          value={editedData.propertyAddress.city}
                          isEditing={isEditing}
                          onEdit={(v) =>
                            handleFieldEdit("propertyAddress.city", v)
                          }
                        />
                        <DataField
                          label="State"
                          value={editedData.propertyAddress.state}
                          isEditing={isEditing}
                          onEdit={(v) =>
                            handleFieldEdit("propertyAddress.state", v)
                          }
                        />
                        <DataField
                          label="ZIP Code"
                          value={editedData.propertyAddress.zipCode}
                          isEditing={isEditing}
                          onEdit={(v) =>
                            handleFieldEdit("propertyAddress.zipCode", v)
                          }
                        />
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <DataField
                      label="Year Built"
                      value={editedData.yearBuilt}
                      type="number"
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("yearBuilt", v)}
                    />
                    <DataField
                      label="Square Footage"
                      value={editedData.squareFootage}
                      type="number"
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("squareFootage", v)}
                    />
                    <DataField
                      label="Construction Type"
                      value={editedData.constructionType}
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("constructionType", v)}
                    />
                    <DataField
                      label="Roof Type"
                      value={editedData.roofType}
                      isEditing={isEditing}
                      onEdit={(v) => handleFieldEdit("roofType", v)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Raw Data Tab */}
            <TabsContent value="raw" className="mt-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-xs text-gray-400 overflow-auto max-h-96">
                  {JSON.stringify(editedData, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Data
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="bg-green-900 hover:bg-green-800 text-white border-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => {
                      setEditedData(extractedData);
                      setIsEditing(false);
                    }}
                    variant="outline"
                    className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onReject}
                variant="outline"
                className="bg-red-900 hover:bg-red-800 text-white border-red-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving || validationErrors.length > 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isApproving ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Apply
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for data fields
function DataField({
  label,
  value,
  type = "text",
  isEditing,
  onEdit,
  required = false,
}: {
  label: string;
  value: any;
  type?: "text" | "number" | "currency" | "date";
  isEditing: boolean;
  onEdit: (value: any) => void;
  required?: boolean;
}) {
  const formatValue = () => {
    if (!value) return <span className="text-gray-500">Not extracted</span>;

    switch (type) {
      case "currency":
        return formatCurrency(value);
      case "date":
        return formatDate(value);
      default:
        return value;
    }
  };

  if (isEditing) {
    return (
      <div className="flex justify-between items-center py-1">
        <span className="text-gray-400 text-sm">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        <input
          type={type === "currency" ? "number" : type}
          value={value || ""}
          onChange={(e) => onEdit(e.target.value)}
          className="bg-gray-900 text-white px-2 py-1 rounded border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
        />
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-gray-400 text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <span className="text-white font-medium">{formatValue()}</span>
    </div>
  );
}
