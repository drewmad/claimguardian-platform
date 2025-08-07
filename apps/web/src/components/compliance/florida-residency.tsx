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

import { MapPin, Check, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FloridaResidencyProps {
  isResident: boolean;
  zipCode: string;
  onResidentChange: (resident: boolean) => void;
  onZipCodeChange: (zip: string) => void;
  error?: string;
  required?: boolean;
}

// Florida ZIP code ranges
const FLORIDA_ZIP_PATTERNS = [
  /^320\d{2}$/, // 32000-32099
  /^321\d{2}$/, // 32100-32199
  /^322\d{2}$/, // 32200-32299
  /^323\d{2}$/, // 32300-32399
  /^324\d{2}$/, // 32400-32499
  /^325\d{2}$/, // 32500-32599
  /^326\d{2}$/, // 32600-32699
  /^327\d{2}$/, // 32700-32799
  /^328\d{2}$/, // 32800-32899
  /^329\d{2}$/, // 32900-32999
  /^330\d{2}$/, // 33000-33099
  /^331\d{2}$/, // 33100-33199
  /^332\d{2}$/, // 33200-33299
  /^333\d{2}$/, // 33300-33399
  /^334\d{2}$/, // 33400-33499
  /^335\d{2}$/, // 33500-33599
  /^336\d{2}$/, // 33600-33699
  /^337\d{2}$/, // 33700-33799
  /^338\d{2}$/, // 33800-33899
  /^339\d{2}$/, // 33900-33999
  /^340\d{2}$/, // 34000-34099
  /^341\d{2}$/, // 34100-34199
  /^342\d{2}$/, // 34200-34299
  /^343\d{2}$/, // 34300-34399
  /^344\d{2}$/, // 34400-34499
  /^345\d{2}$/, // 34500-34599
  /^346\d{2}$/, // 34600-34699
  /^347\d{2}$/, // 34700-34799
  /^348\d{2}$/, // 34800-34899
  /^349\d{2}$/, // 34900-34999
];

// County lookup by ZIP prefix (simplified)
const ZIP_TO_COUNTY: Record<string, string> = {
  "320": "Duval County",
  "321": "Brevard County",
  "322": "Volusia County",
  "323": "Marion County",
  "324": "Bay County",
  "325": "Leon County",
  "326": "Alachua County",
  "327": "Orange County",
  "328": "Orange County",
  "330": "Miami-Dade County",
  "331": "Miami-Dade County",
  "332": "Broward County",
  "333": "Broward County",
  "334": "Palm Beach County",
  "335": "Monroe County",
  "336": "Hillsborough County",
  "337": "Pinellas County",
  "338": "Manatee County",
  "339": "Lee County",
  "340": "Polk County",
  "341": "Sarasota County",
  "342": "Charlotte County",
  "343": "Collier County",
  "344": "Martin County",
  "345": "Indian River County",
  "346": "Pasco County",
  "347": "Lake County",
  "348": "Sumter County",
  "349": "St. Johns County",
};

export function FloridaResidencyVerification({
  isResident,
  zipCode,
  onResidentChange,
  onZipCodeChange,
  error,
  required = true,
}: FloridaResidencyProps) {
  const [touched, setTouched] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [county, setCounty] = useState<string | null>(null);

  // Validate ZIP code
  const validateZipCode = (zip: string): boolean => {
    if (!zip) return false;

    // Remove any non-digits
    const cleanZip = zip.replace(/\D/g, "");

    // Check if it matches Florida patterns
    return FLORIDA_ZIP_PATTERNS.some((pattern) => pattern.test(cleanZip));
  };

  // Get county from ZIP
  const getCountyFromZip = (zip: string): string | null => {
    const prefix = zip.substring(0, 3);
    return ZIP_TO_COUNTY[prefix] || null;
  };

  // Handle ZIP code changes
  useEffect(() => {
    if (zipCode && zipCode.length === 5) {
      const isValid = validateZipCode(zipCode);

      if (isValid) {
        setZipError(null);
        const countyName = getCountyFromZip(zipCode);
        setCounty(countyName);
      } else {
        setZipError("Please enter a valid Florida ZIP code");
        setCounty(null);
      }
    } else if (zipCode && zipCode.length > 0) {
      setZipError(null); // Don't show error while typing
      setCounty(null);
    }
  }, [zipCode]);

  const handleResidentChange = (checked: boolean) => {
    setTouched(true);
    onResidentChange(checked);

    // Clear ZIP if not resident
    if (!checked) {
      onZipCodeChange("");
      setCounty(null);
      setZipError(null);
    }
  };

  const handleZipChange = (value: string) => {
    // Only allow digits
    const cleanValue = value.replace(/\D/g, "").slice(0, 5);
    onZipCodeChange(cleanValue);
  };

  const showResidentError = touched && required && !isResident;
  const showZipError = isResident && touched && (!zipCode || !!zipError);

  return (
    <div className="space-y-4">
      {/* Florida Resident Checkbox */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="florida-resident"
          checked={isResident}
          onCheckedChange={handleResidentChange}
          className={`mt-1 ${showResidentError || error ? "border-red-500" : ""}`}
          aria-invalid={!!error || showResidentError}
          aria-describedby={
            error || showResidentError ? "resident-error" : undefined
          }
        />
        <div className="flex-1">
          <Label
            htmlFor="florida-resident"
            className="text-sm font-medium cursor-pointer flex items-center gap-2"
          >
            <MapPin className="h-4 w-4 text-slate-400" />I am a Florida resident
            with property in Florida
            {required && <span className="text-red-500">*</span>}
          </Label>
          <p className="text-xs text-slate-500 mt-1">
            ClaimGuardian services are currently available only to Florida
            residents
          </p>
        </div>
      </div>

      {/* ZIP Code Input */}
      {isResident && (
        <div className="pl-7 space-y-2">
          <div>
            <Label htmlFor="zip-code" className="text-sm">
              Florida ZIP Code
              {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="zip-code"
              type="text"
              inputMode="numeric"
              placeholder="e.g., 33101"
              value={zipCode}
              onChange={(e) => handleZipChange(e.target.value)}
              onBlur={() => setTouched(true)}
              className={`mt-1 max-w-[150px] ${
                showZipError ? "border-red-500" : ""
              }`}
              aria-invalid={showZipError}
              aria-describedby={
                showZipError ? "zip-error" : county ? "zip-county" : undefined
              }
            />
          </div>

          {/* County Display */}
          {county && (
            <div
              id="zip-county"
              className="flex items-center gap-2 text-sm text-green-600"
            >
              <Check className="h-4 w-4" />
              <span>{county}</span>
            </div>
          )}

          {/* ZIP Error */}
          {zipError && touched && (
            <p id="zip-error" className="text-sm text-red-500">
              {zipError}
            </p>
          )}
        </div>
      )}

      {/* General Error */}
      {(error || showResidentError) && (
        <Alert variant="destructive" className="py-2" id="resident-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error || "Florida residency verification is required"}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {isResident && zipCode && validateZipCode(zipCode) && county && (
        <Alert className="py-2 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            Florida residency verified in {county}
          </AlertDescription>
        </Alert>
      )}

      {/* Non-Florida Notice */}
      {!isResident && touched && (
        <Alert className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            ClaimGuardian is currently available only to Florida residents. We
            plan to expand to other states in the future. Join our waitlist to
            be notified when we launch in your area.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
