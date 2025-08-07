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
  Home,
  Maximize2,
  Square,
  Download,
  Upload,
  Grid,
  Ruler,
  Eye,
  EyeOff,
  Plus,
  Move,
  CheckCircle,
  Sparkles,
  Bed,
  Sofa,
  Bath,
  ChefHat,
  Car,
  Building,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, Suspense } from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Dynamically import AR scanner to avoid SSR issues
const ARRoomScanner = dynamic(
  () =>
    import("@/components/ar/ar-room-scanner").then((mod) => ({
      default: mod.ARRoomScanner,
    })),
  { ssr: false },
);

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Room {
  id: string;
  name: string;
  type:
    | "bedroom"
    | "bathroom"
    | "kitchen"
    | "living"
    | "dining"
    | "garage"
    | "other";
  dimensions: { width: number; height: number };
  position: { x: number; y: number };
  color: string;
  icon?: React.ElementType;
}

interface FloorPlan {
  id: string;
  name: string;
  totalArea: number;
  rooms: Room[];
  scale: number; // pixels per foot
  gridEnabled: boolean;
  unit: "feet" | "meters";
}

export default function FloorplanCreatorPage() {
  const [currentPlan, setCurrentPlan] = useState<FloorPlan>({
    id: Date.now().toString(),
    name: "My Floor Plan",
    totalArea: 0,
    rooms: [],
    scale: 20,
    gridEnabled: true,
    unit: "feet",
  });

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [tool, setTool] = useState<"select" | "draw" | "measure">("select");
  const [showDimensions, setShowDimensions] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showARScanner, setShowARScanner] = useState(false);
  const [selectedRoomTypeForScan, setSelectedRoomTypeForScan] =
    useState<string>("living");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roomTypes = [
    { type: "bedroom", label: "Bedroom", icon: Bed, color: "bg-blue-500" },
    { type: "bathroom", label: "Bathroom", icon: Bath, color: "bg-cyan-500" },
    {
      type: "kitchen",
      label: "Kitchen",
      icon: ChefHat,
      color: "bg-orange-500",
    },
    {
      type: "living",
      label: "Living/Dining",
      icon: Sofa,
      color: "bg-green-500",
    },
    { type: "garage", label: "Garage", icon: Car, color: "bg-gray-500" },
    { type: "other", label: "Other", icon: Square, color: "bg-purple-500" },
  ];

  const sampleRooms: Room[] = [
    {
      id: "1",
      name: "Living/Kitchen/Dining",
      type: "living",
      dimensions: { width: 15, height: 20 },
      position: { x: 50, y: 50 },
      color: "bg-green-500",
      icon: Sofa,
    },
    {
      id: "2",
      name: "Bedroom",
      type: "bedroom",
      dimensions: { width: 12, height: 12 },
      position: { x: 350, y: 50 },
      color: "bg-blue-500",
      icon: Bed,
    },
    {
      id: "3",
      name: "Bedroom",
      type: "bedroom",
      dimensions: { width: 12, height: 10 },
      position: { x: 350, y: 250 },
      color: "bg-blue-500",
      icon: Bed,
    },
    {
      id: "4",
      name: "Bathroom",
      type: "bathroom",
      dimensions: { width: 8, height: 10 },
      position: { x: 250, y: 250 },
      color: "bg-cyan-500",
      icon: Bath,
    },
    {
      id: "5",
      name: "Entrance Hall",
      type: "other",
      dimensions: { width: 8, height: 6 },
      position: { x: 250, y: 150 },
      color: "bg-purple-500",
      icon: Square,
    },
    {
      id: "6",
      name: "Store",
      type: "other",
      dimensions: { width: 6, height: 8 },
      position: { x: 500, y: 50 },
      color: "bg-purple-500",
      icon: Square,
    },
  ];

  const startPhoneScan = async () => {
    setShowARScanner(true);
  };

  const handleARScanComplete = (measurements: Record<string, unknown>) => {
    // Convert AR measurements to room format
    const newRoom: Room = {
      id: Date.now().toString(),
      name: `${selectedRoomTypeForScan.charAt(0).toUpperCase() + selectedRoomTypeForScan.slice(1)}`,
      type: selectedRoomTypeForScan as Room["type"],
      dimensions: {
        width: measurements.width as number,
        height: measurements.length as number, // Use length as room height in 2D view
      },
      position: {
        x: currentPlan.rooms.length * 50 + 50,
        y: 50,
      },
      color:
        roomTypes.find((rt) => rt.type === selectedRoomTypeForScan)?.color ||
        "bg-gray-500",
      icon: roomTypes.find((rt) => rt.type === selectedRoomTypeForScan)?.icon,
    };

    const updatedRooms = [...currentPlan.rooms, newRoom];
    setCurrentPlan({
      ...currentPlan,
      rooms: updatedRooms,
      totalArea: calculateTotalArea(updatedRooms),
    });

    setShowARScanner(false);
    toast.success(
      `${selectedRoomTypeForScan} scanned successfully! Area: ${measurements.area} sq ft`,
    );
  };

  const calculateTotalArea = (rooms: Room[]) => {
    return rooms.reduce((total, room) => {
      return total + room.dimensions.width * room.dimensions.height;
    }, 0);
  };

  const addRoom = (type: string) => {
    const roomType = roomTypes.find((rt) => rt.type === type);
    const newRoom: Room = {
      id: Date.now().toString(),
      name: roomType?.label || "Room",
      type: type as Room["type"],
      dimensions: { width: 10, height: 10 },
      position: { x: 100, y: 100 },
      color: roomType?.color || "bg-gray-500",
      icon: roomType?.icon,
    };

    setCurrentPlan({
      ...currentPlan,
      rooms: [...currentPlan.rooms, newRoom],
      totalArea: calculateTotalArea([...currentPlan.rooms, newRoom]),
    });
    setSelectedRoom(newRoom);
  };

  const updateRoom = (roomId: string, updates: Partial<Room>) => {
    const updatedRooms = currentPlan.rooms.map((room) =>
      room.id === roomId ? { ...room, ...updates } : room,
    );
    setCurrentPlan({
      ...currentPlan,
      rooms: updatedRooms,
      totalArea: calculateTotalArea(updatedRooms),
    });
  };

  const deleteRoom = (roomId: string) => {
    const updatedRooms = currentPlan.rooms.filter((room) => room.id !== roomId);
    setCurrentPlan({
      ...currentPlan,
      rooms: updatedRooms,
      totalArea: calculateTotalArea(updatedRooms),
    });
    setSelectedRoom(null);
  };

  const exportFloorPlan = () => {
    const data = {
      ...currentPlan,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `floorplan-${currentPlan.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.json`;
    a.click();

    toast.success("Floor plan exported successfully");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setCurrentPlan(data);
          toast.success("Floor plan imported successfully");
        } catch {
          toast.error("Failed to import floor plan");
        }
      };
      reader.readAsText(file);
    }
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
                  <Home className="h-6 w-6 text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">
                  AI Floorplan Creator
                </h1>
                <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                  New
                </Badge>
              </div>
              <p className="text-gray-400 max-w-3xl">
                Create accurate floor plans with your phone! Keep scanning your
                whole home and get professional measurements.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Canvas Area */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">
                        Floor Plan Canvas
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={tool === "select" ? "default" : "outline"}
                          onClick={() => setTool("select")}
                        >
                          <Move className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={tool === "draw" ? "default" : "outline"}
                          onClick={() => setTool("draw")}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={tool === "measure" ? "default" : "outline"}
                          onClick={() => setTool("measure")}
                        >
                          <Ruler className="h-4 w-4" />
                        </Button>
                        <div className="h-4 w-px bg-gray-600 mx-2" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setCurrentPlan({
                              ...currentPlan,
                              gridEnabled: !currentPlan.gridEnabled,
                            })
                          }
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDimensions(!showDimensions)}
                        >
                          {showDimensions ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="relative bg-gray-900 rounded-lg overflow-hidden"
                      style={{ height: "600px" }}
                    >
                      {currentPlan.rooms.length === 0 && !isScanning ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                            <Building className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Create Your Floor Plan
                          </h3>
                          <p className="text-gray-400 text-center mb-6">
                            Use AR scanning for precise measurements
                            <br />
                            or add rooms manually
                          </p>

                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                              onClick={startPhoneScan}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
                            >
                              <Sparkles className="h-4 w-4" />
                              AR Scan Room
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => addRoom("bedroom")}
                              className="bg-gray-700 hover:bg-gray-600"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Manually
                            </Button>
                          </div>

                          {/* Room Type Selector for AR Scanning */}
                          <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
                            <p className="text-sm text-gray-300 mb-2">
                              Room type for AR scan:
                            </p>
                            <select
                              value={selectedRoomTypeForScan}
                              onChange={(e) =>
                                setSelectedRoomTypeForScan(e.target.value)
                              }
                              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                            >
                              {roomTypes.map((type) => (
                                <option key={type.type} value={type.type}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Grid Background */}
                          {currentPlan.gridEnabled && (
                            <div
                              className="absolute inset-0"
                              style={{
                                backgroundImage:
                                  "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                                backgroundSize: `${currentPlan.scale}px ${currentPlan.scale}px`,
                              }}
                            />
                          )}

                          {/* Rooms */}
                          <div className="relative w-full h-full">
                            {currentPlan.rooms.map((room) => {
                              return (
                                <div
                                  key={room.id}
                                  className={`absolute ${room.color} bg-opacity-30 border-2 ${
                                    selectedRoom?.id === room.id
                                      ? "border-white"
                                      : "border-gray-400"
                                  } rounded cursor-pointer hover:bg-opacity-40 transition-all`}
                                  style={{
                                    left: `${room.position.x}px`,
                                    top: `${room.position.y}px`,
                                    width: `${room.dimensions.width * currentPlan.scale}px`,
                                    height: `${room.dimensions.height * currentPlan.scale}px`,
                                  }}
                                  onClick={() => setSelectedRoom(room)}
                                >
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                    <Square className="h-6 w-6 mb-1 opacity-70" />
                                    <p className="text-sm font-medium">
                                      {room.name}
                                    </p>
                                    {showDimensions && (
                                      <p className="text-xs opacity-70">
                                        {room.dimensions.width} ×{" "}
                                        {room.dimensions.height}{" "}
                                        {currentPlan.unit}
                                      </p>
                                    )}
                                  </div>

                                  {/* Resize handles */}
                                  {selectedRoom?.id === room.id && (
                                    <>
                                      <div className="absolute -right-2 -bottom-2 w-4 h-4 bg-white rounded-full cursor-se-resize" />
                                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full cursor-e-resize" />
                                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full cursor-s-resize" />
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Scanning Overlay */}
                          {isScanning && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                              <div className="text-center space-y-4">
                                <Maximize2 className="h-16 w-16 text-cyan-400 mx-auto animate-pulse" />
                                <p className="text-white text-lg">
                                  Scanning your home...
                                </p>
                                <p className="text-gray-400">
                                  Keep moving your phone to scan all rooms
                                </p>
                                <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-cyan-400 transition-all duration-500"
                                    style={{ width: `${scanProgress}%` }}
                                  />
                                </div>
                                <p className="text-gray-400">
                                  {scanProgress}% Complete
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Floor Plan Stats */}
                    {currentPlan.rooms.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="bg-gray-700 rounded-lg p-3">
                          <p className="text-xs text-gray-400">Total Area</p>
                          <p className="text-lg font-semibold text-white">
                            {currentPlan.totalArea} sq {currentPlan.unit}
                          </p>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-3">
                          <p className="text-xs text-gray-400">Rooms</p>
                          <p className="text-lg font-semibold text-white">
                            {currentPlan.rooms.length}
                          </p>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-3">
                          <p className="text-xs text-gray-400">Scale</p>
                          <p className="text-lg font-semibold text-white">
                            1:{currentPlan.scale} px/{currentPlan.unit}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tools Panel */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={startPhoneScan}
                      disabled={isScanning}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {isScanning ? "Scanning..." : "AR Scan Room"}
                    </Button>

                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full bg-gray-700 hover:bg-gray-600"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Floor Plan
                    </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <Button
                      onClick={exportFloorPlan}
                      disabled={currentPlan.rooms.length === 0}
                      variant="outline"
                      className="w-full bg-gray-700 hover:bg-gray-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Floor Plan
                    </Button>
                  </CardContent>
                </Card>

                {/* Add Rooms */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Add Rooms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {roomTypes.map((roomType) => {
                        return (
                          <Button
                            key={roomType.type}
                            variant="outline"
                            onClick={() => addRoom(roomType.type)}
                            className="bg-gray-700 hover:bg-gray-600 flex flex-col items-center py-3"
                          >
                            <Square className="h-5 w-5 mb-1" />
                            <span className="text-xs">{roomType.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Room Properties */}
                {selectedRoom && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Room Properties
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="roomName" className="text-white">
                          Name
                        </Label>
                        <Input
                          id="roomName"
                          value={selectedRoom.name}
                          onChange={(e) =>
                            updateRoom(selectedRoom.id, {
                              name: e.target.value,
                            })
                          }
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="roomWidth" className="text-white">
                            Width ({currentPlan.unit})
                          </Label>
                          <Input
                            id="roomWidth"
                            type="number"
                            value={selectedRoom.dimensions.width}
                            onChange={(e) =>
                              updateRoom(selectedRoom.id, {
                                dimensions: {
                                  ...selectedRoom.dimensions,
                                  width: Number(e.target.value),
                                },
                              })
                            }
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="roomHeight" className="text-white">
                            Height ({currentPlan.unit})
                          </Label>
                          <Input
                            id="roomHeight"
                            type="number"
                            value={selectedRoom.dimensions.height}
                            onChange={(e) =>
                              updateRoom(selectedRoom.id, {
                                dimensions: {
                                  ...selectedRoom.dimensions,
                                  height: Number(e.target.value),
                                },
                              })
                            }
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white">Area</Label>
                        <p className="text-lg font-semibold text-cyan-400">
                          {selectedRoom.dimensions.width *
                            selectedRoom.dimensions.height}{" "}
                          sq {currentPlan.unit}
                        </p>
                      </div>

                      <Button
                        onClick={() => deleteRoom(selectedRoom.id)}
                        variant="outline"
                        className="w-full bg-red-600/20 text-red-400 hover:bg-red-600/30 border-red-600/30"
                      >
                        Delete Room
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Tips */}
                <Card className="bg-blue-900/20 border-blue-600/30">
                  <CardHeader>
                    <CardTitle className="text-blue-400 text-lg">
                      Pro Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                        <span className="text-gray-300">
                          Phone scanning uses AI to detect room boundaries
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                        <span className="text-gray-300">
                          Export plans for insurance documentation
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                        <span className="text-gray-300">
                          Accurate measurements help with claims
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>

      {/* AR Scanner Modal */}
      {showARScanner && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p>Loading AR Scanner...</p>
              </div>
            </div>
          }
        >
          <ARRoomScanner
            roomType={selectedRoomTypeForScan}
            onComplete={handleARScanComplete}
            onClose={() => setShowARScanner(false)}
          />
        </Suspense>
      )}
    </ProtectedRoute>
  );
}
