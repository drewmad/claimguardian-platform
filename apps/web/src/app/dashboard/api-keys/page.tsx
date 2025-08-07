/**
 * @fileMetadata
 * @purpose "User dashboard for managing personal API keys and viewing usage statistics"
 * @dependencies ["@/components","react","sonner"]
 * @owner user-dashboard-team
 * @status stable
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  createAPIKey,
  listAPIKeys,
  revokeAPIKey,
  getAPIUsageStats,
} from "@/actions/api-keys";

// Helper function to format dates
const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString();
};

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  last_used_at?: Date;
  usage_count: number;
  created_at: Date;
  expires_at?: Date;
}

interface APIUsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time: number;
  most_used_endpoints: Array<{ endpoint: string; count: number }>;
  daily_usage: Array<{ date: string; count: number }>;
}

const AVAILABLE_PERMISSIONS = [
  {
    id: "properties.read",
    label: "Read Properties",
    description: "View property information",
  },
  {
    id: "properties.write",
    label: "Write Properties",
    description: "Create and update properties",
  },
  {
    id: "claims.read",
    label: "Read Claims",
    description: "View claim information",
  },
  {
    id: "claims.write",
    label: "Write Claims",
    description: "Create and update claims",
  },
  {
    id: "documentation.read",
    label: "Read Documentation",
    description: "View field documentation",
  },
  {
    id: "documentation.write",
    label: "Write Documentation",
    description: "Create field documentation",
  },
  {
    id: "ai.read",
    label: "AI Read Access",
    description: "Access AI analysis results",
  },
  {
    id: "ai.write",
    label: "AI Write Access",
    description: "Trigger AI analysis",
  },
];

export default function APIKeysPage() {
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [stats, setStats] = useState<APIUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Create key modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [newKeyResult, setNewKeyResult] = useState<{
    apiKey: APIKey;
    plainTextKey: string;
  } | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [keysResult, statsResult] = await Promise.all([
        listAPIKeys(),
        getAPIUsageStats(30),
      ]);

      if (keysResult.error) {
        toast.error(keysResult.error);
      } else {
        setAPIKeys(keysResult.data || []);
      }

      if (statsResult.error) {
        toast.error(statsResult.error);
      } else {
        setStats(statsResult.data);
      }
    } catch (error) {
      toast.error("Failed to load API key data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("API key name is required");
      return;
    }

    try {
      const result = await createAPIKey({
        name: newKeyName.trim(),
        permissions: selectedPermissions,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        setNewKeyResult(result.data);
        setNewKeyName("");
        setSelectedPermissions([]);
        toast.success("API key created successfully");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to create API key");
    }
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (
      !confirm(
        `Are you sure you want to revoke the API key "${keyName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const result = await revokeAPIKey(keyId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("API key revoked successfully");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to revoke API key");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">API Keys</h1>
          <p className="text-gray-400 mt-2">
            Manage your API keys for external integrations
          </p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for external integrations. You can set
                specific permissions for different endpoints.
              </DialogDescription>
            </DialogHeader>

            {newKeyResult ? (
              <div className="space-y-4">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    Your API key has been created successfully. Copy it now -
                    you won't be able to see it again.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showNewKey ? "text" : "password"}
                      value={newKeyResult.plainTextKey}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewKey(!showNewKey)}
                    >
                      {showNewKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(newKeyResult.plainTextKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewKeyResult(null);
                      setCreateModalOpen(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keyName">API Key Name</Label>
                  <Input
                    id="keyName"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="My API Key"
                  />
                </div>

                <div>
                  <Label>Permissions</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Select the permissions this API key should have. Leave empty
                    for full access.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AVAILABLE_PERMISSIONS.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start space-x-2"
                      >
                        <Checkbox
                          id={permission.id}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() =>
                            togglePermission(permission.id)
                          }
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={permission.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.label}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateKey}>Create API Key</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">
                    Total Requests
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.total_requests.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">
                    Success Rate
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.total_requests > 0
                      ? Math.round(
                          (stats.successful_requests / stats.total_requests) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">
                    Avg Response Time
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round(stats.avg_response_time)}ms
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">
                    Failed Requests
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {stats.failed_requests}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Keys Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Your API Keys ({apiKeys.length}/10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No API keys found</p>
              <p className="text-sm text-gray-500 mt-2">
                Create your first API key to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Key</TableHead>
                  <TableHead className="text-gray-300">Permissions</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Usage</TableHead>
                  <TableHead className="text-gray-300">Last Used</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium text-white">
                      {key.name}
                    </TableCell>
                    <TableCell className="text-gray-300 font-mono">
                      {key.key_prefix}...
                    </TableCell>
                    <TableCell>
                      {key.permissions.length === 0 ? (
                        <Badge variant="outline">Full Access</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {key.permissions.slice(0, 2).map((permission) => (
                            <Badge
                              key={permission}
                              variant="secondary"
                              className="text-xs"
                            >
                              {permission.split(".")[0]}
                            </Badge>
                          ))}
                          {key.permissions.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{key.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? "Active" : "Revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {key.usage_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {key.last_used_at
                        ? formatDate(key.last_used_at)
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {formatDate(key.created_at)}
                    </TableCell>
                    <TableCell>
                      {key.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeKey(key.id, key.name)}
                          className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Most Used Endpoints */}
      {stats && stats.most_used_endpoints.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Most Used Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.most_used_endpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="text-white font-mono text-sm">
                        {endpoint.endpoint}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{endpoint.count} requests</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
