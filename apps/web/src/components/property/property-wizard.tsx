/**
 * @fileMetadata
 * @purpose "Modern multi-step property creation wizard with comprehensive data collection"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["PropertyWizard"]
 * @complexity high
 * @tags ["property", "wizard", "form", "multi-step", "florida"]
 * @status stable
 */
"use client";

import React, {
  useState,
  useReducer,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Home,
  Building,
  Shield,
  Banknote,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  MapPin,
  Plus,
  Minus,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { createProperty } from "@/actions/properties";

// Simple logger fallback if production logger isn't available
const logger = {
  error: (message: string, error?: unknown) => console.error(message, error),
};

// Add Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: {
              types?: string[];
              componentRestrictions?: { country: string };
            },
          ) => {
            addListener: (event: string, callback: () => void) => void;
            getPlace: () => {
              formatted_address?: string;
              address_components?: Array<{
                types: string[];
                long_name: string;
              }>;
            };
          };
        };
        event: {
          clearInstanceListeners: (instance: unknown) => void;
        };
      };
    };
  }
}

// --- Constants & Configuration ---
const COLORS = {
  background: "bg-slate-900",
  panel: "bg-slate-800/50",
  border: "border-slate-600",
  textPrimary: "text-white",
  textSecondary: "text-slate-400",
  accent: "bg-indigo-600",
  accentBorder: "border-indigo-500",
  error: "text-red-400",
};

const STEPS = [
  { id: 1, name: "Location", icon: Home },
  { id: 2, name: "Details", icon: Building },
  { id: 3, name: "Insurance", icon: Shield },
  { id: 4, name: "Financials", icon: Banknote },
  { id: 5, name: "Review", icon: CheckSquare },
];

const TYPICAL_FEATURES = [
  "Garage",
  "Carport",
  "Fence",
  "Shed",
  "Seawall",
  "Dock",
  "Boat Lift",
  "Pool",
  "Pool Cage / Screen Enclosure",
  "Hurricane Shutters",
  "Impact-Rated Windows",
  "Metal Roof",
  "Whole-House Generator",
  "Solar Panels",
  "Irrigation / Sprinkler System",
  "Septic System",
  "Security System",
];

// --- Types ---
interface PropertyData {
  id?: string;
  step: number;
  ownershipStatus: string;
  address: {
    full: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
  };
  isAddressValidated: boolean;
  basicInfo: { propertyType: string };
  propertyDetails: {
    bedrooms: number;
    bathrooms: number;
    numberOfFloors: number;
    roomsPerFloor: number[];
    features: string[];
  };
  insuranceInfo: {
    hasHomeownersRenters: string;
    hasFlood: string;
    hasOther: string;
  };
  financialInfo: { hasMortgage: string };
  errors: Record<string, string>;
  isSaving: boolean;
  isLoading: boolean;
}

type WizardAction =
  | { type: "SET_ID"; payload: string }
  | {
      type: "UPDATE_FIELD";
      payload: { section?: string; field: string; value: unknown };
    }
  | { type: "SET_ADDRESS"; payload: PropertyData["address"] }
  | { type: "SET_ADDRESS_VALIDATED"; payload: boolean }
  | { type: "SET_ROOMS_PER_FLOOR_ARRAY"; payload: number }
  | {
      type: "UPDATE_ROOMS_PER_FLOOR";
      payload: { index: number; value: number };
    }
  | { type: "TOGGLE_FEATURE"; payload: string }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_ERRORS"; payload: Record<string, string> }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOAD_STATE"; payload: Partial<PropertyData> }
  | { type: "RESET" };

// --- Validation Schema ---
const VALIDATION_SCHEMA: Record<
  number,
  string[] | ((state: PropertyData) => string[])
> = {
  1: [
    "ownershipStatus",
    "address.street1",
    "address.city",
    "address.state",
    "address.zip",
    "propertyType",
  ],
  2: (state: PropertyData) => {
    if (state.basicInfo.propertyType === "land") return [];
    return ["bedrooms", "bathrooms", "numberOfFloors"];
  },
  3: (state: PropertyData) => {
    const required = ["hasHomeownersRenters"];
    if (state.ownershipStatus === "own") {
      required.push("hasFlood");
    }
    return required;
  },
  4: ["hasMortgage"],
};

