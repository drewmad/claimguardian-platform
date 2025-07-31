/**
 * @fileMetadata
 * @purpose Modern multi-step property creation wizard with step-by-step guidance
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["PropertyWizard"]
 * @complexity high
 * @tags ["property", "wizard", "form", "multi-step"]
 * @status active
 */
'use client'

import React, { useReducer, useEffect } from 'react'
import { Home, Building, Shield, Banknote, CheckSquare, ChevronLeft, ChevronRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createProperty } from '@/actions/properties'

// --- Constants & Configuration ---
const COLORS = {
    background: 'bg-slate-900',
    panel: 'bg-slate-800/50',
    border: 'border-slate-600',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-400',
    accent: 'bg-indigo-600',
    accentBorder: 'border-indigo-500',
    error: 'text-red-400',
};

const STEPS = [
    { id: 1, name: 'Location', icon: Home },
    { id: 2, name: 'Details', icon: Building },
    { id: 3, name: 'Insurance', icon: Shield },
    { id: 4, name: 'Financials', icon: Banknote },
    { id: 5, name: 'Review', icon: CheckSquare },
];

const VALIDATION_SCHEMA = {
    1: ['ownershipStatus', 'selectedProperty', 'propertyType'],
    2: ['isHOA'],
    3: ['hasHomeownersRenters', 'hasFlood'],
    4: ['hasMortgage'],
};

// --- Types ---
interface WizardState {
    step: number
    ownershipStatus: string
    selectedProperty: string
    basicInfo: { propertyName: string; propertyType: string }
    propertyDetails: { bedrooms: string; bathrooms: string; isHOA: string }
    insuranceInfo: { hasHomeownersRenters: string; hasFlood: string }
    financialInfo: { hasMortgage: string; lenderName: string; monthlyPayment: string }
    errors: Record<string, string>
    isSaving: boolean
    isLoading: boolean
}

type WizardAction = 
    | { type: 'UPDATE_FIELD'; payload: { section?: string; field: string; value: string } }
    | { type: 'NEXT_STEP' }
    | { type: 'PREV_STEP' }
    | { type: 'SET_ERRORS'; payload: Record<string, string> }
    | { type: 'SET_SAVING'; payload: boolean }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'LOAD_STATE'; payload: Partial<WizardState> }
    | { type: 'RESET' }

