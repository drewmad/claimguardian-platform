/**
 * @fileMetadata
 * @purpose Main application entry point, orchestrates different screens and modals.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/mock-data", "@/lib/gemini-api", "@/lib/constants", "@/components/layout/header", "@/components/layout/sidebar", "@/components/layout/bottom-nav", "@/components/screens/home-screen", "@/components/screens/asset-vault-screen", "@/components/screens/asset-detail-screen", "@/components/screens/damage-assessment-screen", "@/components/screens/claims-screen", "@/components/modals/claim-wizard", "@/components/modals/profile-modal", "@/components/modals/add-asset-wizard", "@/components/modals/add-inventory-item-modal", "@/components/ai/ai-chat-button", "@/components/ai/ai-chat-panel"]
 * @exports ["App"]
 * @complexity high
 * @tags ["app", "main", "layout", "routing"]
 * @status active
 */
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sparkles, X, Bot, ArrowRight, Paperclip, XCircle } from 'lucide-react';

import { INITIAL_ASSETS, MOCK_DATA } from '@/lib/mock-data';
import callGeminiAPI from '@/lib/gemini-api';
import { COLORS } from '@/lib/constants';

import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import BottomNav from '@/components/layout/bottom-nav';

import HomeScreen from '@/components/screens/home-screen';
import AssetVaultScreen from '@/components/screens/asset-vault-screen';
import AssetDetailScreen from '@/components/screens/asset-detail-screen';
import DamageAssessmentScreen from '@/components/screens/damage-assessment-screen';
import ClaimsScreen from '@/components/screens/claims-screen';

import ClaimWizard from '@/components/modals/claim-wizard';
import ProfileModal from '@/components/modals/profile-modal';
import AddAssetWizard from '@/components/modals/add-asset-wizard';
import AddInventoryItemModal from '@/components/modals/add-inventory-item-modal';

export default function App() {
  const [view, setView] = useState({ screen: 'Home', assetId: null });
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isClaimWizardOpen, setIsClaimWizardOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isAddAssetWizardOpen, setIsAddAssetWizardOpen] = useState(false);
  const [activeClaimContext, setActiveClaimContext] = useState(null);
  const [showDemoNotice, setShowDemoNotice] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarCollapsed(false);
      } else {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigate = (screen, assetId = null) => {
    setView({ screen, assetId });
  };
  
  const handleAddAsset = (newAsset) => {
    const assetToAdd = {
        ...newAsset,
        id: Date.now(),
        docs: [],
        maintenance: [],
        policies: newAsset.policyNumber ? [{ id: newAsset.policyNumber, provider: 'Guardian Assurance', type: 'General' }] : [],
        inventory: []
    };
    const newAssets = [assetToAdd, ...assets];
    setAssets(newAssets);
    return assetToAdd.id;
  };

  const handleAddItemToInventory = (newItem, assetId, closeModal = true) => {
    setAssets(currentAssets => 
        currentAssets.map(asset => {
            if (asset.id === assetId) {
                const updatedInventory = [...(asset.inventory || []), { ...newItem, id: Date.now() + Math.random() }];
                return { ...asset, inventory: updatedInventory };
            }
            return asset;
        })
    );
    if (closeModal) {
        setIsInventoryModalOpen(false);
    }
  };

  const renderScreen = () => {
    if (view.screen === 'Assets' && view.assetId) {
        const asset = assets.find(a => a.id === view.assetId);
        return <AssetDetailScreen asset={asset} onBack={() => handleNavigate('Assets')} onAddInventory={() => setIsInventoryModalOpen(true)} />;
    }
    
    switch (view.screen) {
      case 'Home':
        return <HomeScreen onStartClaim={() => setIsClaimWizardOpen(true)} onAddAsset={() => setIsAddAssetWizardOpen(true)} />;
      case 'Assets':
        return <AssetVaultScreen assets={assets} onViewAsset={(id) => handleNavigate('Assets', id)} onAddAsset={() => setIsAddAssetWizardOpen(true)} />;
      case 'Assess':
        return <DamageAssessmentScreen assets={assets} />;
      case 'Claims':
        return <ClaimsScreen onStartClaim={() => setIsClaimWizardOpen(true)} />;
      default:
        return <HomeScreen onStartClaim={() => setIsClaimWizardOpen(true)} onAddAsset={() => setIsAddAssetWizardOpen(true)} />;
    }
  };

  return (
    <div className="flex h-screen w-full font-sans">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Slab:wght@700&display=swap');
          .font-sans { font-family: 'Inter', sans-serif; }
          .font-slab { font-family: 'Roboto Slab', serif; }
          
          /* --- Custom Color Utilities --- */
          .bg-bgPrimary { background-color: ${COLORS.bgPrimary}; }
          .bg-bgSecondary { background-color: ${COLORS.bgSecondary}; }
          .bg-bgTertiary { background-color: ${COLORS.bgTertiary}; }
          
          .text-textPrimary { color: ${COLORS.textPrimary}; }
          .text-textSecondary { color: ${COLORS.textSecondary}; }
          
          .border-border { border-color: ${COLORS.border}; }

          .neon-lime-text { color: ${COLORS.primary}; }
          .neon-lime-bg { background-color: ${COLORS.primary}; }
          .accent-blue-text { color: ${COLORS.accent}; }
          .accent-blue-bg { background-color: ${COLORS.accent}; }
          .danger-red-text { color: ${COLORS.danger}; }
          .danger-red-bg { background-color: ${COLORS.danger}; }

          /* --- Other Styles --- */
          .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -2px rgba(0,0,0,0.15); }
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: ${COLORS.bgSecondary}; }
          ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #555; }
        `}
      </style>
      
      <div className="bg-bgPrimary text-textPrimary w-full h-full flex overflow-hidden">
        {!isMobile && <Sidebar activeScreen={view.screen} setActiveScreen={(s) => handleNavigate(s)} isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />}
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} onProfileClick={() => setIsProfileOpen(true)} isMobile={isMobile} />
          {showDemoNotice && (
              <div className="bg-amber-900/20 border-b border-amber-600/40 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                      <Sparkles size={16} className="text-amber-500" />
                      <span>Demo Mode: AI features are using sample data. Add your Gemini API key for real analysis.</span>
                  </div>
                  <button onClick={() => setShowDemoNotice(false)} className="text-textSecondary hover:text-white">
                      <X size={16} />
                  </button>
              </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {renderScreen()}
          </div>
        </main>

        {isMobile && <BottomNav activeScreen={view.screen} setActiveScreen={(s) => handleNavigate(s)} />}

        {isClaimWizardOpen && <ClaimWizard onClose={() => setIsClaimWizardOpen(false)} onContextSet={setActiveClaimContext} />}
        {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}
        {isAddAssetWizardOpen && <AddAssetWizard onClose={() => setIsAddAssetWizardOpen(false)} onAddAsset={handleAddAsset} onFinish={(id) => { setIsAddAssetWizardOpen(false); handleNavigate('Assets', id); }} />}
        {isInventoryModalOpen && <AddInventoryItemModal assetId={view.assetId} onClose={() => setIsInventoryModalOpen(false)} onAddItem={handleAddItemToInventory} />}
        
        <AiChatButton onClick={() => setIsAiChatOpen(true)} />
        {isAiChatOpen && <AiChatPanel onClose={() => setIsAiChatOpen(false)} isMobile={isMobile} context={activeClaimContext} />}
      </div>
    </div>
  );
}