// --- Reducer for State Management ---
const initialState: PropertyData = {
  id: undefined,
  step: 1,
  ownershipStatus: "",
  address: {
    full: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
  },
  isAddressValidated: false,
  basicInfo: { propertyType: "" },
  propertyDetails: {
    bedrooms: 1,
    bathrooms: 1,
    numberOfFloors: 1,
    roomsPerFloor: [0],
    features: [],
  },
  insuranceInfo: {
    hasHomeownersRenters: "",
    hasFlood: "",
    hasOther: "",
  },
  financialInfo: { hasMortgage: "" },
  errors: {},
  isSaving: false,
  isLoading: false,
};

function wizardReducer(
  state: PropertyData,
  action: WizardAction,
): PropertyData {
  switch (action.type) {
    case "SET_ID":
      return { ...state, id: action.payload };
    case "UPDATE_FIELD": {
      const { section, field, value } = action.payload;
      if (section) {
        const currentSection = state[section as keyof PropertyData] as Record<
          string,
          unknown
        >;
        return { ...state, [section]: { ...currentSection, [field]: value } };
      }
      return { ...state, [field]: value };
    }
    case "SET_ADDRESS":
      return { ...state, address: action.payload };
    case "SET_ADDRESS_VALIDATED":
      return { ...state, isAddressValidated: action.payload };
    case "SET_ROOMS_PER_FLOOR_ARRAY": {
      const floorCount = action.payload;
      const newRoomsPerFloor = Array(floorCount)
        .fill("")
        .map((_, i) => state.propertyDetails.roomsPerFloor[i] || 0);
      return {
        ...state,
        propertyDetails: {
          ...state.propertyDetails,
          numberOfFloors: floorCount,
          roomsPerFloor: newRoomsPerFloor,
        },
      };
    }
    case "UPDATE_ROOMS_PER_FLOOR": {
      const { index, value } = action.payload;
      const newRoomsPerFloor = [...state.propertyDetails.roomsPerFloor];
      newRoomsPerFloor[index] = value;
      return {
        ...state,
        propertyDetails: {
          ...state.propertyDetails,
          roomsPerFloor: newRoomsPerFloor,
        },
      };
    }
    case "TOGGLE_FEATURE": {
      const feature = action.payload;
      const currentFeatures = state.propertyDetails.features || [];
      const newFeatures = currentFeatures.includes(feature)
        ? currentFeatures.filter((f) => f !== feature)
        : [...currentFeatures, feature];
      return {
        ...state,
        propertyDetails: { ...state.propertyDetails, features: newFeatures },
      };
    }
    case "NEXT_STEP":
      return {
        ...state,
        step: Math.min(state.step + 1, STEPS.length),
        errors: {},
      };
    case "PREV_STEP":
      return { ...state, step: Math.max(state.step - 1, 1) };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "SET_SAVING":
      return { ...state, isSaving: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "LOAD_STATE":
      return { ...initialState, ...action.payload };
    case "RESET":
      return { ...initialState, id: state.id };
    default:
      throw new Error(
        `Unhandled action type: ${(action as { type: string }).type}`,
      );
  }
}

// --- Custom Hooks ---
const useDebounce = (callback: (...args: unknown[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  return (...args: unknown[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

const useFormValidation = (state: PropertyData) => {
  const validateStep = useCallback(
    (step: number) => {
      let requiredFields = VALIDATION_SCHEMA[step];
      if (typeof requiredFields === "function")
        requiredFields = requiredFields(state);
      if (!requiredFields) return {};

      const errors: Record<string, string> = {};
      requiredFields.forEach((field) => {
        let value: unknown;
        if (field.startsWith("address."))
          value =
            state.address[field.split(".")[1] as keyof typeof state.address];
        else if (field === "propertyType") value = state.basicInfo.propertyType;
        else if (["bedrooms", "bathrooms", "numberOfFloors"].includes(field))
          value =
            state.propertyDetails[field as keyof typeof state.propertyDetails];
        else if (["hasHomeownersRenters", "hasFlood"].includes(field))
          value =
            state.insuranceInfo[field as keyof typeof state.insuranceInfo];
        else if (field === "hasMortgage")
          value = state.financialInfo.hasMortgage;
        else value = state[field as keyof PropertyData];

        if (value === "" || value === undefined || value === null) {
          errors[field] = "This field is required.";
        }
      });
      return errors;
    },
    [state],
  );
  return { validateStep };
};

const useGooglePlaces = (
  onPlaceSelected: (address: PropertyData["address"]) => void,
) => {
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [scriptState, setScriptState] = useState({
    loaded: false,
    error: null as string | null,
  });

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setScriptState({ loaded: false, error: null });
      return;
    }
    if (window.google && window.google.maps) {
      setScriptState({ loaded: true, error: null });
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setScriptState({ loaded: true, error: null });
    script.onerror = () =>
      setScriptState({
        loaded: false,
        error: "Failed to load Google Maps script.",
      });
    document.body.appendChild(script);
    return () => {
      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com"]`,
      );
      if (existingScript) document.body.removeChild(existingScript);
    };
  }, [GOOGLE_MAPS_API_KEY]);

  const parseAddress = (place: {
    formatted_address?: string;
    address_components?: Array<{ types: string[]; long_name: string }>;
  }) => {
    const components: Record<string, string> = {};
    if (place.address_components) {
      place.address_components.forEach((c) => {
        const type = c.types[0];
        components[type] = c.long_name;
      });
    }
    return {
      street1:
        `${components.street_number || ""} ${components.route || ""}`.trim(),
      street2: components.subpremise || "",
      city: components.locality || "",
      state: components.administrative_area_level_1 || "",
      zip: components.postal_code || "",
      full: place.formatted_address || "",
    };
  };

  const initAutocomplete = useCallback(
    (inputElement: HTMLInputElement) => {
      if (!scriptState.loaded || !inputElement || !window.google) return;
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputElement,
        { types: ["address"], componentRestrictions: { country: "us" } },
      );
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.address_components) onPlaceSelected(parseAddress(place));
      });
    },
    [scriptState.loaded, onPlaceSelected],
  );

  return {
    initAutocomplete,
    isScriptLoaded: scriptState.loaded,
    error: scriptState.error,
  };
};

