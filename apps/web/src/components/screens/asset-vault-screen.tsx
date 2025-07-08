/**
 * @fileMetadata
 * @purpose Displays a vault of user assets with grid and list view options.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["AssetVaultScreen"]
 * @complexity medium
 * @tags ["screen", "assets", "vault"]
 * @status active
 */
import { useState } from 'react';
import Image from 'next/image';
import { List, Grid, Plus, ChevronRight } from 'lucide-react';

const AssetVaultScreen = ({ assets, onViewAsset, onAddAsset }) => {
    const [viewMode, setViewMode] = useState('grid');
    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="flex justify-between items-center">
                <h2 className="font-slab text-2xl md:text-3xl font-bold">Asset Vault</h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 p-1 bg-bgSecondary rounded-lg">
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'accent-blue-bg' : 'hover:bg-bgTertiary'}`}><List size={20}/></button>
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'accent-blue-bg' : 'hover:bg-bgTertiary'}`}><Grid size={20}/></button>
                    </div>
                    <button onClick={onAddAsset} className="accent-blue-bg hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                        <Plus size={18}/> Add Asset
                    </button>
                </div>
            </div>

            {assets.length === 0 ? (
                <div className="text-center py-20 bg-bgSecondary rounded-lg">
                    <p className="text-textSecondary">Your asset vault is empty.</p>
                    <button onClick={onAddAsset} className="mt-4 accent-blue-bg hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg">Add Your First Asset</button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {assets.map(asset => (
                        <div key={asset.id} onClick={() => onViewAsset(asset.id)} className="bg-bgSecondary rounded-lg shadow-md overflow-hidden cursor-pointer group">
                            <Image src={asset.image} alt={asset.name} width={400} height={160} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/400x400/1E1E1E/FFFFFF?text=No+Image`; }}/>
                            <div className="p-4">
                                <h4 className="font-bold truncate">{asset.name}</h4>
                                <p className="text-sm text-textSecondary">{asset.type}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {assets.map(asset => (
                        <div key={asset.id} onClick={() => onViewAsset(asset.id)} className="bg-bgSecondary rounded-lg shadow-md p-4 flex items-center gap-4 cursor-pointer hover:bg-bgTertiary">
                            <Image src={asset.image} alt={asset.name} width={64} height={64} className="w-16 h-16 object-cover rounded-md" onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/100x100/1E1E1E/FFFFFF?text=No+Image`; }}/>
                            <div className="flex-grow">
                                <h4 className="font-bold">{asset.name}</h4>
                                <p className="text-sm text-textSecondary">{asset.type}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">${asset.value.toLocaleString()}</p>
                                <p className="text-sm text-textSecondary">Est. Value</p>
                            </div>
                            <ChevronRight size={20} className="text-textSecondary"/>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssetVaultScreen;
