/**
 * @fileMetadata
 * @purpose Displays user profile information and allows management of settings and preferences.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/mock-data"]
 * @exports ["ProfileModal"]
 * @complexity medium
 * @tags ["modal", "profile", "settings", "user"]
 * @status active
 */
/**
 * @fileMetadata
 * @purpose Displays user profile information and allows management of settings and preferences.
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/lib/mock-data"]
 * @exports ["ProfileModal"]
 * @complexity medium
 * @tags ["modal", "profile", "settings", "user"]
 * @status active
 */
import { useState } from 'react';
import Image from 'next/image';
import { X, Mail, Phone, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';
import { MOCK_DATA } from '@/lib/mock-data';

const ProfileModal = ({ onClose }) => {
    const [prefs, setPrefs] = useState({ email: true, push: true, biometric: false });
    const togglePref = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-bgSecondary w-full max-w-md rounded-lg shadow-lg flex flex-col m-4 max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
                    <h3 className="font-slab text-xl font-bold">Profile & Settings</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-bgTertiary"><X size={20}/></button>
                </header>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="flex items-center gap-6">
                        <Image src={MOCK_DATA.user.avatar} alt="User Avatar" width={80} height={80} className="rounded-full"/>
                        <div>
                            <h3 className="text-2xl font-bold">{MOCK_DATA.user.name}</h3>
                            <p className="text-textSecondary">Member Since {MOCK_DATA.user.memberSince}</p>
                        </div>
                    </div>
                    <div className="bg-bgTertiary p-4 rounded-lg space-y-3">
                        <h4 className="font-slab text-lg font-bold mb-2">Contact Information</h4>
                        <div className="flex items-center gap-3 text-sm"><Mail size={16} className="text-textSecondary"/><span>{MOCK_DATA.user.email}</span></div>
                        <div className="flex items-center gap-3 text-sm"><Phone size={16} className="text-textSecondary"/><span>{MOCK_DATA.user.phone}</span></div>
                        <div className="flex items-center gap-3 text-sm"><MapPin size={16} className="text-textSecondary"/><span>{MOCK_DATA.user.address}</span></div>
                    </div>
                    <div className="bg-bgTertiary p-4 rounded-lg space-y-3">
                        <h4 className="font-slab text-lg font-bold mb-2">Contact Preferences</h4>
                        <div className="flex justify-between items-center"><span className="text-sm">Email Notifications</span><button onClick={() => togglePref('email')}>{prefs.email ? <ToggleRight size={24} className="text-accent"/> : <ToggleLeft size={24} className="text-textSecondary"/>}</button></div>
                        <div className="flex justify-between items-center"><span className="text-sm">Push Notifications</span><button onClick={() => togglePref('push')}>{prefs.push ? <ToggleRight size={24} className="text-accent"/> : <ToggleLeft size={24} className="text-textSecondary"/>}</button></div>
                    </div>
                     <div className="bg-bgTertiary p-4 rounded-lg space-y-3">
                        <h4 className="font-slab text-lg font-bold mb-2">Security</h4>
                        <div className="flex justify-between items-center"><span className="text-sm">Biometric Unlock</span><button onClick={() => togglePref('biometric')}>{prefs.biometric ? <ToggleRight size={24} className="text-accent"/> : <ToggleLeft size={24} className="text-textSecondary"/>}</button></div>
                        <button className="w-full text-center text-sm accent-blue-text font-semibold p-2 rounded-lg hover:bg-border">Change Password</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
