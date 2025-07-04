import { ArrowLeft, FileText } from 'lucide-react';
import { COLORS } from '@/lib/constants';

const AssetDetailScreen = ({ asset, onBack, onAddInventory }) => {
    if (!asset) return <div className="text-center p-10">Asset not found. <button onClick={onBack} className="text-accent">Go Back</button></div>;

    const coverageColor = asset.coverage > 90 ? COLORS.success : asset.coverage > 60 ? COLORS.warning : COLORS.danger;
    
    const PropertyDetailItem = ({ label, value }) => (
        <div className="flex justify-between items-start py-2 border-b border-border last:border-b-0">
            <span className="text-sm text-textSecondary flex-shrink-0 mr-4">{label}</span>
            <span className="text-sm font-semibold text-right">{value}</span>
        </div>
    );

    return (
        <div className="pb-20 md:pb-0">
            <button onClick={onBack} className="flex items-center gap-2 mb-6 text-textSecondary hover:text-white">
                <ArrowLeft size={20} /> Back to Asset Vault
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <img src={asset.image} alt={asset.name} className="w-full h-80 object-cover rounded-lg shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/800x400/1E1E1E/FFFFFF?text=Image+Not+Available`; }}/>
                    <div className="bg-bgSecondary p-6 rounded-lg shadow-md">
                        <h2 className="font-slab text-3xl font-bold">{asset.name}</h2>
                        <p className="text-lg text-textSecondary">{asset.type}</p>
                    </div>
                    {asset.type === 'Property' && (
                        <div className="bg-bgSecondary p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-slab text-xl font-bold">Personal Property Inventory</h3>
                                <button onClick={onAddInventory} className="accent-blue-bg text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2"><Plus size={16} /> Add Item</button>
                            </div>
                            <div className="space-y-3">
                                {asset.inventory.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 bg-bgTertiary p-2 rounded-lg">
                                        <img src={item.imagePreviews[0]} alt={item.name} className="w-12 h-12 object-cover rounded-md" onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/100x100/1E1E1E/FFFFFF?text=No+Image`; }}/>
                                        <div className="flex-grow">
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-xs text-textSecondary">{item.category}</p>
                                        </div>
                                        <p className="font-semibold text-sm">${item.value.toLocaleString()}</p>
                                    </div>
                                ))}
                                {asset.inventory.length === 0 && <p className="text-sm text-textSecondary text-center py-4">No inventory items added yet.</p>}
                            </div>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-bgSecondary p-6 rounded-lg shadow-md">
                         <h3 className="font-slab text-xl font-bold mb-4">Value & Coverage</h3>
                         <p className="text-xs text-textSecondary">Replacement Cost</p>
                         <p className="text-4xl font-bold neon-lime-text mb-4">${asset.value.toLocaleString()}</p>
                         <h4 className="font-bold mb-2">Coverage Status</h4>
                        <div className="w-full bg-bgTertiary rounded-full h-4">
                            <div className="h-4 rounded-full" style={{ width: `${asset.coverage}%`, backgroundColor: coverageColor }}></div>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span>{asset.coverage}% Covered</span>
                            <span className="text-textSecondary">${(asset.value * (1 - asset.coverage/100)).toLocaleString()} OOP</span>
                        </div>
                    </div>
                     <div className="bg-bgSecondary p-6 rounded-lg shadow-md">
                        <h3 className="font-slab text-xl font-bold mb-4">Insurance Policies</h3>
                         <div className="space-y-2">
                            {asset.policies.map(policy => (
                                <div key={policy.id} className="bg-bgTertiary p-3 rounded-lg text-sm hover:bg-border">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-textSecondary"/>
                                            <p className="truncate flex-grow">Policy #{policy.id}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetDetailScreen;