// --- Main Wizard Component ---
interface PropertyWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete?: (propertyId: string) => void;
}

export function PropertyWizard({
  open,
  onClose,
  onComplete,
}: PropertyWizardProps) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const { validateStep } = useFormValidation(state);
  const [isNextDisabled, setIsNextDisabled] = useState(true);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (!open) return;
    dispatch({ type: "SET_LOADING", payload: true });
    const savedState = localStorage.getItem("propertyWizardState");
    if (savedState) {
      try {
        dispatch({ type: "LOAD_STATE", payload: JSON.parse(savedState) });
      } catch (error) {
        console.warn("Failed to load saved wizard state:", error);
        localStorage.removeItem("propertyWizardState");
      }
    }
    // Always create a session ID for this wizard instance
    dispatch({ type: "SET_ID", payload: `draft_${Date.now()}` });
    setTimeout(() => dispatch({ type: "SET_LOADING", payload: false }), 200);
  }, [open]);

  const debouncedSave = useCallback(
    useDebounce((newState: PropertyData) => {
      if (!newState.id) return;
      // Auto-save to localStorage
      localStorage.setItem("propertyWizardState", JSON.stringify(newState));
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    }, 600),
    [],
  );

  useEffect(() => {
    debouncedSave(state);
  }, [state, debouncedSave]);
  useEffect(() => {
    setIsNextDisabled(Object.keys(validateStep(state.step)).length > 0);
  }, [state, validateStep]);

  const handleNext = () => {
    const errors = validateStep(state.step);
    if (Object.keys(errors).length > 0) {
      dispatch({ type: "SET_ERRORS", payload: errors });
    } else {
      dispatch({ type: "NEXT_STEP" });
    }
  };

  const handleBack = () => dispatch({ type: "PREV_STEP" });

  const handleSubmit = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const { data: createdProperty, error: propertyError } =
        await createProperty({
          propertyData: {
            street_address: state.address.street1,
            city: state.address.city,
            state: state.address.state,
            zip_code: state.address.zip,
            property_type:
              (state.basicInfo.propertyType as
                | "single_family"
                | "condo"
                | "townhouse"
                | "multi_family"
                | "commercial"
                | "land") || "single_family",
            year_built: new Date().getFullYear(),
            square_footage: 0,
            bedrooms: state.propertyDetails.bedrooms,
            bathrooms: state.propertyDetails.bathrooms,
            lot_size_acres: 0,
            metadata: {
              ownership_status: state.ownershipStatus,
              property_details: state.propertyDetails,
              insurance_info: state.insuranceInfo,
              financial_info: state.financialInfo,
              wizard_completed: true,
            },
          },
        });

      if (propertyError) throw propertyError;

      toast.success("Property created successfully!");
      onComplete?.(createdProperty?.id || "");
      localStorage.removeItem("propertyWizardState");
      dispatch({ type: "RESET" });
      onClose();
    } catch (error) {
      logger.error("Error creating property:", error);
      toast.error("Failed to create property");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  if (!open) return null;
  if (state.isLoading) return <SkeletonLoader />;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-3xl h-full max-h-[95vh]">
        <div
          className={`w-full h-full ${COLORS.panel} rounded-2xl shadow-2xl backdrop-blur-2xl ${COLORS.border} border flex flex-col overflow-hidden`}
        >
          <header
            className={`flex items-center justify-between p-6 border-b ${COLORS.border} flex-shrink-0`}
          >
            <div>
              <h1 className={`text-xl font-bold ${COLORS.textPrimary}`}>
                Add New Property
              </h1>
              <p className={COLORS.textSecondary}>
                Create your primary asset: "My Home"
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full text-slate-400 hover:bg-slate-700/50`}
            >
              {" "}
              <X size={20} />{" "}
            </button>
          </header>

          <div className={`p-6 border-b ${COLORS.border}`}>
            <div className="flex items-center justify-between">
              {STEPS.map((s, index) => (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center text-center w-16">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${state.step > s.id ? `${COLORS.accent} ${COLORS.accentBorder} ${COLORS.textPrimary}` : state.step === s.id ? `border-indigo-500 ${COLORS.textPrimary}` : `border-slate-700 ${COLORS.textSecondary}`}`}
                    >
                      {state.step > s.id ? (
                        <CheckCircle size={20} />
                      ) : (
                        <s.icon size={20} />
                      )}
                    </div>
                    <p
                      className={`mt-2 text-xs font-semibold ${state.step >= s.id ? COLORS.textPrimary : COLORS.textSecondary}`}
                    >
                      {s.name}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${state.step > s.id ? COLORS.accent : "bg-slate-700"}`}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <main className="flex-grow p-8 overflow-y-auto pb-24">
            {state.step === 1 && <Step1 state={state} dispatch={dispatch} />}
            {state.step === 2 && <Step2 state={state} dispatch={dispatch} />}
            {state.step === 3 && <Step3 state={state} dispatch={dispatch} />}
            {state.step === 4 && <Step4 state={state} dispatch={dispatch} />}
            {state.step === 5 && <Step5 state={state} />}
          </main>

          <footer className="fixed bottom-0 inset-x-0 p-4 bg-slate-900/80 backdrop-blur border-t border-slate-700 flex items-center justify-between">
            <div
              className={`transition-opacity duration-300 ${showSavedToast ? "opacity-100" : "opacity-0"}`}
            >
              <p className="text-sm text-green-400 flex items-center gap-2">
                <CheckCircle size={16} /> Saved
              </p>
            </div>
            <div className="flex items-center gap-4">
              {state.step > 1 ? (
                <button
                  onClick={handleBack}
                  className={`flex items-center gap-2 px-6 py-2.5 bg-slate-700/50 text-white font-semibold rounded-lg hover:bg-slate-600/50 border ${COLORS.border}`}
                >
                  <ChevronLeft size={18} /> Back
                </button>
              ) : (
                <div className="w-24"></div>
              )}

              {state.step < STEPS.length ? (
                <button
                  onClick={handleNext}
                  disabled={isNextDisabled}
                  className={`flex items-center gap-2 px-6 py-2.5 ${COLORS.accent} text-white font-semibold rounded-lg hover:bg-indigo-500 border ${COLORS.accentBorder} shadow-lg shadow-indigo-600/30 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none`}
                >
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={state.isLoading}
                  className={`flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 border border-green-400 shadow-lg shadow-green-600/30 disabled:bg-slate-500 disabled:cursor-wait`}
                >
                  {state.isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  {state.isLoading ? "Creating..." : "Create Property"}
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---
const SkeletonLoader = () => (
  <div className="w-full h-full bg-slate-800/50 p-8 space-y-6 animate-pulse">
    {" "}
    <div className="h-10 w-3/4 bg-slate-700 rounded-lg"></div>{" "}
    <div className="h-12 w-full bg-slate-700 rounded-lg"></div>{" "}
    <div className="h-12 w-full bg-slate-700 rounded-lg"></div>{" "}
    <div className="h-12 w-1/2 bg-slate-700 rounded-lg"></div>{" "}
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input = ({ label, ...props }: InputProps) => (
  <div>
    <label className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}>
      {label}
    </label>
    <input
      {...props}
      className={`w-full p-3 bg-slate-900/50 border ${COLORS.border} rounded-lg focus:ring-2 focus:ring-indigo-400 ${COLORS.textPrimary} placeholder-slate-500`}
    />
  </div>
);

interface NumericStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const NumericStepper = ({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
}: NumericStepperProps) => {
  const increment = () => onChange(Math.min(max, value + step));
  const decrement = () => onChange(Math.max(min, value - step));
  return (
    <div>
      <label
        className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}
      >
        {label}
      </label>
      <div className="flex items-center gap-4">
        <button
          onClick={decrement}
          className={`p-3 rounded-full bg-slate-700/50 hover:bg-slate-600/50 border ${COLORS.border}`}
        >
          <Minus size={16} />
        </button>
        <span className="text-2xl font-bold w-12 text-center">{value}</span>
        <button
          onClick={increment}
          className={`p-3 rounded-full bg-slate-700/50 hover:bg-slate-600/50 border ${COLORS.border}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

