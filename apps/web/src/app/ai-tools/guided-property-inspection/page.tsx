/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
"use client";

import {
  Camera,
  Home,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ListChecks,
  FileText,
  Clock,
  Target,
  Zap,
  Info,
  Play,
  Pause,
  SkipForward,
  ChevronLeft,
  Flag,
  MessageSquare,
  Volume2,
  VolumeX,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { CameraCapture } from "@/components/camera/camera-capture";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

interface InspectionRoom {
  id: string;
  name: string;
  icon: React.ElementType;
  areas: InspectionArea[];
  status: "pending" | "in-progress" | "completed";
  issues: number;
  photos: number;
}

interface InspectionArea {
  id: string;
  name: string;
  checkpoints: InspectionCheckpoint[];
  notes?: string;
  photos?: string[];
}

interface InspectionCheckpoint {
  id: string;
  item: string;
  description: string;
  condition?: "good" | "fair" | "poor" | "critical";
  notes?: string;
  photo?: string;
  priority?: "low" | "medium" | "high" | "urgent";
}

interface InspectionReport {
  id: string;
  propertyAddress: string;
  inspectionDate: Date;
  inspector: string;
  totalIssues: number;
  criticalIssues: number;
  rooms: InspectionRoom[];
  recommendations: string[];
  estimatedCosts: {
    immediate: number;
    shortTerm: number;
    longTerm: number;
  };
}

export default function GuidedPropertyInspectionPage() {
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [issueCount, setIssueCount] = useState(0);

  const [rooms, setRooms] = useState<InspectionRoom[]>([
    {
      id: "1",
      name: "Exterior",
      icon: Home,
      status: "pending",
      issues: 0,
      photos: 0,
      areas: [
        {
          id: "roof",
          name: "Roof & Gutters",
          checkpoints: [
            {
              id: "r1",
              item: "Shingles/Tiles",
              description: "Check for missing, damaged, or loose shingles",
            },
            {
              id: "r2",
              item: "Flashing",
              description: "Inspect around chimneys, vents, and skylights",
            },
            {
              id: "r3",
              item: "Gutters",
              description: "Check for clogs, damage, or improper drainage",
            },
            {
              id: "r4",
              item: "Downspouts",
              description:
                "Ensure proper attachment and drainage away from foundation",
            },
          ],
        },
        {
          id: "walls",
          name: "Walls & Siding",
          checkpoints: [
            {
              id: "w1",
              item: "Siding",
              description: "Look for cracks, gaps, or loose panels",
            },
            {
              id: "w2",
              item: "Paint/Stucco",
              description: "Check for peeling, cracking, or water damage",
            },
            {
              id: "w3",
              item: "Windows",
              description: "Inspect frames, seals, and operation",
            },
            {
              id: "w4",
              item: "Doors",
              description: "Check weatherstripping, operation, and locks",
            },
          ],
        },
        {
          id: "foundation",
          name: "Foundation & Grade",
          checkpoints: [
            {
              id: "f1",
              item: "Foundation",
              description: "Look for cracks, settling, or water intrusion",
            },
            {
              id: "f2",
              item: "Grading",
              description: "Ensure proper slope away from foundation",
            },
            {
              id: "f3",
              item: "Drainage",
              description: "Check for standing water or erosion",
            },
          ],
        },
      ],
    },
    {
      id: "2",
      name: "Kitchen",
      icon: Home,
      status: "pending",
      issues: 0,
      photos: 0,
      areas: [
        {
          id: "appliances",
          name: "Appliances",
          checkpoints: [
            {
              id: "a1",
              item: "Refrigerator",
              description: "Check temperature, seals, and ice maker",
            },
            {
              id: "a2",
              item: "Stove/Oven",
              description: "Test all burners and oven operation",
            },
            {
              id: "a3",
              item: "Dishwasher",
              description: "Run a cycle and check for leaks",
            },
            {
              id: "a4",
              item: "Microwave",
              description: "Test operation and ventilation",
            },
            {
              id: "a5",
              item: "Garbage Disposal",
              description: "Test operation and check for leaks",
            },
          ],
        },
        {
          id: "plumbing",
          name: "Plumbing",
          checkpoints: [
            {
              id: "p1",
              item: "Sink & Faucet",
              description: "Check for leaks and proper drainage",
            },
            {
              id: "p2",
              item: "Under Sink",
              description: "Inspect for leaks, damage, or mold",
            },
            {
              id: "p3",
              item: "Water Pressure",
              description: "Test hot and cold water pressure",
            },
          ],
        },
        {
          id: "surfaces",
          name: "Surfaces & Cabinets",
          checkpoints: [
            {
              id: "s1",
              item: "Countertops",
              description: "Check for damage, stains, or separation",
            },
            {
              id: "s2",
              item: "Cabinets",
              description: "Test doors/drawers and check for damage",
            },
            {
              id: "s3",
              item: "Backsplash",
              description: "Look for loose tiles or water damage",
            },
          ],
        },
      ],
    },
    {
      id: "3",
      name: "Bathrooms",
      icon: Home,
      status: "pending",
      issues: 0,
      photos: 0,
      areas: [
        {
          id: "fixtures",
          name: "Fixtures",
          checkpoints: [
            {
              id: "b1",
              item: "Toilet",
              description: "Check for leaks, proper flush, and stability",
            },
            {
              id: "b2",
              item: "Sink & Vanity",
              description: "Test faucets and check for leaks",
            },
            {
              id: "b3",
              item: "Tub/Shower",
              description: "Check for proper drainage and leaks",
            },
            {
              id: "b4",
              item: "Exhaust Fan",
              description: "Test operation and check venting",
            },
          ],
        },
        {
          id: "water",
          name: "Water & Moisture",
          checkpoints: [
            {
              id: "m1",
              item: "Caulking",
              description: "Check around tub, shower, and fixtures",
            },
            {
              id: "m2",
              item: "Grout & Tile",
              description: "Look for cracks or missing grout",
            },
            {
              id: "m3",
              item: "Water Damage",
              description: "Check walls, ceiling, and floor for stains",
            },
          ],
        },
      ],
    },
    {
      id: "4",
      name: "HVAC & Electrical",
      icon: Zap,
      status: "pending",
      issues: 0,
      photos: 0,
      areas: [
        {
          id: "hvac",
          name: "HVAC System",
          checkpoints: [
            {
              id: "h1",
              item: "Air Handler",
              description: "Check filter and listen for unusual noises",
            },
            {
              id: "h2",
              item: "Thermostat",
              description: "Test heating and cooling operation",
            },
            {
              id: "h3",
              item: "Vents",
              description: "Check airflow and look for blockages",
            },
          ],
        },
        {
          id: "electrical",
          name: "Electrical",
          checkpoints: [
            {
              id: "e1",
              item: "Panel",
              description: "Look for proper labeling and no double-taps",
            },
            {
              id: "e2",
              item: "Outlets",
              description: "Test GFCI outlets and check for proper grounding",
            },
            {
              id: "e3",
              item: "Switches",
              description: "Test all switches and dimmers",
            },
          ],
        },
      ],
    },
  ]);

  const currentRoom = rooms[currentRoomIndex];
  const currentArea = currentRoom?.areas[currentAreaIndex];
  const currentCheckpoint = currentArea?.checkpoints[currentCheckpointIndex];

  const totalCheckpoints = rooms.reduce(
    (total, room) =>
      total +
      room.areas.reduce(
        (areaTotal, area) => areaTotal + area.checkpoints.length,
        0,
      ),
    0,
  );

  const completedCheckpoints = rooms.reduce(
    (total, room) =>
      total +
      room.areas.reduce(
        (areaTotal, area) =>
          areaTotal + area.checkpoints.filter((cp) => cp.condition).length,
        0,
      ),
    0,
  );

  const progressPercentage = (completedCheckpoints / totalCheckpoints) * 100;

  useEffect(() => {
    if (isInspecting && !isPaused && audioEnabled) {
      // Simulate voice guidance
      const utterance = new SpeechSynthesisUtterance(
        `Now inspecting ${currentCheckpoint?.item}. ${currentCheckpoint?.description}`,
      );
      window.speechSynthesis.speak(utterance);
    }
  }, [
    currentCheckpointIndex,
    isInspecting,
    isPaused,
    audioEnabled,
    currentCheckpoint?.description,
    currentCheckpoint?.item,
  ]);

  const handleStartInspection = () => {
    setIsInspecting(true);
    toast.success("Starting guided inspection");
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (audioEnabled) {
      window.speechSynthesis.cancel();
    }
  };

  const handleConditionSelect = (
    condition: "good" | "fair" | "poor" | "critical",
  ) => {
    const updatedRooms = [...rooms];
    const checkpoint =
      updatedRooms[currentRoomIndex].areas[currentAreaIndex].checkpoints[
        currentCheckpointIndex
      ];
    checkpoint.condition = condition;

    if (condition === "poor" || condition === "critical") {
      updatedRooms[currentRoomIndex].issues++;
      setIssueCount(issueCount + 1);
      checkpoint.priority = condition === "critical" ? "urgent" : "high";
    }

    setRooms(updatedRooms);
    setCompletedCount(completedCount + 1);

    // Auto-advance to next checkpoint
    setTimeout(() => {
      handleNext();
    }, 500);
  };

  const handleNext = () => {
    const currentArea = rooms[currentRoomIndex].areas[currentAreaIndex];

    if (currentCheckpointIndex < currentArea.checkpoints.length - 1) {
      setCurrentCheckpointIndex(currentCheckpointIndex + 1);
    } else if (currentAreaIndex < rooms[currentRoomIndex].areas.length - 1) {
      setCurrentAreaIndex(currentAreaIndex + 1);
      setCurrentCheckpointIndex(0);
    } else if (currentRoomIndex < rooms.length - 1) {
      // Mark current room as completed
      const updatedRooms = [...rooms];
      updatedRooms[currentRoomIndex].status = "completed";
      setRooms(updatedRooms);

      setCurrentRoomIndex(currentRoomIndex + 1);
      setCurrentAreaIndex(0);
      setCurrentCheckpointIndex(0);
    } else {
      // Inspection complete
      setIsInspecting(false);
      toast.success("Inspection complete!");
      generateReport();
    }
  };

  const handlePrevious = () => {
    if (currentCheckpointIndex > 0) {
      setCurrentCheckpointIndex(currentCheckpointIndex - 1);
    } else if (currentAreaIndex > 0) {
      setCurrentAreaIndex(currentAreaIndex - 1);
      const prevArea = rooms[currentRoomIndex].areas[currentAreaIndex - 1];
      setCurrentCheckpointIndex(prevArea.checkpoints.length - 1);
    } else if (currentRoomIndex > 0) {
      setCurrentRoomIndex(currentRoomIndex - 1);
      const prevRoom = rooms[currentRoomIndex - 1];
      setCurrentAreaIndex(prevRoom.areas.length - 1);
      const prevArea = prevRoom.areas[prevRoom.areas.length - 1];
      setCurrentCheckpointIndex(prevArea.checkpoints.length - 1);
    }
  };

  const handleImageCapture = async (file: File) => {
    const updatedRooms = [...rooms];
    const checkpoint =
      updatedRooms[currentRoomIndex].areas[currentAreaIndex].checkpoints[
        currentCheckpointIndex
      ];
    checkpoint.photo = URL.createObjectURL(file);
    updatedRooms[currentRoomIndex].photos++;
    setRooms(updatedRooms);
    setShowCameraCapture(false);
    toast.success("Photo added to checkpoint");
  };

  const handleAddNote = () => {
    const updatedRooms = [...rooms];
    const checkpoint =
      updatedRooms[currentRoomIndex].areas[currentAreaIndex].checkpoints[
        currentCheckpointIndex
      ];
    checkpoint.notes = currentNote;
    setRooms(updatedRooms);
    setCurrentNote("");
    setShowNoteDialog(false);
    toast.success("Note added");
  };

  const generateReport = () => {
    const report: InspectionReport = {
      id: Date.now().toString(),
      propertyAddress: "1234 Main Street, Miami, FL 33101",
      inspectionDate: new Date(),
      inspector: "Property Owner",
      totalIssues: issueCount,
      criticalIssues: rooms.reduce(
        (total, room) =>
          total +
          room.areas.reduce(
            (areaTotal, area) =>
              areaTotal +
              area.checkpoints.filter((cp) => cp.condition === "critical")
                .length,
            0,
          ),
        0,
      ),
      rooms: rooms,
      recommendations: [
        "Address critical issues immediately",
        "Schedule professional inspection for major concerns",
        "Create maintenance schedule for fair condition items",
      ],
      estimatedCosts: {
        immediate: 2500,
        shortTerm: 5000,
        longTerm: 10000,
      },
    };

    // Download report
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-inspection-${Date.now()}.json`;
    a.click();
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/ai-tools"
                className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
              >
                ← Back to AI Tools
              </Link>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg">
                  <ListChecks className="h-6 w-6 text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">
                  Guided Property Inspection
                </h1>
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                  AI Assisted
                </Badge>
              </div>
              <p className="text-gray-400 max-w-3xl">
                Comprehensive property inspection with AI guidance. Document
                conditions, identify issues, and generate professional reports.
              </p>
            </div>

            {!isInspecting ? (
              /* Pre-Inspection Setup */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Inspection Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Alert className="bg-blue-900/20 border-blue-600/30">
                          <Info className="h-4 w-4 text-blue-400" />
                          <AlertDescription className="text-blue-200">
                            This guided inspection will walk you through each
                            area of your property systematically. Take photos
                            and notes as needed.
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-700/50 rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-1">
                              Total Checkpoints
                            </p>
                            <p className="text-2xl font-bold text-white">
                              {totalCheckpoints}
                            </p>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-1">
                              Estimated Time
                            </p>
                            <p className="text-2xl font-bold text-white">
                              45-60 min
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-white font-medium">
                            Areas to Inspect:
                          </h4>
                          {rooms.map((room) => (
                            <div
                              key={room.id}
                              className="p-3 bg-gray-700/50 rounded-lg"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Home className="h-5 w-5 text-gray-400" />
                                  <span className="text-white">
                                    {room.name}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {room.areas.reduce(
                                    (total, area) =>
                                      total + area.checkpoints.length,
                                    0,
                                  )}{" "}
                                  items
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button
                          onClick={handleStartInspection}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="lg"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Start Guided Inspection
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">
                        What You'll Need
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                          <span className="text-gray-300">
                            Flashlight for dark areas
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                          <span className="text-gray-300">
                            Camera or phone for photos
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                          <span className="text-gray-300">
                            Ladder for roof/gutter inspection
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                          <span className="text-gray-300">
                            45-60 minutes of time
                          </span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-900/20 border-purple-600/30">
                    <CardHeader>
                      <CardTitle className="text-purple-400 text-lg">
                        AI Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <Volume2 className="h-4 w-4 text-purple-400 mt-0.5" />
                          <span className="text-gray-300">
                            Voice-guided instructions
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Camera className="h-4 w-4 text-purple-400 mt-0.5" />
                          <span className="text-gray-300">
                            Photo analysis for issues
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-purple-400 mt-0.5" />
                          <span className="text-gray-300">
                            Automated report generation
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-purple-400 mt-0.5" />
                          <span className="text-gray-300">
                            Priority recommendations
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              /* Active Inspection Interface */
              <div className="space-y-6">
                {/* Progress Bar */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">
                          Overall Progress
                        </span>
                        <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                          {completedCheckpoints} / {totalCheckpoints}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {progressPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </CardContent>
                </Card>

                {/* Main Inspection Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-gray-700 text-gray-300">
                                {currentRoom?.name}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                              <Badge className="bg-gray-700 text-gray-300">
                                {currentArea?.name}
                              </Badge>
                            </div>
                            <CardTitle className="text-white text-2xl">
                              {currentCheckpoint?.item}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setAudioEnabled(!audioEnabled)}
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                            >
                              {audioEnabled ? (
                                <Volume2 className="h-4 w-4" />
                              ) : (
                                <VolumeX className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={handlePauseResume}
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                            >
                              {isPaused ? (
                                <Play className="h-4 w-4" />
                              ) : (
                                <Pause className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                            <p className="text-blue-200 flex items-start gap-2">
                              <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                              {currentCheckpoint?.description}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-white">
                              Condition Assessment
                            </Label>
                            <div className="grid grid-cols-4 gap-3">
                              <button
                                onClick={() => handleConditionSelect("good")}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  currentCheckpoint?.condition === "good"
                                    ? "bg-green-600/20 border-green-600 text-green-400"
                                    : "bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-300"
                                }`}
                              >
                                <CheckCircle className="h-6 w-6 mx-auto mb-1" />
                                <p className="text-sm font-medium">Good</p>
                              </button>
                              <button
                                onClick={() => handleConditionSelect("fair")}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  currentCheckpoint?.condition === "fair"
                                    ? "bg-yellow-600/20 border-yellow-600 text-yellow-400"
                                    : "bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-300"
                                }`}
                              >
                                <AlertCircle className="h-6 w-6 mx-auto mb-1" />
                                <p className="text-sm font-medium">Fair</p>
                              </button>
                              <button
                                onClick={() => handleConditionSelect("poor")}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  currentCheckpoint?.condition === "poor"
                                    ? "bg-orange-600/20 border-orange-600 text-orange-400"
                                    : "bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-300"
                                }`}
                              >
                                <AlertTriangle className="h-6 w-6 mx-auto mb-1" />
                                <p className="text-sm font-medium">Poor</p>
                              </button>
                              <button
                                onClick={() =>
                                  handleConditionSelect("critical")
                                }
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  currentCheckpoint?.condition === "critical"
                                    ? "bg-red-600/20 border-red-600 text-red-400"
                                    : "bg-gray-700 border-gray-600 hover:border-gray-500 text-gray-300"
                                }`}
                              >
                                <AlertTriangle className="h-6 w-6 mx-auto mb-1" />
                                <p className="text-sm font-medium">Critical</p>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Button
                              onClick={() => setShowCameraCapture(true)}
                              variant="outline"
                              className="flex-1 bg-gray-700 hover:bg-gray-600 border-gray-600"
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Add Photo
                            </Button>
                            <Button
                              onClick={() => setShowNoteDialog(true)}
                              variant="outline"
                              className="flex-1 bg-gray-700 hover:bg-gray-600 border-gray-600"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Note
                            </Button>
                          </div>

                          {currentCheckpoint?.photo && (
                            <div className="relative">
                              <img
                                src={currentCheckpoint.photo}
                                alt={`Inspection photo for ${currentCheckpoint.item}`}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <Badge className="absolute top-2 right-2 bg-black/60">
                                Photo attached
                              </Badge>
                            </div>
                          )}

                          {currentCheckpoint?.notes && (
                            <div className="p-3 bg-gray-700/50 rounded-lg">
                              <p className="text-sm text-gray-400 mb-1">
                                Notes:
                              </p>
                              <p className="text-white">
                                {currentCheckpoint.notes}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-4">
                            <Button
                              onClick={handlePrevious}
                              variant="outline"
                              disabled={
                                currentRoomIndex === 0 &&
                                currentAreaIndex === 0 &&
                                currentCheckpointIndex === 0
                              }
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                            >
                              <ChevronLeft className="h-4 w-4 mr-2" />
                              Previous
                            </Button>
                            <Button
                              onClick={handleNext}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              {currentRoomIndex === rooms.length - 1 &&
                              currentAreaIndex ===
                                currentRoom.areas.length - 1 &&
                              currentCheckpointIndex ===
                                currentArea.checkpoints.length - 1 ? (
                                <>
                                  Complete Inspection
                                  <Flag className="h-4 w-4 ml-2" />
                                </>
                              ) : (
                                <>
                                  Next
                                  <ChevronRight className="h-4 w-4 ml-2" />
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={handleNext}
                              variant="outline"
                              className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                            >
                              <SkipForward className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Room Progress */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">
                          Room Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {rooms.map((room, index) => (
                            <div key={room.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Home
                                    className={`h-4 w-4 ${
                                      index === currentRoomIndex
                                        ? "text-blue-400"
                                        : room.status === "completed"
                                          ? "text-green-400"
                                          : "text-gray-500"
                                    }`}
                                  />
                                  <span
                                    className={`text-sm ${
                                      index === currentRoomIndex
                                        ? "text-white font-medium"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {room.name}
                                  </span>
                                </div>
                                {room.status === "completed" && (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                )}
                              </div>
                              {index === currentRoomIndex && (
                                <Progress
                                  value={
                                    (currentAreaIndex * 100) / room.areas.length
                                  }
                                  className="h-1"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Statistics */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">
                          Inspection Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              Items Inspected
                            </span>
                            <span className="text-lg font-semibold text-white">
                              {completedCount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              Issues Found
                            </span>
                            <span className="text-lg font-semibold text-orange-400">
                              {issueCount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              Photos Taken
                            </span>
                            <span className="text-lg font-semibold text-white">
                              {rooms.reduce(
                                (total, room) => total + room.photos,
                                0,
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              Time Elapsed
                            </span>
                            <span className="text-lg font-semibold text-white">
                              <Clock className="h-4 w-4 inline mr-1" />
                              32:15
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Camera Capture Modal */}
        {showCameraCapture && (
          <CameraCapture
            onClose={() => setShowCameraCapture(false)}
            onCapture={handleImageCapture}
          />
        )}

        {/* Note Dialog */}
        <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add Note</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add any observations or details about {currentCheckpoint?.item}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Enter your notes here..."
                className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNoteDialog(false)}
                  className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddNote}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
