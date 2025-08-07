"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  MessageSquare,
  Shield,
  DollarSign,
  AlertTriangle,
  Users,
  Calendar,
  Zap,
} from "lucide-react";

interface NotificationChannel {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

interface NotificationPreference {
  claimUpdates: NotificationChannel;
  securityAlerts: NotificationChannel;
  paymentReminders: NotificationChannel;
  weatherAlerts: NotificationChannel;
  communityAlerts: NotificationChannel;
  maintenanceReminders: NotificationChannel;
  policyChanges: NotificationChannel;
  marketInsights: NotificationChannel;
}

const defaultPreferences: NotificationPreference = {
  claimUpdates: { email: true, sms: true, push: true, inApp: true },
  securityAlerts: { email: true, sms: true, push: true, inApp: true },
  paymentReminders: { email: true, sms: false, push: true, inApp: true },
  weatherAlerts: { email: true, sms: true, push: true, inApp: true },
  communityAlerts: { email: false, sms: false, push: true, inApp: true },
  maintenanceReminders: { email: true, sms: false, push: true, inApp: true },
  policyChanges: { email: true, sms: false, push: true, inApp: true },
  marketInsights: { email: true, sms: false, push: false, inApp: true },
};

const notificationTypes = [
  {
    key: "claimUpdates",
    label: "Claim Updates",
    icon: Shield,
    description: "Updates about your insurance claims",
  },
  {
    key: "securityAlerts",
    label: "Security Alerts",
    icon: AlertTriangle,
    description: "Important security notifications",
  },
  {
    key: "paymentReminders",
    label: "Payment Reminders",
    icon: DollarSign,
    description: "Premium and payment notifications",
  },
  {
    key: "weatherAlerts",
    label: "Weather Alerts",
    icon: Zap,
    description: "Severe weather and disaster alerts",
  },
  {
    key: "communityAlerts",
    label: "Community Alerts",
    icon: Users,
    description: "Neighborhood and community updates",
  },
  {
    key: "maintenanceReminders",
    label: "Maintenance",
    icon: Calendar,
    description: "Home maintenance reminders",
  },
  {
    key: "policyChanges",
    label: "Policy Changes",
    icon: Bell,
    description: "Insurance policy updates",
  },
  {
    key: "marketInsights",
    label: "Market Insights",
    icon: MessageSquare,
    description: "Insurance market trends and tips",
  },
];

export function NotificationPreferences() {
  const [preferences, setPreferences] =
    useState<NotificationPreference>(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("notification_preferences")
        .eq("user_id", user.id)
        .single();

      if (data?.notification_preferences) {
        setPreferences(data.notification_preferences as NotificationPreference);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          notification_preferences: preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

      if (error) throw error;
      toast.success("Notification preferences saved");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (
    type: keyof NotificationPreference,
    channel: keyof NotificationChannel,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type][channel],
      },
    }));
  };

  const toggleAllChannels = (
    type: keyof NotificationPreference,
    enabled: boolean,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        email: enabled,
        sms: enabled,
        push: enabled,
        inApp: enabled,
      },
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications about your properties
            and claims
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="push">Push</TabsTrigger>
              <TabsTrigger value="inApp">In-App</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                const pref =
                  preferences[type.key as keyof NotificationPreference];
                const allEnabled =
                  pref.email && pref.sms && pref.push && pref.inApp;

                return (
                  <div key={type.key} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <Icon className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{type.label}</h4>
                            <p className="text-sm text-gray-500">
                              {type.description}
                            </p>
                          </div>
                          <Switch
                            checked={allEnabled}
                            onCheckedChange={(checked) =>
                              toggleAllChannels(
                                type.key as keyof NotificationPreference,
                                checked,
                              )
                            }
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-4 pt-2">
                          <Label className="flex items-center space-x-2">
                            <Switch
                              checked={pref.email}
                              onCheckedChange={() =>
                                toggleChannel(
                                  type.key as keyof NotificationPreference,
                                  "email",
                                )
                              }
                            />
                            <Mail className="h-4 w-4" />
                            <span className="text-xs">Email</span>
                          </Label>

                          <Label className="flex items-center space-x-2">
                            <Switch
                              checked={pref.sms}
                              onCheckedChange={() =>
                                toggleChannel(
                                  type.key as keyof NotificationPreference,
                                  "sms",
                                )
                              }
                            />
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-xs">SMS</span>
                          </Label>

                          <Label className="flex items-center space-x-2">
                            <Switch
                              checked={pref.push}
                              onCheckedChange={() =>
                                toggleChannel(
                                  type.key as keyof NotificationPreference,
                                  "push",
                                )
                              }
                            />
                            <Bell className="h-4 w-4" />
                            <span className="text-xs">Push</span>
                          </Label>

                          <Label className="flex items-center space-x-2">
                            <Switch
                              checked={pref.inApp}
                              onCheckedChange={() =>
                                toggleChannel(
                                  type.key as keyof NotificationPreference,
                                  "inApp",
                                )
                              }
                            />
                            <Bell className="h-4 w-4" />
                            <span className="text-xs">In-App</span>
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {["email", "sms", "push", "inApp"].map((channel) => (
              <TabsContent
                key={channel}
                value={channel}
                className="space-y-4 mt-6"
              >
                {notificationTypes.map((type) => {
                  const pref =
                    preferences[type.key as keyof NotificationPreference];
                  const Icon = type.icon;

                  return (
                    <div
                      key={type.key}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-sm text-gray-500">
                            {type.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={pref[channel as keyof NotificationChannel]}
                        onCheckedChange={() =>
                          toggleChannel(
                            type.key as keyof NotificationPreference,
                            channel as keyof NotificationChannel,
                          )
                        }
                      />
                    </div>
                  );
                })}
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button onClick={savePreferences} disabled={saving}>
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Set times when you don't want to receive non-urgent notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
              <Switch id="quiet-hours" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiet-start">Start Time</Label>
                <input
                  type="time"
                  id="quiet-start"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  defaultValue="22:00"
                />
              </div>
              <div>
                <Label htmlFor="quiet-end">End Time</Label>
                <input
                  type="time"
                  id="quiet-end"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  defaultValue="08:00"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