interface CheckboxGridProps {
  options: string[];
  selectedOptions: string[];
  onToggle: (option: string) => void;
}

const CheckboxGrid = ({
  options,
  selectedOptions,
  onToggle,
}: CheckboxGridProps) => (
  <div>
    <label className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}>
      Select applicable features (select all that apply)
    </label>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {options.map((option) => {
        const isSelected = selectedOptions.includes(option);
        return (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`p-3 rounded-lg border-2 text-left font-semibold text-sm transition-all duration-200 ${isSelected ? `bg-indigo-500/20 border-indigo-500 ${COLORS.textPrimary}` : `bg-slate-900/50 ${COLORS.border} ${COLORS.textSecondary} hover:border-slate-500`}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  </div>
);

interface ButtonGroupProps {
  options: { label: string; value: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
  columns?: number;
}

const ButtonGroup = ({
  options,
  selectedValue,
  onChange,
  columns = 3,
}: ButtonGroupProps) => (
  <div className={`grid grid-cols-1 sm:grid-cols-${columns} gap-4`}>
    {options.map((option) => (
      <button
        key={option.value}
        onClick={() => onChange(option.value)}
        className={`p-4 rounded-lg border-2 text-center font-semibold transition-all duration-200 ${selectedValue === option.value ? `bg-indigo-500/20 border-indigo-500 ${COLORS.textPrimary}` : `bg-slate-900/50 ${COLORS.border} ${COLORS.textSecondary} hover:border-slate-500`}`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

interface AddressInputProps {
  address: PropertyData["address"];
  dispatch: React.Dispatch<WizardAction>;
}

const AddressInput = ({ address, dispatch }: AddressInputProps) => {
  const [isManual, setIsManual] = useState(false);
  const onPlaceSelected = (parsedAddress: PropertyData["address"]) => {
    dispatch({ type: "SET_ADDRESS", payload: parsedAddress });
  };
  const { initAutocomplete, isScriptLoaded } = useGooglePlaces(onPlaceSelected);
  const autocompleteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isScriptLoaded && autocompleteRef.current)
      initAutocomplete(autocompleteRef.current);
  }, [isScriptLoaded, initAutocomplete]);

  const handleManualChange = (
    field: keyof PropertyData["address"],
    value: string,
  ) => {
    dispatch({
      type: "SET_ADDRESS",
      payload: { ...address, [field]: value, full: "" },
    });
  };

  return (
    <div className="space-y-4">
      {!isManual ? (
        <div className="relative">
          <label
            className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}
          >
            Street Address
          </label>
          <MapPin
            className={`absolute left-3 top-10 w-5 h-5 ${COLORS.textSecondary}`}
          />
          <input
            ref={autocompleteRef}
            type="text"
            defaultValue={address.full}
            placeholder="Start typing your address..."
            className={`w-full p-3 pl-10 bg-slate-900/50 border ${COLORS.border} rounded-lg`}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          <Input
            label="Street 1"
            value={address.street1}
            onChange={(e) => handleManualChange("street1", e.target.value)}
          />
          <Input
            label="Street 2 (Apt, etc.)"
            value={address.street2}
            onChange={(e) => handleManualChange("street2", e.target.value)}
          />
          <Input
            label="City"
            value={address.city}
            onChange={(e) => handleManualChange("city", e.target.value)}
          />
          <Input
            label="State"
            value={address.state}
            onChange={(e) => handleManualChange("state", e.target.value)}
          />
          <Input
            label="Zip Code"
            value={address.zip}
            onChange={(e) => handleManualChange("zip", e.target.value)}
          />
        </div>
      )}
      <button
        onClick={() => setIsManual(!isManual)}
        className="text-sm text-indigo-400 hover:text-indigo-300"
      >
        {isManual ? "Use Address Search" : "Enter Manually"}
      </button>
    </div>
  );
};

// --- Step Components ---
interface StepProps {
  state: PropertyData;
  dispatch: React.Dispatch<WizardAction>;
}

const Step1 = ({ state, dispatch }: StepProps) => {
  return (
    <div className="space-y-8">
      <h2 className={`text-2xl font-bold ${COLORS.textPrimary}`}>
        First, do you own or rent the property?
      </h2>
      <ButtonGroup
        options={[
          { label: "I Own It", value: "own" },
          { label: "I Rent It", value: "rent" },
        ]}
        columns={2}
        selectedValue={state.ownershipStatus}
        onChange={(value) =>
          dispatch({
            type: "UPDATE_FIELD",
            payload: { field: "ownershipStatus", value },
          })
        }
      />

      {state.ownershipStatus && (
        <div className="space-y-8 animate-fade-in">
          <h3 className={`text-xl font-bold ${COLORS.textPrimary}`}>
            And where is it located?
          </h3>
          <AddressInput address={state.address} dispatch={dispatch} />

          {state.address.street1 && (
            <div className="animate-fade-in">
              <label
                className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}
              >
                Property Type
              </label>
              <ButtonGroup
                options={[
                  { label: "Single Family", value: "single-family" },
                  { label: "Condo", value: "condominium" },
                  { label: "Townhouse", value: "townhouse" },
                  { label: "Apartment", value: "apartment" },
                  { label: "Multi-Family", value: "multi-family" },
                  { label: "Land", value: "land" },
                ]}
                columns={3}
                selectedValue={state.basicInfo.propertyType}
                onChange={(value) =>
                  dispatch({
                    type: "UPDATE_FIELD",
                    payload: {
                      section: "basicInfo",
                      field: "propertyType",
                      value,
                    },
                  })
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Step2 = ({ state, dispatch }: StepProps) => {
  const [visibleQuestions, setVisibleQuestions] = useState({
    beds: true,
    baths: false,
    floors: false,
    rooms: false,
    features: false,
  });

  useEffect(() => {
    if (state.propertyDetails.bedrooms)
      setVisibleQuestions((v) => ({ ...v, baths: true }));
    if (state.propertyDetails.bathrooms)
      setVisibleQuestions((v) => ({ ...v, floors: true }));
    if (state.propertyDetails.numberOfFloors)
      setVisibleQuestions((v) => ({ ...v, rooms: true }));
    const allRoomsEntered = state.propertyDetails.roomsPerFloor.every(
      (r) => r > 0,
    );
    if (state.propertyDetails.numberOfFloors > 0 && allRoomsEntered)
      setVisibleQuestions((v) => ({ ...v, features: true }));
  }, [state.propertyDetails]);

  if (state.basicInfo.propertyType === "land") {
    return (
      <div className="text-center">
        <h2 className={`text-2xl font-bold ${COLORS.textPrimary}`}>
          No additional details needed for land.
        </h2>
        <p className={COLORS.textSecondary}>
          You can proceed to the next step.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className={`text-2xl font-bold ${COLORS.textPrimary}`}>
        Tell us a bit more about the property.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <NumericStepper
          label="Bedrooms"
          value={state.propertyDetails.bedrooms}
          onChange={(value) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { section: "propertyDetails", field: "bedrooms", value },
            })
          }
        />
        {visibleQuestions.baths && (
          <div className="animate-fade-in">
            <NumericStepper
              label="Bathrooms"
              value={state.propertyDetails.bathrooms}
              step={0.5}
              onChange={(value) =>
                dispatch({
                  type: "UPDATE_FIELD",
                  payload: {
                    section: "propertyDetails",
                    field: "bathrooms",
                    value,
                  },
                })
              }
            />
          </div>
        )}
        {visibleQuestions.floors && (
          <div className="animate-fade-in">
            <NumericStepper
              label="Number of Floors"
              value={state.propertyDetails.numberOfFloors}
              min={1}
              max={4}
              onChange={(value) =>
                dispatch({ type: "SET_ROOMS_PER_FLOOR_ARRAY", payload: value })
              }
            />
          </div>
        )}
      </div>

      {visibleQuestions.rooms && state.propertyDetails.numberOfFloors > 0 && (
        <div className="animate-fade-in">
          <label
            className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}
          >
            Rooms per Floor
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {state.propertyDetails.roomsPerFloor.map((_, index) => (
              <NumericStepper
                key={index}
                label={`Floor ${index + 1}`}
                value={state.propertyDetails.roomsPerFloor[index]}
                onChange={(value) =>
                  dispatch({
                    type: "UPDATE_ROOMS_PER_FLOOR",
                    payload: { index, value },
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      {visibleQuestions.features && (
        <div className="animate-fade-in">
          <CheckboxGrid
            options={TYPICAL_FEATURES}
            selectedOptions={state.propertyDetails.features}
            onToggle={(feature) =>
              dispatch({ type: "TOGGLE_FEATURE", payload: feature })
            }
          />
        </div>
      )}
    </div>
  );
};

const Step3 = ({ state, dispatch }: StepProps) => (
  <div className="space-y-8">
    <h2 className={`text-2xl font-bold ${COLORS.textPrimary}`}>
      Do you have insurance coverage?
    </h2>
    <div>
      <label
        className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}
      >
        {state.ownershipStatus === "rent"
          ? "Do you have Renters Insurance?"
          : "Do you have Homeowners Insurance?"}
      </label>
      <ButtonGroup
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
        columns={2}
        selectedValue={state.insuranceInfo.hasHomeownersRenters}
        onChange={(value) =>
          dispatch({
            type: "UPDATE_FIELD",
            payload: {
              section: "insuranceInfo",
              field: "hasHomeownersRenters",
              value,
            },
          })
        }
      />
    </div>

    {state.ownershipStatus === "own" && (
      <div>
        <label
          className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}
        >
          Does this policy include Flood Insurance?
        </label>
        <ButtonGroup
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
          columns={2}
          selectedValue={state.insuranceInfo.hasFlood}
          onChange={(value) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { section: "insuranceInfo", field: "hasFlood", value },
            })
          }
        />
      </div>
    )}

    <div>
      <label
        className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}
      >
        Do you have any other insurance policies for this property?
      </label>
      <ButtonGroup
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
        columns={2}
        selectedValue={state.insuranceInfo.hasOther}
        onChange={(value) =>
          dispatch({
            type: "UPDATE_FIELD",
            payload: { section: "insuranceInfo", field: "hasOther", value },
          })
        }
      />
    </div>
  </div>
);

const Step4 = ({ state, dispatch }: StepProps) => (
  <div className="space-y-8">
    <h2 className={`text-2xl font-bold ${COLORS.textPrimary}`}>
      Let's cover the financials.
    </h2>
    <div>
      <label
        className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}
      >
        Do you have a mortgage or loan on the property?
      </label>
      <ButtonGroup
        options={[
          { label: "Yes, I have a mortgage", value: "yes" },
          { label: "No, I own it outright", value: "no" },
        ]}
        columns={2}
        selectedValue={state.financialInfo.hasMortgage}
        onChange={(value) =>
          dispatch({
            type: "UPDATE_FIELD",
            payload: { section: "financialInfo", field: "hasMortgage", value },
          })
        }
      />
    </div>
  </div>
);

interface ReviewItemProps {
  label: string;
  value: string;
  isFullWidth?: boolean;
}

const ReviewItem = ({ label, value, isFullWidth }: ReviewItemProps) => (
  <div
    className={`py-4 border-b ${COLORS.border} ${isFullWidth ? "col-span-2" : ""}`}
  >
    <p className={`text-sm ${COLORS.textSecondary}`}>{label}</p>
    <p className={`font-semibold ${COLORS.textPrimary} mt-1`}>
      {value || "Not provided"}
    </p>
  </div>
);

interface ReviewSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const ReviewSection = ({ title, icon, children }: ReviewSectionProps) => (
  <div className={`bg-slate-900/50 p-6 rounded-xl border ${COLORS.border}`}>
    <h3 className="flex items-center text-lg font-bold text-indigo-300 mb-4">
      {icon}
      <span className="ml-3">{title}</span>
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">{children}</div>
  </div>
);

interface Step5Props {
  state: PropertyData;
}

const Step5 = ({ state }: Step5Props) => (
  <div>
    <h2 className={`text-2xl font-bold ${COLORS.textPrimary} mb-2`}>
      Does this look right?
    </h2>
    <p className={`${COLORS.textSecondary} mb-6`}>
      Review the information below. You can go back to make changes.
    </p>
    <div className="space-y-6">
      <ReviewSection title="Property Overview" icon={<Home size={20} />}>
        <ReviewItem
          label="Address"
          value={`${state.address.street1}${state.address.street2 ? " " + state.address.street2 : ""}, ${state.address.city}, ${state.address.state} ${state.address.zip}`}
          isFullWidth
        />
        <ReviewItem
          label="Ownership"
          value={
            state.ownershipStatus.charAt(0).toUpperCase() +
            state.ownershipStatus.slice(1)
          }
        />
        <ReviewItem
          label="Property Type"
          value={state.basicInfo.propertyType
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        />
      </ReviewSection>

      {state.basicInfo.propertyType !== "land" && (
        <ReviewSection title="Structural Details" icon={<Building size={20} />}>
          <ReviewItem
            label="Bed / Bath"
            value={`${state.propertyDetails.bedrooms || "?"} bed / ${state.propertyDetails.bathrooms || "?"} bath`}
          />
          <ReviewItem
            label="Floors"
            value={String(state.propertyDetails.numberOfFloors)}
          />
          <ReviewItem
            label="Rooms per Floor"
            value={state.propertyDetails.roomsPerFloor.join(", ")}
            isFullWidth
          />
          <ReviewItem
            label="Features"
            value={state.propertyDetails.features.join(", ")}
            isFullWidth
          />
        </ReviewSection>
      )}

      <ReviewSection title="Coverage & Financials" icon={<Shield size={20} />}>
        <ReviewItem
          label="Home/Renters Insurance"
          value={
            state.insuranceInfo.hasHomeownersRenters.charAt(0).toUpperCase() +
            state.insuranceInfo.hasHomeownersRenters.slice(1)
          }
        />
        {state.insuranceInfo.hasHomeownersRenters === "yes" && (
          <ReviewItem
            label="Includes Flood"
            value={
              state.insuranceInfo.hasFlood.charAt(0).toUpperCase() +
              state.insuranceInfo.hasFlood.slice(1)
            }
          />
        )}
        <ReviewItem
          label="Mortgage"
          value={state.financialInfo.hasMortgage === "yes" ? "Yes" : "No"}
        />
      </ReviewSection>
    </div>
  </div>
);