// --- Reducer for State Management ---
const initialState: WizardState = {
    step: 1,
    ownershipStatus: '', // 'own' or 'rent'
    selectedProperty: '', // Full address
    basicInfo: { propertyName: '', propertyType: '' },
    propertyDetails: { bedrooms: '', bathrooms: '', isHOA: '' },
    insuranceInfo: { hasHomeownersRenters: '', hasFlood: '' },
    financialInfo: { hasMortgage: '', lenderName: '', monthlyPayment: '' },
    errors: {},
    isSaving: false,
    isLoading: false,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
    switch (action.type) {
        case 'UPDATE_FIELD':
            const { section, field, value } = action.payload;
            if (section) {
                return { ...state, [section]: { ...(state[section as keyof typeof state] as Record<string, unknown>), [field]: value } };
            }
            return { ...state, [field]: value };
        case 'NEXT_STEP':
            return { ...state, step: Math.min(state.step + 1, STEPS.length), errors: {} };
        case 'PREV_STEP':
            return { ...state, step: Math.max(state.step - 1, 1) };
        case 'SET_ERRORS':
            return { ...state, errors: action.payload };
        case 'SET_SAVING':
            return { ...state, isSaving: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'LOAD_STATE':
            return { ...initialState, ...action.payload };
        case 'RESET':
            return initialState;
        default:
            throw new Error(`Unhandled action type: ${(action as { type: string }).type}`);
    }
}

// --- Custom Hooks ---
const useFormValidation = (state: WizardState) => {
    const validateStep = (step: number) => {
        const requiredFields = VALIDATION_SCHEMA[step as keyof typeof VALIDATION_SCHEMA];
        if (!requiredFields) return {};

        const errors: Record<string, string> = {};
        requiredFields.forEach(field => {
            // This handles nested and top-level fields with explicit checks
            if (field === 'ownershipStatus' && !state.ownershipStatus) {
                errors[field] = 'This field is required.';
            } else if (field === 'selectedProperty' && !state.selectedProperty) {
                errors[field] = 'This field is required.';
            } else if (field === 'propertyType' && !state.basicInfo.propertyType) {
                errors[field] = 'Please select a property type.';
            } else if (field === 'isHOA' && !state.propertyDetails.isHOA) {
                errors[field] = 'Please select an option.';
            } else if (field === 'hasHomeownersRenters' && !state.insuranceInfo.hasHomeownersRenters) {
                errors[field] = 'This field is required.';
            } else if (field === 'hasFlood' && !state.insuranceInfo.hasFlood) {
                errors[field] = 'This field is required.';
            } else if (field === 'hasMortgage' && !state.financialInfo.hasMortgage) {
                errors[field] = 'This field is required.';
            }
        });
        return errors;
    };
    return { validateStep };
};

const useAutoSave = (state: WizardState, dispatch: React.Dispatch<WizardAction>) => {
    useEffect(() => {
        const handler = setTimeout(() => {
            if (state.step > 1 || state.ownershipStatus) { // Don't save initial blank state
                localStorage.setItem('propertyWizardState', JSON.stringify(state));
                dispatch({ type: 'SET_SAVING', payload: true });
                setTimeout(() => dispatch({ type: 'SET_SAVING', payload: false }), 1500);
            }
        }, 2000); // Save 2 seconds after user stops typing

        return () => clearTimeout(handler);
    }, [state, dispatch]);
};

// --- Main Wizard Component ---
interface PropertyWizardProps {
    open: boolean;
    onClose: () => void;
    onComplete?: (propertyId: string) => void;
}

export function PropertyWizard({ open, onClose, onComplete }: PropertyWizardProps) {
    const [state, dispatch] = useReducer(wizardReducer, initialState);
    const { validateStep } = useFormValidation(state);

    useAutoSave(state, dispatch);

    // Load saved state from localStorage on initial render
    useEffect(() => {
        const savedState = localStorage.getItem('propertyWizardState');
        if (savedState) {
            dispatch({ type: 'LOAD_STATE', payload: JSON.parse(savedState) });
        }
    }, []);

    const handleNext = () => {
        const errors = validateStep(state.step);
        if (Object.keys(errors).length > 0) {
            dispatch({ type: 'SET_ERRORS', payload: errors });
        } else {
            dispatch({ type: 'NEXT_STEP' });
        }
    };

    const handleBack = () => dispatch({ type: 'PREV_STEP' });
    
    const handleFieldChange = (section: string | null, field: string, value: string) => {
        dispatch({ type: 'UPDATE_FIELD', payload: { section: section || undefined, field, value } });
    };

    const handleSubmit = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // Create property with collected data
            const { data: createdProperty, error: propertyError } = await createProperty({
                propertyData: {
                    name: state.basicInfo.propertyName || 'My Property',
                    type: state.basicInfo.propertyType,
                    address: state.selectedProperty,
                    year_built: new Date().getFullYear(),
                    square_feet: 0, // Would need to collect this
                    details: {
                        bedrooms: parseInt(state.propertyDetails.bedrooms) || 0,
                        bathrooms: parseFloat(state.propertyDetails.bathrooms) || 0,
                        lot_size: 0 // Default value
                    }
                }
            });
            
            if (propertyError) throw propertyError;
            
            toast.success('Property created successfully!');
            localStorage.removeItem('propertyWizardState');
            dispatch({ type: 'RESET' });
            
            if (onComplete && createdProperty?.id) {
                onComplete(createdProperty.id);
            }
            
            onClose();
        } catch (error) {
            console.error('Error creating property:', error);
            toast.error('Failed to create property');
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
    
    const handleSaveAndExit = () => {
        localStorage.setItem('propertyWizardState', JSON.stringify(state));
        onClose();
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-3xl h-full max-h-[95vh]">
                <div className={`w-full h-full ${COLORS.panel} rounded-2xl shadow-2xl backdrop-blur-2xl ${COLORS.border} border flex flex-col overflow-hidden`}>
                    {/* Header */}
                    <header className={`flex items-center justify-between p-6 border-b ${COLORS.border} flex-shrink-0`}>
                        <div>
                            <h1 className={`text-xl font-bold ${COLORS.textPrimary}`}>Add New Property</h1>
                            <p className={COLORS.textSecondary}>Create your primary asset: &quot;My Home&quot;</p>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className={`text-sm ${COLORS.textSecondary} transition-opacity duration-500 ${state.isSaving ? 'opacity-100' : 'opacity-0'}`}>
                                <CheckCircle size={16} className="inline mr-1 text-green-400"/> Saved
                            </div>
                            <button onClick={handleSaveAndExit} className={`px-4 py-2 text-sm font-semibold rounded-lg ${COLORS.textPrimary} bg-slate-700/50 hover:bg-slate-600/50`}>
                                Save & Exit
                            </button>
                        </div>
                    </header>

                    {/* Step Progress */}
                    <div className={`p-6 border-b ${COLORS.border}`}>
                        <div className="flex items-center justify-between">
                            {STEPS.map((s, index) => (
                                <React.Fragment key={s.id}>
                                    <div className="flex flex-col items-center text-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${state.step > s.id ? `${COLORS.accent} ${COLORS.accentBorder} ${COLORS.textPrimary}` : state.step === s.id ? `border-indigo-500 ${COLORS.textPrimary}` : `border-slate-700 ${COLORS.textSecondary}`}`}>
                                            {state.step > s.id ? <CheckCircle size={20} /> : <s.icon size={20} />}
                                        </div>
                                        <p className={`mt-2 text-xs font-semibold ${state.step >= s.id ? COLORS.textPrimary : COLORS.textSecondary}`}>{s.name}</p>
                                    </div>
                                    {index < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${state.step > s.id ? COLORS.accent : 'bg-slate-700'}`}></div>}
                                </React.Fragment>
                            ))}
                        </div>
                         {Object.keys(state.errors).length > 0 && (
                            <div className={`mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-3`}>
                                <AlertCircle className={COLORS.error} size={20}/>
                                <p className={COLORS.error}>Please fix the following: {Object.values(state.errors).join(', ')}</p>
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <main className="flex-grow p-8 overflow-y-auto">
                        {state.step === 1 && <Step1 state={state} onChange={handleFieldChange} />}
                        {state.step === 2 && <Step2 state={state} onChange={handleFieldChange} />}
                        {state.step === 3 && <Step3 state={state} onChange={handleFieldChange} />}
                        {state.step === 4 && <Step4 state={state} onChange={handleFieldChange} />}
                        {state.step === 5 && <Step5 state={state} />}
                    </main>

                    {/* Footer */}
                    <footer className={`flex items-center justify-between p-6 border-t ${COLORS.border} flex-shrink-0`}>
                        {state.step > 1 ? (
                            <button onClick={handleBack} className={`flex items-center gap-2 px-6 py-2.5 bg-slate-700/50 text-white font-semibold rounded-lg hover:bg-slate-600/50 border ${COLORS.border}`}>
                                <ChevronLeft size={18} /> Back
                            </button>
                        ) : <div></div>}
                        
                        {state.step < STEPS.length ? (
                            <button onClick={handleNext} className={`flex items-center gap-2 px-6 py-2.5 ${COLORS.accent} text-white font-semibold rounded-lg hover:bg-indigo-500 border ${COLORS.accentBorder} shadow-lg shadow-indigo-600/30`}>
                                Next <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={state.isLoading} className={`flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 border border-green-400 shadow-lg shadow-green-600/30 disabled:bg-slate-500 disabled:cursor-wait`}>
                                {state.isLoading ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18} />}
                                {state.isLoading ? 'Creating...' : 'Create Property'}
                            </button>
                        )}
                    </footer>
                </div>
            </div>
        </div>
    );
}

// --- Step Components ---

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

const Input: React.FC<InputProps> = ({ label, ...props }) => (
    <div>
        <label className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}>{label}</label>
        <input {...props} className={`w-full p-3 ${COLORS.panel} border ${COLORS.border} rounded-lg focus:ring-2 focus:ring-indigo-400 ${COLORS.textPrimary} placeholder-slate-500`} />
    </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, children, ...props }) => (
     <div>
        <label className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}>{label}</label>
        <select {...props} className={`w-full p-3 ${COLORS.panel} border ${COLORS.border} rounded-lg focus:ring-2 focus:ring-indigo-400 ${COLORS.textPrimary}`}>
            {children}
        </select>
    </div>
);

interface ButtonGroupProps {
    options: { label: string; value: string }[];
    selectedValue: string;
    onChange: (value: string) => void;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ options, selectedValue, onChange }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map(option => (
            <button key={option.value} onClick={() => onChange(option.value)} className={`p-4 rounded-lg border-2 text-center font-semibold transition-all duration-200 ${selectedValue === option.value ? `bg-indigo-500/20 border-indigo-500 ${COLORS.textPrimary}` : `bg-slate-900/50 ${COLORS.border} ${COLORS.textSecondary} hover:border-slate-500`}`}>
                {option.label}
            </button>
        ))}
    </div>
);

interface StepProps {
    state: WizardState;
    onChange: (section: string | null, field: string, value: string) => void;
}

const Step1: React.FC<StepProps> = ({ state, onChange }) => (
    <div className="space-y-8">
        <h2 className={`text-2xl font-bold ${COLORS.textPrimary}`}>First, where is the property located?</h2>
        <ButtonGroup
            options={[{label: 'I Own It', value: 'own'}, {label: 'I Rent It', value: 'rent'}]}
            selectedValue={state.ownershipStatus}
            onChange={(value) => onChange(null, 'ownershipStatus', value)}
        />
        {state.errors.ownershipStatus && <p className={COLORS.error}>{state.errors.ownershipStatus}</p>}
        
        <Input label="Street Address" placeholder="e.g., 123 Main St, Anytown, USA" value={state.selectedProperty} onChange={(e) => onChange(null, 'selectedProperty', e.target.value)} />
        {state.errors.selectedProperty && <p className={COLORS.error}>{state.errors.selectedProperty}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Property Nickname" placeholder="e.g., Beach House, Downtown Condo" value={state.basicInfo.propertyName} onChange={(e) => onChange('basicInfo', 'propertyName', e.target.value)} />
            <Select label="Property Type" value={state.basicInfo.propertyType} onChange={(e) => onChange('basicInfo', 'propertyType', e.target.value)}>
                <option value="">Select a type...</option>
                <option value="single-family">Single Family Home</option>
                <option value="condominium">Condominium</option>
                <option value="townhouse">Townhouse</option>
                <option value="apartment">Apartment</option>
                <option value="multi-family">Multi-Family</option>
            </Select>
        </div>
        {state.errors.propertyType && <p className={COLORS.error}>{state.errors.propertyType}</p>}
    </div>
);

const Step2: React.FC<StepProps> = ({ state, onChange }) => (
    <div className="space-y-8">
        <h2 className={`text-2xl font-bold ${COLORS.textPrimary}`}>Tell us a bit more about the property.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Select label="Bedrooms" value={state.propertyDetails.bedrooms} onChange={(e) => onChange('propertyDetails', 'bedrooms', e.target.value)}>
                <option value="">Select...</option>
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Bedroom{n > 1 ? 's' : ''}</option>)}
            </Select>
            <Select label="Bathrooms" value={state.propertyDetails.bathrooms} onChange={(e) => onChange('propertyDetails', 'bathrooms', e.target.value)}>
                <option value="">Select...</option>
                {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(n => <option key={n} value={n}>{n} Bathroom{n % 1 !== 0 ? '' : '.0'}{n > 1 ? 's' : ''}</option>)}
            </Select>
        </div>
        <div>
            <label className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}>Is it part of an HOA (Homeowners Association)?</label>
            <ButtonGroup
                options={[{label: 'Yes', value: 'yes'}, {label: 'No', value: 'no'}, {label: 'Unsure', value: 'unsure'}]}
                selectedValue={state.propertyDetails.isHOA}
                onChange={(value) => onChange('propertyDetails', 'isHOA', value)}
            />
            {state.errors.isHOA && <p className={`mt-2 ${COLORS.error}`}>{state.errors.isHOA}</p>}
        </div>
    </div>
);

const Step3: React.FC<StepProps> = ({ state, onChange }) => (
    <div className="space-y-8">
        <h2 className={`text-2xl font-bold ${COLORS.textPrimary}`}>Do you have insurance coverage?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label={state.ownershipStatus === 'rent' ? 'Do you have Renters Insurance?' : 'Do you have Homeowners Insurance?'} value={state.insuranceInfo.hasHomeownersRenters} onChange={(e) => onChange('insuranceInfo', 'hasHomeownersRenters', e.target.value)}>
                <option value="">Select an option...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
            </Select>
            <Select label="Do you have separate Flood Insurance?" value={state.insuranceInfo.hasFlood} onChange={(e) => onChange('insuranceInfo', 'hasFlood', e.target.value)}>
                <option value="">Select an option...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
            </Select>
        </div>
         {state.errors.hasHomeownersRenters && <p className={COLORS.error}>{state.errors.hasHomeownersRenters}</p>}
         {state.errors.hasFlood && <p className={COLORS.error}>{state.errors.hasFlood}</p>}
    </div>
);

const Step4: React.FC<StepProps> = ({ state, onChange }) => (
    <div className="space-y-8">
        <h2 className={`text-2xl font-bold ${COLORS.textPrimary}`}>Let&apos;s cover the financials.</h2>
        <div>
            <label className={`block text-sm font-medium mb-2 ${COLORS.textSecondary}`}>Do you have a mortgage or loan on the property?</label>
            <ButtonGroup
                options={[{label: 'Yes, I have a mortgage', value: 'yes'}, {label: 'No, I own it outright', value: 'no'}]}
                selectedValue={state.financialInfo.hasMortgage}
                onChange={(value) => onChange('financialInfo', 'hasMortgage', value)}
            />
            {state.errors.hasMortgage && <p className={`mt-2 ${COLORS.error}`}>{state.errors.hasMortgage}</p>}
        </div>

        {state.financialInfo.hasMortgage === 'yes' && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-900/50 rounded-lg border ${COLORS.border}`}>
                <Input label="Lender Name (Optional)" placeholder="e.g., Acme Bank" value={state.financialInfo.lenderName} onChange={(e) => onChange('financialInfo', 'lenderName', e.target.value)} />
                <Input label="Monthly Payment (Optional)" type="number" placeholder="e.g., 2500" value={state.financialInfo.monthlyPayment} onChange={(e) => onChange('financialInfo', 'monthlyPayment', e.target.value)} />
            </div>
        )}
    </div>
);

interface ReviewItemProps {
    label: string;
    value: string;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ label, value }) => (
    <div className={`py-3 border-b ${COLORS.border}`}>
        <p className={`text-sm ${COLORS.textSecondary}`}>{label}</p>
        <p className={`font-semibold ${COLORS.textPrimary}`}>{value || 'Not provided'}</p>
    </div>
);

interface Step5Props {
    state: WizardState;
}

const Step5: React.FC<Step5Props> = ({ state }) => (
    <div>
        <h2 className={`text-2xl font-bold ${COLORS.textPrimary} mb-4`}>Does this look right?</h2>
        <p className={`${COLORS.textSecondary} mb-6`}>Review the information below. You can go back to make changes.</p>
        <div className="space-y-2">
            <ReviewItem label="Address" value={state.selectedProperty} />
            <ReviewItem label="Nickname" value={state.basicInfo.propertyName} />
            <ReviewItem label="Ownership" value={state.ownershipStatus.charAt(0).toUpperCase() + state.ownershipStatus.slice(1)} />
            <ReviewItem label="Property Type" value={state.basicInfo.propertyType.replace('-', ' ')} />
            <ReviewItem label="Bed/Bath" value={`${state.propertyDetails.bedrooms || '?'} bed / ${state.propertyDetails.bathrooms || '?'} bath`} />
            <ReviewItem label="HOA" value={state.propertyDetails.isHOA.charAt(0).toUpperCase() + state.propertyDetails.isHOA.slice(1)} />
            <ReviewItem label="Has Mortgage" value={state.financialInfo.hasMortgage.charAt(0).toUpperCase() + state.financialInfo.hasMortgage.slice(1)} />
            {state.financialInfo.hasMortgage === 'yes' && <ReviewItem label="Lender" value={state.financialInfo.lenderName} />}
        </div>
    </div>
);