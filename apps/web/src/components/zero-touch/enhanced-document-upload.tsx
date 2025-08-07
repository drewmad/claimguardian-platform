"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Brain,
  Sparkles,
  Clock,
  Tag,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface UploadedDocument {
  id: string;
  fileName: string;
  size: number;
  type: string;
  status:
    | "uploading"
    | "processing"
    | "pending_review"
    | "auto_confirmed"
    | "failed";
  progress: number;
  aiSuggestions?: {
    name: string;
    category: string;
    tags: string[];
    confidence: number;
    metadata: any;
  };
}

export function EnhancedDocumentUpload({
  propertyId,
  claimId,
  onDocumentProcessed,
}: {
  propertyId?: string;
  claimId?: string;
  onDocumentProcessed?: (document: any) => void;
}) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const supabase = createClient();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsProcessing(true);

      for (const file of acceptedFiles) {
        const docId = crypto.randomUUID();

        // Add document to state immediately
        const newDoc: UploadedDocument = {
          id: docId,
          fileName: file.name,
          size: file.size,
          type: file.type,
          status: "uploading",
          progress: 0,
        };

        setDocuments((prev) => [...prev, newDoc]);

        try {
          // Mock AI processing for demo
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === docId ? { ...d, status: "processing", progress: 25 } : d,
            ),
          );

          // Simulate processing time
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Mock AI results
          const mockResult = {
            status: "pending_review",
            suggested_name: `${file.name.split(".")[0]}_analyzed.${file.name.split(".").pop()}`,
            suggested_category: "insurance_document",
            confidence: 0.85,
            metadata: {
              "Document Type": "Insurance Policy",
              "Date Found": new Date().toLocaleDateString(),
              "File Size": `${(file.size / 1024).toFixed(1)} KB`,
            },
          };

          setDocuments((prev) =>
            prev.map((d) =>
              d.id === docId
                ? {
                    ...d,
                    status:
                      mockResult.status === "auto_confirmed"
                        ? "auto_confirmed"
                        : "pending_review",
                    progress: 100,
                    aiSuggestions: {
                      name: mockResult.suggested_name,
                      category: mockResult.suggested_category,
                      tags: [],
                      confidence: mockResult.confidence,
                      metadata: mockResult.metadata,
                    },
                  }
                : d,
            ),
          );

          toast.success(`Document processed: ${mockResult.suggested_name}`, {
            description: `Confidence: ${Math.round(mockResult.confidence * 100)}%`,
          });

          onDocumentProcessed?.(mockResult);
        } catch (error) {
          console.error("Document processing error:", error);

          setDocuments((prev) =>
            prev.map((d) =>
              d.id === docId ? { ...d, status: "failed", progress: 0 } : d,
            ),
          );

          toast.error(`Failed to process ${file.name}`);
        }
      }

      setIsProcessing(false);
    },
    [propertyId, claimId, onDocumentProcessed],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".tiff"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
  });

  const getStatusIcon = (status: UploadedDocument["status"]) => {
    switch (status) {
      case "uploading":
        return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />;
      case "processing":
        return <Brain className="w-4 h-4 text-purple-500 animate-pulse" />;
      case "pending_review":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "auto_confirmed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadedDocument["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "processing":
        return "AI Processing...";
      case "pending_review":
        return "Ready for Review";
      case "auto_confirmed":
        return "Auto-Confirmed";
      case "failed":
        return "Processing Failed";
    }
  };

  const getStatusColor = (status: UploadedDocument["status"]) => {
    switch (status) {
      case "uploading":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "processing":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "pending_review":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "auto_confirmed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <CardTitle className="text-white text-lg">
              Zero-Touch Document Upload
            </CardTitle>
            <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          <p className="text-gray-400 text-sm">
            Upload any document - AI will automatically name it, extract
            metadata, and create smart tags
          </p>
        </CardHeader>

        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-purple-500 bg-purple-500/5"
                : "border-gray-600 hover:border-gray-500"
            }`}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-gray-700 rounded-full">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>

              {isDragActive ? (
                <div className="space-y-2">
                  <p className="text-purple-400 font-medium">
                    Drop files here to start AI processing
                  </p>
                  <p className="text-gray-500 text-sm">
                    Supported: PDF, Images, Word docs, Text files
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-300 font-medium">
                    Drag & drop documents or click to browse
                  </p>
                  <p className="text-gray-500 text-sm">
                    AI will automatically analyze and organize your documents
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>Max 50MB per file</span>
                    <span>•</span>
                    <span>Up to 10 files at once</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {documents.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Processing Status
              {isProcessing && (
                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  <div className="animate-pulse">Processing...</div>
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="space-y-3">
                {/* Document Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-700 rounded">
                      {doc.type.startsWith("image/") ? (
                        <Image className="w-4 h-4 text-gray-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-400" />
                      )}
                    </div>

                    <div>
                      <p className="text-white font-medium truncate max-w-xs">
                        {doc.fileName}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {(doc.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>

                  <Badge className={getStatusColor(doc.status)}>
                    {getStatusIcon(doc.status)}
                    {getStatusText(doc.status)}
                  </Badge>
                </div>

                {/* Progress Bar */}
                {doc.status !== "failed" && doc.status !== "auto_confirmed" && (
                  <Progress value={doc.progress} className="h-2" />
                )}

                {/* AI Suggestions */}
                {doc.aiSuggestions && (
                  <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-purple-400">
                        AI Analysis Results
                      </span>
                      <Badge className="bg-green-500/10 text-green-500 text-xs">
                        {Math.round(doc.aiSuggestions.confidence * 100)}%
                        confident
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Suggested Name:</span>
                        <p className="text-white font-medium mt-1">
                          {doc.aiSuggestions.name}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-400">Category:</span>
                        <Badge className="mt-1 bg-blue-500/10 text-blue-500">
                          {doc.aiSuggestions.category}
                        </Badge>
                      </div>
                    </div>

                    {/* Extracted Metadata */}
                    {doc.aiSuggestions.metadata &&
                      Object.keys(doc.aiSuggestions.metadata).length > 0 && (
                        <div>
                          <span className="text-gray-400 text-sm">
                            Extracted Information:
                          </span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(doc.aiSuggestions.metadata)
                              .filter(
                                ([key, value]) => value && String(value).trim(),
                              )
                              .slice(0, 6)
                              .map(([key, value]) => (
                                <Badge
                                  key={key}
                                  className="bg-gray-700 text-gray-300 text-xs"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  {key}: {String(value).substring(0, 20)}
                                  {String(value).length > 20 ? "..." : ""}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-500 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-white font-medium">
                How Zero-Touch Processing Works
              </h4>
              <div className="text-gray-400 text-sm space-y-1">
                <p>
                  1. <strong>Upload:</strong> Drag & drop any document
                </p>
                <p>
                  2. <strong>AI Analysis:</strong> Multiple AI models extract
                  metadata simultaneously
                </p>
                <p>
                  3. <strong>Smart Naming:</strong> Generates descriptive
                  filenames with dates, amounts, entities
                </p>
                <p>
                  4. <strong>Auto-Tagging:</strong> Creates intelligent tags for
                  easy searching
                </p>
                <p>
                  5. <strong>Review/Confirm:</strong> High confidence documents
                  auto-confirm, others need review
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
