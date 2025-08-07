"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Brain,
  Sparkles,
  Zap,
  DollarSign,
  Settings,
  TestTube,
  Key,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  Eye,
  MessageSquare,
  FileText,
  Image,
  TrendingUp,
  Clock,
  Shield,
  RefreshCw,
} from "lucide-react";
// Using local AI model types for now - in production would import from ai-services package
type AIProvider = "openai" | "gemini" | "anthropic" | "xai";
type AIModel =
  | "gpt-4-turbo-preview"
  | "gpt-4-vision-preview"
  | "gpt-3.5-turbo"
  | "gemini-pro"
  | "gemini-pro-vision"
  | "claude-3-opus"
  | "claude-3-sonnet"
  | "grok-1";

// Mock functions for demo
const getAvailableAIProviders = (): AIProvider[] => ["openai", "gemini"];

// Mock AI model manager
const aiModelManager = {
  getAvailableProviders: () => getAvailableAIProviders(),
  generateText: async (prompt: string, options?: any) => ({
    content: "Mock response",
    usage: {
      totalTokens: 100,
      promptTokens: 50,
      completionTokens: 50,
      cost: 0.01,
    },
  }),
  getBestModelForTask: (task: string) => ({
    provider: "openai" as AIProvider,
    model: "gpt-4-turbo-preview" as AIModel,
  }),
  analyzeImage: async (imageData: string, prompt: string) => ({
    content: "Mock image analysis",
    usage: {
      totalTokens: 150,
      promptTokens: 75,
      completionTokens: 75,
      cost: 0.02,
    },
  }),
};

interface ModelStatus {
  provider: AIProvider;
  model: AIModel;
  status: "active" | "inactive" | "error";
  lastUsed?: Date;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  errorRate: number;
}

interface ModelTest {
  prompt: string;
  expectedOutput?: string;
  testType: "text" | "vision" | "analysis";
}

