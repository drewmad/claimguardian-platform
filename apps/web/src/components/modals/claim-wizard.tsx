/**
 * @fileMetadata
 * @purpose Guides the user through the process of filing a new insurance claim.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/gemini-api", "@/lib/constants"]
 * @exports ["ClaimWizard"]
 * @complexity high
 * @tags ["modal", "wizard", "claims", "ai"]
 * @status active
 */
import React, { useState, useEffect } from 'react';
import { X, Camera, Bot, Sparkles, CheckCircle } from 'lucide-react';
import callGeminiAPI from '@/lib/gemini-api';
import { COLORS } from '@/lib/constants';

const ClaimWizard = ({ onClose, onContextSet }) => {
    const [step, setStep] = useState(1);
    const [claimData, setClaimData] = useState({ incidentType: '', incidentDate: '', location: '' });
    const [aiAssessment, setAiAssessment] = useState(null);
    const [isAssessing, setIsAssessing] = useState(false);
    const totalSteps = 5;

    useEffect(() => {
        if (step === 3 && !aiAssessment && claimData.incidentType) {
            const getAssessment = async () => {
                setIsAssessing(true);
                onContextSet({ type: 'claim_assessment', data: claimData });
                const prompt = `I am filing an insurance claim. The incident type is "${claimData.incidentType}" and it happened at this location: "${claimData.location}". Based on this, generate a plausible damage assessment. Provide a suggested repair scope, an estimated cost as a number, and an estimated time.`;
                const schema = {
                    type: "OBJECT",
                    properties: {
                        scope: { type: "STRING", description: "A brief description of the repair work needed." },
                        cost: { type: "NUMBER", description: "The estimated cost of the repair in USD." },
                        time: { type: "STRING", description: "The estimated time to complete the repair." }
                    },
                    required: ["scope", "cost", "time"]
                };
                const result = await callGeminiAPI(prompt, [], schema);
                if (typeof result === 'object' && result !== null && result.scope) {
                    setAiAssessment(result);
                } else {
                    setAiAssessment({ scope: 'Could not determine scope.', cost: 0, time: 'N/A' });
                }
                setIsAssessing(false);
            };
            getAssessment();
        }
    }, [step, claimData, aiAssessment, onContextSet]);

    const handleDataChange = (e) => {
        setClaimData({ ...claimData, [e.target.name]: e.target.value });
    };

    const StepIndicator = () => (
        <div className="flex items-center mb-6">
            {[...Array(totalSteps)].map((_, i) => (
                <React.Fragment key={i}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i + 1 <= step ? 'accent-blue-bg text-white' : 'bg-bgTertiary text-textSecondary'}`}>
                        {i + 1}
                    </div>
                    {i < totalSteps - 1 && <div className={`flex-grow h-1 ${i + 1 < step ? 'accent-blue-bg' : 'bg-bgTertiary'}`}></div>}
                </React.Fragment>
            ))}
        </div>
    );

    const handleSubmitClaim = async () => {
        try {
            // Placeholder for actual claim data from wizard steps
            const claimPayload = {
                policy_id: "", // This needs to be dynamically obtained
                property_id: "", // This needs to be dynamically obtained
                claim_details: { incident_type: claimData.incidentType, incident_date: claimData.incidentDate, description: `Incident at ${claimData.location}` },
                damages: [], // Populate from evidence capture
                timeline: { filed: new Date().toISOString() },
                status: { current: "filed" }
            };

            const response = await fetch('/api/v1/claims', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(claimPayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit claim');
            }

            const result = await response.json();
            console.log('Claim submitted successfully:', result.claim);
            setStep(s => s + 1); // Move to success step
        } catch (error) {
            console.error('Error submitting claim:', error);
            alert(`Error submitting claim: ${error.message}`);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1: return (
                <div>
                    <h3 className="text-lg font-bold mb-4">Incident Basics</h3>
                    <div className="space-y-4">
                        <select name="incidentType" value={claimData.incidentType} onChange={handleDataChange} className="w-full p-3 bg-bgTertiary rounded-lg border border-border">
                            <option value="">Select Incident Type</option>
                            <option>Water Damage</option><option>Fire</option><option>Theft</option><option>Wind/Hail</option><option>Collision</option>
                        </select>
                        <input name="incidentDate" type="date" value={claimData.incidentDate} onChange={handleDataChange} className="w-full p-3 bg-bgTertiary rounded-lg border border-border" />
                        <input name="location" type="text" value={claimData.location} onChange={handleDataChange} placeholder="Location (e.g., Kitchen)" className="w-full p-3 bg-bgTertiary rounded-lg border border-border" />
                    </div>
                </div>
            );
            case 2: return (
                <div>
                    <h3 className="text-lg font-bold mb-4">Evidence Capture</h3>
                    <div className="border-2 border-dashed border-border rounded-lg p-10 text-center bg-bgPrimary">
                        <Camera size={48} className="mx-auto text-textSecondary mb-4" />
                        <h4 className="font-bold">Smart Camera</h4>
                        <p className="text-sm text-textSecondary mb-4">Overlays will guide you to frame the perfect shot.</p>
                        <button className="accent-blue-bg text-white font-bold py-2 px-4 rounded-lg">Open Camera</button>
                    </div>
                </div>
            );
            case 3: return (
                <div>
                    <h3 className="text-lg font-bold mb-4">✨ AI Damage Assessment</h3>
                    <div className="bg-bgTertiary p-4 rounded-lg text-center">
                        <Bot size={32} className="mx-auto neon-lime-text mb-2"/>
                        {isAssessing ? (
                            <p className="font-bold">ClaimGuardian AI is analyzing your evidence...</p>
                        ) : aiAssessment ? (
                            <div className="mt-4 text-left space-y-2">
                                <p><strong>Suggested Repair Scope:</strong> {aiAssessment.scope}</p>
                                <p><strong>Estimated Cost:</strong> <span className="font-bold neon-lime-text">${aiAssessment.cost.toLocaleString()}</span></p>
                                <p><strong>Estimated Time:</strong> {aiAssessment.time}</p>
                            </div>
                        ) : <p>Please complete step 1 to generate an assessment.</p>}
                    </div>
                </div>
            );
            case 4: return (
                <div>
                    <h3 className="text-lg font-bold mb-4">Policy Cross-Check</h3>
                    <div className="bg-bgTertiary p-4 rounded-lg space-y-3">
                        <div className="flex justify-between"><span>Coverage Limit:</span> <span className="font-bold">$25,000</span></div>
                        <div className="flex justify-between"><span>Deductible:</span> <span className="font-bold danger-red-text">$1,000</span></div>
                        <div className="flex justify-between items-center text-green-400 font-bold"><span>Covered</span> <CheckCircle size={20}/></div>
                    </div>
                </div>
            );
            case 5: return (
                <div className="text-center">
                    <CheckCircle size={64} className="mx-auto text-green-400 mb-4"/>
                    <h3 className="text-xl font-bold mb-2">Claim Submitted!</h3>
                    <p className="text-textSecondary">Your claim ID is <span className="font-mono font-bold text-white">#C2025-07-301</span>. An adjuster will be assigned within 24 hours.</p>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-bgSecondary w-full max-w-lg rounded-lg shadow-lg flex flex-col m-4" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-slab text-xl font-bold">New Claim Wizard</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-bgTertiary"><X size={20}/></button>
                </header>
                <div className="p-6">
                    <StepIndicator />
                    {renderStepContent()}
                </div>
                <footer className="p-4 border-t border-border flex justify-end gap-3">
                    {step > 1 && step < 5 && <button onClick={() => setStep(s => s - 1)} className="bg-bgTertiary hover:bg-border text-white font-bold py-2 px-4 rounded-lg">Back</button>}
                    {step < 4 && <button onClick={() => setStep(s => s + 1)} className="accent-blue-bg hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg">Next</button>}
                    {step === 4 && <button onClick={handleSubmitClaim} className="neon-lime-bg hover:opacity-90 text-black font-bold py-2 px-4 rounded-lg">Submit Claim</button>}
                    {step === 5 && <button onClick={onClose} className="accent-blue-bg hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg">Done</button>}
                </footer>
            </div>
        </div>
    );
};

export default ClaimWizard;
