/**
 * @fileMetadata
 * @purpose "Comprehensive settings modal for user preferences and account management"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react", "@/stores/modal-store", "@/components/auth/auth-provider"]
 * @exports ["SettingsModal"]
 * @complexity high
 * @tags ["modal", "settings", "preferences", "account"]
 * @status stable
 */
"use client";

import {
  X,
  User,
  Bell,
  Shield,
  Key,
  Palette,
  Globe,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Volume2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";

import { useAuth } from "@/components/auth/auth-provider";
import { useModalStore } from "@/stores/modal-store";
import { createClient } from "@/lib/supabase/client";

type SettingsTab =
  | "profile"
  | "notifications"
  | "appearance"
  | "security"
  | "billing"
  | "help";

interface UserPreferences {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  soundEnabled: boolean;
  language: "en" | "es";
  timezone: string;
}

export function SettingsModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    bio: "",
  });

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: "dark",
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    soundEnabled: true,
    language: "en",
    timezone: "America/New_York",
  });

  // Security state
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    gemini: "",
  });

  useEffect(() => {
    if (activeModal === "settings") {
      loadUserSettings();
    }
  }, [activeModal]);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  if (activeModal !== "settings") return null;

  const loadUserSettings = async () => {
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (profile) {
        setProfile({
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          email: user?.email || "",
          phone: profile.phone || "",
          bio: profile.bio || "",
        });
      }

      // Load preferences from localStorage for now
      const savedPrefs = localStorage.getItem("userPreferences");
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    } catch (error) {
      logger.error("Failed to load user settings", {}, error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.from("user_profiles").upsert({
        user_id: user?.id,
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        bio: profile.bio,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSaveSuccess(true);
      logger.track("profile_updated", { userId: user?.id });
    } catch (error) {
      setError("Failed to save profile");
      logger.error("Profile save failed", {}, error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
    setSaveSuccess(true);
    logger.track(
      "preferences_updated",
      preferences as unknown as Record<string, unknown>,
    );
  };

  const handleSignOut = async () => {
    closeModal();
    await signOut();
  };

  const tabs = [
    { id: "profile" as SettingsTab, label: "Profile", icon: User },
    { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
    { id: "appearance" as SettingsTab, label: "Appearance", icon: Palette },
    { id: "security" as SettingsTab, label: "Security", icon: Shield },
    { id: "billing" as SettingsTab, label: "Billing", icon: CreditCard },
    { id: "help" as SettingsTab, label: "Help", icon: HelpCircle },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">
                      Email Notifications
                    </p>
                    <p className="text-xs text-gray-400">
                      Receive updates via email
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      emailNotifications: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">Push Notifications</p>
                    <p className="text-xs text-gray-400">
                      Get mobile app notifications
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      pushNotifications: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">Sound Effects</p>
                    <p className="text-xs text-gray-400">
                      Play sounds for notifications
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.soundEnabled}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      soundEnabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                />
              </label>
            </div>

            <button
              onClick={handleSavePreferences}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light" as const, icon: Sun, label: "Light" },
                  { value: "dark" as const, icon: Moon, label: "Dark" },
                  { value: "system" as const, icon: Monitor, label: "System" },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() =>
                      setPreferences({ ...preferences, theme: value })
                    }
                    className={`p-3 rounded-lg border transition-all ${
                      preferences.theme === value
                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                        : "bg-slate-700/30 border-slate-600 text-gray-400 hover:bg-slate-700/50"
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-xs">{label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Language
              </label>
              <select
                value={preferences.language}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    language: e.target.value as "en" | "es",
                  })
                }
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timezone
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) =>
                  setPreferences({ ...preferences, timezone: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            <button
              onClick={handleSavePreferences}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Appearance Settings
            </button>
          </div>
        );

      case "security":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h3 className="font-medium text-white mb-3">API Keys</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    OpenAI API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKeys.openai}
                      onChange={(e) =>
                        setApiKeys({ ...apiKeys, openai: e.target.value })
                      }
                      className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-sm"
                      placeholder="sk-..."
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Google Gemini API Key
                  </label>
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKeys.gemini}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, gemini: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-sm"
                    placeholder="AIza..."
                  />
                </div>
              </div>
            </div>

            <button className="w-full p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <span className="text-white">Change Password</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button className="w-full p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-white">Two-Factor Authentication</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h3 className="font-medium text-white mb-2">Current Plan</h3>
              <p className="text-2xl font-bold text-blue-400">Free Tier</p>
              <p className="text-sm text-gray-400 mt-1">
                Basic features included
              </p>
            </div>

            <button
              onClick={() => {
                closeModal();
                // Navigate to pricing
              }}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg"
            >
              Upgrade to Pro
            </button>

            <div className="space-y-2">
              <button className="w-full p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left">
                <p className="text-white">Payment Methods</p>
                <p className="text-xs text-gray-400">
                  Manage your payment information
                </p>
              </button>

              <button className="w-full p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left">
                <p className="text-white">Billing History</p>
                <p className="text-xs text-gray-400">
                  View past invoices and receipts
                </p>
              </button>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <a
                href="/docs"
                target="_blank"
                className="block p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg"
              >
                <p className="text-white">Documentation</p>
                <p className="text-xs text-gray-400">
                  Learn how to use ClaimGuardian
                </p>
              </a>

              <a
                href="/faq"
                target="_blank"
                className="block p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg"
              >
                <p className="text-white">FAQ</p>
                <p className="text-xs text-gray-400">
                  Frequently asked questions
                </p>
              </a>

              <button className="w-full p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-left">
                <p className="text-white">Contact Support</p>
                <p className="text-xs text-gray-400">Get help from our team</p>
              </button>

              <div className="p-3 bg-slate-700/30 rounded-lg">
                <p className="text-white">Version</p>
                <p className="text-xs text-gray-400">ClaimGuardian v1.0.0</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeModal}
      />

      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl w-full max-w-2xl max-h-[80vh] shadow-2xl overflow-hidden flex">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 pointer-events-none" />

        {/* Sidebar */}
        <div className="w-56 bg-slate-900/50 border-r border-slate-700 p-4">
          <h2 className="text-xl font-bold text-white mb-4">Settings</h2>

          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === id
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-gray-400 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-700">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative p-6 overflow-y-auto">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm">
                Settings saved successfully!
              </p>
            </div>
          )}

          {renderContent()}
        </div>
      </div>
    </div>
  );
}
