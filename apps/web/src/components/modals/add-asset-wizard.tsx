import React, { useState, useRef } from 'react';
import { X, Camera, Paperclip, Plus, Building, Car, Tv, Shield, Grid, Sparkles, Video } from 'lucide-react';
import { COLORS } from '@/lib/constants';

const AddAssetWizard = ({ onClose, onAddAsset, onFinish }) => {
    const [step, setStep] = useState(1);
    const [assetData, setAssetData] = useState({
        type: '',
        name: '',
        category: '',
        value: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        unknownValue: false,
        specificDetails: {},
        images: [],
        documents: [],
        policyLinkType: 'existing', // 'existing' or 'new'
        selectedPolicy: '',
        newPolicyNumber: '',
        newPolicyProvider: '',
        maintenanceEnabled: true,
        selectedMaintenanceTasks: ['Roof Inspection', 'HVAC Service'],
        weatherAlerts: true,
        confirmed: false
    });
    const [showAssetSearch, setShowAssetSearch] = useState(false);
    const [imagePreview, setImagePreview] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const fileInputRef = useRef(null);
    const docInputRef = useRef(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const totalSteps = 8;

    const assetCategories = {
        Property: ['Single Family Home', 'Condo', 'Townhouse', 'Multi-Family', 'Land'],
        Vehicle: ['Car', 'Truck', 'SUV', 'Motorcycle', 'RV'],
        Electronics: ['Computer', 'TV', 'Audio Equipment', 'Camera', 'Gaming System'],
        Boat: ['Powerboat', 'Sailboat', 'Yacht', 'Jet Ski'],
        Other: ['Jewelry', 'Art', 'Collectibles', 'Furniture', 'Tools']
    };

    const maintenanceTasks = {
        Property: ['Roof Inspection', 'HVAC Service', 'Gutter Cleaning', 'Termite Inspection'],
        Vehicle: ['Oil Change', 'Tire Rotation', 'Brake Inspection', 'Battery Check'],
        Electronics: ['Dust Cleaning', 'Software Updates', 'Warranty Check'],
        Boat: ['Hull Inspection', 'Engine Service', 'Safety Equipment Check'],
        Other: ['Appraisal Update', 'Storage Check', 'Insurance Review']
    };

    const handleDataChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setAssetData({ ...assetData, [name]: checked });
        } else {
            setAssetData({ ...assetData, [name]: value });
        }
    };

    const handleSpecificDetailChange = (field, value) => {
        setAssetData({
            ...assetData,
            specificDetails: { ...assetData.specificDetails, [field]: value }
        });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadstart = () => {
                    setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
                };
                reader.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const progress = (e.loaded / e.total) * 100;
                        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
                    }
                };
                reader.onloadend = () => {
                    const preview = URL.createObjectURL(file);
                    setImagePreview(prev => [...prev, { url: preview, name: file.name }]);
                    setAssetData(prev => ({
                        ...prev,
                        images: [...prev.images, { file, preview }]
                    }));
                    setTimeout(() => {
                        setUploadProgress(prev => {
                            const newProgress = { ...prev };
                            delete newProgress[file.name];
                            return newProgress;
                        });
                    }, 500);
                };
                reader.readAsDataURL(file);
            }
        });
    };

    const handleDocChange = (e) => {
        const files = Array.from(e.target.files);
        setAssetData(prev => ({
            ...prev,
            documents: [...prev.documents, ...files.map(file => ({ file, name: file.name }))]
        }));
    };

    const removeImage = (index) => {
        setImagePreview(prev => prev.filter((_, i) => i !== index));
        setAssetData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleMaintenanceTaskToggle = (task) => {
        setAssetData(prev => ({
            ...prev,
            selectedMaintenanceTasks: prev.selectedMaintenanceTasks.includes(task)
                ? prev.selectedMaintenanceTasks.filter(t => t !== task)
                : [...prev.selectedMaintenanceTasks, task]
        }));
    };

    const formatCurrency = (value) => {
        return value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handleSubmit = () => {
        setShowSuccess(true);
        const newAssetId = onAddAsset({
            ...assetData,
            value: parseFloat(assetData.value.replace(/,/g, '')),
            coverage: 85,
            image: imagePreview[0]?.url || 'https://placehold.co/400x400/1E1E1E/FFFFFF?text=No+Image'
        });
        
        setTimeout(() => {
            onFinish(newAssetId);
        }, 2000);
    };

    const getCompletionPercentage = () => {
        const checks = [
            assetData.type,
            assetData.name,
            assetData.value || assetData.unknownValue,
            Object.keys(assetData.specificDetails).length > 0,
            assetData.images.length > 0,
            assetData.selectedPolicy || assetData.newPolicyNumber,
            step >= 6,
            assetData.confirmed
        ];
        return Math.round((checks.filter(Boolean).length / 8) * 100);
    };

    const StepIndicator = () => (
        <div className="flex items-center mb-6">
            {[...Array(totalSteps)].map((_, i) => (
                <React.Fragment key={i}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        i + 1 <= step ? 'accent-blue-bg text-white' : 'bg-bgTertiary text-textSecondary'
                    }`}>
                        {i + 1}
                    </div>
                    {i < totalSteps - 1 && (
                        <div className={`flex-grow h-1 ${i + 1 < step ? 'accent-blue-bg' : 'bg-bgTertiary'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const renderStepContent = () => {
        switch (step) {
            case 1: // Select Asset Type
                const assetTypes = [
                    { type: 'Property', icon: Building, available: true },
                    { type: 'Vehicle', icon: Car, available: false },
                    { type: 'Electronics', icon: Tv, available: false },
                    { type: 'Boat', icon: Shield, available: false },
                    { type: 'Other', icon: Grid, available: false }
                ];
                
                return (
                    <div>
                        <h3 className="text-lg font-bold mb-4">Select Asset Type</h3>
                        {!showAssetSearch ? (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {assetTypes.map(({ type, icon: Icon, available }) => (
                                        <button
                                            key={type}
                                            onClick={() => available && setAssetData({ ...assetData, type, category: assetCategories[type]?.[0] || '' })}
                                            disabled={!available}
                                            className={`relative p-6 rounded-lg border-2 transition-all ${
                                                available 
                                                    ? assetData.type === type 
                                                        ? 'border-accent bg-accent/10 text-white' 
                                                        : 'border-border bg-bgTertiary hover:border-accent hover:bg-accent/5 cursor-pointer'
                                                    : 'border-border bg-bgTertiary opacity-50 cursor-not-allowed'
                                            }`}
                                        >
                                            <Icon size={32} className="mx-auto mb-2" />
                                            <p className="font-semibold">{type}</p>
                                            {!available && <p className="text-xs text-textSecondary mt-1">(Future)</p>}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setShowAssetSearch(true)}
                                    className="mt-4 text-sm accent-blue-text hover:underline"
                                >
                                    Can't find your asset type?
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Search for asset type..."
                                    className="w-full p-3 bg-bgTertiary rounded-lg border border-border"
                                    autoFocus
                                />
                                <button 
                                    onClick={() => setShowAssetSearch(false)}
                                    className="text-sm text-textSecondary hover:text-white"
                                >
                                    Back to categories
                                </button>
                            </div>
                        )}
                    </div>
                );

            case 2: // Basic Info
                return (
                    <div>
                        <h3 className="text-lg font-bold mb-4">Basic Info</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-textSecondary mb-1 block">Asset Name</label>
                                <input
                                    name="name"
                                    value={assetData.name}
                                    onChange={handleDataChange}
                                    placeholder="e.g., Primary Residence"
                                    className="w-full p-3 bg-bgTertiary rounded-lg border border-border"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-textSecondary mb-1 block">Category</label>
                                <select
                                    name="category"
                                    value={assetData.category}
                                    onChange={handleDataChange}
                                    className="w-full p-3 bg-bgTertiary rounded-lg border border-border"
                                >
                                    {assetCategories[assetData.type]?.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-textSecondary mb-1 block">Estimated Value</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-textSecondary">$</span>
                                    <input
                                        name="value"
                                        value={formatCurrency(assetData.value)}
                                        onChange={(e) => setAssetData({ ...assetData, value: e.target.value })}
                                        placeholder="0"
                                        className="w-full p-3 pl-8 bg-bgTertiary rounded-lg border border-border"
                                        disabled={assetData.unknownValue}
                                    />
                                </div>
                                <label className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        name="unknownValue"
                                        checked={assetData.unknownValue}
                                        onChange={handleDataChange}
                                        className="rounded"
                                    />
                                    <span className="text-sm">I don't know the value</span>
                                </label>
                                {assetData.unknownValue && (
                                    <p className="text-xs text-textSecondary mt-2 p-3 bg-bgTertiary rounded-lg">
                                         Knowing your asset's value helps ensure proper coverage. You can update this later or get a professional appraisal.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm text-textSecondary mb-1 block">Purchase Date</label>
                                <input
                                    name="purchaseDate"
                                    type="date"
                                    value={assetData.purchaseDate}
                                    onChange={handleDataChange}
                                    className="w-full p-3 bg-bgTertiary rounded-lg border border-border"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3: // Asset-Specific Details
                const propertyFields = [
                    { label: 'Year Built', field: 'yearBuilt', type: 'number', placeholder: 'e.g., 1995' },
                    { label: 'Construction Type', field: 'constructionType', type: 'select', options: ['Block', 'Wood Frame', 'Steel Frame', 'Concrete'] },
                    { label: 'Square Feet', field: 'squareFeet', type: 'number', placeholder: 'e.g., 2500' },
                    { label: 'Number of Bedrooms', field: 'bedrooms', type: 'number', placeholder: 'e.g., 3' },
                    { label: 'Number of Bathrooms', field: 'bathrooms', type: 'number', placeholder: 'e.g., 2' }
                ];

                return (
                    <div>
                        <h3 className="text-lg font-bold mb-4">Property Details</h3>
                        <div className="space-y-4">
                            {propertyFields.map(({ label, field, type, placeholder, options }) => (
                                <div key={field}>
                                    <label className="text-sm text-textSecondary mb-1 block">{label}</label>
                                    {type === 'select' ? (
                                        <select
                                            value={assetData.specificDetails[field] || ''}
                                            onChange={(e) => handleSpecificDetailChange(field, e.target.value)}
                                            className="w-full p-3 bg-bgTertiary rounded-lg border border-border"
                                        >
                                            <option value="">Select...</option>
                                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type={type}
                                            value={assetData.specificDetails[field] || ''}
                                            onChange={(e) => handleSpecificDetailChange(field, e.target.value)}
                                            placeholder={placeholder}
                                            className="w-full p-3 bg-bgTertiary rounded-lg border border-border"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 4: // Photos & Documents
                return (
                    <div>
                        <h3 className="text-lg font-bold mb-4">Photos & Documents</h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold mb-2">Photos</h4>
                                <div 
                                    onClick={() => fileInputRef.current.click()}
                                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
                                >
                                    <Camera size={40} className="mx-auto mb-2 text-textSecondary" />
                                    <p className="text-textSecondary">Drag & drop images here or click to browse</p>
                                    <p className="text-xs text-textSecondary mt-1">PNG, JPG up to 10MB</p>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                />
                                
                                {Object.entries(uploadProgress).map(([filename, progress]) => (
                                    <div key={filename} className="mt-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>{filename}</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full bg-bgTertiary rounded-full h-2">
                                            <div 
                                                className="accent-blue-bg h-2 rounded-full transition-all"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {imagePreview.length > 0 && (
                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        {imagePreview.map((img, index) => (
                                            <div key={index} className="relative group">
                                                <img 
                                                    src={img.url} 
                                                    alt={img.name}
                                                    className="w-full h-24 object-cover rounded-lg"
                                                />
                                                <button
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={16} />
                                                </button>
                                                {index === 0 && (
                                                    <span className="absolute bottom-1 left-1 text-xs bg-black/70 px-2 py-1 rounded">Cover</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">Documents</h4>
                                <button
                                    onClick={() => docInputRef.current.click()}
                                    className="w-full p-3 bg-bgTertiary rounded-lg border border-border hover:border-accent text-sm"
                                >
                                    <Paperclip size={16} className="inline mr-2" />
                                    Upload Documents (PDF, DOC, etc.)
                                </button>
                                <input
                                    type="file"
                                    ref={docInputRef}
                                    onChange={handleDocChange}
                                    accept=".pdf,.doc,.docx"
                                    multiple
                                    className="hidden"
                                />
                                {assetData.documents.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {assetData.documents.map((doc, index) => (
                                            <div key={index} className="flex items-center gap-2 text-sm bg-bgTertiary p-2 rounded">
                                                <FileText size={16} />
                                                <span className="flex-grow">{doc.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 5: // Insurance Coverage
                return (
                    <div>
                        <h3 className="text-lg font-bold mb-4">Insurance Coverage</h3>
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 bg-bgTertiary rounded-lg cursor-pointer hover:bg-border">
                                    <input
                                        type="radio"
                                        name="policyLinkType"
                                        value="existing"
                                        checked={assetData.policyLinkType === 'existing'}
                                        onChange={handleDataChange}
                                    />
                                    <div>
                                        <p className="font-semibold">Link existing policy</p>
                                        <p className="text-xs text-textSecondary">Choose from your active policies</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-bgTertiary rounded-lg cursor-pointer hover:bg-border">
                                    <input
                                        type="radio"
                                        name="policyLinkType"
                                        value="new"
                                        checked={assetData.policyLinkType === 'new'}
                                        onChange={handleDataChange}
                                    />
                                    <div>
                                        <p className="font-semibold">Add new policy later</p>
                                        <p className="text-xs text-textSecondary">Enter basic details now</p>
                                    </div>
                                </label>
                            </div>

                            {assetData.policyLinkType === 'existing' ? (
                                <div>
                                    <label className="text-sm text-textSecondary mb-1 block">Select Policy</label>
                                    <select
                                        name="selectedPolicy"
                                        value={assetData.selectedPolicy}
                                        onChange={handleDataChange}
                                        className="w-full p-3 bg-bgTertiary rounded-lg border border-border"
                                    >
                                        <option value="">Choose a policy...</option>
                                        <option value="04760651">Policy #04760651 - Homeowners</option>
                                        <option value="NEW-001">Policy #NEW-001 - Property</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        name="newPolicyNumber"
                                        value={assetData.newPolicyNumber}
                                        onChange={handleDataChange}
                                        placeholder="Policy Number"
                                        className="w-full p-3 bg-bgTertiary rounded-lg border border-border"
                                    />
                                    <input
                                        name="newPolicyProvider"
                                        value={assetData.newPolicyProvider}
                                        onChange={handleDataChange}
                                        placeholder="Insurance Provider"
                                        className="w-full p-3 bg-bgTertiary rounded-lg border border-border"
                                    />
                                </div>
                            )}

                            <div className="bg-bgTertiary p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Current Coverage</span>
                                    <span className="font-bold neon-lime-text">85%</span>
                                </div>
                                <div className="w-full bg-bgPrimary rounded-full h-2 mt-2">
                                    <div className="neon-lime-bg h-2 rounded-full" style={{ width: '85%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 6: // Maintenance & Alerts Setup
                return (
                    <div>
                        <h3 className="text-lg font-bold mb-4">Maintenance & Alerts Setup</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="flex items-center justify-between p-4 bg-bgTertiary rounded-lg">
                                    <div>
                                        <p className="font-semibold">Enable Smart Maintenance Reminders</p>
                                        <p className="text-xs text-textSecondary">Get notified about important maintenance tasks</p>
                                    </div>
                                    <button
                                        onClick={() => setAssetData({ ...assetData, maintenanceEnabled: !assetData.maintenanceEnabled })}
                                        className="flex-shrink-0"
                                    >
                                        {assetData.maintenanceEnabled ? 
                                            <ToggleRight size={24} className="text-accent" /> : 
                                            <ToggleLeft size={24} className="text-textSecondary" />
                                        }
                                    </button>
                                </label>
                            </div>

                            {assetData.maintenanceEnabled && (
                                <div>
                                    <p className="text-sm text-textSecondary mb-3">Suggested tasks for your {assetData.type}:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {maintenanceTasks[assetData.type]?.map(task => (
                                            <button
                                                key={task}
                                                onClick={() => handleMaintenanceTaskToggle(task)}
                                                className={`px-3 py-2 rounded-full text-sm transition-all ${
                                                    assetData.selectedMaintenanceTasks.includes(task)
                                                        ? 'accent-blue-bg text-white'
                                                        : 'bg-bgTertiary hover:bg-border'
                                                }`}
                                            >
                                                {task}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="weatherAlerts"
                                    checked={assetData.weatherAlerts}
                                    onChange={handleDataChange}
                                    className="rounded"
                                />
                                <div>
                                    <p className="font-semibold">Weather damage alerts for this asset</p>
                                    <p className="text-xs text-textSecondary">Get notified about severe weather in your area</p>
                                </div>
                            </label>
                        </div>
                    </div>
                );

            case 7: // Review & Confirm
                return (
                    <div>
                        <h3 className="text-lg font-bold mb-4">Review & Confirm</h3>
                        <div className="space-y-4 mb-6">
                            <div className="bg-bgTertiary p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold">Basic Information</h4>
                                    <button onClick={() => setStep(2)} className="text-sm accent-blue-text">Edit</button>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-textSecondary">Type:</span> {assetData.type}</p>
                                    <p><span className="text-textSecondary">Name:</span> {assetData.name}</p>
                                    <p><span className="text-textSecondary">Value:</span> ${formatCurrency(assetData.value)}</p>
                                </div>
                            </div>

                            <div className="bg-bgTertiary p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold">Coverage & Protection</h4>
                                    <button onClick={() => setStep(5)} className="text-sm accent-blue-text">Edit</button>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-textSecondary">Policy:</span> {assetData.selectedPolicy || assetData.newPolicyNumber || 'None'}</p>
                                    <p><span className="text-textSecondary">Maintenance:</span> {assetData.maintenanceEnabled ? 'Enabled' : 'Disabled'}</p>
                                </div>
                            </div>

                            <div className="bg-bgTertiary p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold">Documentation</h4>
                                    <button onClick={() => setStep(4)} className="text-sm accent-blue-text">Edit</button>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-textSecondary">Photos:</span> {assetData.images.length}</p>
                                    <p><span className="text-textSecondary">Documents:</span> {assetData.documents.length}</p>
                                </div>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 p-4 bg-bgTertiary rounded-lg">
                            <input
                                type="checkbox"
                                name="confirmed"
                                checked={assetData.confirmed}
                                onChange={handleDataChange}
                                className="rounded"
                            />
                            <span>I confirm the information is accurate</span>
                        </label>
                    </div>
                );

            case 8: // Success & Next Steps
                return (
                    <div className="text-center">
                        {showSuccess && (
                            <div className="mb-6">
                                <div className="inline-block animate-bounce">
                                    <Sparkles size={64} className="mx-auto neon-lime-text" />
                                </div>
                                <h3 className="text-2xl font-bold mt-4 mb-2">Asset Added Successfully!</h3>
                                <p className="text-textSecondary">Your {assetData.type.toLowerCase()} has been secured</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-bgTertiary p-4 rounded-lg">
                                <p className="text-sm text-textSecondary">Coverage</p>
                                <p className="text-2xl font-bold neon-lime-text">85%</p>
                            </div>
                            <div className="bg-bgTertiary p-4 rounded-lg">
                                <p className="text-sm text-textSecondary">Protection Score</p>
                                <p className="text-2xl font-bold accent-blue-text">A+</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={() => onFinish(1)}
                                className="w-full accent-blue-bg hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg"
                            >
                                Add Inventory Items
                            </button>
                            <button 
                                onClick={() => window.location.reload()}
                                className="w-full bg-bgTertiary hover:bg-border font-bold py-3 px-4 rounded-lg"
                            >
                                Add Another Asset
                            </button>
                            <button 
                                onClick={onClose}
                                className="w-full text-textSecondary hover:text-white font-bold py-3 px-4"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1: return assetData.type;
            case 2: return assetData.name && (assetData.value || assetData.unknownValue);
            case 3: return true; // Optional details
            case 4: return true; // Optional photos
            case 5: return assetData.selectedPolicy || assetData.newPolicyNumber;
            case 6: return true; // Optional maintenance
            case 7: return assetData.confirmed;
            default: return true;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-bgSecondary w-full max-w-2xl rounded-lg shadow-lg flex flex-col m-4 max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
                    <h3 className="font-slab text-xl font-bold">Add New Asset</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-bgTertiary">
                        <X size={20}/>
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        <StepIndicator />
                        {renderStepContent()}
                    </div>
                </div>
                <footer className="p-4 border-t border-border flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-textSecondary">
                            Completion: {getCompletionPercentage()}%
                        </div>
                        <div className="flex gap-3">
                            {step > 1 && step < 8 && (
                                <button
                                    onClick={() => setStep(s => s - 1)}
                                    className="bg-bgTertiary hover:bg-border text-white font-bold py-2 px-4 rounded-lg"
                                >
                                    Back
                                </button>
                            )}
                            {step < 7 ? (
                                <button
                                    onClick={() => canProceed() ? setStep(s => s + 1) : alert('Please complete required fields')}
                                    className={`font-bold py-2 px-6 rounded-lg ${
                                        canProceed() 
                                            ? 'accent-blue-bg hover:opacity-90 text-white' 
                                            : 'bg-bgTertiary text-textSecondary cursor-not-allowed'
                                    }`}
                                >
                                    Next
                                </button>
                            ) : step === 7 ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!assetData.confirmed}
                                    className={`font-bold py-2 px-6 rounded-lg ${
                                        assetData.confirmed
                                            ? 'neon-lime-bg hover:opacity-90 text-black'
                                            : 'bg-bgTertiary text-textSecondary cursor-not-allowed'
                                    }`}
                                >
                                    Add Asset
                                </button>
                            ) : null}
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AddAssetWizard;
