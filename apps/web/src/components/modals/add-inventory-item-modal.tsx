/**
 * @fileMetadata
 * @purpose Modal for adding new inventory items to an asset, supporting manual entry and AI-powered image scanning.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/gemini-api"]
 * @exports ["AddInventoryItemModal"]
 * @complexity high
 * @tags ["modal", "inventory", "ai", "asset"]
 * @status active
 */
import React, { useState, useRef } from 'react';
import { X, Camera, Paperclip, Plus, Sparkles, Video } from 'lucide-react';
import Image from 'next/image';

const AddInventoryItemModal = ({ assetId, onClose, onAddItem }) => {
    const [mode, setMode] = useState('manual'); // 'manual' or 'ai'
    const [itemData, setItemData] = useState({ name: '', category: '', value: '', imagePreviews: [], description: '', serial: '', purchaseDate: '', location: '', condition: 'Good', attachments: [] });
    const [aiImageInfo, setAiImageInfo] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [identifiedItems, setIdentifiedItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const photoInputRef = useRef(null);
    const docInputRef = useRef(null);

    const handleDataChange = (e) => setItemData({ ...itemData, [e.target.name]: e.target.value });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const previews = files.map((file: File) => URL.createObjectURL(file));
            if (mode === 'manual') {
                setItemData({ ...itemData, imagePreviews: [...itemData.imagePreviews, ...previews] });
            } else {
                const file = files[0];
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result;
                    if (typeof result === 'string') {
                        const base64String = result.split(',')[1];
                        setAiImageInfo({ data: base64String, mimeType: file.type, previewUrl: previews[0] });
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleDocChange = (e) => {
        const file = e.target.files[0];
        if(file) {
            setItemData(prev => ({...prev, attachments: [...prev.attachments, {file: file, type: 'Receipt'}]}))
        }
    };

    const handleDocTypeChange = (index, type) => {
        setItemData(prev => {
            const newAttachments = [...prev.attachments];
            newAttachments[index].type = type;
            return {...prev, attachments: newAttachments};
        })
    }

    const handleAnalyze = async () => {
        if (!aiImageInfo) return;
        setIsAnalyzing(true);

        const formData = new FormData();
        formData.append('property_id', assetId); // Assuming assetId is the property_id
        // Convert base64 to Blob for FormData
        const byteCharacters = atob(aiImageInfo.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: aiImageInfo.mimeType });
        formData.append('image', blob, aiImageInfo.name);

        try {
            const response = await fetch('/api/v1/inventory/recognize', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to recognize items');
            }

            const result = await response.json();
            if (result && result.detected_items && result.detected_items.length > 0) {
                setIdentifiedItems(result.detected_items);
                setSelectedItems(result.detected_items.map((_, index) => index)); // Select all by default
            } else {
                alert("Could not identify items. Please try a different image or enter manually.");
            }
        } catch (error) {
            console.error('AI recognition error:', error);
            alert(`AI recognition failed: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleItemSelection = (index) => {
        setSelectedItems(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleAddSelectedItems = () => {
        selectedItems.forEach((index, i) => {
            const item = identifiedItems[index];
            const isLastItem = i === selectedItems.length - 1;
            onAddItem({
                ...item,
                imagePreviews: [aiImageInfo.previewUrl],
                serial: '',
                purchaseDate: '',
                location: '',
                condition: 'Good',
                attachments: []
            }, assetId, isLastItem); // Only close modal on last item
        });
    };

    const handleSubmit = () => {
        if (!itemData.name || !itemData.value) {
            alert("Please provide at least an item name and value.");
            return;
        }
        onAddItem({ ...itemData, value: parseFloat(itemData.value) }, assetId, true);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-bgSecondary w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
                    <h3 className="font-slab text-xl font-bold">Add Inventory Item</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-bgTertiary"><X size={20}/></button>
                </header>
                <div className="p-2 bg-bgTertiary m-4 rounded-lg flex flex-shrink-0">
                    <button onClick={() => {setMode('manual'); setIdentifiedItems([]);}} className={`w-1/2 p-2 rounded-md font-semibold text-sm transition-colors ${mode === 'manual' ? 'accent-blue-bg' : 'hover:bg-opacity-50'}`}>Manual Entry</button>
                    <button onClick={() => {setMode('ai'); setIdentifiedItems([]);}} className={`w-1/2 p-2 rounded-md font-semibold text-sm transition-colors ${mode === 'ai' ? 'accent-blue-bg' : 'hover:bg-opacity-50'}`}>Scan with AI</button>
                </div>
                <div className="overflow-y-auto px-6 pb-6">
                {mode === 'manual' ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            {itemData.imagePreviews.map((preview, index) => (
                                <Image key={index} src={preview} alt={`preview ${index}`} width={96} height={96} className="h-24 w-full object-cover rounded-md"/>
                            ))}
                             <div onClick={() => photoInputRef.current.click()} className="cursor-pointer bg-bgTertiary h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-center text-textSecondary hover:border-accent hover:text-white">
                                <div><Plus size={20} className="mx-auto"/><p className="text-xs">Add Photo</p></div>
                            </div>
                        </div>
                        <input type="file" ref={photoInputRef} onChange={handlePhotoChange} accept="image/*" multiple className="hidden"/>
                        
                        <textarea name="description" value={itemData.description} onChange={handleDataChange} placeholder="Detailed Description (brand, model, color, etc.)" className="w-full p-3 bg-bgTertiary rounded-lg border border-border h-24 resize-none" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="name" value={itemData.name} onChange={handleDataChange} placeholder="Item Name" className="w-full p-3 bg-bgTertiary rounded-lg border border-border" />
                            <input name="serial" value={itemData.serial} onChange={handleDataChange} placeholder="Serial or Model #" className="w-full p-3 bg-bgTertiary rounded-lg border border-border" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="category" value={itemData.category} onChange={handleDataChange} placeholder="Category (e.g., Electronics)" className="w-full p-3 bg-bgTertiary rounded-lg border border-border" />
                            <input name="value" value={itemData.value} onChange={handleDataChange} type="number" placeholder="Current Value ($)" className="w-full p-3 bg-bgTertiary rounded-lg border border-border" />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="purchaseDate" value={itemData.purchaseDate} onChange={handleDataChange} type="date" placeholder="Purchase Date" className="w-full p-3 bg-bgTertiary rounded-lg border border-border" />
                            <select name="condition" value={itemData.condition} onChange={handleDataChange} className="w-full p-3 bg-bgTertiary rounded-lg border border-border">
                                <option>Good</option><option>New</option><option>Excellent</option><option>Fair</option>
                            </select>
                        </div>
                        <input name="location" value={itemData.location} onChange={handleDataChange} placeholder="Storage Location (e.g., Living Room)" className="w-full p-3 bg-bgTertiary rounded-lg border border-border" />

                        <div>
                            <h4 className="text-sm font-bold text-textSecondary mb-2">Attachments</h4>
                            {itemData.attachments.map((doc, index) => (
                                <div key={index} className="flex items-center gap-2 bg-bgTertiary p-2 rounded-lg mb-2">
                                    <Paperclip size={16} />
                                    <span className="text-sm flex-grow truncate">{doc.file.name}</span>
                                    <select value={doc.type} onChange={(e) => handleDocTypeChange(index, e.target.value)} className="bg-bgPrimary text-xs p-1 rounded border border-border">
                                        <option>Receipt</option><option>Warranty</option><option>Appraisal</option><option>Other</option>
                                    </select>
                                </div>
                            ))}
                            <button type="button" onClick={() => docInputRef.current.click()} className="w-full text-xs text-accent-blue-text p-2 bg-bgTertiary rounded-lg border border-dashed border-border hover:border-accent">Attach Document</button>
                            <input type="file" ref={docInputRef} onChange={handleDocChange} className="hidden" />
                        </div>
                        
                        <button onClick={handleSubmit} className="w-full accent-blue-bg font-bold py-3 rounded-lg">Add Item</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-center p-2 bg-bgTertiary rounded-lg">
                            <h4 className="font-bold">Batch & Video Scan</h4>
                            <p className="text-sm text-textSecondary">Upload multiple room photos or a video walk-through, and we&apos;ll automatically create your inventory list for you to confirm.</p>
                        </div>
                        <div onClick={() => photoInputRef.current.click()} className="cursor-pointer bg-bgTertiary h-64 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-center text-textSecondary hover:border-accent hover:text-white">
                            {aiImageInfo ? <Image src={aiImageInfo.previewUrl} alt="AI scan preview" width={256} height={256} className="h-full w-full object-contain rounded-lg p-1"/> : <div><Camera size={30} className="mx-auto mb-2"/><p>Upload a single item photo or multiple room photos</p></div>}
                        </div>
                        <input type="file" ref={photoInputRef} onChange={handlePhotoChange} accept="image/*" multiple className="hidden"/>
                        
                        {identifiedItems.length > 0 ? (
                            <div>
                                <h4 className="font-bold mb-3">Identified Items</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {identifiedItems.map((item, index) => (
                                        <div 
                                            key={index} 
                                            className={`p-3 bg-bgTertiary rounded-lg border-2 cursor-pointer transition-all ${
                                                selectedItems.includes(index) 
                                                    ? 'border-accent bg-accent/10' 
                                                    : 'border-transparent hover:border-border'
                                            }`}
                                            onClick={() => handleItemSelection(index)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(index)}
                                                    onChange={() => handleItemSelection(index)}
                                                    className="rounded"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{item.name}</p>
                                                    <p className="text-xs text-textSecondary">{item.category} • ${item.value.toLocaleString()}</p>
                                                    <p className="text-xs text-textSecondary mt-1">{item.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button 
                                        onClick={handleAddSelectedItems}
                                        disabled={selectedItems.length === 0}
                                        className="flex-grow accent-blue-bg text-white font-bold py-2 rounded-lg disabled:opacity-50"
                                    >
                                        Add {selectedItems.length} Selected Items
                                    </button>
                                    <button 
                                        onClick={() => setMode('manual')}
                                        className="px-4 py-2 bg-bgTertiary rounded-lg hover:bg-border"
                                    >
                                        Edit Manually
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button onClick={handleAnalyze} disabled={!aiImageInfo || isAnalyzing} className="w-full neon-lime-bg text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isAnalyzing ? "Analyzing..." : <><Sparkles size={18}/> Analyze with AI</>}
                                </button>
                                <button disabled className="w-full bg-bgTertiary text-textSecondary font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-not-allowed">
                                   <Video size={18}/> Scan with Video (Coming Soon)
                                </button>
                            </>
                        )}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default AddInventoryItemModal;
