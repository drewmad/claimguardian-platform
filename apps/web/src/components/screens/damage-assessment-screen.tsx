/**
 * @fileMetadata
 * @purpose Provides an AI-powered tool for assessing damage based on uploaded photos and linked assets/policies.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/gemini-api"]
 * @exports ["DamageAssessmentScreen"]
 * @complexity high
 * @tags ["screen", "ai", "assessment", "damage"]
 * @status active
 */
/**
 * @fileMetadata
 * @purpose Provides an AI-powered tool for assessing damage based on uploaded photos and linked assets/policies.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/gemini-api"]
 * @exports ["DamageAssessmentScreen"]
 * @complexity high
 * @tags ["screen", "ai", "assessment", "damage"]
 * @status active
 */
/**
 * @fileMetadata
 * @purpose Provides an AI-powered tool for assessing damage based on uploaded photos and linked assets/policies.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/gemini-api"]
 * @exports ["DamageAssessmentScreen"]
 * @complexity high
 * @tags ["screen", "ai", "assessment", "damage"]
 * @status active
 */
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Bot, Sparkles } from 'lucide-react';
import callGeminiAPI from '@/lib/gemini-api';

const DamageAssessmentScreen = ({ assets }) => {
    const [selectedAssetId, setSelectedAssetId] = useState('');
    const [selectedPolicyId, setSelectedPolicyId] = useState('');
    const [imageInfo, setImageInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result.split(',')[1];
                setImageInfo({
                    data: base64String,
                    mimeType: file.type,
                    previewUrl: URL.createObjectURL(file)
                });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleStartAssessment = async () => {
        if (!selectedAssetId || !selectedPolicyId || !imageInfo) {
            alert("Please select an asset, a policy, and upload an image.");
            return;
        }
        setIsLoading(true);
        setReport('');

        const asset = assets.find(a => a.id.toString() === selectedAssetId);
        const policy = asset.policies.find(p => p.id === selectedPolicyId);

        const prompt = `
            Analyze the attached image which shows damage to the asset: "${asset.name}".
            The relevant insurance policy is #${policy.id}.
            
            Assume the policy contains standard clauses for a ${policy.type} policy.
            
            Generate a damage assessment report with the following structure:
            1.  **Observed Damage:** Describe the damage visible in the photo.
            2.  **Likely Cause:** Infer the most probable cause of the damage (e.g., water, impact, fire).
            3.  **Policy Coverage Analysis:** Directly connect the damage to the policy. State whether this type of damage is likely covered, referencing hypothetical but realistic policy sections (e.g., "Section II, Clause 4a: Water Damage"). Explain any potential limits or deductibles that might apply.
            
            Format the output clearly with headings.
        `;

        const result = await callGeminiAPI(prompt, [], null, imageInfo);
        setReport(result);
        setIsLoading(false);
    };

    const selectedAsset = assets.find(a => a.id.toString() === selectedAssetId);

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <h2 className="font-slab text-2xl md:text-3xl font-bold">AI Damage Assessment</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-bgSecondary p-6 rounded-lg shadow-md">
                        <h3 className="font-slab text-lg font-bold mb-4">1. Select Asset & Policy</h3>
                        <select value={selectedAssetId} onChange={e => {setSelectedAssetId(e.target.value); setSelectedPolicyId('');}} className="w-full p-3 bg-bgTertiary rounded-lg border border-border mb-4">
                            <option value="">-- Select an Asset --</option>
                            {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                        </select>
                        {selectedAsset && (
                             <select value={selectedPolicyId} onChange={e => setSelectedPolicyId(e.target.value)} className="w-full p-3 bg-bgTertiary rounded-lg border border-border">
                                <option value="">-- Select a Policy --</option>
                                {selectedAsset.policies.map(p => <option key={p.id} value={p.id}>Policy #{p.id} ({p.type})</option>)}
                            </select>
                        )}
                    </div>
                     <div className="bg-bgSecondary p-6 rounded-lg shadow-md">
                        <h3 className="font-slab text-lg font-bold mb-4">2. Upload Damage Photo</h3>
                        <div onClick={() => fileInputRef.current.click()} className="cursor-pointer bg-bgTertiary min-h-[12rem] rounded-lg border-2 border-dashed border-border flex items-center justify-center text-center text-textSecondary hover:border-accent hover:text-white">
                            {imageInfo ? (
                                <Image src={imageInfo.previewUrl} alt="Damage preview" width={400} height={240} className="h-full max-h-64 w-full object-contain rounded-lg"/>
                            ) : (
                                <div><Camera size={40} className="mx-auto mb-2"/><p>Click to upload photo</p></div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
                    </div>
                    <button onClick={handleStartAssessment} disabled={isLoading || !selectedPolicyId || !imageInfo} className="w-full neon-lime-bg text-black font-bold py-3 px-4 rounded-lg text-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
                        {isLoading ? 'Analyzing...' : <><Sparkles size={20}/> Start Assessment</>}
                    </button>
                </div>
                <div className="bg-bgSecondary p-6 rounded-lg shadow-md">
                    <h3 className="font-slab text-lg font-bold mb-4">3. AI-Generated Report</h3>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Bot size={48} className="mx-auto neon-lime-text animate-pulse"/>
                                <p className="mt-4 text-textSecondary">Analyzing damage and cross-referencing policy...</p>
                            </div>
                        </div>
                    ) : report ? (
                        <div className="prose prose-invert prose-sm max-w-none text-textSecondary whitespace-pre-wrap font-sans">
                            {report.split('\n').map((line, index) => {
                                if (line.startsWith('**') && line.endsWith('**')) {
                                    return <h4 key={index} className="font-bold text-white mt-4 mb-2">{line.replace(/\*\*/g, '')}</h4>
                                }
                                if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
                                    return <h4 key={index} className="font-bold text-white mt-4 mb-2">{line}</h4>
                                }
                                return <p key={index} className="mb-2">{line}</p>
                            })}
                        </div>

                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-textSecondary">
                            <p>Your assessment report will appear here once generated.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DamageAssessmentScreen;