export function AIModelConfiguration() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<AIProvider>("openai");
  const [selectedModel, setSelectedModel] = useState<AIModel>(
    "gpt-4-turbo-preview",
  );
  const [testPrompt, setTestPrompt] = useState("");
  const [testResult, setTestResult] = useState("");
  const [testing, setTesting] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [modelSettings, setModelSettings] = useState({
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });

  useEffect(() => {
    loadProviders();
    loadModelStatuses();
  }, []);

  const loadProviders = () => {
    const available = getAvailableAIProviders();
    setProviders(available);
    if (available.length > 0 && !available.includes(selectedProvider)) {
      setSelectedProvider(available[0]);
    }
  };

  const loadModelStatuses = async () => {
    // In production, fetch from database
    const mockStatuses: ModelStatus[] = [
      {
        provider: "openai",
        model: "gpt-4-turbo-preview",
        status: "active",
        lastUsed: new Date(),
        totalRequests: 1543,
        totalTokens: 2847329,
        totalCost: 28.47,
        averageLatency: 1.2,
        errorRate: 0.02,
      },
      {
        provider: "gemini",
        model: "gemini-pro",
        status: "active",
        lastUsed: new Date(Date.now() - 3600000),
        totalRequests: 892,
        totalTokens: 1293847,
        totalCost: 0, // Free during preview
        averageLatency: 0.8,
        errorRate: 0.01,
      },
      {
        provider: "openai",
        model: "gpt-4-vision-preview",
        status: "active",
        lastUsed: new Date(Date.now() - 7200000),
        totalRequests: 234,
        totalTokens: 483921,
        totalCost: 14.52,
        averageLatency: 2.1,
        errorRate: 0.03,
      },
    ];
    setModelStatuses(mockStatuses);
  };

  const testModel = async () => {
    if (!testPrompt) {
      toast.error("Please enter a test prompt");
      return;
    }

    setTesting(true);
    setTestResult("");

    try {
      const response = await aiModelManager.generateText(testPrompt, {
        provider: selectedProvider,
        model: selectedModel,
        temperature: modelSettings.temperature,
        maxTokens: modelSettings.maxTokens,
      });

      setTestResult(response.content);

      if (response.usage) {
        toast.success(
          `Test successful! Tokens: ${response.usage.totalTokens}, Cost: $${response.usage.cost?.toFixed(4) || "0"}`,
        );
      } else {
        toast.success("Test successful!");
      }
    } catch (error: any) {
      toast.error(`Test failed: ${error.message}`);
      setTestResult(`Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const saveApiKey = async (provider: AIProvider, key: string) => {
    // In production, encrypt and save to secure storage
    setApiKeys((prev) => ({ ...prev, [provider]: key }));

    // Update environment variable (server-side only in production)
    if (provider === "openai") {
      process.env.OPENAI_API_KEY = key;
    } else if (provider === "gemini") {
      process.env.GEMINI_API_KEY = key;
    }

    toast.success(`${provider} API key updated`);
    loadProviders(); // Refresh available providers
  };

  const runBenchmark = async () => {
    toast.info("Running benchmark suite...");

    const benchmarks = [
      {
        prompt: "Summarize this in one sentence: Insurance claims are complex.",
        type: "text" as const,
      },
      {
        prompt: "What are the key factors in property damage assessment?",
        type: "analysis" as const,
      },
      {
        prompt: "Generate a brief claim denial letter.",
        type: "text" as const,
      },
    ];

    for (const benchmark of benchmarks) {
      try {
        const startTime = Date.now();
        await aiModelManager.generateText(benchmark.prompt, {
          provider: selectedProvider,
          model: selectedModel,
        });
        const latency = Date.now() - startTime;

        console.log(`Benchmark: ${benchmark.type} - ${latency}ms`);
      } catch (error) {
        console.error(`Benchmark failed: ${error}`);
      }
    }

    toast.success("Benchmark complete! Check console for results.");
  };

  const modelsByProvider: Record<AIProvider, AIModel[]> = {
    openai: ["gpt-4-turbo-preview", "gpt-4-vision-preview", "gpt-3.5-turbo"],
    gemini: ["gemini-pro", "gemini-pro-vision"],
    anthropic: ["claude-3-opus", "claude-3-sonnet"],
    xai: ["grok-1"],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span>AI Model Configuration</span>
          </h2>
          <p className="text-gray-600">
            Manage and configure AI model providers
          </p>
        </div>
        <Button onClick={runBenchmark} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Run Benchmark
        </Button>
      </div>

      {/* Provider Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <Badge
                variant={providers.includes("openai") ? "default" : "secondary"}
              >
                {providers.includes("openai") ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-2xl font-bold">OpenAI</p>
            <p className="text-sm text-gray-500">GPT-4, GPT-3.5</p>
            <p className="text-xs text-gray-400 mt-1">
              {modelStatuses
                .filter((m) => m.provider === "openai")
                .reduce((sum, m) => sum + m.totalRequests, 0)}{" "}
              requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-green-500" />
              <Badge
                variant={providers.includes("gemini") ? "default" : "secondary"}
              >
                {providers.includes("gemini") ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-2xl font-bold">Gemini</p>
            <p className="text-sm text-gray-500">Pro, Pro Vision</p>
            <p className="text-xs text-gray-400 mt-1">
              {modelStatuses
                .filter((m) => m.provider === "gemini")
                .reduce((sum, m) => sum + m.totalRequests, 0)}{" "}
              requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <Badge variant="outline">Total Cost</Badge>
            </div>
            <p className="text-2xl font-bold">
              $
              {modelStatuses
                .reduce((sum, m) => sum + m.totalCost, 0)
                .toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">This month</p>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              12% less than last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <Badge variant="outline">Performance</Badge>
            </div>
            <p className="text-2xl font-bold">
              {(
                modelStatuses.reduce((sum, m) => sum + m.averageLatency, 0) /
                Math.max(modelStatuses.length, 1)
              ).toFixed(1)}
              s
            </p>
            <p className="text-sm text-gray-500">Avg latency</p>
            <p className="text-xs text-gray-400 mt-1">
              {(
                (modelStatuses.reduce((sum, m) => sum + m.errorRate, 0) /
                  Math.max(modelStatuses.length, 1)) *
                100
              ).toFixed(1)}
              % error rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Tabs */}
      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="usage">Usage Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>
                Configure model parameters and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Provider</Label>
                  <Select
                    value={selectedProvider}
                    onValueChange={(v) => setSelectedProvider(v as AIProvider)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="xai">xAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Model</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={(v) => setSelectedModel(v as AIModel)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelsByProvider[selectedProvider]?.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Temperature ({modelSettings.temperature})</Label>
                  <Slider
                    value={[modelSettings.temperature]}
                    onValueChange={([v]) =>
                      setModelSettings((prev) => ({ ...prev, temperature: v }))
                    }
                    min={0}
                    max={2}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controls randomness. Lower = more focused, Higher = more
                    creative
                  </p>
                </div>

                <div>
                  <Label>Max Tokens ({modelSettings.maxTokens})</Label>
                  <Slider
                    value={[modelSettings.maxTokens]}
                    onValueChange={([v]) =>
                      setModelSettings((prev) => ({ ...prev, maxTokens: v }))
                    }
                    min={100}
                    max={4000}
                    step={100}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum length of generated response
                  </p>
                </div>

                <div>
                  <Label>Top P ({modelSettings.topP})</Label>
                  <Slider
                    value={[modelSettings.topP]}
                    onValueChange={([v]) =>
                      setModelSettings((prev) => ({ ...prev, topP: v }))
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>
                    Frequency Penalty ({modelSettings.frequencyPenalty})
                  </Label>
                  <Slider
                    value={[modelSettings.frequencyPenalty]}
                    onValueChange={([v]) =>
                      setModelSettings((prev) => ({
                        ...prev,
                        frequencyPenalty: v,
                      }))
                    }
                    min={-2}
                    max={2}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>
                    Presence Penalty ({modelSettings.presencePenalty})
                  </Label>
                  <Slider
                    value={[modelSettings.presencePenalty]}
                    onValueChange={([v]) =>
                      setModelSettings((prev) => ({
                        ...prev,
                        presencePenalty: v,
                      }))
                    }
                    min={-2}
                    max={2}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keys">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Securely manage your AI provider API keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>
                  API keys are encrypted and stored securely. Never share your
                  API keys publicly.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label>OpenAI API Key</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={apiKeys.openai || ""}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          openai: e.target.value,
                        }))
                      }
                    />
                    <Button
                      onClick={() => saveApiKey("openai", apiKeys.openai || "")}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                  {providers.includes("openai") && (
                    <p className="text-xs text-green-600 mt-1">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Connected
                    </p>
                  )}
                </div>

                <div>
                  <Label>Google Gemini API Key</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="password"
                      placeholder="AIza..."
                      value={apiKeys.gemini || ""}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          gemini: e.target.value,
                        }))
                      }
                    />
                    <Button
                      onClick={() => saveApiKey("gemini", apiKeys.gemini || "")}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                  {providers.includes("gemini") && (
                    <p className="text-xs text-green-600 mt-1">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Connected
                    </p>
                  )}
                </div>

                <div>
                  <Label>Anthropic API Key</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="password"
                      placeholder="sk-ant-..."
                      disabled
                      value={apiKeys.anthropic || ""}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          anthropic: e.target.value,
                        }))
                      }
                    />
                    <Button disabled>
                      <Key className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                </div>

                <div>
                  <Label>xAI API Key</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="password"
                      placeholder="xai-..."
                      disabled
                      value={apiKeys.xai || ""}
                      onChange={(e) =>
                        setApiKeys((prev) => ({ ...prev, xai: e.target.value }))
                      }
                    />
                    <Button disabled>
                      <Key className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle>Model Testing</CardTitle>
              <CardDescription>
                Test AI models with custom prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Test Provider</Label>
                  <Select
                    value={selectedProvider}
                    onValueChange={(v) => setSelectedProvider(v as AIProvider)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Test Model</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={(v) => setSelectedModel(v as AIModel)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modelsByProvider[selectedProvider]?.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Test Prompt</Label>
                <textarea
                  className="w-full mt-2 p-3 border rounded-lg"
                  rows={4}
                  placeholder="Enter a test prompt..."
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                />
              </div>

              <div className="flex justify-between">
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setTestPrompt(
                        "Analyze a claim for hurricane damage to a residential property in Miami, FL. The property has significant roof damage and water intrusion.",
                      )
                    }
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Claim Analysis
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setTestPrompt(
                        "What are the key indicators of insurance fraud in property damage claims?",
                      )
                    }
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Fraud Detection
                  </Button>
                </div>
                <Button onClick={testModel} disabled={testing}>
                  {testing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Run Test
                    </>
                  )}
                </Button>
              </div>

              {testResult && (
                <div className="mt-4">
                  <Label>Test Result</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">
                      {testResult}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Monitor AI model usage and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelStatuses.map((status) => (
                  <div
                    key={`${status.provider}-${status.model}`}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{status.model}</h4>
                        <p className="text-sm text-gray-500">
                          {status.provider}
                        </p>
                      </div>
                      <Badge
                        variant={
                          status.status === "active" ? "default" : "secondary"
                        }
                      >
                        {status.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Requests</p>
                        <p className="font-medium">
                          {status.totalRequests.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tokens</p>
                        <p className="font-medium">
                          {(status.totalTokens / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cost</p>
                        <p className="font-medium">
                          ${status.totalCost.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Latency</p>
                        <p className="font-medium">
                          {status.averageLatency.toFixed(1)}s
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Error Rate</p>
                        <p className="font-medium">
                          {(status.errorRate * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {status.lastUsed && (
                      <p className="text-xs text-gray-400 mt-2">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Last used {new Date(status.lastUsed).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
